const fetch = require('node-fetch');

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY;

// ── Layer 1: Hardcoded image map ──────────────────────────
const IMAGE_MAP = [
  { keywords: ['park','playground','las palmas','seven seas','magical bridge'], img: '/images/park.jpg' },
  { keywords: ['stem','coding','robot','lego','science','snapology'],           img: '/images/stem.jpg' },
  { keywords: ['horse','pony','carriage','riding','ranch'],                     img: '/images/horse.jpg' },
  { keywords: ['cherry','berry','orchard','fruit pick','u-pick'],               img: '/images/cherry.jpg' },
  { keywords: ['market','festival','fair','art & wine'],                        img: '/images/sunnyvalemarket.jpg' },
  { keywords: ['outdoor camp','ropes','zip','high rope'],                       img: '/images/outcamp.jpg' },
  { keywords: ['camp','ymca','galileo','safari kid'],                           img: '/images/summercamp.jpg' },
  { keywords: ['library','storytime','reading','book'],                         img: '/images/readingroom.jpg' },
  { keywords: ['museum','discovery','winchester','tech interactive'],           img: '/images/museum.jpg' },
  { keywords: ['ballet','dance','music','art studio'],                          img: '/images/ballet.jpg' },
  { keywords: ['pool','swim','aquatic','water'],                                img: '/images/splash.jpg' },
  { keywords: ['trail','hike','creek','canyon','mission peak'],                 img: '/images/trail.jpg' },
];

function getHardcodedImage(title = '', category = '') {
  const text = `${title} ${category}`.toLowerCase();
  for (const entry of IMAGE_MAP) {
    if (entry.keywords.some(kw => text.includes(kw))) return entry.img;
  }
  return null;
}

// ── Layer 2: Google Places API (New) photo ────────────────
async function getPlacePhoto(placeId) {
  if (!placeId || !GOOGLE_KEY) return null;
  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=photos&key=${GOOGLE_KEY}`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.photos?.[0]) {
      const ref = data.photos[0].name;
      return `https://places.googleapis.com/v1/${ref}/media?maxHeightPx=400&key=${GOOGLE_KEY}&skipHttpRedirect=true`;
    }
  } catch (e) {
    console.warn('Places photo fetch failed:', e.message);
  }
  return null;
}

// ── Layer 3: Branded fallback message ────────────────────
function getFallbackMessage(category = '') {
  const cat = category.toLowerCase();
  if (cat.includes('park') || cat.includes('trail'))   return '🌳 Scouting the park...';
  if (cat.includes('stem') || cat.includes('coding'))  return '🔬 Loading the lab...';
  if (cat.includes('camp'))                            return '⛺ Setting up camp...';
  if (cat.includes('market'))                          return '🎪 Finding the market...';
  if (cat.includes('horse'))                           return '🐴 Saddling up...';
  if (cat.includes('cherry') || cat.includes('fruit')) return '🍒 Checking the orchard...';
  if (cat.includes('pool') || cat.includes('swim'))    return '🏊 Filling the pool...';
  if (cat.includes('museum'))                          return '🏛️ Opening the exhibit...';
  if (cat.includes('ballet') || cat.includes('dance')) return '🩰 Warming up...';
  return '☀️ Scouting the area...';
}

// ── Main handler ──────────────────────────────────────────
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { city = 'Sunnyvale', category = '', tab = '1' } = req.query;

  // --- Pull activities from Google Places Text Search ---
  const query  = `${category} activities for kids in ${city} CA`;
  const searchUrl = `https://places.googleapis.com/v1/places:searchText`;

  let places = [];
  try {
    const searchRes = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos',
      },
      body: JSON.stringify({ textQuery: query, maxResultCount: 10 }),
    });
    const searchData = await searchRes.json();
    places = searchData.places || [];
  } catch (e) {
    console.error('Places search failed:', e.message);
  }

  // Sort by rating desc (proxy for closest/best)
  places.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  // Build activity list with 3-layer image resolution
  const activities = await Promise.all(places.map(async (p) => {
    const title    = p.displayName?.text || 'Activity';
    const address  = p.formattedAddress || '';
    const rating   = p.rating || null;
    const reviews  = p.userRatingCount || 0;
    const placeId  = p.id;
    const mapsLink = `https://www.google.com/maps/place/?q=place_id:${placeId}`;

    // 3-layer image resolution
    const hardcoded  = getHardcodedImage(title, category);
    const googlePhoto = hardcoded ? null : await getPlacePhoto(placeId);
    const image      = hardcoded || googlePhoto || null;
    const fallback   = image ? null : getFallbackMessage(category);

    return { title, address, rating, reviews, placeId, mapsLink, image, fallback, photoAttribution: googlePhoto ? 'Photo © Google' : null };
  }));

  res.json({ city, category, tab, activities });
};
