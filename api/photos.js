const CACHE = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const CATEGORY_QUERIES = {
  swimming:   "children swimming pool summer",
  soccer:     "kids soccer camp field",
  stem:       "children coding robotics stem",
  ballet:     "kids ballet dance class",
  museum:     "children museum exhibit interactive",
  library:    "kids library reading storytime",
  camp:       "summer camp kids outdoor adventure",
  gymnastics: "kids gymnastics class",
  music:      "children music class instruments",
  art:        "kids art painting class",
  hiking:     "family hiking trail nature kids",
  farm:       "kids petting zoo farm animals",
  playground: "children playground park sunny",
  beach:      "family beach summer fun kids",
  climbing:   "kids rock climbing gym",
  cooking:    "kids cooking baking class",
  yoga:       "kids yoga class",
  tennis:     "kids tennis camp",
  horse:      "kids horseback riding",
  market:     "farmers market family outdoor",
  festival:   "kids festival outdoor summer fun",
  default:    "kids summer activities fun outdoor"
};

function getCategory(name, desc) {
  const t = (name + " " + (desc||"")).toLowerCase();
  if (t.includes("swim")||t.includes("pool")||t.includes("aquatic")||t.includes("splash")) return "swimming";
  if (t.includes("soccer")||t.includes("football")) return "soccer";
  if (t.includes("stem")||t.includes("coding")||t.includes("robot")||t.includes("lego")||t.includes("science")||t.includes("tech")||t.includes("ai ")) return "stem";
  if (t.includes("ballet")||t.includes("dance")) return "ballet";
  if (t.includes("museum")||t.includes("discovery")||t.includes("winchester")) return "museum";
  if (t.includes("library")||t.includes("storytime")||t.includes("reading")||t.includes("book")) return "library";
  if (t.includes("gymnastics")||t.includes("trampoline")||t.includes("kidstrong")) return "gymnastics";
  if (t.includes("music")||t.includes("instrument")||t.includes("piano")||t.includes("guitar")) return "music";
  if (t.includes("art")||t.includes("paint")||t.includes("pottery")||t.includes("clay")||t.includes("craft")) return "art";
  if (t.includes("hike")||t.includes("trail")||t.includes("nature")||t.includes("creek")) return "hiking";
  if (t.includes("farm")||t.includes("petting")||t.includes("zoo")||t.includes("animal")||t.includes("horse")||t.includes("pony")) return "farm";
  if (t.includes("climbing")||t.includes("ropes course")||t.includes("zip")) return "climbing";
  if (t.includes("cook")||t.includes("bak")||t.includes("chef")||t.includes("kitchen")) return "cooking";
  if (t.includes("tennis")||t.includes("pickleball")) return "tennis";
  if (t.includes("beach")||t.includes("boardwalk")) return "beach";
  if (t.includes("market")||t.includes("fair")||t.includes("festival")) return "festival";
  if (t.includes("playground")||t.includes("splash pad")||t.includes("park")) return "playground";
  if (t.includes("camp")||t.includes("galileo")||t.includes("kidventure")||t.includes("ymca")) return "camp";
  return "default";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { name, desc } = req.query;
  if (!name) return res.status(400).json({ error: "name required" });

  const category = getCategory(name, desc || "");
  const query = CATEGORY_QUERIES[category];

  // Cache by activity name for unique photos per activity
  const cacheKey = name.toLowerCase().trim();
  if (CACHE.has(cacheKey)) {
    const { url, ts } = CACHE.get(cacheKey);
    if (Date.now() - ts < CACHE_TTL) {
      return res.json({ url, category, cached: true });
    }
  }

  try {
    // Fetch 15 photos and pick randomly for variety across activities
    const page = Math.floor(Math.random() * 3) + 1;
    const r = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    );
    const data = await r.json();
    const photos = data.photos || [];
    if (photos.length === 0) return res.json({ url: null });

    const pick = photos[Math.floor(Math.random() * photos.length)];
    const url = pick.src.large;

    CACHE.set(cacheKey, { url, ts: Date.now() });
    return res.json({ url, category, cached: false });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
