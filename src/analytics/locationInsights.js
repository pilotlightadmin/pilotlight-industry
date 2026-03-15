// US regions for geographic analysis
const US_REGIONS = {
  'Northeast': ['Connecticut', 'Delaware', 'Maine', 'Maryland', 'Massachusetts', 'New Hampshire', 'New Jersey', 'New York', 'Pennsylvania', 'Rhode Island', 'Vermont'],
  'Midwest': ['Illinois', 'Indiana', 'Iowa', 'Kansas', 'Michigan', 'Minnesota', 'Missouri', 'Nebraska', 'North Dakota', 'Ohio', 'South Dakota', 'Wisconsin'],
  'South': ['Alabama', 'Arkansas', 'District of Columbia', 'Florida', 'Georgia', 'Kentucky', 'Louisiana', 'Mississippi', 'North Carolina', 'Oklahoma', 'South Carolina', 'Tennessee', 'Texas', 'Virginia', 'West Virginia'],
  'West': ['Alaska', 'Arizona', 'California', 'Colorado', 'Hawaii', 'Idaho', 'Montana', 'Nevada', 'New Mexico', 'Oregon', 'Utah', 'Washington', 'Wyoming']
};

function normalizeVoterLocation(location) {
  if (Array.isArray(location)) return location[0] || '';
  return location;
}

function generateLocationInsights(votes) {
  const votesWithLocation = votes.filter(v => {
    const loc = normalizeVoterLocation(v.voterLocation);
    return loc && loc !== 'Location unavailable';
  });
  if (votesWithLocation.length < 2) return [];

  // Aggregate by state
  const byState = {};
  const byCity = {};
  votesWithLocation.forEach(vote => {
    const location = normalizeVoterLocation(vote.voterLocation);
    const parts = location.split(',').map(p => p.trim());
    const city = parts[0] || '';
    const state = parts[1] || '';
    if (state) {
      byState[state] = (byState[state] || 0) + 1;
      if (city) {
        const cityKey = `${city}, ${state}`;
        byCity[cityKey] = (byCity[cityKey] || 0) + 1;
      }
    }
  });

  const insights = [];
  const stateCount = Object.keys(byState).length;
  const cityCount = Object.keys(byCity).length;
  const totalWithLocation = votesWithLocation.length;

  // Insight 1: Geographic reach
  insights.push({
    icon: 'globe',
    text: `Your pilot has reached voters across ${stateCount} state${stateCount !== 1 ? 's' : ''} and ${cityCount} cit${cityCount !== 1 ? 'ies' : 'y'}.`
  });

  // Insight 2: Top market
  const sortedCities = Object.entries(byCity).sort((a, b) => b[1] - a[1]);
  if (sortedCities.length > 0) {
    const [topCity, topCount] = sortedCities[0];
    const percentage = Math.round((topCount / totalWithLocation) * 100);
    insights.push({
      icon: 'map-pin',
      text: `${topCity} is your strongest market with ${topCount} vote${topCount !== 1 ? 's' : ''} (${percentage}% of total).`
    });
  }

  // Insight 3: Gender by city analysis
  const genderByCity = {};
  votesWithLocation.forEach(vote => {
    const location = normalizeVoterLocation(vote.voterLocation);
    const parts = location.split(',').map(p => p.trim());
    const city = parts[0] || '';
    const state = parts[1] || '';
    const gender = vote.voterGender;
    if (city && state && gender) {
      const cityKey = `${city}, ${state}`;
      if (!genderByCity[cityKey]) {
        genderByCity[cityKey] = { Male: 0, Female: 0, 'Non-binary': 0, Other: 0, total: 0 };
      }
      if (genderByCity[cityKey][gender] !== undefined) {
        genderByCity[cityKey][gender]++;
      } else {
        genderByCity[cityKey].Other++;
      }
      genderByCity[cityKey].total++;
    }
  });

  // Find cities with notable gender skew (60%+ one gender, minimum 3 votes)
  const citiesWithGenderData = Object.entries(genderByCity).filter(([, data]) => data.total >= 3);
  if (citiesWithGenderData.length > 0) {
    // Find the city with the strongest gender skew
    let bestSkew = { city: null, gender: null, pct: 0 };
    citiesWithGenderData.forEach(([city, data]) => {
      ['Male', 'Female', 'Non-binary'].forEach(gender => {
        const pct = Math.round((data[gender] / data.total) * 100);
        if (pct > bestSkew.pct && pct >= 55) {
          bestSkew = { city, gender, pct };
        }
      });
    });
    if (bestSkew.city) {
      insights.push({
        icon: 'users',
        text: `${bestSkew.gender} viewers lead in ${bestSkew.city.split(',')[0]} (${bestSkew.pct}%).`
      });
    }
  }

  // Insight 4: Regional analysis
  const regionVotes = {};
  Object.entries(byState).forEach(([state, count]) => {
    for (const [region, states] of Object.entries(US_REGIONS)) {
      if (states.includes(state)) {
        regionVotes[region] = (regionVotes[region] || 0) + count;
        break;
      }
    }
  });
  const sortedRegions = Object.entries(regionVotes).sort((a, b) => b[1] - a[1]);
  if (sortedRegions.length > 0) {
    const [topRegion, regionCount] = sortedRegions[0];
    const regionPct = Math.round((regionCount / totalWithLocation) * 100);
    insights.push({
      icon: 'trending-up',
      text: `${topRegion} leads engagement with ${regionPct}% of votes.`
    });
  }

  // Insight 5: Concentration
  if (sortedCities.length >= 3) {
    const top3Votes = sortedCities.slice(0, 3).reduce((sum, [, count]) => sum + count, 0);
    const concentrationPct = Math.round((top3Votes / totalWithLocation) * 100);
    if (concentrationPct >= 50) {
      insights.push({
        icon: 'target',
        text: `High concentration: Top 3 cities account for ${concentrationPct}% of all votes.`
      });
    } else {
      insights.push({
        icon: 'share-2',
        text: `Good distribution: Votes spread across multiple markets (top 3 = ${concentrationPct}%).`
      });
    }
  }

  return insights.slice(0, 5);
}

export { generateLocationInsights, US_REGIONS };
