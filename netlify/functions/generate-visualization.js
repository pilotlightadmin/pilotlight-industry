// Netlify Function: Build FLUX Dev prompts from script + creative direction
// Returns prompts for the frontend to kick off one at a time
//
// FLUX Dev prompt principles:
// - Follows natural language faithfully — no keyword spam
// - Reads front-to-back with heavy weighting on first ~150 tokens
// - Prompt order = priority order
// - Positive prompting only (no negative_prompt support)
// - Up to 512 tokens

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { script_id, parsed_structure, mood, visual_style, characters, period_override, shot_list_mode } = JSON.parse(event.body);

    if (!script_id || !parsed_structure || !mood || !visual_style) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    // =========================================================================
    // MOOD — owns LIGHTING, COLOR PALETTE, and ATMOSPHERE.
    // What does the light do? What colors dominate? What's the air like?
    // Never describes physical objects, set dressing, or composition.
    // =========================================================================
    // MOOD — owns LIGHTING TECHNIQUE, COLOR PALETTE, and ATMOSPHERE.
    // Uses cinematographic lighting terms that FLUX interprets as specific setups:
    //   HIGH-KEY: low contrast, fill light everywhere, minimal shadows → comedy, upbeat
    //   LOW-KEY:  high contrast, strong key light, deep shadows → drama, tension
    //   Light SOURCES should vary — not just "bright warm light" but motivated sources
    //   (practicals, bounce, overhead, sidelight, backlight, rim) so scenes look different.
    const moodDescriptions = {
      'action': {
        scene: 'Low-key hard crosslight, warm amber and steel blue split palette.',
        scene_full: 'Low-key hard crosslight from opposing directions, warm amber and cold steel blue split palette, dust particles catching shafts of light, atmospheric haze.',
        character: 'Intense expression, sweat on skin, hard key light from one side with deep shadow on the other, sharp focus on eyes.',
        mood_board: 'Low-key hard crosslight, dust catching shafts of light, warm amber versus cold steel blue palette.'
      },
      'horror': {
        scene: 'Extreme low-key single-source underlight, cold desaturated palette.',
        scene_full: 'Extreme low-key lighting from a single low source, cold desaturated palette with sickly green undertones, 90% of frame in shadow, edges dissolving into darkness.',
        character: 'Underlit face from below, pallid skin, deep black eye sockets, unease in expression.',
        mood_board: 'Extreme low-key single-source light, cold desaturated sickly palette, oppressive darkness.'
      },
      'comedy': {
        scene: 'High-key soft lighting, strong fill, warm saturated palette.',
        scene_full: 'High-key three-point lighting with strong fill, minimal shadows, warm saturated palette, everything evenly lit and clearly visible.',
        character: 'Expressive face, high-key soft light with strong fill, minimal shadows, warm and approachable.',
        mood_board: 'High-key even soft lighting, strong fill, minimal shadows, warm saturated cheerful palette.'
      },
      'drama': {
        scene: 'Low-key motivated sidelight, muted earth tones, deep shadows.',
        scene_full: 'Low-key single motivated sidelight, muted earth tones, one side of the frame in deep shadow, gentle falloff into darkness.',
        character: 'Vulnerable expression, low-key sidelight illuminating half the face, muted tones, close crop.',
        mood_board: 'Low-key motivated sidelight, muted earth tones, deep atmospheric shadows, quiet stillness.'
      }
    };

    // =========================================================================
    // STYLE — owns SET DRESSING, COMPOSITION, PROPS, TEXTURES, and CAMERA.
    // What does the physical world look like? How is the frame composed?
    // Never describes lighting color or atmosphere — that's mood's job.
    // =========================================================================
    const styleDescriptions = {
      'cinematic': {
        scene: 'Detailed production design, layered depth, 35mm film grain.',
        scene_full: 'Detailed rich production design, layered foreground and background depth, 35mm film grain, soft bokeh on background elements.',
        character: 'Close-up on 35mm, shallow bokeh, detailed skin texture, film grain.',
        mood_board: 'Polished production design, widescreen composition, layered depth, 35mm film grain.'
      },
      'indie_realistic': {
        scene: 'Lived-in cluttered spaces, handheld framing, heavy grain.',
        scene_full: 'Lived-in messy cluttered spaces, worn surfaces, handheld camera framing, heavy 16mm grain, raw unpolished textures.',
        character: 'Close-up on 16mm, unflattering honest framing, heavy grain, visible skin texture.',
        mood_board: 'Worn lived-in surfaces, cluttered authentic spaces, handheld 16mm grain.'
      },
      'expressionistic': {
        scene: 'Dutch angle, wide-angle lens distortion, heightened production design.',
        scene_full: 'Dutch angle, wide-angle lens distortion, heightened oversized production design, photorealistic textures with theatrical framing.',
        character: 'Close-up with wide-angle lens distortion, photorealistic skin, exaggerated perspective.',
        mood_board: 'Dutch angle framing, wide-angle distortion, heightened theatrical production design, photorealistic textures.'
      },
      'minimalist': {
        scene: 'Sparse clean surfaces, symmetrical framing, few props.',
        scene_full: 'Sparse clean uncluttered surfaces, symmetrical centered framing, few carefully placed props, large empty negative space.',
        character: 'Centered subject, clean simple background, precise symmetrical framing.',
        mood_board: 'Sparse clean surfaces, symmetrical composition, large empty spaces, few precise props.'
      }
    };

    const moodSet = moodDescriptions[mood] || moodDescriptions['drama'];
    const styleSet = styleDescriptions[visual_style] || styleDescriptions['cinematic'];

    // =========================================================================
    // ERA / TIME PERIOD
    // =========================================================================
    const settingPeriod = parsed_structure.setting_period || {};
    let eraLabel = '';
    let eraCues = '';
    if (period_override) {
      // User selected a specific era — override everything
      eraLabel = period_override;
      eraCues = ''; // Don't use parsed cues — they belong to the original era
    } else if (typeof settingPeriod === 'object') {
      eraLabel = settingPeriod.era || 'present day';
      eraCues = settingPeriod.era_visual_cues || '';
    } else {
      eraLabel = settingPeriod;
    }

    // Normalize common parser era errors:
    // - "20th century" for scripts mentioning 2000s/2010s/2019 → "present day 2020s"
    // - "21st century" is vague → "present day 2020s"
    // - Any era containing a 4-digit year ≥ 2000 is modern → "present day 2020s"
    const eraLower = eraLabel.toLowerCase();
    const yearInEra = eraLabel.match(/\b(20[0-2]\d)\b/);
    if (yearInEra || /\b21st\s+century\b/i.test(eraLabel)) {
      eraLabel = yearInEra ? `present day ${yearInEra[1].slice(0,3)}0s` : 'present day 2020s';
    } else if (/\b20th\s+century\b/i.test(eraLabel)) {
      // "20th century" without a specific decade — check if script scenes mention modern years
      const scriptText = JSON.stringify(parsed_structure.scenes || []);
      const modernYear = scriptText.match(/\b(20[0-2]\d)\b/);
      if (modernYear) {
        eraLabel = `present day ${modernYear[1].slice(0,3)}0s`;
      }
      // Otherwise keep "20th century" — it might genuinely be a period piece
    }

    // Clean era cues: strip activities and people-implying phrases
    const cleanedEraCues = eraCues
      ? eraCues.split(',')
          .map(c => c.trim())
          .filter(c => {
            const lc = c.toLowerCase();
            return c.length > 0 &&
              !/(riding|walking|gathering|dancing|working|bustling|trading|marching|patrolling|fighting)/i.test(lc) &&
              !/(horseback|on foot|people|men|women|folk|crowd)/i.test(lc);
          })
          .join(', ')
      : '';

    // Don't inject specific prop lists — FLUX renders them literally (rotary phones in 1880s, etc.)
    // Just set the era. Character wardrobe comes from physDesc + profession map.
    // Environment period detail comes from the parser's image_prompt_base per scene.
    const eraDescription = (eraLabel && eraLabel !== 'present day' && eraLabel !== 'contemporary')
      ? `Set in ${eraLabel}.`
      : '';

    const isHistoricalEra = eraLabel && eraLabel !== 'present day' && eraLabel !== 'contemporary';

    // =========================================================================
    // ANACHRONISM FILTER: strip props that don't exist in the target era.
    // Applied to both coreVisual (environment) and character_actions.
    // Each era threshold defines what to strip — anything ABOVE the era's tech level.
    // =========================================================================
    const eraYearMatch = eraLabel.match(/\d{4}|\d{2}s/);
    const eraYear = eraYearMatch
      ? (eraYearMatch[0].length === 4 ? parseInt(eraYearMatch[0]) : parseInt('19' + eraYearMatch[0]))
      : (/ancient|medieval|feudal|renaissance/i.test(eraLabel) ? 1400
        : /colonial/i.test(eraLabel) ? 1750
        : /regency/i.test(eraLabel) ? 1815
        : /victorian/i.test(eraLabel) ? 1880
        : /old west/i.test(eraLabel) ? 1880
        : /turn of the century/i.test(eraLabel) ? 1905
        : /world war i/i.test(eraLabel) ? 1916
        : 2020);

    const stripAnachronisms = (text) => {
      if (!text || eraYear >= 2000) return text; // modern era, nothing to strip
      let cleaned = text;
      // Post-2000 tech
      if (eraYear < 2000) {
        cleaned = cleaned.replace(/\b(smartphone|iphone|android|tablet|ipad|laptop|wifi|bluetooth|drone|uber|lyft|airpod|earbud|flat-?screen|LED\s+screen|ring\s+light|selfie|vlog)\b[^,.]*/gi, '');
      }
      // Post-1980 tech — "phone" here means portable/cell phone (landline "telephone" is pre-1920)
      if (eraYear < 1980) {
        cleaned = cleaned.replace(/\b(cell\s*phone|mobile\s*phone|phone|computer\s+screen|monitor|microwave|VHS|cassette\s+player|CD|compact\s+disc|pager|beeper|fax\s+machine|satellite\s+dish)\b[^,.]*/gi, '');
      }
      // Post-1950 tech/toys
      if (eraYear < 1950) {
        cleaned = cleaned.replace(/\b(television|TV\s+set|TV|neon\s+sign|plastic|vinyl|transistor\s+radio|jukebox|fluorescent\s+light|fluorescent|lego|legos|lego\s+pieces?|lego\s+bricks?|lego\s+car|play-?doh|slinky)\b[^,.]*/gi, '');
      }
      // Post-1920 tech
      if (eraYear < 1920) {
        cleaned = cleaned.replace(/\b(telephone|radio|automobile|car|truck|motorcycle|airplane|neon|electric\s+light|light\s+bulb|movie\s+theater|cinema|record\s+player|phonograph)\b[^,.]*/gi, '');
      }
      // Post-1850 tech
      if (eraYear < 1850) {
        cleaned = cleaned.replace(/\b(telegraph|train|railroad|railway|steam\s+engine|photograph|camera|revolver|repeating\s+rifle|barbed\s+wire|typewriter|sewing\s+machine)\b[^,.]*/gi, '');
      }
      // Clean artifacts
      cleaned = cleaned
        .replace(/\bpressed\s+to\s+(her|his|their)\s+ear\b/gi, '')
        .replace(/,\s*,+/g, ',')
        .replace(/,\s*\./g, '.')
        .replace(/\s{2,}/g, ' ')
        .replace(/^[,\s]+/, '').replace(/[,\s]+$/, '')
        .trim();
      return cleaned;
    };

    // =========================================================================
    // VISUAL OCCLUSION — outer layers hide inner details.
    // If a body is "covered by a tarp", don't describe scars/damage underneath.
    // If a character wears a coat, don't describe a badge/holster underneath.
    // Only the outermost visible layer should carry descriptors in the FLUX prompt.
    // =========================================================================
    const applyVisualOcclusion = (text) => {
      if (!text) return text;
      let cleaned = text;

      // BODY COVERINGS: tarp, sheet, blanket, cloth, bag → suppress wound/damage descriptors
      // ONLY after the covering phrase (proximity-aware). "Scarred warehouse... body covered by tarp"
      // should keep "Scarred" (describes building) but strip "scarred" if it follows the covering.
      const coverMatch = cleaned.match(/\b(covered|draped|wrapped|shrouded|concealed|hidden)\s+(by|in|with|under)\s+(a\s+)?(tarp|sheet|blanket|cloth|bag|body\s*bag|plastic)/i);
      if (coverMatch) {
        const coverPos = coverMatch.index + coverMatch[0].length;
        const before = cleaned.substring(0, coverPos);
        let after = cleaned.substring(coverPos);
        after = after
          .replace(/,?\s*\b(scarred|damaged|bloody|bloodied|bruised|wounded|mutilated|decomposed|decomposing|burned|charred|lacerated|mangled|battered|disfigured|cut|slashed|stabbed|gashed)\b(\s+and\s+\w+ed)?/gi, '')
          .replace(/,?\s*\b(open\s+wounds?|visible\s+(injuries|wounds?|trauma|scars?)|pool\s+of\s+blood|blood\s+(pool|stain|splatter)|exposed\s+(bone|flesh|skin))\b[^,.]*/gi, '')
          // Items ON the covered body: "pinned to the victim's chest", "clutched in hand"
          // If the body is covered, these items wouldn't be visible.
          // Handles parser fusions like "victimchest" (no space/apostrophe).
          .replace(/,?\s*\b\w+\s+(pinned|attached|stapled|taped|stuck|placed|resting|lying|clutched)\s+(to|on|in|across)\s+(the\s+)?(victim|body|corpse|chest|hand|torso|face)[^,.]*/gi, '');
        cleaned = before + after;
      }

      // CLOTHING COVERINGS: coat, jacket, overcoat, poncho, cloak → suppress hidden items
      // "under his coat" / "beneath the jacket" / "concealed by" patterns
      if (/\b(coat|overcoat|trench\s*coat|jacket|poncho|cloak|parka|hoodie|windbreaker|duster)\b/i.test(cleaned)) {
        // Strip "ITEM under/beneath/underneath GARMENT" patterns
        cleaned = cleaned
          .replace(/,?\s*\b(badge|gun|pistol|revolver|holster|shoulder\s+holster|weapon|handgun|firearm|vest|kevlar|body\s*armor)\s+(under|beneath|underneath|hidden\s+(by|under|beneath)|concealed\s+(by|under|beneath)|tucked\s+(in|under|into))\b[^,.]*/gi, '')
          // Also strip "under/beneath GARMENT, a ITEM" patterns
          .replace(/,?\s*\b(under|beneath|underneath)\s+(his|her|their|the)\s+(coat|overcoat|trench\s*coat|jacket|poncho|cloak|parka|hoodie|windbreaker|duster),?\s*(a\s+)?(badge|gun|pistol|revolver|holster|shoulder\s+holster|weapon|handgun|firearm|vest|kevlar)\b[^,.]*/gi, '');
      }

      // Clean artifacts left by stripping
      cleaned = cleaned
        .replace(/,\s*,+/g, ',')
        .replace(/,\s*\./g, '.')
        .replace(/\s{2,}/g, ' ')
        .replace(/^[,\s]+/, '').replace(/[,\s]+$/, '')
        .trim();

      return cleaned;
    };

    // =========================================================================
    // LOCATION CONSISTENCY via deterministic seed
    // =========================================================================
    const allScenes = (parsed_structure.scenes || []);
    const locationMap = {};

    const locationSeed = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash) % 100000;
    };

    const normalizeLocation = (loc) => {
      if (!loc) return '_unknown';
      return loc.toLowerCase().trim()
        .replace(/['']/g, "'")
        .replace(/\s+/g, ' ');
    };

    allScenes.forEach((scene) => {
      const intExt = (scene.int_ext || '').toUpperCase();
      const key = (intExt ? intExt + '_' : '') + normalizeLocation(scene.location);
      if (!locationMap[key]) {
        locationMap[key] = {
          seed: locationSeed(key + eraLabel + mood + visual_style),
          location: scene.location || 'an interior'
        };
      }
    });

    const jobs = [];

    // =========================================================================
    // AGE VISUAL CUES — face-aging details for portraits
    // =========================================================================
    const ageVisualCues = (ageRange) => {
      if (!ageRange) return '';
      const a = ageRange.toLowerCase();
      // Children — FLUX needs explicit child cues or it renders adults
      if (a.includes('infant') || a.includes('baby') || a.includes('newborn') || /\b[0-1]\b/.test(a))
        return 'tiny infant, round face, big eyes, chubby cheeks';
      if (a.includes('toddler') || /\b[2-3]\s*(year|yr)/.test(a) || a === '2' || a === '3')
        return 'small toddler, round chubby face, big eyes, tiny hands';
      if (a.includes('preschool') || /\b[4-5]\s*(year|yr)/.test(a) || a === '4' || a === '5')
        return 'small young child, round face, bright curious eyes';
      if (/\b[6-9]\s*(year|yr)/.test(a) || a.includes('child') || a.includes('grade school') || a.includes('elementary'))
        return 'young child, small stature, round youthful face, bright eyes';
      if (/\b1[0-2]\s*(year|yr)/.test(a) || a.includes('preteen') || a.includes('pre-teen') || a.includes('tween'))
        return 'young preteen face, smooth skin, growing features';
      if (a.includes('teen') || a.includes('17') || a.includes('18') || a.includes('19') || a.includes('late teens') || /\b1[3-6]\s*(year|yr)/.test(a))
        return 'youthful face, smooth skin, soft features';
      if (a.includes('early 20') || a.includes('20s'))
        return 'young adult face, smooth skin, bright eyes';
      if (a.includes('late 20') || a.includes('early 30'))
        return 'adult face, faint smile lines, sharp features';
      if (a.includes('30s') || a.includes('mid 30'))
        return 'adult face, subtle laugh lines, strong bone structure';
      if (a.includes('late 30') || a.includes('early 40'))
        return 'mature face, visible smile lines, confident look';
      if (a.includes('40s') || a.includes('mid 40') || a.includes('late 40'))
        return 'middle-aged face, laugh lines, lived-in features';
      if (a.includes('early 50') || a.includes('50s'))
        return 'middle-aged face, some gray in hair, strong features with character';
      if (a.includes('late 50') || a.includes('early 60') || a.includes('60'))
        return 'older face, gray hair, deep laugh lines, weathered but strong';
      if (a.includes('70') || a.includes('80') || a.includes('elder') || a.includes('old'))
        return 'elderly face, white hair, deep wrinkles, thin skin';
      return '';
    };

    // =========================================================================
    // AGE-AWARE GENDER WORD — children get "boy"/"girl", not "man"/"woman"
    // FLUX renders "man" as an adult even with "age 3" — must use child terms.
    // =========================================================================
    const isChildAge = (ageRange) => {
      if (!ageRange) return false;
      const a = ageRange.toLowerCase();
      if (a.includes('infant') || a.includes('baby') || a.includes('newborn') || a.includes('toddler') ||
          a.includes('child') || a.includes('kid') || a.includes('preschool') || a.includes('grade school') ||
          a.includes('elementary') || a.includes('preteen') || a.includes('pre-teen') || a.includes('tween'))
        return true;
      // Check for numeric ages under 13
      const numMatch = a.match(/\b(\d{1,2})\b/);
      if (numMatch && parseInt(numMatch[1]) < 13) return true;
      return false;
    };

    const isTeenAge = (ageRange) => {
      if (!ageRange) return false;
      const a = ageRange.toLowerCase();
      if (a.includes('teen') || a.includes('adolescent')) return true;
      const numMatch = a.match(/\b(\d{1,2})\b/);
      if (numMatch) {
        const n = parseInt(numMatch[1]);
        if (n >= 13 && n <= 17) return true;
      }
      return false;
    };

    // =========================================================================
    // CLOTHING EXTRACTION from era cues
    // =========================================================================
    const extractClothingCues = (cues) => {
      if (!cues) return '';
      const clothingTerms = cues.split(',').filter(term => {
        const t = term.toLowerCase();
        return t.includes('suit') || t.includes('dress') || t.includes('shirt') ||
               t.includes('hat') || t.includes('hair') || t.includes('shoe') ||
               t.includes('boot') || t.includes('coat') || t.includes('jacket') ||
               t.includes('pant') || t.includes('skirt') || t.includes('cloth') ||
               t.includes('wear') || t.includes('lapel') || t.includes('collar') ||
               t.includes('tie') || t.includes('vest') || t.includes('uniform') ||
               t.includes('bonnet') || t.includes('fedora') || t.includes('denim') ||
               t.includes('leather') || t.includes('wool') || t.includes('silk') ||
               t.includes('linen') || t.includes('calico');
      }).map(t => t.trim());
      return clothingTerms.join(', ');
    };

    const eraClothingCues = extractClothingCues(eraCues);

    // =========================================================================
    // SHARED CHARACTER IDENTITY SYSTEM
    // =========================================================================
    // Build a reusable physical description for each character ONCE, then inject
    // into every scene and portrait. This is the main lever for visual consistency.
    const charIdentities = {};
    const allChars = characters || parsed_structure.characters || {};

    // Work-related location keywords — if a scene location matches,
    // work-only profession cues (journalist badge, chef apron, etc.) apply
    const workLocationKeywords = /\b(office|newsroom|hospital|clinic|surgery|courtroom|courthouse|kitchen|restaurant|bar|pub|lab|laboratory|school|classroom|university|station|precinct|field|arena|gym|ring|garage|workshop|studio|cockpit|airport|farm|ranch)\b/i;

    // Helper: "a" or "an" based on next word's starting sound (needed for non-human desc)
    const aOrAn = (word, capitalize) => {
      const an = /^[aeiou]/i.test(word);
      return capitalize ? (an ? 'An' : 'A') : (an ? 'an' : 'a');
    };

    Object.entries(allChars).forEach(([name, char]) => {
      let physDesc = char.physical_description || 'person with distinct features';
      // Strip expressions/emotions from physDesc — these are scene-specific, not permanent traits.
      // "bright smile", "warm grin", "stern frown" lock every scene into one mood.
      physDesc = physDesc
        .replace(/\b(bright|warm|wide|shy|gentle|confident|infectious|radiant|dazzling|cheerful|friendly|sweet)?\s*(smile|grin|smirk|frown|scowl|grimace|laugh|laughter)\b/gi, '')
        .replace(/\b(smiling|grinning|frowning|scowling|laughing|beaming)\b/gi, '')
        .replace(/\bwith\s+a\s+,/g, 'with a')  // clean up "with a ," artifacts
        .replace(/,\s*,/g, ',').replace(/,\s*$/, '').replace(/\s{2,}/g, ' ').trim();
      const age = char.age_range || 'adult';
      const energy = char.energy || 'neutral';
      const gender = char.gender || '';

      // NON-HUMAN characters: robots, AI, orbs, animals, digital entities
      // Skip the entire human identity pipeline — use physDesc directly as the visual identity
      // Fallback: detect non-human even if parser tagged gender wrong.
      // Check multiple signals: physDesc, voice_type, character name, profession.
      const nhKeywords = /\b(orb|robot|hologram|AI\b|artificial|digital\s*(entity|construct|assistant|orb|screen|being)?|android|drone|computer|virtual|LED\s+screen|glowing\s+light|software|algorithm|interface|voice\s*assistant|smart\s*speaker|machine|automaton|bot\b|cyborg|avatar|projection|screen\b)/i;
      const nhSearchText = [physDesc, char.voice_type || '', char.profession || '', name].join(' ');
      const isNonHumanFallback = gender !== 'non-human' && nhKeywords.test(nhSearchText);
      if (isNonHumanFallback) {
        console.log(`NON-HUMAN FALLBACK: "${name}" has gender "${gender}" but signals suggest non-human. Search text: "${nhSearchText.substring(0, 120)}"`);
      }
      if (gender === 'non-human' || isNonHumanFallback) {
        // If parser gave a human-style physDesc despite being non-human, replace it
        // with a generic non-human description based on available cues.
        let nhDesc = physDesc.trim();
        if (/^a\s+(man|woman|person)\s+(with|who)/i.test(nhDesc)) {
          // Parser wrote "a woman with..." for a non-human — use a generic orb/entity description
          const nameHint = name.toLowerCase();
          if (/receptionist/i.test(nameHint)) {
            nhDesc = 'a glowing digital orb on an LED screen';
          } else {
            nhDesc = 'a digital entity rendered on a screen';
          }
          console.log(`NON-HUMAN: Replaced human-style physDesc for "${name}" with: "${nhDesc}"`);
        }
        // Strip leading article so downstream consumers can add their own
        const nhDescNoArticle = nhDesc.replace(/^(a|an)\s+/i, '');
        const nhSceneDesc = nhDescNoArticle;
        const nhCompact = nhDescNoArticle;
        // Portrait: describe the entity up close
        const nhPortraitParts = [
          `Extreme close-up of ${aOrAn(nhDescNoArticle, false)} ${nhDescNoArticle}.`,
          `${energy} presence.`,
          'Sharp focus, shallow depth of field, photorealistic textures.'
        ];
        charIdentities[name] = {
          sceneDesc: nhSceneDesc,
          compactSceneDesc: nhCompact,
          portraitPromptParts: nhPortraitParts,
          genderWord: nhDesc,           // used in prompt slots where "man"/"woman" would go
          safeGenderWord: nhDesc,
          featureGenderWord: nhDesc,
          ethnicity: '',
          age: '',
          profession: char.profession || '',
          profVisualCues: '',
          energy,
          isNonHuman: true
        };
        return; // skip the rest of the human pipeline
      }

      // Use age-appropriate gender word: child → boy/girl, teen → teenage boy/girl, adult → man/woman
      let baseGenderWord;
      if (isChildAge(age)) {
        baseGenderWord = gender === 'male' ? 'boy' : gender === 'female' ? 'girl' : 'child';
      } else if (isTeenAge(age)) {
        baseGenderWord = gender === 'male' ? 'teenage boy' : gender === 'female' ? 'teenage girl' : 'teenager';
      } else {
        baseGenderWord = gender === 'male' ? 'man' : gender === 'female' ? 'woman' : 'person';
      }
      const ageCues = ageVisualCues(age);

      // Gender-aware physDesc cleanup: strip traits that contradict the selected gender.
      // "woman with gray beard" or "man in a torn calico dress" confuses FLUX.
      if (gender === 'female') {
        physDesc = physDesc
          .replace(/,?\s*\b(gray|grey|white|bushy|thick|thin|long|short|scraggly|unkempt|well-trimmed|salt-and-pepper)?\s*(beard|goatee|mustache|moustache|stubble|mutton\s*chops|sideburns)\b[^,]*/gi, '')
          .replace(/,?\s*\b(broad[- ]?shouldered|barrel[- ]?chested|heavyset)\b/gi, '')
          .replace(/,\s*,/g, ',').replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
      } else if (gender === 'male') {
        physDesc = physDesc
          .replace(/,?\s*\b(wearing\s+)?(a\s+)?(torn\s+|faded\s+|elegant\s+|flowing\s+|simple\s+)?(calico|cotton|lace|silk)?\s*(dress|gown|skirt|bonnet|petticoat|corset|blouse)\b[^,]*/gi, '')
          .replace(/,?\s*\b(delicate|petite|dainty)\b/gi, '')
          .replace(/,\s*,/g, ',').replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
      }

      // Ethnicity: explicit override → name inference → default White.
      // Priority: 1) Creator's explicit dropdown selection (strongest)
      //           2) Name-based inference — "Tanaka" → East Asian, "Garcia" → Hispanic
      //           3) Default White (FLUX defaults to White appearance when unspecified)
      //
      // Name inference uses surname patterns as soft ethnic signals. This matches how
      // audiences naturally read characters: "Tanaka" reads East Asian, "Cole" reads ambiguous.
      // The inferred ethnicity drives PHYSICAL FEATURE descriptors (hair, skin tone),
      // NOT ethnic labels — so CLIP binds features per-character without global bleed.
      const inferEthnicityFromName = (fullName) => {
        if (!fullName) return null;
        const parts = fullName.trim().split(/\s+/);
        const surname = (parts.length > 1 ? parts[parts.length - 1] : '').toLowerCase();
        const firstName = parts[0].toLowerCase();

        // East Asian surnames
        if (/^(tanaka|yamamoto|suzuki|watanabe|takahashi|sato|ito|nakamura|kobayashi|yoshida|saito|matsumoto|inoue|kimura|hayashi|shimizu|yamaguchi|mori|abe|ikeda|hashimoto|ogawa|ishikawa|ueda|morita|fujita|okada|nishimura)$/i.test(surname)) return 'Japanese';
        if (/^(kim|park|lee|choi|jung|kang|cho|yoon|jang|lim|han|shin|seo|kwon|hwang|ahn|song|yoo|hong|moon|bae|baek|nam|ryu)$/i.test(surname)) return 'Korean';
        if (/^(wang|li|zhang|liu|chen|yang|huang|zhao|wu|zhou|xu|sun|ma|zhu|hu|guo|lin|he|gao|luo|zheng|liang|xie|tang|deng|han|feng|cao|peng|zeng|xiao|tian|dong|pan|yuan|gu|yu|lu|wei|su|jiang)$/i.test(surname)) return 'Chinese';
        // Catch-all East Asian first names
        if (/^(yuki|kenji|akira|hiro|sakura|mei|jing|xiu|ming|ling|suki|koji|ren|kaito|hana|yuna|jun|jin|hyun|seo|min|dae)$/i.test(firstName)) return 'East Asian';

        // South Asian surnames
        if (/^(patel|sharma|singh|kumar|gupta|mehta|joshi|shah|rao|das|bhat|nair|reddy|iyer|pillai|verma|mishra|pandey|chopra|malhotra|kapoor|chandra|rajan|devi|khan)$/i.test(surname)) return 'South Asian';

        // Hispanic/Latino surnames
        if (/^(garcia|rodriguez|martinez|lopez|gonzalez|hernandez|perez|sanchez|ramirez|torres|flores|rivera|gomez|diaz|morales|reyes|cruz|ortiz|gutierrez|chavez|ramos|vargas|castillo|mendoza|ruiz|alvarez|romero|jimenez|medina|aguilar|vega|delgado|soto|guerrero|espinoza|contreras)$/i.test(surname)) return 'Hispanic';

        // African surnames — distinctive patterns that are unambiguously African origin
        if (/^(mwangi|okafor|okonkwo|adeyemi|adesanya|obi|nwosu|achebe|eze|nnamdi|okoro|chukwu|emeka|ogbonna|ndidi|amadi|okeke|uzoma|onyeka|kamau|wanjiku|njoroge|kimani|kariuki|muthoni|otieno|odhiambo|achieng|kipchoge|toure|diallo|diop|sow|traore|coulibaly|keita|konate|ouattara|camara|sylla|dembele|mensah|asante|adjei|boateng|owusu|amponsah|agyemang|annan)$/i.test(surname)) return 'Black';
        // African-American common surnames — these overlap with White surnames,
        // so only return Black when paired with distinctively Black first names
        if (/^(washington|jefferson|jackson|freeman|banks|booker|tucker|brooks|coleman|hayes|sanders|simmons|reed|howard|dixon|porter|butler|jenkins|perry|foster|barnes|powell|hunter|alexander|watts|logan)$/i.test(surname)) {
          if (/^(deshawn|jamal|tyrone|lamar|aaliyah|imani|keisha|ebony|malik|jaden|zion|kai|amari|nia|kendra|darnell|marquis|terrell|devonte|shanice|latoya|rashad)$/i.test(firstName)) return 'Black';
          return null; // ambiguous — default to White
        }

        // Middle Eastern surnames
        if (/^(al-|el-|abd|abdul|hassan|hussein|ali|omar|ahmed|mohammed|ibrahim|khalil|salem|nasser|farah|khoury|haddad|mansour|yousef|karimi|hosseini|tehrani|rahimi|mohammadi)$/i.test(surname)) return 'Middle Eastern';
        if (/^al[a-z]+$/i.test(surname) && surname.length > 4) return 'Middle Eastern'; // Al-prefix fused

        // Indigenous/Native (very limited — mostly avoid assumptions)
        // Only match very distinctive patterns

        return null; // ambiguous — will default to White
      };

      const ethnicity = char.ethnicity_override || inferEthnicityFromName(name) || 'White';
      // Strip any ethnic cues from physDesc — genderWord handles ethnicity exclusively
      physDesc = physDesc
        .replace(/\b(Black|African|Latino|Latina|Hispanic|Asian|East Asian|South Asian|Southeast Asian|Middle Eastern|Arab|Indigenous|Native|Pacific Islander|Korean|Japanese|Chinese|Indian|Filipino|Vietnamese|Mexican|Caribbean|Afro)\b[^,.]*/gi, '')
        .replace(/,\s*,/g, ',').replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
      // Standard genderWord: "East Asian man", "White woman", etc.
      const genderWord = ethnicity ? `${ethnicity} ${baseGenderWord}` : baseGenderWord;
      // SAFE genderWord for mixed-ethnicity multi-char scenes:
      // FLUX's CLIP treats multi-word ethnic labels ("East Asian") as global modifiers
      // that shift ALL faces. Strategy: use single-word ethnic terms or skin-tone + hair
      // descriptors that FLUX interprets per-character rather than globally.
      //   - Compound labels ("East Asian") → single-word equivalent ("Korean") or features
      //   - "White" → "Caucasian" (stronger, more clinical anchor in CLIP space)
      //   - Single-word labels ("Black", "Korean") bleed less than compounds
      const safeEthnicityMap = {
        'White':              'Caucasian',
        'Black':              'African-American',
        'African':            'African',
        'Latino':             'Latino',
        'Latina':             'Latina',
        'Hispanic':           'Hispanic',
        'East Asian':         'Korean',        // single-word proxy, less bleed than "East Asian"
        'South Asian':        'Indian',
        'Southeast Asian':    'Filipino',
        'Middle Eastern':     'Mediterranean',
        'Arab':               'Mediterranean',
        'Indigenous':         'Indigenous',
        'Native':             'Indigenous',
        'Pacific Islander':   'Polynesian',
        'Korean':             'Korean',
        'Japanese':           'Japanese',
        'Chinese':            'Chinese',
        'Latino/a':           'Latino',
        'Mixed race':         '',  // no single ethnic term — let physDesc carry appearance
      };
      const safeEthLabel = safeEthnicityMap[ethnicity] || ethnicity;
      const safeGenderWord = safeEthLabel
        ? `${safeEthLabel} ${baseGenderWord}`
        : baseGenderWord;

      // FEATURE-BASED ethnicity for mixed-ethnicity scenes.
      // Ethnic LABELS ("Korean") enter CLIP's global attention pool → bleed onto all faces.
      // Physical FEATURES ("straight black hair, warm golden skin") bind per-character because
      // CLIP treats them as concrete visual attributes attached to the nearest noun, not style tokens.
      // In mixed scenes: White chars get NO features (FLUX defaults White), non-White chars get features.
      // NO COMMAS in feature strings — commas break the action-first comma-split logic.
      // Use "and" to join traits so the entire feature phrase stays in the genderPart slot.
      const ethnicFeatureMap = {
        'White':              '',  // no features needed — FLUX defaults to White
        'Black':              'dark brown skin and coily black hair',
        'African':            'dark brown skin and coily black hair',
        'Latino':             'warm brown skin and dark wavy hair',
        'Latina':             'warm brown skin and dark wavy hair',
        'Hispanic':           'warm brown skin and dark wavy hair',
        'East Asian':         'straight black hair and warm golden skin',
        'South Asian':        'deep brown skin and thick dark hair',
        'Southeast Asian':    'warm tan skin and straight dark hair',
        'Middle Eastern':     'olive skin and dark hair',
        'Arab':               'olive skin and dark hair',
        'Indigenous':         'warm copper skin and straight dark hair',
        'Native':             'warm copper skin and straight dark hair',
        'Pacific Islander':   'warm brown skin and thick dark wavy hair',
        'Korean':             'straight black hair and warm golden skin',
        'Japanese':           'straight black hair and fair warm skin',
        'Chinese':            'straight black hair and warm golden skin',
        'Latino/a':           'warm brown skin and dark wavy hair',
        'Mixed race':         '',  // no single feature set — let physDesc carry appearance
      };
      const ethnicFeatures = ethnicFeatureMap[ethnicity] || '';
      // featureGenderWord: "man with straight black hair, warm golden skin tone" or just "woman"
      const featureGenderWord = ethnicFeatures
        ? `${baseGenderWord} with ${ethnicFeatures}`
        : baseGenderWord;
      if (ethnicity) {
        // Strip existing skin tone references from physDesc to avoid conflicting cues
        physDesc = physDesc
          .replace(/\b(pale|fair|olive|dark|light|brown|tan|ebony|ivory|copper|golden|caramel|porcelain|alabaster|bronze|tawny|mahogany|chocolate|mocha|peach|ruddy|sallow|swarthy)\s+(skin(ned)?|complex(ion(ed)?)?|tone(d)?)\b/gi, '')
          .replace(/,\s*,/g, ',').replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
      }

      // Clean up profession: filter out "none", "unknown", "n/a"
      // Children don't have professions — strip for toddlers/kids
      const rawProf = (char.profession || '').toLowerCase().trim();
      const profession = (rawProf && rawProf !== 'none' && rawProf !== 'unknown' && rawProf !== 'n/a' && !isChildAge(age))
        ? char.profession : '';
      const profLabel = profession ? `, ${profession}` : '';

      // Profession → identity-first visual cues (NOT isolated props — FLUX renders props literally).
      // Each entry is a HOLISTIC outfit description that FLUX interprets as a recognizable archetype.
      // Bad:  "badge clipped to belt, shoulder holster under jacket" → FLUX renders floating badge + holster
      // Good: "detective in a rumpled suit" → FLUX renders a person who LOOKS like a detective
      //
      // SPLIT: "always" = clothing IS the character identity (worn in every scene).
      //        "work"   = gear/uniform only in work-related scenes (office, field, etc.).
      // The scene's location determines if work-only cues apply.
      const professionAlwaysMap = {
        // These professions define the character's look everywhere
        'detective':        'detective in a rumpled suit',
        'homicide detective': 'detective in a rumpled suit',
        'detective partner': 'detective in a worn jacket',
        'plainclothes detective': 'detective in a worn jacket',
        'police officer':   'uniformed police officer in navy blues',
        'officer':          'uniformed police officer in navy blues',
        'cop':              'uniformed police officer in navy blues',
        'patrol officer':   'uniformed police officer in navy blues',
        'sheriff':          'county sheriff in tan uniform with star badge',
        'soldier':          'soldier in military fatigues and combat boots',
        'priest':           'priest in black clerical shirt with white collar',
        'nun':              'nun in black habit and white wimple',
        'cowboy':           'cowboy in wide-brimmed hat and duster coat',
        'rancher':          'rancher in worn cowboy hat and denim work shirt',
        'bounty hunter':    'bounty hunter in duster coat and wide-brimmed hat',
        'cavalry officer':  'cavalry officer in Union Army uniform',
        'former cavalry officer': 'former cavalry officer in worn military coat',
        'general':          'general in decorated military dress uniform',
        'lawyer':           'lawyer in tailored suit with leather briefcase',
        'attorney':         'attorney in tailored suit with leather briefcase',
        'businessman':      'businessman in tailored dark suit',
        'businesswoman':    'businesswoman in tailored blazer'
      };
      const professionWorkMap = {
        // These professions only show gear/uniform in work-related scenes
        'doctor':           'doctor in white lab coat with stethoscope',
        'surgeon':          'surgeon in surgical scrubs and cap',
        'nurse':            'nurse in medical scrubs',
        'firefighter':      'firefighter in turnout gear',
        'chef':             'chef in white double-breasted coat and apron',
        'bartender':        'bartender in vest and rolled sleeves',
        'mechanic':         'mechanic in oil-stained coveralls',
        'judge':            'judge in black judicial robe',
        'teacher':          'teacher in business casual with reading glasses',
        'professor':        'professor in tweed jacket with elbow patches',
        'scientist':        'scientist in white lab coat',
        'journalist':       'journalist with press badge and notepad',
        'reporter':         'reporter with press badge and notepad',
        'photographer':     'photographer with camera hanging from neck strap',
        'pilot':            'pilot in navy uniform with epaulettes',
        'farmer':           'farmer in overalls and work boots',
        'waitress':         'waitress in uniform with apron',
        'waiter':           'waiter in black vest over white shirt',
        'boxer':            'boxer in boxing gloves and shorts',
        'athlete':          'athlete in athletic jersey',
        'thief':            'figure in dark hoodie and gloves'
      };
      let profVisualCues = '';
      let workOnlyCues = '';
      if (profession) {
        if (professionAlwaysMap[rawProf]) {
          profVisualCues = professionAlwaysMap[rawProf];
        } else if (professionWorkMap[rawProf]) {
          // Work-only: no cues by default, stored for per-scene application
          profVisualCues = '';
          workOnlyCues = professionWorkMap[rawProf];
        }
      }

      // Format age: "17" → "17-year-old", ranges pass through
      const ageFormatted = /^\d{1,2}$/.test(age.trim()) ? `${age.trim()}-year-old` : age;

      // Strip leading gender from physDesc to avoid "a woman with a woman with..."
      physDesc = physDesc
        .replace(/^(a\s+)?(man|woman|person|young man|young woman|teenage girl|teenage boy|girl|boy)\s+(with\s+)?/i, '')
        .trim();

      // Strip redundant age from physDesc — already added via ageFormatted.
      // LLM often writes "in her 40s with..." or "in his early 30s, ..." which duplicates "age 40s".
      physDesc = physDesc
        .replace(/^in\s+(his|her|their)\s+(early\s+|mid[- ]?|late\s+)?\d{1,2}s\s*(,\s*|\s+with\s+)/i, '')
        .replace(/^(aged?\s+)?\d{1,2}s?\s*(,\s*|\s+)/i, '')
        .trim();

      // Strip positional/action phrases — these belong in character_actions per scene
      physDesc = physDesc
        .replace(/,?\s*\b(on horseback|on foot|riding|sitting|standing|kneeling|running|walking|crouching|leaning|mounted|dismounted|on a horse|atop a horse|in the saddle)\b[^,]*/gi, '')
        .replace(/,\s*,/g, ',')
        .replace(/,\s*$/, '')
        .trim();

      // Wardrobe priority: profession visual cues always win when set (detective needs badge+holster),
      // then physDesc clothing, then era generic clothing.
      // Strip LLM-guessed clothing ("likely wearing...", "probably dressed in...") — these are
      // NOT script-explicit and produce generic wardrobes ("jacket and badge") that make
      // same-profession characters visually identical. Let profVisualCues handle wardrobe instead.
      const likelyClothingRe = /,?\s*\b(likely|probably|presumably|possibly)\s+(wearing|dressed in|clad in)\b[^,.]*[.,]?/gi;
      const hadLikelyClothing = likelyClothingRe.test(physDesc);
      if (hadLikelyClothing) {
        console.log(`  WARDROBE: Stripping LLM-guessed clothing from physDesc for "${name}": "${physDesc.match(likelyClothingRe)?.[0]?.trim()}"`);
        physDesc = physDesc.replace(likelyClothingRe, '').replace(/,\s*,/g, ',').replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
      }
      const hasClothingInDesc = /\b(wear|dress|shirt|coat|suit|uniform|gown|robe|vest|jacket|pants|skirt|hat|bonnet|boots|calico|denim|leather|wool)\b/i.test(physDesc);

      let wardrobeLine = '';
      if (profVisualCues && hasClothingInDesc) {
        // Script explicitly describes clothing AND we have profession cues —
        // script clothing wins. "Hands in jacket pockets" should NOT become "uniformed police officer".
        // Keep the profession ROLE (for compact desc) but don't override the script's wardrobe.
        wardrobeLine = ''; // physDesc clothing takes priority
        console.log(`  WARDROBE: Script clothing in physDesc wins over profession cues "${profVisualCues}" for "${name}"`);
      } else if (profVisualCues) {
        // No clothing in physDesc — profession cues define the character's visual role
        // (detective badge, police uniform, doctor's coat, etc.)
        wardrobeLine = profVisualCues;
        // Strip redundant clothing from physDesc — profession cues handle wardrobe now.
        // Keeps physical traits (hair, build, face, scars) but removes "wearing X", garments, accessories.
        physDesc = physDesc
          .replace(/,?\s*\b(wearing|dressed in|clad in)\b[^,.]*/gi, '')
          .replace(/,?\s*\b(blazer|jacket|coat|vest|shirt|dress shirt|suit|tie|uniform|holster|badge|shield|boots?|shoes?|pants|trousers|belt)\b[^,.]*/gi, '')
          .replace(/,\s*,/g, ',').replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
      } else if (hasClothingInDesc) {
        wardrobeLine = ''; // physDesc already describes their clothing, no profession to add
      } else if (eraClothingCues) {
        wardrobeLine = `authentic ${eraLabel} period clothing: ${eraClothingCues}`;
      } else if (isHistoricalEra) {
        wardrobeLine = `authentic ${eraLabel} period clothing and hairstyle`;
      }

      // Visual occlusion: if wearing outer layer, suppress hidden items from physDesc
      physDesc = applyVisualOcclusion(physDesc);

      const charEraLine = wardrobeLine ? `wearing ${wardrobeLine}` : '';

      // SCENE description: identity + profession + physical traits
      // When wardrobeLine is set from profession, it already contains the role name ("detective in a rumpled suit")
      // so skip the separate profLabel to avoid duplication ("detective, detective in a rumpled suit")
      const wardrobeInScene = wardrobeLine ? `, ${wardrobeLine},` : ',';
      const sceneDesc = wardrobeLine
        ? `${genderWord}, age ${ageFormatted}, ${wardrobeLine}, ${physDesc}`
        : `${genderWord}, age ${ageFormatted}${profLabel}${wardrobeInScene} ${physDesc}`;

      // Extract short HAIR TOKEN (~2-3 tokens) for consistency across scenes.
      // Try "[color/style] hair" first, then "hair [descriptor]" reversed patterns.
      const hairMatch = physDesc.match(/\b(black|dark|brown|light brown|blonde|blond|red|auburn|gray|grey|white|silver|sandy|chestnut|copper|ginger|golden|platinum|raven|long|short|curly|wavy|straight|cropped|shaved|braided|matted|thinning|buzzed|slicked)\s+(hair|beard|curls|locks)\b/i)
        || physDesc.match(/\b(hair|beard)\s+(pulled|tied|in a|cropped|buzzed)\b/i)
        || physDesc.match(/\b(bald|shaved head|buzz cut|crew cut)\b/i);
      const hairToken = hairMatch ? hairMatch[0] : '';

      // COMPACT description for 2+ character scenes.
      // Ultra-short: age + gender + hair + ONE face feature + ONE wardrobe item.
      const physParts = physDesc.split(',').map(p => p.trim()).filter(Boolean);
      const facePart = physParts.find(p =>
        !/(wearing|dressed|coat|hat|dress|suit|boot|shirt|uniform|vest|jacket)/i.test(p) &&
        !(hairToken && p.toLowerCase().includes(hairToken.toLowerCase()))
      ) || physParts[0] || '';
      // Wardrobe for compact desc: script clothing wins over profession map when both exist.
      // If physDesc has explicit clothing from the script, use that. Otherwise fall back to profession cues.
      const wardrobePart = (hasClothingInDesc)
        ? (physParts.find(p => /(wearing|dressed|coat|hat|dress|suit|boot|shirt|uniform|vest|jacket|calico|duster)/i.test(p)) || '')
        : (profVisualCues ? profVisualCues.split(',')[0].trim() : '');
      const compactFeatures = [hairToken, facePart, wardrobePart].filter(Boolean).join(', ');
      const compactSceneDesc = `${genderWord}, age ${ageFormatted}, ${compactFeatures}`;

      // PORTRAIT: character concept — full design showing how the character looks.
      // Uses the SAME descriptors (featureGenderWord, physDesc, wardrobe) as scene prompts
      // so FLUX generates a consistent visual identity across portrait and scene images.
      // Strip heavy aging language that FLUX interprets as 70+:
      const portraitPhysDesc = physDesc
        .replace(/\bsun-?weathered\b/gi, 'tan')
        .replace(/\btrail-?worn\b/gi, 'rugged')
        .replace(/\b(grizzled|leathery|haggard|gaunt|wizened|withered|craggy)\b/gi, 'rugged');

      const portraitPromptParts = [
        `Character concept portrait of ${aOrAn(featureGenderWord)} ${featureGenderWord}, age ${ageFormatted}.`,
        `${energy} expression.`,
        portraitPhysDesc ? portraitPhysDesc + '.' : '',
        charEraLine ? charEraLine + '.' : '',
        'Three-quarter body, neutral studio background, photorealistic, cinematic lighting, shallow depth of field.'
      ];

      charIdentities[name] = { sceneDesc, compactSceneDesc, portraitPromptParts, genderWord, safeGenderWord, featureGenderWord, ethnicity, age: ageFormatted, profession, profVisualCues, workOnlyCues, energy };
    });

    // =========================================================================
    // SCENE IMAGES (max 3)
    // =========================================================================
    allScenes.forEach((scene, i) => {
      // -----------------------------------------------------------------
      // PER-SCENE ERA OVERRIDE — flashback headings, embedded years
      // Scene headings like "INT. LIVING ROOM - 1932 - FLASHBACK" contain
      // a year that should override the global era for THIS scene only.
      // MUST be defined before cleanAction() which calls sceneStripAnachronisms.
      // -----------------------------------------------------------------
      let sceneEraLabel = eraLabel;
      let sceneEraYear = eraYear;
      let sceneEraDescription = eraDescription;
      let sceneIsHistoricalEra = isHistoricalEra;

      const sceneTextForEra = [
        scene.location || '',
        scene.description || '',
        scene.image_prompt_base || ''
      ].join(' ');

      const explicitSceneYear = scene.scene_year ? parseInt(scene.scene_year) : null;
      const sceneYearMatch = sceneTextForEra.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
      const detectedYear = explicitSceneYear || (sceneYearMatch ? parseInt(sceneYearMatch[1]) : null);
      const isFlashback = /\bflashback\b/i.test(sceneTextForEra + ' ' + (scene.location || ''));

      if (detectedYear) {
        if (Math.abs(detectedYear - eraYear) > 10 || isFlashback) {
          const decade = Math.floor(detectedYear / 10) * 10;
          sceneEraLabel = `${decade}s`;
          sceneEraYear = detectedYear;
          sceneEraDescription = `Set in the ${decade}s.`;
          sceneIsHistoricalEra = detectedYear < 2000;
        }
      } else if (isFlashback) {
        console.log(`--- Scene ${scene.scene_num || (i + 1)}: FLASHBACK detected but no year found`);
      }

      // Per-scene anachronism filter using the scene-specific era year
      const sceneStripAnachronisms = (text) => {
        if (!text || sceneEraYear >= 2000) return text;
        let cleaned = text;
        if (sceneEraYear < 2000) {
          cleaned = cleaned.replace(/\b(smartphone|iphone|android|tablet|ipad|laptop|wifi|bluetooth|drone|uber|lyft|airpod|earbud|flat-?screen|LED\s+screen|ring\s+light|selfie|vlog)\b[^,.]*/gi, '');
        }
        if (sceneEraYear < 1980) {
          cleaned = cleaned.replace(/\b(cell\s*phone|mobile\s*phone|phone|computer\s+screen|monitor|microwave|VHS|cassette\s+player|CD|compact\s+disc|pager|beeper|fax\s+machine|satellite\s+dish)\b[^,.]*/gi, '');
        }
        if (sceneEraYear < 1950) {
          cleaned = cleaned.replace(/\b(television|TV\s+set|TV|neon\s+sign|plastic|vinyl|transistor\s+radio|jukebox|fluorescent\s+light|fluorescent|lego|legos|lego\s+pieces?|lego\s+bricks?|lego\s+car|play-?doh|slinky)\b[^,.]*/gi, '');
        }
        if (sceneEraYear < 1920) {
          cleaned = cleaned.replace(/\b(telephone|radio|automobile|car|truck|motorcycle|airplane|neon|electric\s+light|light\s+bulb|movie\s+theater|cinema|record\s+player|phonograph)\b[^,.]*/gi, '');
        }
        if (sceneEraYear < 1850) {
          cleaned = cleaned.replace(/\b(telegraph|train|railroad|railway|steam\s+engine|photograph|camera|revolver|repeating\s+rifle|barbed\s+wire|typewriter|sewing\s+machine)\b[^,.]*/gi, '');
        }
        cleaned = cleaned
          .replace(/\bpressed\s+to\s+(her|his|their)\s+ear\b/gi, '')
          .replace(/,\s*,+/g, ',').replace(/,\s*\./g, '.').replace(/\s{2,}/g, ' ')
          .replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
        return cleaned;
      };

      // Resolve scene character names to charIdentity keys.
      // Parser may output "BUCKY", "YOUNG BILL", or "TEACHER" while charIdentities
      // has "Bucky Builtworth", "William Byron Builtworth", etc.
      // Resolution tiers:
      //   1. Exact match (case-insensitive)
      //   2. Starts-with / contains match
      //   3. First-name match (after stripping age prefixes like YOUNG/OLD/LITTLE)
      //   4. Nickname → formal name mapping (Bill→William, etc.)
      //   5. Unresolved → marked as extra (generic "figure", doesn't inflate cast count)
      const allIdentityKeys = Object.keys(charIdentities);

      // Common English nickname → formal name mappings
      const nicknameMap = {
        'bill': 'william', 'billy': 'william', 'will': 'william', 'willy': 'william', 'liam': 'william',
        'bob': 'robert', 'bobby': 'robert', 'rob': 'robert', 'robbie': 'robert',
        'dick': 'richard', 'rick': 'richard', 'ricky': 'richard', 'rich': 'richard',
        'jim': 'james', 'jimmy': 'james', 'jamie': 'james',
        'joe': 'joseph', 'joey': 'joseph',
        'mike': 'michael', 'mikey': 'michael',
        'tom': 'thomas', 'tommy': 'thomas',
        'jack': 'john', 'johnny': 'john', 'jon': 'john',
        'ted': 'theodore', 'teddy': 'theodore',
        'ed': 'edward', 'eddie': 'edward', 'ned': 'edward',
        'dan': 'daniel', 'danny': 'daniel',
        'dave': 'david', 'davy': 'david',
        'steve': 'stephen', 'stevie': 'stephen',
        'pat': 'patrick', 'patty': 'patricia', 'trish': 'patricia',
        'liz': 'elizabeth', 'lizzy': 'elizabeth', 'beth': 'elizabeth', 'betty': 'elizabeth',
        'kate': 'katherine', 'katie': 'katherine', 'kathy': 'katherine',
        'sue': 'susan', 'suzy': 'susan',
        'jen': 'jennifer', 'jenny': 'jennifer',
        'meg': 'margaret', 'maggie': 'margaret', 'peggy': 'margaret',
        'tony': 'anthony',
        'chris': 'christopher', 'topher': 'christopher',
        'alex': 'alexander', 'al': 'albert',
        'sam': 'samuel', 'sammy': 'samuel',
        'ben': 'benjamin', 'benny': 'benjamin',
        'charlie': 'charles', 'chuck': 'charles',
        'nick': 'nicholas', 'nicky': 'nicholas',
        'matt': 'matthew',
        'greg': 'gregory',
        'hank': 'henry', 'harry': 'henry',
        'frank': 'franklin', 'frankie': 'franklin',
        'ray': 'raymond',
        'larry': 'lawrence',
        'buck': 'bucky', 'bucky': 'bucky',  // direct pass-through for diminutives that ARE the name
      };

      // Age/descriptor prefixes the parser adds to character names in flashbacks
      const agePrefixes = /^(young|old|older|elderly|little|baby|kid|teen|teenage|child|adult|middle-aged|aged)\s+/i;

      const resolveCharName = (rawName) => {
        const lower = rawName.toLowerCase().trim();

        // Tier 1: exact match (case-insensitive)
        const exact = allIdentityKeys.find(k => k.toLowerCase() === lower);
        if (exact) return exact;

        // Tier 2: starts-with / contains match
        const startsWith = allIdentityKeys.find(k =>
          k.toLowerCase().startsWith(lower) || lower.startsWith(k.toLowerCase())
        );
        if (startsWith) return startsWith;

        // Tier 3: strip age prefix, then first-name match
        const stripped = lower.replace(agePrefixes, '').trim();
        const firstName = stripped.split(/\s+/)[0];

        const firstNameMatch = allIdentityKeys.find(k =>
          k.split(' ')[0].toLowerCase() === firstName
        );
        if (firstNameMatch) return firstNameMatch;

        // Tier 4: nickname resolution — "Bill" → "William", then match
        const formalName = nicknameMap[firstName];
        if (formalName) {
          const nickMatch = allIdentityKeys.find(k =>
            k.split(' ')[0].toLowerCase() === formalName
          );
          if (nickMatch) return nickMatch;
        }

        // Tier 5: check if ANY word in the raw name matches any first name in identities
        // Catches "YOUNG BILL BUILTWORTH" where "BILL" is a middle token
        const words = stripped.split(/\s+/);
        for (const word of words) {
          const wordMatch = allIdentityKeys.find(k =>
            k.split(' ')[0].toLowerCase() === word
          );
          if (wordMatch) return wordMatch;
          // Also try nickname for each word
          const wordFormal = nicknameMap[word];
          if (wordFormal) {
            const wordNickMatch = allIdentityKeys.find(k =>
              k.split(' ')[0].toLowerCase() === wordFormal
            );
            if (wordNickMatch) return wordNickMatch;
          }
        }

        return rawName; // no match — will be filtered as an extra
      };

      // ---------------------------------------------------------------
      // SAFETY NET: cross-reference character_actions, voiceover_options,
      // and scene description for characters the parser forgot to list
      // in characters_present. Llama 3 70B sometimes drops late-arriving
      // or mid-scene characters from this array.
      // ---------------------------------------------------------------
      const presentSet = new Set((scene.characters_present || []).map(n => n.toUpperCase().trim()));

      // Check character_actions keys — if parser gave an action for a character,
      // they're obviously present in the scene
      const rawActionKeys = Object.keys(scene.character_actions || {});
      for (const key of rawActionKeys) {
        const upper = key.toUpperCase().trim();
        if (upper && !presentSet.has(upper)) {
          console.log(`[SAFETY NET] Scene ${scene.scene_num}: adding "${key}" from character_actions (missing from characters_present)`);
          scene.characters_present = scene.characters_present || [];
          scene.characters_present.push(key);
          presentSet.add(upper);
        }
      }

      // Check voiceover_options — if a character speaks, they're present
      const voOptions = scene.voiceover_options || [];
      for (const opt of voOptions) {
        if (opt.character && opt.type !== 'stage_direction') {
          const upper = opt.character.toUpperCase().trim();
          if (upper && !presentSet.has(upper)) {
            console.log(`[SAFETY NET] Scene ${scene.scene_num}: adding "${opt.character}" from voiceover dialogue (missing from characters_present)`);
            scene.characters_present = scene.characters_present || [];
            scene.characters_present.push(opt.character);
            presentSet.add(upper);
          }
        }
      }

      // NOTE: Description-based safety net removed — scanning scene descriptions
      // for character names caused false positives when characters are merely
      // mentioned or thought about (e.g. "Mark finds Mallory's letter" added
      // Mallory as physically present). The character_actions and voiceover_options
      // safety nets above are sufficient.

      // ---------------------------------------------------------------
      // GHOST CHARACTER FILTER: Remove characters whose only action is
      // a generic placeholder like "standing nearby, observing". These
      // are hallucinated by the parser when it lists ALL story characters
      // in every scene instead of only those physically present.
      // ---------------------------------------------------------------
      const genericActionPattern = /^(standing nearby|observing|standing nearby, observing|nearby|watching|looking on|present)$/i;
      const rawActions = scene.character_actions || {};
      const rawPresent = scene.characters_present || [];
      // Build set of characters who have dialogue in this scene — never filter them
      const speakingChars = new Set();
      (scene.voiceover_options || []).forEach(opt => {
        if (opt.character && opt.type !== 'stage_direction' && opt.line && opt.line.trim()) {
          speakingChars.add(opt.character.toUpperCase().trim());
        }
      });
      scene.characters_present = rawPresent.filter(name => {
        const resolvedName = resolveCharName(name);
        const action = rawActions[name] || rawActions[resolvedName] || '';
        const nameUpper = (resolvedName || name).toUpperCase().trim();
        // Never filter characters who have dialogue — they're definitely present
        if (speakingChars.has(nameUpper) || speakingChars.has(name.toUpperCase().trim())) {
          return true;
        }
        if (genericActionPattern.test(action.trim())) {
          console.log(`[GHOST FILTER] Scene ${scene.scene_num || (i + 1)}: removing "${name}" — generic action "${action.trim()}" and no dialogue`);
          // Also remove from character_actions so it doesn't get picked up later
          delete rawActions[name];
          delete rawActions[resolvedName];
          return false;
        }
        return true;
      });

      const sceneCharNamesRaw = (scene.characters_present || []).map(resolveCharName);

      // Separate resolved CAST (matched to charIdentities) from EXTRAS (unresolved).
      // Only resolved cast members drive the character count template (1-char, 2-char, 3+).
      // Extras get a generic "figure" mention but don't inflate the template —
      // "Exactly two people" with two unresolved names generates two random people.
      const resolvedCast = sceneCharNamesRaw.filter(n => charIdentities[n]);
      const unresolvedExtras = sceneCharNamesRaw.filter(n => !charIdentities[n]);

      // Separate resolved cast into HUMAN and NON-HUMAN.
      // Non-human characters (orbs, robots, AI screens) go into the ENVIRONMENT block,
      // not the character block — FLUX renders character-block items as physical entities
      // near/in human characters' hands. Non-humans belong in the set description.
      const resolvedHumans = resolvedCast.filter(n => !charIdentities[n]?.isNonHuman);
      const resolvedNonHumans = resolvedCast.filter(n => charIdentities[n]?.isNonHuman);

      // Build environment clause for non-human characters.
      // sceneDesc is stored WITHOUT leading article, so add one back here.
      let envNonHumanClause = '';
      if (resolvedNonHumans.length > 0) {
        envNonHumanClause = resolvedNonHumans.map(n => {
          const nhId = charIdentities[n];
          if (!nhId) return '';
          const desc = nhId.sceneDesc;
          return `${aOrAn(desc, false)} ${desc}`;
        }).filter(Boolean).join('. ') + '.';
      }

      // The template is driven by HUMAN cast count only.
      // Non-humans are in the environment. Extras are appended as generic figures.
      const sceneCharNames = resolvedHumans;
      const charCount = resolvedHumans.length;
      const extraCount = unresolvedExtras.length;

      // Debug: log character resolution for this scene
      if (unresolvedExtras.length > 0) {
        console.log(`--- SCENE ${scene.scene_num || (i + 1)}: EXTRAS (unresolved): [${unresolvedExtras.join(', ')}] from raw: [${(scene.characters_present || []).join(', ')}] → resolved cast: [${resolvedCast.join(', ')}] (available: [${Object.keys(charIdentities).join(', ')}])`);
      }

      // -----------------------------------------------------------------
      // ---------------------------------------------------------------
      // CHARACTER BLOCK: identity + action per character, NO NAMES.
      // FLUX interprets name-like tokens as extra people.
      //
      // Strategy:
      // 1 char:  "A [desc] is the sole figure. She is [action]."
      // 2 chars: "A [descA] — and a [descB]. The [ageA genderA] is [actionA]. The [ageB genderB] is [actionB]."
      // 3+ chars: PAIR each description with its action in one sentence to prevent trait bleed:
      //           "A [descA], [actionA]. A [descB], [actionB]. A [descC], [actionC]."
      // ---------------------------------------------------------------

      // aOrAn helper defined above (before character identity loop)

      // Helper: clean an action string — strip names, enforce single action
      const allCharNames = Object.keys(charIdentities);
      // Check if the scene environment describes a body/victim — used to anchor posture verbs
      const sceneEnvText = (scene.image_prompt_base || '') + ' ' + (scene.description || '');
      const sceneHasBody = /\b(body|corpse|victim|dead\s+(man|woman|person|figure)|covered\s+by\s+a\s+(tarp|sheet|blanket))\b/i.test(sceneEnvText);

      const cleanAction = (rawAction) => {
        if (!rawAction) return '';
        let action = rawAction;

        // 1. Normalize curly apostrophes then strip character names
        action = action.replace(/[\u2018\u2019\u2032\u0060]/g, "'");
        allCharNames.forEach(cn => {
          const fn = cn.split(' ')[0];
          // Possessives first → replace with "the" to preserve noun
          action = action.replace(new RegExp(`\\b${cn}['']s\\s+`, 'gi'), 'the ');
          action = action.replace(new RegExp(`\\b${fn}['']s\\s+`, 'gi'), 'the ');
          // Bare names → replace with space to prevent fusion
          action = action.replace(new RegExp(`\\b${cn}\\b`, 'gi'), ' ');
          action = action.replace(new RegExp(`\\b${fn}\\b`, 'gi'), ' ');
        });

        // 2. Enforce SINGLE ACTION: if there's a comma followed by another -ing verb,
        //    it's a second action — truncate to just the first.
        //    "entering with rifle first, kneeling to cut ropes" → "entering with rifle first"
        //    BUT "sitting against a wall, wrists bound" is fine (no second -ing verb)
        const commaVerbMatch = action.match(/^(.+?),\s+\w+ing\b/);
        if (commaVerbMatch) {
          action = commaVerbMatch[1];
        }

        // 3. Strip anachronistic props from actions (uses per-scene era for flashbacks)
        action = sceneStripAnachronisms(action);

        // 4a. Replace gendered possessive pronouns — "sitting at her desk" → "sitting at the desk"
        action = action
          .replace(/\b(her|his|their)\s+(desk|chair|office|room|car|bag|phone|gun|badge|coat|jacket|hat|book|glass|cup|door|locker|seat|table|partner|side)\b/gi, 'the $2');

        // 4b. Replace standalone object pronouns in positional phrases
        // "standing beside her" → "standing nearby", "looking at him" → "looking ahead"
        // These imply a third person to FLUX.
        action = action
          .replace(/\b(beside|next to|near|behind|in front of|across from|opposite|toward|towards|facing|with)\s+(her|him|them)\b/gi, 'nearby')
          .replace(/\b(looking|staring|glancing|gazing)\s+(at)\s+(her|him|them)\b/gi, '$1 ahead');

        // 5. Clean up artifacts
        action = action
          .replace(/['']s\s+/g, '')
          .replace(/\bat\s+and\b/gi, 'ahead')
          .replace(/\band\s*$/i, '')
          .replace(/,\s*and\s*,/g, ',')
          .replace(/,\s*,+/g, ',')
          .replace(/\s{2,}/g, ' ')
          .replace(/^[,\s]+/, '')
          .replace(/[,\s]+$/, '')
          .trim();

        // 5. Anchor bare posture verbs to scene context
        //    If the action is just a posture verb (possibly with trailing words like "down")
        //    and the scene describes a body/victim, connect them explicitly.
        //    OCCLUSION-AWARE: if the body is covered (tarp/sheet/blanket), reference the covering.
        //    An uncovered "body on the ground" at token ~30 overrides "covered by a tarp" at ~80+
        //    because FLUX commits to the first visual it encounters.
        if (sceneHasBody && /^(kneeling|crouching|leaning|bending|hunched|stooping)(\s+(down|over|forward))?$/i.test(action)) {
          const hasCovering = /\bcovered\s+by\s+a\s+(tarp|sheet|blanket|cloth)\b/i.exec(sceneEnvText);
          if (hasCovering) {
            action = `${action} beside a shape covered by a ${hasCovering[1]}`;
          } else {
            action = `${action} over a body on the ground`;
          }
        }

        return action;
      };

      // Resolve character_actions keys through the same name resolution as characters_present.
      // Parser outputs raw keys like "MARA" but charIdentities uses "MARA COLE".
      // Without this, actions silently fail to match → "talking heads" scenes with no action.
      // (rawActions already declared in ghost filter block above)
      const sceneActions = {};
      for (const [rawKey, actionVal] of Object.entries(rawActions)) {
        const resolvedKey = resolveCharName(rawKey);
        sceneActions[resolvedKey] = actionVal;
      }
      // ---------------------------------------------------------------
      // FALLBACK ACTIONS: when parser doesn't provide character_actions
      // for a character, derive a short default from scene.description.
      // Without this, characters become static descriptions with no verb,
      // and FLUX may drop them entirely.
      // ---------------------------------------------------------------
      const sceneDescText = scene.description || '';
      const inferFallbackAction = () => {
        // Try to extract a group activity verb from scene description
        // "Ruth, Elijah, and Alma ride across the desert" → "riding"
        // "The group walks through the forest" → "walking"
        const groupVerbMatch = sceneDescText.match(/\b(rid(?:e|es|ing)|walk(?:s|ing)?|march(?:es|ing)?|stand(?:s|ing)?|sit(?:s|ting)?|run(?:s|ning)?|driv(?:e|es|ing)|flee(?:s|ing)?|hid(?:e|es|ing)|fight(?:s|ing)?|climb(?:s|ing)?|wait(?:s|ing)?|gallop(?:s|ing)?|trot(?:s|ting)?|travel(?:s|ing)?|trek(?:s|king)?|hik(?:e|es|ing)?)\b/i);
        if (groupVerbMatch) {
          const verb = groupVerbMatch[1].toLowerCase();
          // Convert to -ing form for consistency
          if (verb.endsWith('ing')) return verb;
          if (verb.endsWith('e') && !verb.endsWith('ee')) return verb.slice(0, -1) + 'ing';
          if (/^(sit|run|hid)$/.test(verb)) return verb + verb.slice(-1) + 'ing';
          return verb + 'ing';
        }
        return 'nearby';
      };
      let fallbackAction = null; // lazy — only compute if needed

      // Debug: show raw → resolved action mapping for this scene
      console.log(`--- SCENE ${scene.scene_num || (i + 1)} ACTIONS ---`);
      console.log(`  Raw character_actions keys: [${Object.keys(rawActions).join(', ')}]`);
      console.log(`  Resolved sceneActions keys: [${Object.keys(sceneActions).join(', ')}]`);
      console.log(`  Characters present (resolved): [${sceneCharNamesRaw.join(', ')}]`);
      sceneCharNamesRaw.forEach(n => {
        const rawAction = sceneActions[n];
        const cleaned = rawAction ? cleanAction(rawAction) : '(no action)';
        console.log(`    ${n}: raw="${rawAction || '(missing)'}" → cleaned="${cleaned}"`);
      });
      // Per-scene: check if work-only profession cues should apply based on location.
      // A journalist at The New Yorker office gets press badge; at home, no.
      const sceneLocLower = (scene.location || '').toLowerCase();
      const isWorkScene = workLocationKeywords.test(sceneLocLower);
      const getSceneDesc = (charName) => {
        const id = charIdentities[charName];
        if (!id || id.isNonHuman) return id?.sceneDesc || '';
        // If this is a work scene and the character has work-only cues,
        // inject them into the description
        if (isWorkScene && id.workOnlyCues && !id.profVisualCues) {
          return `${id.genderWord}, age ${id.age}, ${id.workOnlyCues}, ${id.sceneDesc.replace(new RegExp(`^${id.genderWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},?\\s*age\\s+${id.age.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},?\\s*`), '')}`;
        }
        return id.sceneDesc;
      };

      let charCountClause = '';
      let charPhrase = '';
      let actionClause = '';

      // Count human vs non-human characters separately
      const humanCast = sceneCharNames.filter(n => !charIdentities[n]?.isNonHuman);
      const nonHumanCast = sceneCharNames.filter(n => charIdentities[n]?.isNonHuman);
      const humanCount = humanCast.length + extraCount;
      // totalVisible counts only HUMANS for "X people" phrasing
      const totalVisible = humanCount;

      if (charCount === 0) {
        if (extraCount > 0) {
          // No resolved cast but extras present — generic figure(s) scene
          charCountClause = `Eyes cast down or away from camera.`;
          charPhrase = extraCount === 1
            ? 'A figure in the scene.'
            : `${extraCount} figures in the scene.`;
        } else {
          // Truly empty
          charCountClause = 'An empty, still scene. Only architecture and landscape visible.';
        }
      } else if (charCount === 1) {
        const name = sceneCharNames[0];
        const id = charIdentities[name];
        if (id?.isNonHuman) {
          charCountClause = '';
        } else {
          charCountClause = 'No one else in frame. Eyes cast down or away from camera.';
        }
        const action = cleanAction(sceneActions[name]);
        if (action && id) {
          // ACTION-FIRST with FEATURE-BASED ethnicity for cross-scene consistency.
          // Use featureGenderWord ("man with straight black hair and warm golden skin")
          // instead of ethnic labels ("Korean man") — features bind per-character in CLIP
          // and render consistently across multiple scenes.
          const fgw = id.featureGenderWord; // "woman" or "man with straight black hair and warm golden skin"
          const restDesc = id.sceneDesc.replace(new RegExp(`^${id.genderWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')},?\\s*`), '');
          charPhrase = `${aOrAn(fgw, true)} ${fgw} ${action}. ${restDesc}.`;
        } else {
          // No action — use feature-based sceneDesc
          const fgwDesc = id
            ? id.sceneDesc.replace(new RegExp(`^${id.genderWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), id.featureGenderWord)
            : 'a single figure';
          charPhrase = id ? `${aOrAn(fgwDesc, true)} ${fgwDesc}.` : 'A single figure.';
        }
        // Action already embedded in charPhrase — no separate actionClause needed
        actionClause = '';
      } else if (charCount === 2) {
        // 2 characters: Each gets their own sentence with desc+action.
        // Brief count constraint at END of prompt — not front-loaded.
        charCountClause = totalVisible > 0 ? 'No one else in frame. Eyes cast down or away from camera.' : '';

        // --- ETHNICITY HANDLING ---
        // All scene images use featureGenderWord (physical features like "straight black hair
        // and warm golden skin") instead of ethnic labels ("Korean man"). Features bind
        // per-character in CLIP without global bleed. Applied uniformly in pairedDescs2 below.

        // --- DUPLICATE PROFESSION DIFFERENTIATION ---
        // If both characters share the exact same profession visual cues,
        // FLUX may render them as one repeated figure. Differentiate wardrobe.
        const profCues2 = sceneCharNames.map(n => (charIdentities[n])?.profVisualCues || '');
        const hasDuplicateProf = profCues2[0] && profCues2[0] === profCues2[1];
        // Alternate wardrobe variants for the SECOND character with same profession
        // Variants use simple single-garment descriptions. FLUX parses compound clothing
        // ("leather jacket and open collar") as multiple items → sometimes multiple figures.
        // Keep each variant to ONE recognizable outfit silhouette.
        const professionVariantMap = {
          'detective in a rumpled suit':                             'detective in a worn leather jacket',
          'uniformed police officer in navy blues':                'police officer in a patrol jacket',
          'doctor in white lab coat with stethoscope':             'doctor in surgical scrubs',
          'soldier in military fatigues and combat boots':         'soldier in a field jacket',
          'lawyer in tailored suit with leather briefcase':        'lawyer in a fitted blazer',
          'journalist with press badge and notepad':               'journalist in a field vest',
        };

        const pairedDescs2 = sceneCharNames.map((name, idx) => {
          const id = charIdentities[name];
          if (!id) return `${idx === 0 ? 'One' : 'another'} figure`;

          // ALWAYS use featureGenderWord in scene images — not just mixed-ethnicity.
          // Features ("man with straight black hair and warm golden skin") bind per-character
          // in CLIP and render consistently across ALL scenes. Ethnic labels ("Korean man")
          // bleed globally and cause cross-scene inconsistency.
          const safeCompact = id.compactSceneDesc
            .replace(new RegExp(`^${id.genderWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), id.featureGenderWord);
          let desc = `${aOrAn(safeCompact, true)} ${safeCompact}`;

          // If this is the SECOND character with a duplicate profession, swap in variant wardrobe
          if (hasDuplicateProf && idx === 1) {
            const variant = professionVariantMap[profCues2[0]] || profCues2[0].replace(/rumpled suit/, 'pressed shirt and tie');
            desc = desc.replace(profCues2[0], variant);
          }

          let action = cleanAction(sceneActions[name]);
          // Fallback: if parser didn't provide an action, derive from scene description
          if (!action) {
            if (!fallbackAction) fallbackAction = inferFallbackAction();
            action = fallbackAction;
            console.log(`  FALLBACK action for "${name}": "${action}"`);
          }
          // Description first, action last with comma: "A woman, age 40s, dark hair, bounty hunter, holding rifle."
          // Comma keeps description and action as one continuous phrase — FLUX binds them
          // to the same subject. Period creates a hard break that can lose the binding.
          const actionCap = action.charAt(0).toLowerCase() + action.slice(1);
          return `${desc}, ${actionCap}.`;
        });
        charPhrase = pairedDescs2.join(' ');
        actionClause = ''; // Actions embedded in charPhrase
      } else {
        // 3+ characters: Use COMPACT descriptions to stay within FLUX's ~150 token attention.
        // PAIR compact description + action per character in one sentence each.
        charCountClause = totalVisible > 0 ? 'No one else in frame. Eyes cast down or away from camera.' : '';
        const pairedDescs = sceneCharNames.map((name, idx) => {
          const id = charIdentities[name];
          // Use featureGenderWord for cross-scene consistency (same as 1-char and 2-char paths)
          const fDesc = id
            ? id.compactSceneDesc.replace(new RegExp(`^${id.genderWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), id.featureGenderWord)
            : null;
          const desc = fDesc ? `${aOrAn(fDesc, true)} ${fDesc}` : `${idx === 0 ? 'One' : 'Another'} figure`;
          let action = cleanAction(sceneActions[name]);
          // Fallback: if parser didn't provide an action, derive from scene description
          if (!action) {
            if (!fallbackAction) fallbackAction = inferFallbackAction();
            action = fallbackAction;
            console.log(`  FALLBACK action for "${name}": "${action}"`);
          }
          return `${desc}, ${action}.`;
        });
        charPhrase = pairedDescs.join(' ');
        actionClause = '';
      }

      // ---------------------------------------------------------------
      // SCENE COMPOSITION: for 2+ char scenes, extract spatial relationships
      // from scene.description ("Behind her, Elijah and Alma share a horse")
      // and rewrite with role references ("Behind her, the man and the girl
      // share a horse"). This preserves groupings that per-character isolation loses.
      // ---------------------------------------------------------------
      if (charCount >= 2 && sceneDescText) {
        let composition = sceneDescText;
        // Replace character names with their gender/age reference
        sceneCharNamesRaw.forEach(resolvedName => {
          const id = charIdentities[resolvedName];
          if (!id) return;
          const ref = id.isNonHuman ? id.genderWord : `the ${id.genderWord.split(' ').pop()}`; // "the man", "the woman", "the girl"
          // Replace full name and first name
          const firstName = resolvedName.split(' ')[0];
          composition = composition
            .replace(new RegExp(`\\b${resolvedName}\\b`, 'gi'), ref)
            .replace(new RegExp(`\\b${firstName}\\b`, 'gi'), ref);
        });
        // Also replace raw (unresolved) names from characters_present
        (scene.characters_present || []).forEach(rawName => {
          const resolved = resolveCharName(rawName);
          const id = charIdentities[resolved];
          if (!id) return;
          const ref = id.isNonHuman ? id.genderWord : `the ${id.genderWord.split(' ').pop()}`;
          composition = composition.replace(new RegExp(`\\b${rawName}\\b`, 'gi'), ref);
        });
        // Extract ONLY spatial/compositional sentences (those with spatial keywords).
        // Drop pure narrative ("They decide to ride south") — that's for motion prompts.
        const sentences = composition.split(/(?<=[.!?])\s+/);
        const spatialSentences = sentences.filter(s =>
          /\b(behind|beside|next to|between|across from|in front of|share|sharing|together|side by side|mounted on|riding together|on the same|following|leading|flanking|carrying|holding)\b/i.test(s)
        );
        if (spatialSentences.length > 0) {
          const compositionLine = spatialSentences.join(' ').trim();
          // Append to charPhrase — spatial context comes right after character descriptions
          charPhrase = charPhrase + ' ' + compositionLine;
          console.log(`  COMPOSITION: "${compositionLine}"`);
        }
      }

      // Append generic extras to charPhrase if any unresolved characters exist.
      // These are background characters (TEACHER, BULLIES, BARTENDER) that aren't
      // in charIdentities but appear in the scene. Give them a brief mention
      // with their action if available, but don't let them inflate the template.
      if (extraCount > 0 && charCount > 0) {
        const extraPhrases = unresolvedExtras.map(extraName => {
          const action = cleanAction(sceneActions[extraName]);
          // Use the raw name as a descriptor (lowercase, strip "YOUNG"/"OLD" prefixes)
          const label = extraName.toLowerCase().replace(agePrefixes, '').trim();
          return action ? `A ${label} ${action}.` : `A ${label} nearby.`;
        });
        charPhrase = charPhrase + ' ' + extraPhrases.join(' ');
      }

      // INT/EXT as a SHORT subordinate clause
      const intExt = (scene.int_ext || '').toUpperCase();
      // Normalize non-location scene headings.
      // Screenwriters sometimes use scene headings for shot descriptions:
      // "INT. A FUNERAL CASKET" isn't a place — it's a close-up of an object.
      // "INT. A CAR" → fine. "INT. A COFFIN" → should be "a funeral home" or "a church".
      // Map common object-as-location patterns to their containing spaces.
      let locationName = scene.location || 'a room';
      const locLower = locationName.toLowerCase();
      const locationNormMap = {
        'casket': 'a funeral home',
        'funeral casket': 'a funeral home',
        'coffin': 'a funeral home',
        'open coffin': 'a funeral home',
        'open casket': 'a funeral home',
        'grave': 'a cemetery',
        'gravesite': 'a cemetery',
        'tombstone': 'a cemetery',
        'trunk': 'a car',
        'car trunk': 'a parking lot',
        'glove compartment': 'a car',
        'mirror': 'a bathroom',
        'bathroom mirror': 'a bathroom',
        'phone screen': 'a room',
        'computer screen': 'an office',
        'tv screen': 'a living room',
      };
      for (const [pattern, replacement] of Object.entries(locationNormMap)) {
        if (locLower.includes(pattern)) {
          locationName = replacement;
          break;
        }
      }

      let envClause = '';
      if (intExt === 'INT') {
        envClause = `inside ${locationName}`;
      } else if (intExt === 'EXT') {
        envClause = `outside ${locationName}`;
      } else {
        envClause = `at ${locationName}`;
      }

      // Core visual — environment only (parser should exclude character actions)
      // Safety net: strip character names + actions that the LLM may have leaked in despite instructions
      let coreVisual = scene.image_prompt_base || scene.description || '';

      // Strip character names + actions that the LLM may have leaked into coreVisual.
      // Also clean up artifacts left behind: orphaned possessives, broken conjunctions.
      // (allCharNames already defined above)
      if (allCharNames.length > 0) {
        // Normalize curly/smart apostrophes to straight before name stripping
        coreVisual = coreVisual.replace(/[\u2018\u2019\u2032\u0060]/g, "'");
        allCharNames.forEach(name => {
          const firstName = name.split(' ')[0];
          // Strip "Name doing something" clauses (comma-delimited or sentence fragments)
          const namePattern = new RegExp(`,?\\s*${name}\\s+\\w+ing\\b[^,.]*`, 'gi');
          const firstNamePattern = new RegExp(`,?\\s*${firstName}\\s+\\w+ing\\b[^,.]*`, 'gi');
          coreVisual = coreVisual.replace(namePattern, '').replace(firstNamePattern, '');
          // Strip possessives: "Mara's desk" → "the desk" (handles straight + curly apostrophes)
          const namePossPattern = new RegExp(`\\b${name}[''\u2019]?s\\s+`, 'gi');
          const firstPossPattern = new RegExp(`\\b${firstName}[''\u2019]?s\\s+`, 'gi');
          coreVisual = coreVisual.replace(namePossPattern, 'the ').replace(firstPossPattern, 'the ');
          // Strip fused names: "Maradesk" → " desk" (name glued to next word without space)
          // This catches cases where the LLM omitted the apostrophe/space entirely.
          const fusedNamePattern = new RegExp(`${firstName}(?=[a-z])`, 'gi');
          coreVisual = coreVisual.replace(fusedNamePattern, '');
          // Strip bare name mentions with word boundaries — replace with space
          const bareNamePattern = new RegExp(`\\b${name}\\b`, 'gi');
          const bareFirstPattern = new RegExp(`\\b${firstName}\\b`, 'gi');
          coreVisual = coreVisual.replace(bareNamePattern, ' ').replace(bareFirstPattern, ' ');
        });
        // Clean up artifacts left by name stripping
        // Replace gendered pronouns with "the" — FLUX interprets "her desk" as another woman
        coreVisual = coreVisual
          .replace(/\b(her|his|their)\s+(desk|chair|office|room|car|bag|phone|gun|badge|coat|jacket|hat|book|glass|cup|door|locker|seat|table)\b/gi, 'the $2')
          .replace(/['']s\s+/g, '')            // orphaned possessives: "'s horse" → "horse"
          .replace(/\band\s+and\b/gi, 'and')   // "and and" → "and"
          // Orphaned "and [preposition]" left by name stripping:
          // "a lone horse and in the distance" → "a lone horse"
          // "desk and across the room" → "desk"
          .replace(/\band\s+(in|on|at|by|near|from|to|through|across|over|under|behind|beside|between|into|toward|towards)\s+(the|a|an)\s+\w+/gi, '')
          .replace(/,?\s*\band\s*[,.\s]*$/gi, '')  // trailing "and" or ", and" at end
          .replace(/,?\s*\band\s*,/gi, ',')    // ", and," or "and," in middle
          .replace(/,\s*and\s*\./g, '.')       // ", and." → "."
          .replace(/^\s*,?\s*and\s+/i, '')     // leading "and " or ", and "
          // Orphaned "with a lone [noun]" that implies a riderless animal/vehicle
          // when the character IS riding it — strip the "lone" since character is there
          .replace(/\bwith\s+a\s+lone\b/gi, 'with a')
          .replace(/,\s*,+/g, ',')             // multiple commas
          .replace(/,\s*\./g, '.')             // ", ." → "."
          .replace(/\.\s*\./g, '.')            // ".." → "."
          .replace(/\s{2,}/g, ' ')
          .replace(/^[,\s]+/, '')              // leading commas/spaces
          .replace(/[,\s]+$/, '')              // trailing commas/spaces
          .trim();
      }

      // Strip crowd/extras/figure-implying language.
      // FLUX renders anything that implies a human: "silhouette", "figure", "shadow of a person",
      // "in the distance" (orphaned after name stripping: "Ruth in silhouette" → "in silhouette").
      coreVisual = coreVisual
        .replace(/\b(crowd(ed|s)?|bystanders?|onlookers?|passersby|pedestrians?|townsfolk|townspeople|villagers?|settlers?|people milling|group of people|several people|many people|figures in the background|surrounded by people|bustling|teeming|others?\s+(are|stand|walk|watch|gather)|men and women|people\s+(walk|stand|gather|watch|mill|crowd))\b/gi, '')
        .replace(/,?\s*\bin\s+silhouette\b[^,.]*/gi, '')   // "in silhouette in the distance"
        .replace(/,?\s*\bsilhouett(e|ed)\b[^,.]*/gi, '')   // "silhouetted against the sky"
        .replace(/,?\s*\ba?\s*lone\s+figure\b[^,.]*/gi, '')   // "a lone figure"
        .replace(/,?\s*\b(figure|person|someone|somebody)\b[^,.]{0,30}/gi, '') // "figure in the doorway"
        .replace(/\band\s+standing\b/gi, '')
        .replace(/,\s*,/g, ',')
        .replace(/,\s*\./g, '.')
        .replace(/\s{2,}/g, ' ')
        .replace(/^[,\s]+/, '')
        .replace(/[,\s]+$/, '')
        .trim();

      // If non-human characters are being described in envNonHumanClause,
      // strip duplicate references from coreVisual to avoid the orb/screen appearing twice.
      if (envNonHumanClause) {
        // Strip clauses that mention orb/LED/digital entity on a screen — already in envNonHumanClause
        coreVisual = coreVisual
          .replace(/,?\s*(an?\s+)?LED\s+screen\s+displaying\s+[^,.]+/gi, '')
          .replace(/,?\s*(an?\s+)?(glowing\s+)?(digital\s+)?orb\s+(composed\s+of|of|on|floating|hovering)\s+[^,.]+/gi, '')
          .replace(/,?\s*(an?\s+)?screen\s+(showing|displaying|projecting|with)\s+[^,.]+/gi, '')
          .replace(/,\s*,/g, ',')
          .replace(/,\s*\./g, '.')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }

      // Strip anachronistic props from environment (uses per-scene era for flashbacks)
      coreVisual = sceneStripAnachronisms(coreVisual);

      // INT/EXT consistency filter — strip elements that contradict the scene's location type.
      // The parser's scene description may reference weather or outdoor phenomena even for INT scenes
      // (e.g., "rain pounds outside" → FLUX renders rain INSIDE the warehouse).
      if (intExt === 'INT') {
        // Strip weather, sky, outdoor phenomena from interior scenes
        coreVisual = coreVisual
          .replace(/,?\s*\b(rain(ing|s|fall|drops|storm|water)?|pouring|downpour|drizzl(e|ing)|storm(y|ing)?|thunder(ing|storm|ous)?|lightning|wind(y|swept|blown)?|snow(ing|fall|flakes|storm)?|hail(ing|stones?)?|sleet|blizzard)\b[^,.]*/gi, '')
          .replace(/,?\s*\b(clouds?|cloudy|overcast|clear\s+sky|starry\s+sky|moonlight|moonlit|starlight|sunset|sunrise|horizon|sky\s+above)\b[^,.]*/gi, '')
          .replace(/,?\s*\b(puddles?|wet\s+(ground|street|pavement|road)|mud(dy)?|flooded|flooding|standing\s+water)\b[^,.]*/gi, '')
          .replace(/,?\s*\b(outside|outdoors|open\s+air|under\s+the\s+sky)\b[^,.]*/gi, '')
          .replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
      } else if (intExt === 'EXT') {
        // Strip interior-only elements from exterior scenes
        coreVisual = coreVisual
          .replace(/,?\s*\b(ceiling\s+(fan|light|lamp)|fluorescent\s+light(s|ing)?|overhead\s+light(s|ing)?|chandelier|wall\s+sconce|lamp\s+on\s+(the\s+)?(desk|table|nightstand))\b[^,.]*/gi, '')
          .replace(/,?\s*\b(carpet(ed|ing)?|hardwood\s+floor|tile\s+floor|linoleum|wallpaper)\b[^,.]*/gi, '')
          .replace(/,\s*,/g, ',').replace(/\s{2,}/g, ' ').replace(/^[,\s]+/, '').replace(/[,\s]+$/, '').trim();
      }

      // Visual occlusion: outer layers hide inner details.
      // "body covered by a tarp" → strip "scarred, damaged" etc.
      // "wearing a coat" → strip "badge underneath" etc.
      coreVisual = applyVisualOcclusion(coreVisual);

      // FINAL CLEANUP — runs AFTER all stripping passes (name, crowd, anachronism,
      // INT/EXT, occlusion) so it catches orphaned phrases created by ANY step.
      // The crowd stripping can turn "horse and rider in the distance" into
      // "horse and in the distance" which the earlier name-stripping cleanup misses.
      coreVisual = coreVisual
        // Orphaned "and [preposition]": "horse and in the distance" → "horse"
        .replace(/\band\s+(in|on|at|by|near|from|to|through|across|over|under|behind|beside|between|into|toward|towards)\s+(the|a|an)?\s*\w+/gi, '')
        // Orphaned "with a lone [X]" when character is there
        .replace(/\bwith\s+a\s+lone\b/gi, 'with a')
        // Trailing dangling prepositions: "with a horse and" → "with a horse"
        .replace(/\band\s*[,.\s]*$/gi, '')
        // General cleanup
        .replace(/,\s*,+/g, ',')
        .replace(/,\s*\./g, '.')
        .replace(/\.\s*\./g, '.')
        .replace(/\s{2,}/g, ' ')
        .replace(/^[,\s]+/, '').replace(/[,\s]+$/, '')
        .trim();

      // ELEMENT SEPARATION: setting descriptions should list distinct visual
      // elements as independent period-separated clauses, NOT subordinated
      // with commas or "with" prepositions.
      // "mine entrance, with two horses hitched outside" → "mine entrance. Two horses hitched outside"
      // "a narrow trail, a dust cloud rising" → "a narrow trail. A dust cloud rising"
      coreVisual = coreVisual
        // "with [number/article] [noun]" → ". [Noun phrase]" — promotes to independent clause
        .replace(/,?\s*\bwith\s+(two|three|four|five|six|seven|eight|nine|ten|\d+)\s+/gi, (m, num) =>
          `. ${num.charAt(0).toUpperCase() + num.slice(1)} `)
        .replace(/,?\s*\bwith\s+(a|an|the)\s+([a-z])/gi, (m, article, firstChar) =>
          `. ${article.charAt(0).toUpperCase() + article.slice(1)} ${firstChar}`)
        // Comma + new subject (number word or article) — same promotion
        .replace(/,\s+(two|three|four|five|six|seven|eight|nine|ten|\d+)\s+/gi, (m, num) =>
          `. ${num.charAt(0).toUpperCase() + num.slice(1)} `)
        .replace(/,\s+(a|an|the)\s+([a-z])/gi, (m, article, firstChar) =>
          `. ${article.charAt(0).toUpperCase() + article.slice(1)} ${firstChar}`)
        // Clean leading period if conversion hit start of string
        .replace(/^\.\s*/, '');

      // Genre-aware time of day — split by INT/EXT
      // Interior scenes must NEVER get sunlight/daylight descriptions — that forces FLUX outdoors.
      // INT "day" = ambient interior light. EXT "day" = actual sunlight.
      const timeRaw = (scene.time_of_day || '').toLowerCase();
      const isInterior = intExt === 'INT';

      // Era-adaptive exterior lighting helper (uses per-scene era for flashbacks)
      const eraExtLight = (modern, pre1920, pre1850) => {
        if (sceneEraYear < 1850) return pre1850;
        if (sceneEraYear < 1920) return pre1920;
        return modern;
      };

      const genreTimeMapExt = {
        action: {
          day: 'harsh midday sun with heat haze',
          night: 'cold blue moonlight with sharp shadows',
          dawn: 'blood-red dawn breaking over the horizon',
          dusk: 'fiery orange dusk, last light fading fast',
          golden_hour: 'intense golden sidelight',
          midnight: eraExtLight(
            'deep black night lit by distant fire',
            'deep black night lit by distant fire',
            'deep black night lit by distant fire'
          )
        },
        horror: {
          day: 'flat overcast gray sky, wan and lifeless',
          night: 'near-total darkness with faint moonlight',
          dawn: 'sickly pale pre-dawn sky, cold and colorless',
          dusk: 'dying twilight, long distorted shadows on the ground',
          golden_hour: 'unnatural amber light filtering through haze',
          midnight: 'pitch black with faint moonlight revealing only edges'
        },
        comedy: {
          // HIGH-KEY exterior: open sky fill, minimal harsh shadows
          day: 'high-key bright sunshine with open sky fill, soft shadows, cheerful and clear',
          night: eraExtLight(
            'high-key from string lights and warm practicals, bright and inviting',
            'high-key warm lantern glow and soft full moonlight, bright and inviting',
            'high-key warm bonfire light and full moonlight, bright and inviting'
          ),
          dawn: 'high-key soft pink-gold sunrise, open sky fill, gentle and warm',
          dusk: 'high-key warm golden sunset glow, open sky fill, inviting',
          golden_hour: 'perfect high-key golden hour light from low sun, warm wrap-around glow',
          midnight: eraExtLight(
            'high-key warm porch light and moonlight, bright enough to see everything',
            'high-key warm lantern glow and full moonlight, well-lit scene',
            'high-key warm firelight and full moonlight, well-lit scene'
          )
        },
        drama: {
          // LOW-KEY exterior: single directional source, long shadows
          day: 'low-key overcast sky, flat diffused light, muted and somber',
          night: 'low-key dim moonlight from one direction, deep long shadows, most of scene dark',
          dawn: 'low-key cold pre-dawn light from the horizon, everything else in shadow',
          dusk: 'low-key fading amber from the horizon, long shadows stretching, melancholic',
          golden_hour: 'low-key rich golden sidelight from low sun, long dramatic shadows across ground',
          midnight: 'near-total darkness, faint starlight revealing only edges'
        }
      };

      // Era-adaptive interior lighting helper (uses per-scene era for flashbacks)
      const eraIntLight = (modern, pre2000, pre1950, pre1920, pre1850) => {
        if (sceneEraYear < 1850) return pre1850;
        if (sceneEraYear < 1920) return pre1920;
        if (sceneEraYear < 1950) return pre1950;
        if (sceneEraYear < 2000) return pre2000;
        return modern;
      };

      const genreTimeMapInt = {
        action: {
          day: eraIntLight(
            'harsh overhead fluorescent light, hard shadows',
            'harsh overhead light, hard shadows',
            'hard overhead light through high windows, sharp shadows',
            'hard daylight through grimy windows, dust in the air',
            'shafts of daylight through narrow openings, hard shadows'
          ),
          night: eraIntLight(
            'emergency lighting, red and white, flickering',
            'flickering overhead light, harsh and unsteady',
            'single swinging bare bulb, sharp moving shadows',
            'flickering lantern light, erratic shadows on walls',
            'torch fire casting wild moving shadows'
          ),
          dawn: 'cold gray light filtering through gaps, barely visible',
          dusk: eraIntLight(
            'dim amber bulbs, fading power',
            'dim amber light, fading',
            'dim amber light fading from a single fixture',
            'fading oil lamp, amber glow retreating to corners',
            'dying fire glow, deep amber retreating to corners'
          ),
          golden_hour: 'warm light slicing through gaps in walls',
          midnight: eraIntLight(
            'pitch dark, lit only by muzzle flash or sparks',
            'pitch dark, lit only by muzzle flash or sparks',
            'pitch dark, lit only by muzzle flash or sparks',
            'pitch dark, lit only by muzzle flash or match strike',
            'pitch dark, lit only by sparks or distant flame'
          )
        },
        horror: {
          day: eraIntLight(
            'sickly fluorescent flicker overhead, buzzing and uneven',
            'sickly flickering overhead light, uneven and buzzing',
            'weak bare bulb overhead, sickly and uneven',
            'weak gray daylight through filthy glass, sickly and dim',
            'feeble gray light seeping through cracks, cold and uneven'
          ),
          night: eraIntLight(
            'a single bare bulb casting long shadows on walls',
            'a single bare bulb casting long shadows on walls',
            'a single bare bulb casting long shadows on walls',
            'a single flickering flame casting long shadows on walls',
            'a single flickering flame casting long shadows on walls'
          ),
          dawn: 'faint gray glow from unseen source, barely visible',
          dusk: 'dying amber light, most of the room in shadow',
          golden_hour: 'unnatural amber glow from an unseen source',
          midnight: eraIntLight(
            'total darkness except one weak flickering light',
            'total darkness except one weak flickering light',
            'total darkness except one weak flickering light',
            'total darkness except one guttering flame',
            'total darkness except one guttering flame'
          )
        },
        comedy: {
          // HIGH-KEY: multiple sources, strong fill, minimal shadows
          day: eraIntLight(
            'high-key overhead practicals and bounce light, no harsh shadows, everything evenly lit',
            'high-key overhead light with bounce fill, everything evenly lit',
            'high-key daylight from multiple windows, bounce fill from pale walls, no harsh shadows',
            'bright daylight flooding through large open windows, bounce light off whitewashed walls',
            'bright daylight flooding through large open windows, bounce light off pale walls'
          ),
          night: eraIntLight(
            'high-key from multiple practical lamps, warm fill from every direction, no dark corners',
            'high-key warm light from several table lamps, filled shadows',
            'high-key warm light from multiple practical lamps, filled shadows',
            'warm glow from multiple oil lamps placed around the room, filled and bright',
            'warm glow from a large hearth fire and several candles, room well-lit and inviting'
          ),
          dawn: 'soft high-key light from east-facing windows, warm pink fill bouncing off walls',
          dusk: eraIntLight(
            'high-key warm practicals switching on, golden fill from overhead fixtures',
            'high-key warm lamplight from several fixtures, golden fill',
            'high-key warm light from overhead and table fixtures, golden and even',
            'high-key warm lamp glow from multiple sources, golden and even',
            'high-key warm firelight supplemented by candles, golden and even'
          ),
          golden_hour: 'high-key golden light from windows, strong warm bounce fill off every surface',
          midnight: eraIntLight(
            'cozy high-key from bedside lamp and hallway spill, warm and shadowless',
            'cozy warm light from bedside lamp and hallway glow, soft and even',
            'cozy warm light from a bedside lamp with soft fill, intimate and bright',
            'warm glow from a turned-up lamp on the nightstand, soft intimate fill',
            'warm glow from banked embers and a tallow candle, intimate and soft'
          )
        },
        drama: {
          // LOW-KEY: single motivated source, deep shadows, high contrast
          day: eraIntLight(
            'low-key sidelight from one window, rest of room in shadow, muted palette',
            'low-key sidelight from a single window, muted and quiet',
            'low-key daylight from one high window, deep shadows across the room',
            'low-key daylight from one window, deep shadows filling most of the room',
            'low-key daylight from one narrow window, most of the room in shadow'
          ),
          night: eraIntLight(
            'low-key from a single practical lamp, half the room in deep shadow',
            'low-key from a single desk lamp, deep shadows on walls',
            'low-key from one bare bulb, most of the room lost in darkness',
            'low-key from a single oil lamp, deep shadows swallowing the room',
            'low-key from a single flame, deep shadows swallowing the room'
          ),
          dawn: 'faint cold low-key light from one direction, most of the room still dark',
          dusk: eraIntLight(
            'low-key amber from one window fading, lamp just being switched on',
            'low-key amber from one window fading, lamp just being lit',
            'low-key last amber light from one window, lamp being lit',
            'low-key last light fading from one window, lantern being lit',
            'low-key last light fading from one window, tallow candle being lit'
          ),
          golden_hour: 'low-key warm amber shaft from one window, dust in the air, rest in shadow',
          midnight: 'near darkness, one faint low-key source casting long shadows'
        }
      };

      const genreTimes = isInterior
        ? (genreTimeMapInt[mood] || genreTimeMapInt.drama)
        : (genreTimeMapExt[mood] || genreTimeMapExt.drama);
      const timeLight = timeRaw ? (genreTimes[timeRaw] || `${timeRaw} light`) + '.' : '';

      // Location consistency
      const locKey = (intExt ? intExt + '_' : '') + normalizeLocation(scene.location);
      const locInfo = locationMap[locKey];
      const locSeed = locInfo ? locInfo.seed : null;

      // Era adherence — uses per-scene era if flashback overrides global
      const sceneEraAdherence = sceneIsHistoricalEra
        ? `All props and technology authentic to ${sceneEraLabel}.`
        : '';

      // =====================================================================
      // FLUX PROMPT — token priority order:
      // Pos 1: Era + environment (grounds the setting)
      // Pos 2: Genre mood (overrides script tone)
      // Pos 3: Visual style / camera
      // Pos 4: Character identity (persistent traits)
      // Pos 5: Character actions (scene-specific posture/state)
      // Pos 6: Core visual / environment (from parser)
      // Pos 7: Character count constraint
      // Pos 8: Era adherence
      // =====================================================================

      // =====================================================================
      // PROMPT ASSEMBLY — priority order (FLUX reads front-to-back):
      //   1. Time period (era)
      //   2. Setting (location + time of day + environment details)
      //   3. Character descriptions + actions (each character once)
      //   4. Mood + style (lighting, composition)
      //   5. Brief gaze/count constraint at end
      //   6. Era adherence
      // Gaze direction uses positive prompting ("Eyes focused on the scene") — FLUX has no negative prompt support.
      // Characters described ONCE with action inline — no redundant re-mentions.
      // =====================================================================

      let prompt;

      // ── Shot list mode: user wrote the description, keep it as-is ──
      // Only add minimal framing (era, location context, style baseline).
      // No heavy mood lighting injection — the user is art-directing.
      if (shot_list_mode) {
        const userDesc = scene.visual_description || scene.description || '';
        prompt = [
          `Set in ${sceneEraLabel}.`,
          `A scene from a movie ${envClause}.`,
          userDesc,
          charPhrase,
          styleSet.scene,
          charCountClause
        ].filter(Boolean).join(' ');

      // ── Script mode: full prompt assembly with mood/style layers ──
      } else if (charCount === 0) {
        // 0 characters — plenty of token headroom, use full descriptions
        prompt = [
          sceneEraDescription || `Set in ${sceneEraLabel}.`,

          `A scene from a movie ${envClause}. ${timeLight}`,
          coreVisual || `An empty ${locationName}, still and quiet.`,
          moodSet.scene_full,
          styleSet.scene_full,
          charCountClause,
          sceneEraAdherence
        ].filter(Boolean).join(' ');
      } else if (charCount >= 3) {
        // 3+ chars — tight token budget. Keep coreVisual but truncate to
        // ~25 words so scene context (horses, vehicles, key props) isn't lost.
        const shortCoreVisual = coreVisual
          ? coreVisual.split(/\s+/).slice(0, 25).join(' ').replace(/,?\s*$/, '.')
          : '';
        prompt = [
          sceneEraDescription || `Set in ${sceneEraLabel}.`,

          `A scene from a movie ${envClause}. ${timeLight}`,
          shortCoreVisual,
          charPhrase,
          envNonHumanClause,
          charCountClause,
          sceneEraAdherence
        ].filter(Boolean).join(' ');
      } else if (charCount === 2) {
        // 2 characters — era, setting, then each character with their action.
        prompt = [
          sceneEraDescription || `Set in ${sceneEraLabel}.`,

          `A scene from a movie ${envClause}. ${timeLight}`,
          coreVisual,
          charPhrase,
          `${moodSet.scene} ${styleSet.scene}`,
          envNonHumanClause,
          charCountClause,
          sceneEraAdherence
        ].filter(Boolean).join(' ');
      } else {
        // 1 character — era, setting, character desc+action, then mood/style.
        prompt = [
          sceneEraDescription || `Set in ${sceneEraLabel}.`,

          `A scene from a movie ${envClause}. ${timeLight}`,
          coreVisual,
          charPhrase,
          actionClause,
          `${moodSet.scene} ${styleSet.scene}`,
          envNonHumanClause,
          charCountClause,
          sceneEraAdherence
        ].filter(Boolean).join(' ');
      }

      // Log per-scene era info if it differs from global
      if (sceneEraYear !== eraYear) {
        console.log(`\n--- SCENE ${scene.scene_num || (i + 1)}: PER-SCENE ERA OVERRIDE → ${sceneEraLabel} (year ${sceneEraYear}, global was ${eraLabel}/${eraYear}) ---`);
      }
      console.log(`\n--- SCENE ${scene.scene_num || (i + 1)} PROMPT (${prompt.split(' ').length} words) ---`);
      console.log(prompt);

      // -----------------------------------------------------------------
      // MOTION PROMPT — for image-to-video (Wan 2.1 I2V)
      // Tells the video model what HAPPENS in the scene — the narrative beat.
      // Built from scene.description (dynamic action) NOT character_actions (frozen pose).
      // Must describe motion since the image is static. ~20-30 words.
      // -----------------------------------------------------------------

      // Camera movement keyed to scene tone (more specific than overall mood)
      const sceneTone = (scene.tone || '').toLowerCase();
      const toneCameraMap = {
        tense:       'Slow push-in, building tension.',
        dramatic:    'Slow deliberate push-in.',
        action:      'Dynamic tracking shot.',
        eerie:       'Slow creeping drift.',
        quiet:       'Gentle static hold, subtle drift.',
        comedic:     'Steady shot, gentle drift.',
        romantic:    'Soft slow dolly.',
        bittersweet: 'Slow pull-back, widening frame.'
      };
      const moodCameraFallback = {
        action: 'Dynamic tracking shot.',
        horror: 'Slow creeping push-in.',
        comedy: 'Steady shot, gentle drift.',
        drama:  'Slow deliberate push-in.'
      };
      const cameraCue = toneCameraMap[sceneTone] || moodCameraFallback[mood] || moodCameraFallback.drama;

      // Build narrative motion from scene.description (what HAPPENS, not frozen pose)
      let narrativeMotion = scene.description || '';

      // Strip character names → replace with gender words (use per-scene age-adjusted IDs)
      // First, replace NON-HUMAN character names in motion text (they're not in sceneCharNames)
      resolvedNonHumans.forEach(name => {
        const firstName = name.split(' ')[0];
        // Replace with "the screen" or similar — "the AI" repeated for each mention is fine
        narrativeMotion = narrativeMotion.replace(new RegExp(`\\b${name}\\b`, 'gi'), 'the screen');
        narrativeMotion = narrativeMotion.replace(new RegExp(`\\b${firstName}\\b`, 'gi'), 'the screen');
      });

      // Only human characters get ethnicity labels in motion prompt
      const humanMotionChars = sceneCharNames.filter(n => !charIdentities[n]?.isNonHuman);
      const motionEthnicities = humanMotionChars.map(n => (charIdentities[n])?.ethnicity || 'White');
      const motionMixedEth = motionEthnicities.length >= 2 &&
        new Set(motionEthnicities).size > 1;

      sceneCharNames.forEach(name => {
        const id = charIdentities[name];
        let gw;
        if (!id) {
          gw = 'a figure';
        } else if (motionMixedEth) {
          // Same strategy as image prompt: White chars get no ethnic label, others keep theirs
          const isWhite = (id.ethnicity || 'White') === 'White';
          const baseGW = id.genderWord.replace(/^\S+\s+/, ''); // "man" or "woman"
          gw = isWhite ? baseGW : id.safeGenderWord;
        } else {
          gw = id.genderWord;
        }
        const firstName = name.split(' ')[0];
        // Replace full name first, then first name, preserving surrounding text
        narrativeMotion = narrativeMotion.replace(new RegExp(`\\b${name}\\b`, 'gi'), gw);
        narrativeMotion = narrativeMotion.replace(new RegExp(`\\b${firstName}\\b`, 'gi'), gw);
      });

      // Replace gendered pronouns that could cause extra figures
      narrativeMotion = narrativeMotion
        .replace(/\b[Ss]he\b/g, 'the woman')
        .replace(/\b[Hh]e\b/g, 'the man')
        .replace(/\b(her|his|their)\s+(desk|chair|office|room|car|bag|phone|gun|badge|coat|jacket|hat|book|glass|cup|door|locker|seat|table|partner|side|shoulder|face|hand|arm|back)\b/gi, 'the $2');

      // Soften summary verbs that video model takes literally.
      // Parser descriptions summarize emotional beats ("meets her father", "confronts rival")
      // but Wan I2V renders the physical action. "Meets" → handshake/hug. "Sees" → a look.
      narrativeMotion = narrativeMotion
        .replace(/\bmeets\b/gi, 'sees')
        .replace(/\bmeeting\b/gi, 'seeing')
        .replace(/\bgreets\b/gi, 'notices')
        .replace(/\bgreeting\b/gi, 'noticing')
        .replace(/\bembraces\b/gi, 'faces')
        .replace(/\bembracing\b/gi, 'facing')
        .replace(/\bconfronts\b/gi, 'faces')
        .replace(/\bconfronting\b/gi, 'facing')
        .replace(/\breunites with\b/gi, 'turns to see')
        .replace(/\breuniting with\b/gi, 'turning to see');

      // Trim to ~25 words max for video model attention
      const motionWords = narrativeMotion.split(/\s+/);
      if (motionWords.length > 25) {
        narrativeMotion = motionWords.slice(0, 25).join(' ');
      }

      // Clean up punctuation artifacts
      narrativeMotion = narrativeMotion
        .replace(/\s{2,}/g, ' ')
        .replace(/^[,.\s]+/, '')
        .replace(/[,\s]+$/, '')
        .trim();

      const motionPrompt = `${cameraCue} ${narrativeMotion}.`.replace(/\.\./g, '.');

      console.log(`--- MOTION PROMPT: ${motionPrompt}`);

      jobs.push({
        type: 'scene',
        scene_num: scene.scene_num || (i + 1),
        description: scene.description || `Scene ${i + 1}`,
        prompt,
        motion_prompt: motionPrompt,
        characters_in_scene: sceneCharNames.slice(),
        width: 1344,
        height: 768,
        seed: locSeed
      });
    });

    // =========================================================================
    // MOOD BOARD / ATMOSPHERE IMAGE
    // =========================================================================
    // Mood board respects the MOOD vs STYLE separation:
    //   MOOD  → lighting, color palette, atmosphere (moodSet.mood_board)
    //   STYLE → composition, textures, set dressing, camera (styleSet.mood_board)
    // The location gets a clean, neutral mention — no genre adjectives bolted on.
    // moodBoardGenre was removed because it crossed lanes: it described physical
    // environment (style territory) inside what should be mood-only descriptions.
    // =========================================================================
    const overallTone = parsed_structure.overall_tone || 'dramatic';

    // Normalize the first location for mood board — same map as scene headings
    // so "funeral casket" → "a funeral home", not a literal casket in a war zone.
    let firstLocation = (parsed_structure.scenes && parsed_structure.scenes[0])
      ? (parsed_structure.scenes[0].location || 'an atmospheric interior')
      : 'an atmospheric interior';
    const firstLocLower = firstLocation.toLowerCase();
    // Reuse the same location normalization map from the scene loop
    const moodBoardLocNormMap = {
      'casket': 'a funeral home', 'funeral casket': 'a funeral home',
      'coffin': 'a funeral home', 'open coffin': 'a funeral home',
      'open casket': 'a funeral home', 'grave': 'a cemetery',
      'gravesite': 'a cemetery', 'tombstone': 'a cemetery',
      'trunk': 'a car', 'car trunk': 'a parking lot',
      'glove compartment': 'a car',
      'mirror': 'a bathroom', 'bathroom mirror': 'a bathroom',
      'phone screen': 'a room', 'computer screen': 'an office',
      'tv screen': 'a living room',
    };
    for (const [pattern, replacement] of Object.entries(moodBoardLocNormMap)) {
      if (firstLocLower.includes(pattern)) {
        firstLocation = replacement;
        break;
      }
    }

    const moodPrompt = applyVisualOcclusion([
      `Set in ${eraLabel}.`,
      /* MOOD: lighting, color palette, atmosphere */
      moodSet.mood_board,
      /* STYLE: composition, textures, set dressing, camera */
      styleSet.mood_board,
      /* Location: clean neutral mention */
      `Empty ${firstLocation}.`,
      /* Tone + framing */
      `${overallTone} atmosphere. Still life photograph of an empty place. Deep focus, every texture sharp.`
    ].filter(Boolean).join(' '));

    console.log(`\n--- MOOD BOARD PROMPT (${moodPrompt.split(' ').length} words) ---`);
    console.log(moodPrompt);

    jobs.push({
      type: 'mood_board',
      prompt: moodPrompt,
      width: 1344,
      height: 768
    });

    // =========================================================================
    // CHARACTER PORTRAITS (max 3) — expression-focused casting portraits
    // =========================================================================
    Object.entries(charIdentities).slice(0, 3).forEach(([name, id]) => {
      const prompt = [
        ...id.portraitPromptParts,
        moodSet.character,
        styleSet.character
      ].filter(Boolean).join(' ');

      console.log(`\n--- CHARACTER: ${name} (${prompt.split(' ').length} words) ---`);
      console.log(prompt);

      jobs.push({
        type: 'character',
        name,
        prompt,
        width: 832,
        height: 1216
      });
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        script_id,
        jobs,
        total: jobs.length
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', message: error.message }) };
  }
};
