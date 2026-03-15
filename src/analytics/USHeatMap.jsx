import React from 'react';
import { US_CITY_COORDS, US_STATE_PATHS } from '../data/usMapData';

function normalizeVoterLocation(location) {
  if (Array.isArray(location)) return location[0] || '';
  return location;
}

function USHeatMap({ votes, width = 700, height = 450 }) {
  // City name aliases for flexible matching
  const cityAliases = {
    'new york city': 'New York',
    'nyc': 'New York',
    'la': 'Los Angeles',
    'sf': 'San Francisco',
    'dc': 'Washington',
    'philly': 'Philadelphia',
    'vegas': 'Las Vegas',
    'nola': 'New Orleans'
  };

  // Metro area rollup - map smaller cities to their nearest major city
  // Format: 'small city, state': 'Major City, State'
  const metroAreaRollup = {
    // San Francisco Bay Area
    'Redwood City, California': 'San Francisco, California',
    'Palo Alto, California': 'San Francisco, California',
    'Mountain View, California': 'San Francisco, California',
    'Sunnyvale, California': 'San Francisco, California',
    'Santa Clara, California': 'San Francisco, California',
    'Fremont, California': 'San Francisco, California',
    'Hayward, California': 'San Francisco, California',
    'Berkeley, California': 'San Francisco, California',
    'Daly City, California': 'San Francisco, California',
    'San Mateo, California': 'San Francisco, California',
    'Cupertino, California': 'San Francisco, California',
    'Menlo Park, California': 'San Francisco, California',
    'Walnut Creek, California': 'San Francisco, California',
    'Concord, California': 'San Francisco, California',
    'Richmond, California': 'San Francisco, California',
    'Pleasanton, California': 'San Francisco, California',
    'Livermore, California': 'San Francisco, California',
    'San Ramon, California': 'San Francisco, California',
    'Milpitas, California': 'San Jose, California',
    'Campbell, California': 'San Jose, California',
    'Los Gatos, California': 'San Jose, California',
    'Saratoga, California': 'San Jose, California',
    // Los Angeles Area
    'Pasadena, California': 'Los Angeles, California',
    'Glendale, California': 'Los Angeles, California',
    'Burbank, California': 'Los Angeles, California',
    'Santa Monica, California': 'Los Angeles, California',
    'Long Beach, California': 'Los Angeles, California',
    'Torrance, California': 'Los Angeles, California',
    'Anaheim, California': 'Los Angeles, California',
    'Irvine, California': 'Los Angeles, California',
    'Huntington Beach, California': 'Los Angeles, California',
    'Ontario, California': 'Los Angeles, California',
    'Pomona, California': 'Los Angeles, California',
    'Fullerton, California': 'Los Angeles, California',
    'Costa Mesa, California': 'Los Angeles, California',
    'Newport Beach, California': 'Los Angeles, California',
    'West Hollywood, California': 'Los Angeles, California',
    'Beverly Hills, California': 'Los Angeles, California',
    'Culver City, California': 'Los Angeles, California',
    // New York Metro
    'Brooklyn, New York': 'New York, New York',
    'Queens, New York': 'New York, New York',
    'Bronx, New York': 'New York, New York',
    'Staten Island, New York': 'New York, New York',
    'Jersey City, New Jersey': 'New York, New York',
    'Newark, New Jersey': 'New York, New York',
    'Hoboken, New Jersey': 'New York, New York',
    'Yonkers, New York': 'New York, New York',
    'White Plains, New York': 'New York, New York',
    'Stamford, Connecticut': 'New York, New York',
    // Chicago Area
    'Evanston, Illinois': 'Chicago, Illinois',
    'Oak Park, Illinois': 'Chicago, Illinois',
    'Naperville, Illinois': 'Chicago, Illinois',
    'Aurora, Illinois': 'Chicago, Illinois',
    'Joliet, Illinois': 'Chicago, Illinois',
    'Schaumburg, Illinois': 'Chicago, Illinois',
    // Boston Area
    'Cambridge, Massachusetts': 'Boston, Massachusetts',
    'Somerville, Massachusetts': 'Boston, Massachusetts',
    'Brookline, Massachusetts': 'Boston, Massachusetts',
    'Newton, Massachusetts': 'Boston, Massachusetts',
    'Quincy, Massachusetts': 'Boston, Massachusetts',
    // Washington DC Area
    'Arlington, Virginia': 'Washington, District of Columbia',
    'Alexandria, Virginia': 'Washington, District of Columbia',
    'Bethesda, Maryland': 'Washington, District of Columbia',
    'Silver Spring, Maryland': 'Washington, District of Columbia',
    'Rockville, Maryland': 'Washington, District of Columbia',
    // Seattle Area
    'Bellevue, Washington': 'Seattle, Washington',
    'Redmond, Washington': 'Seattle, Washington',
    'Kirkland, Washington': 'Seattle, Washington',
    'Tacoma, Washington': 'Seattle, Washington',
    'Everett, Washington': 'Seattle, Washington',
    // Dallas-Fort Worth
    'Arlington, Texas': 'Dallas, Texas',
    'Plano, Texas': 'Dallas, Texas',
    'Irving, Texas': 'Dallas, Texas',
    'Frisco, Texas': 'Dallas, Texas',
    'McKinney, Texas': 'Dallas, Texas',
    // Houston Area
    'Sugar Land, Texas': 'Houston, Texas',
    'The Woodlands, Texas': 'Houston, Texas',
    'Pasadena, Texas': 'Houston, Texas',
    'Pearland, Texas': 'Houston, Texas',
    // Miami Area
    'Fort Lauderdale, Florida': 'Miami, Florida',
    'Hollywood, Florida': 'Miami, Florida',
    'Hialeah, Florida': 'Miami, Florida',
    'Coral Gables, Florida': 'Miami, Florida',
    'Boca Raton, Florida': 'Miami, Florida',
    // Denver Area
    'Boulder, Colorado': 'Denver, Colorado',
    'Aurora, Colorado': 'Denver, Colorado',
    'Lakewood, Colorado': 'Denver, Colorado',
    'Thornton, Colorado': 'Denver, Colorado',
    // Phoenix Area
    'Scottsdale, Arizona': 'Phoenix, Arizona',
    'Mesa, Arizona': 'Phoenix, Arizona',
    'Tempe, Arizona': 'Phoenix, Arizona',
    'Chandler, Arizona': 'Phoenix, Arizona',
    'Gilbert, Arizona': 'Phoenix, Arizona',
    // Atlanta Area
    'Marietta, Georgia': 'Atlanta, Georgia',
    'Sandy Springs, Georgia': 'Atlanta, Georgia',
    'Roswell, Georgia': 'Atlanta, Georgia',
    'Alpharetta, Georgia': 'Atlanta, Georgia',
    'Decatur, Georgia': 'Atlanta, Georgia',
    // Philadelphia Area
    'Camden, New Jersey': 'Philadelphia, Pennsylvania',
    'Wilmington, Delaware': 'Philadelphia, Pennsylvania',
    'Chester, Pennsylvania': 'Philadelphia, Pennsylvania',
    // Detroit Area
    'Dearborn, Michigan': 'Detroit, Michigan',
    'Livonia, Michigan': 'Detroit, Michigan',
    'Ann Arbor, Michigan': 'Detroit, Michigan',
    'Warren, Michigan': 'Detroit, Michigan',
    // Minneapolis Area
    'St. Paul, Minnesota': 'Minneapolis, Minnesota',
    'Bloomington, Minnesota': 'Minneapolis, Minnesota',
    'Plymouth, Minnesota': 'Minneapolis, Minnesota',
    // Portland Area
    'Beaverton, Oregon': 'Portland, Oregon',
    'Hillsboro, Oregon': 'Portland, Oregon',
    'Gresham, Oregon': 'Portland, Oregon',
    'Vancouver, Washington': 'Portland, Oregon'
  };

  // Normalize city name for lookup
  const normalizeCityForLookup = (city, state) => {
    if (!city || !state) return null;
    const cityLower = city.toLowerCase().trim();
    // Check for alias
    const aliasedCity = cityAliases[cityLower] || city;

    // Build the full location key
    const locationKey = `${aliasedCity}, ${state}`;
    const originalKey = `${city}, ${state}`;

    // Check metro area rollup first
    if (metroAreaRollup[originalKey]) return metroAreaRollup[originalKey];
    if (metroAreaRollup[locationKey]) return metroAreaRollup[locationKey];

    // Try exact match
    if (US_CITY_COORDS[locationKey]) return locationKey;
    if (US_CITY_COORDS[originalKey]) return originalKey;

    // Try fuzzy match - find any city in that state
    const stateKeys = Object.keys(US_CITY_COORDS).filter(k => k.endsWith(`, ${state}`));
    for (const key of stateKeys) {
      const coordCity = key.split(',')[0].toLowerCase().trim();
      if (coordCity.includes(cityLower) || cityLower.includes(coordCity)) {
        return key;
      }
    }

    // Last resort: check if any metro area rollup matches this state and do proximity match
    for (const [smallCity, majorCity] of Object.entries(metroAreaRollup)) {
      if (smallCity.endsWith(`, ${state}`)) {
        const smallCityName = smallCity.split(',')[0].toLowerCase().trim();
        if (cityLower.includes(smallCityName) || smallCityName.includes(cityLower)) {
          return majorCity;
        }
      }
    }

    return null;
  };

  const votesWithLocation = votes.filter(v => {
    const loc = normalizeVoterLocation(v.voterLocation);
    return loc && loc !== 'Location unavailable';
  });

  // Aggregate votes by normalized city key (matching US_CITY_COORDS)
  const votesByCity = {};
  const cityDisplayNames = {}; // Store original display names
  const cityGenderData = {}; // Store gender breakdown per city
  votesWithLocation.forEach(vote => {
    const location = normalizeVoterLocation(vote.voterLocation);
    const parts = location.split(',').map(p => p.trim());
    const city = parts[0] || '';
    const state = parts[1] || '';
    if (city && state) {
      const coordKey = normalizeCityForLookup(city, state);
      const key = coordKey || `${city}, ${state}`;
      votesByCity[key] = (votesByCity[key] || 0) + 1;
      cityDisplayNames[key] = coordKey ? `${city}, ${state}` : key;
      // Track gender data
      if (!cityGenderData[key]) {
        cityGenderData[key] = { Male: 0, Female: 0, 'Non-binary': 0, Other: 0 };
      }
      const gender = vote.voterGender || 'Other';
      if (cityGenderData[key][gender] !== undefined) {
        cityGenderData[key][gender]++;
      } else {
        cityGenderData[key].Other++;
      }
    }
  });

  const maxCityVotes = Math.max(...Object.values(votesByCity), 1);

  // Get city marker properties (size and color based on votes)
  const getCityProps = (votes) => {
    const intensity = votes / maxCityVotes;
    const minSize = 8;
    const maxSize = 16;
    const size = minSize + intensity * (maxSize - minSize);
    // High vote cities (>= 60% of max) get yellow, others get teal
    const color = intensity >= 0.6 ? '#feca57' : '#4ecdc4';
    return { size, color, intensity };
  };

  const [hoveredCity, setHoveredCity] = React.useState(null);

  if (votesWithLocation.length < 2) {
    return (
      <div style={{
        width: '100%', maxWidth: width, aspectRatio: '1000 / 589',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
        border: '1px dashed rgba(255,255,255,0.1)'
      }}>
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '0.5rem', opacity: 0.5 }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>Collect more votes to see geographic insights</p>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', opacity: 0.7 }}>Need at least 2 votes with location data</p>
        </div>
      </div>
    );
  }

  // Inline keyframes for pulse animation
  const pulseKeyframes = `
    @keyframes heatPulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 0.2; transform: scale(1.3); }
    }
  `;

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: width, aspectRatio: '1000 / 589' }}>
      <style>{pulseKeyframes}</style>
      <svg viewBox="0 0 1000 589" preserveAspectRatio="xMidYMid meet" style={{ width: '100%', height: '100%', display: 'block', position: 'absolute', top: 0, left: 0 }}>
        {/* Render all US states as solid fill - creates clean US outline */}
        {Object.entries(US_STATE_PATHS).map(([stateCode, pathData]) => (
          <path
            key={stateCode}
            d={pathData}
            fill="rgba(255,255,255,0.08)"
            stroke="none"
          />
        ))}

        {/* City heat markers with glow effect */}
        {Object.entries(votesByCity).map(([cityKey, voteCount]) => {
          // Get coordinates (already calibrated for 1000x589 viewBox)
          const coords = US_CITY_COORDS[cityKey];
          if (!coords) return null;
          const { size, color, intensity } = getCityProps(voteCount);
          const glowColor = color === '#feca57' ? 'rgba(254,202,87,' : 'rgba(78,205,196,';
          const displayName = cityDisplayNames[cityKey] || cityKey;
          return (
            <g key={cityKey}>
              {/* Outer pulse ring (for high-vote cities) */}
              {intensity > 0.5 && (
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={size * 2.5}
                  fill={`${glowColor}0.15)`}
                  style={{ animation: 'heatPulse 2s ease-in-out infinite', transformOrigin: `${coords.x}px ${coords.y}px` }}
                />
              )}
              {/* Middle glow */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={size * 1.8}
                fill={`${glowColor}0.25)`}
              />
              {/* Inner glow */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={size * 1.3}
                fill={`${glowColor}0.4)`}
              />
              {/* Main dot */}
              <circle
                cx={coords.x}
                cy={coords.y}
                r={size}
                fill={color}
                stroke="#fff"
                strokeWidth="1.5"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredCity({ key: cityKey, display: displayName, votes: voteCount, genders: cityGenderData[cityKey], x: coords.x, y: coords.y })}
                onMouseLeave={() => setHoveredCity(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip for city */}
      {hoveredCity && (
        <div style={{
          position: 'absolute',
          top: `${(hoveredCity.y / 589) * 100}%`,
          left: `${(hoveredCity.x / 1000) * 100}%`,
          transform: 'translate(-50%, -100%) translateY(-15px)',
          background: 'rgba(0,0,0,0.95)', padding: '0.75rem 1rem',
          borderRadius: '10px', fontSize: '0.85rem', color: '#fff',
          border: '1px solid rgba(78,205,196,0.3)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)', minWidth: '160px',
          pointerEvents: 'none', zIndex: 10
        }}>
          <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#4ecdc4' }}>{hoveredCity.display}</div>
          <div style={{ marginBottom: '0.5rem' }}>{hoveredCity.votes} vote{hoveredCity.votes !== 1 ? 's' : ''}</div>
          {hoveredCity.genders && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
              {hoveredCity.genders.Male > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Male</span><span>{hoveredCity.genders.Male}</span></div>}
              {hoveredCity.genders.Female > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Female</span><span>{hoveredCity.genders.Female}</span></div>}
              {hoveredCity.genders['Non-binary'] > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Non-binary</span><span>{hoveredCity.genders['Non-binary']}</span></div>}
              {hoveredCity.genders.Other > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'rgba(255,255,255,0.6)' }}>Other</span><span>{hoveredCity.genders.Other}</span></div>}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default USHeatMap;
