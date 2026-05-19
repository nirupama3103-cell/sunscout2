const CACHE = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

const CATEGORY_QUERIES = {
  swimming:     "children swimming pool summer fun",
  splash:       "kids splash pad water park summer",
  soccer:       "kids soccer camp field outdoor",
  stem:         "children coding robotics stem class",
  ballet:       "kids ballet dance recital class",
  museum:       "children museum interactive exhibit",
  library:      "kids library reading storytime books",
  camp:         "summer camp kids outdoor adventure",
  gymnastics:   "kids gymnastics class tumbling",
  music:        "children music class instruments singing",
  art:          "kids art painting craft class",
  hiking:       "family hiking trail nature kids",
  horse:        "kids horseback riding equestrian carriage",
  cherry:       "cherry picking orchard family kids",
  berry:        "berry picking strawberry farm family",
  farm:         "kids petting zoo goats farm animals",
  playground:   "children playground park sunny",
  beach:        "family beach summer fun kids waves",
  climbing:     "kids rock climbing gym bouldering",
  cooking:      "kids cooking baking class chef",
  yoga:         "kids yoga class stretching",
  tennis:       "kids tennis camp court",
  market:       "farmers market family outdoor produce",
  festival:     "kids festival outdoor summer fair",
  train:        "children train ride scenic railway",
  fishing:      "kids fishing pier family outdoor",
  bowling:      "kids bowling alley fun",
  skating:      "kids ice skating rink",
  default:      "kids summer activities fun outdoor"
};

function getCategory(name, desc) {
  const t = (name + " " + (desc||"")).toLowerCase();
  if (t.includes("cherry")||t.includes("stone fruit")||t.includes("orchard")) return "cherry";
  if (t.includes("berry")||t.includes("strawberry")||t.includes("blueberry")||t.includes("raspberry")) return "berry";
  if (t.includes("horse")||t.includes("pony")||t.includes("equestrian")||t.includes("carriage")||t.includes("riding")) return "horse";
  if (t.includes("train")||t.includes("railway")||t.includes("railroad")) return "train";
  if (t.includes("fish")||t.includes("pier")||t.includes("angling")) return "fishing";
  if (t.includes("splash pad")||t.includes("splash")) return "splash";
  if (t.includes("swim")||t.includes("pool")||t.includes("aquatic")) return "swimming";
  if (t.includes("soccer")||t.includes("football")) return "soccer";
  if (t.includes("stem")||t.includes("coding")||t.includes("robot")||t.includes("lego")||t.includes("science")||t.includes("tech")) return "stem";
  if (t.includes("ballet")||t.includes("dance")) return "ballet";
  if (t.includes("museum")||t.includes("discovery")||t.includes("winchester")) return "museum";
  if (t.includes("library")||t.includes("storytime")||t.includes("reading")||t.includes("book")) return "library";
  if (t.includes("gymnastics")||t.includes("trampoline")||t.includes("kidstrong")) return "gymnastics";
  if (t.includes("music")||t.includes("instrument")||t.includes("piano")||t.includes("guitar")) return "music";
  if (t.includes("art")||t.includes("paint")||t.includes("pottery")||t.includes("clay")||t.includes("craft")) return "art";
  if (t.includes("hike")||t.includes("trail")||t.includes("nature")||t.includes("creek")) return "hiking";
  if (t.includes("farm")||t.includes("petting")||t.includes("zoo")||t.includes("animal")) return "farm";
  if (t.includes("climbing")||t.includes("ropes course")||t.includes("zip")) return "climbing";
  if (t.includes("cook")||t.includes("bak")||t.includes("chef")||t.includes("kitchen")) return "cooking";
  if (t.includes("tennis")||t.includes("pickleball")) return "tennis";
  if (t.includes("beach")||t.includes("boardwalk")||t.includes("pier")) return "beach";
  if (t.includes("bowl")) return "bowling";
  if (t.includes("skat")||t.includes("ice rink")||t.includes("ice centre")) return "skating";
  if (t.includes("market")||t.includes("fair")||t.includes("festival")) return "festival";
  if (t.includes("playground")||t.includes("park")) return "playground";
  if (t.includes("camp")||t.includes("galileo")||t.includes("kidventure")||t.includes("ymca")) return "camp";
  return "default";
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const { name, desc } = req.query;
  if (!name) return res.status(400).json({ error: "name required" });

  const category = getCategory(name, desc || "");
  const query = CATEGORY_QUERIES[category];
  const cacheKey = name.toLowerCase().trim();

  if (CACHE.has(cacheKey)) {
    const { url, ts } = CACHE.get(cacheKey);
    if (Date.now() - ts < CACHE_TTL) {
      return res.json({ url, category, cached: true });
    }
  }

  try {
    const page = Math.floor(Math.random() * 3) + 1;
    const r = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    );
    const data = await r.json();
    const photos = data.photos || [];
    if (photos.length === 0) return res.json({ url: null });
    const pick = photos[Math.floor(Math.random() * photos.length)];
    CACHE.set(cacheKey, { url: pick.src.large, ts: Date.now() });
    return res.json({ url: pick.src.large, category, cached: false });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
