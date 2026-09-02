const CACHE = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

/* ══════════════════════════════════════════════════════════════════════════
   QUERY BUILDING

   Pexels searches the phrase, so the phrase IS the photo quality. Three
   things were wrong with the old matcher:

     1. Almost every generic query said "summer". A December tree lighting
        asked Pexels for "kids summer activities fun outdoor" and got a
        beach.
     2. Matching was a chain of substring tests in source order, so
        "farmers market" hit the `market` test inside the festival rule and
        never reached the `market` category — which was unreachable code.
     3. The caller's own hint was discarded. The Halloween hub sends
        "pumpkin patch field autumn orange pumpkins" as desc and got the
        summer default, because no rule mentioned pumpkins at all.

   The fix: rules are an ORDERED list of phrases, most specific first, so
   "farmers market" is tested before "market" and "tree lighting" before
   "tree"; seasonal event types have their own categories; generic
   categories take a season word from the request date instead of always
   saying summer; and a caller that already knows what it wants can pass
   &hint= and have it used verbatim.

   scripts/test-photo-queries.js pins the before/after for the event types
   we actually list.
   ══════════════════════════════════════════════════════════════════════════ */

const CATEGORY_QUERIES = {
  /* Seasonal — these are the ones the old matcher got most wrong. */
  pumpkin:      "pumpkin patch family children autumn orange pumpkins",
  cornmaze:     "corn maze autumn farm field aerial",
  trickortreat: "children halloween costumes trick or treating street",
  haunt:        "haunted house at night jack o lantern",
  harvest:      "autumn harvest festival families hay bales",
  lights:       "christmas lights display house night neighbourhood",
  treelighting: "christmas tree lighting ceremony crowd evening",
  treefarm:     "christmas tree farm family choosing tree",
  santa:        "santa claus children visit christmas",

  /* Everyday activities. */
  swimming:     "children swimming pool fun",
  splash:       "kids splash pad water park",
  soccer:       "kids soccer field outdoor",
  stem:         "children coding robotics stem class",
  ballet:       "kids ballet dance recital class",
  museum:       "children museum interactive hands on exhibit",
  library:      "kids library storytime reading circle",
  camp:         "kids day camp outdoor group activity",
  gymnastics:   "kids gymnastics class tumbling",
  music:        "children music class instruments singing",
  art:          "kids art painting craft class",
  hiking:       "family hiking trail nature kids",
  horse:        "kids horseback riding pony equestrian",
  cherry:       "cherry picking orchard family kids",
  berry:        "berry picking strawberry farm family",
  farm:         "kids petting zoo goats farm animals",
  playground:   "children playground park",
  beach:        "family beach kids waves sand",
  climbing:     "kids rock climbing gym bouldering",
  cooking:      "kids cooking baking class chef",
  yoga:         "kids yoga class stretching",
  tennis:       "kids tennis court lesson",
  market:       "farmers market families produce stalls outdoor",
  festival:     "family street festival outdoor fair crowd",
  train:        "children train ride scenic railway",
  fishing:      "kids fishing pier family outdoor",
  bowling:      "kids bowling alley fun",
  skating:      "children ice skating rink",
  default:      "kids activities fun outdoor family",
};

/* Categories whose photo reads wrong in the wrong season — a playground in
   snow, a beach in December. The season word goes in front so Pexels
   weights it. Explicitly seasonal categories are NOT in here: a pumpkin
   patch is already autumn by definition. */
const SEASON_SENSITIVE = new Set([
  "playground", "hiking", "farm", "market", "festival", "camp", "default",
]);
const SEASON_BY_MONTH = ["winter", "winter", "spring", "spring", "spring", "summer",
                         "summer", "summer", "fall", "fall", "fall", "winter"];
const SEASON_WORD = { spring: "spring", summer: "summer", fall: "autumn", winter: "winter" };

/* Ordered most specific first — the order is the whole contract. A phrase
   earlier in this list wins over a broader one later, which is what stops
   "farmers market" being read as a festival and "tree lighting" as a farm. */
const RULES = [
  ["pumpkin",      ["pumpkin patch", "pumpkin farm", "pick a pumpkin", "pumpkin"]],
  ["cornmaze",     ["corn maze", "hay maze", "maze"]],
  ["trickortreat", ["trunk-or-treat", "trunk or treat", "trick-or-treat", "trick or treat",
                    "halloween parade", "costume parade", "safe treat"]],
  ["haunt",        ["haunted house", "haunted", "haunt", "spooky", "scare", "ghost tour",
                    "after-dark", "fright"]],
  ["treelighting", ["tree lighting", "tree-lighting", "lighting ceremony", "menorah lighting",
                    "light up the", "holiday kickoff"]],
  ["lights",       ["holiday lights", "christmas lights", "light display", "lights display",
                    "winter lights", "lights walk", "lights drive", "zoolights", "glow"]],
  ["treefarm",     ["christmas tree farm", "tree farm", "cut your own tree"]],
  ["santa",        ["santa", "breakfast with st", "polar express"]],
  ["harvest",      ["harvest festival", "harvest days", "harvest", "fall festival",
                    "autumn festival", "apple picking", "cider"]],
  ["market",       ["farmers market", "farmers' market", "farmer's market", "night market",
                    "holiday market", "craft market", "makers market"]],
  ["cherry",       ["cherry", "stone fruit", "orchard"]],
  ["berry",        ["berry picking", "strawberry", "blueberry", "raspberry", "berry"]],
  ["horse",        ["horseback", "horse", "pony", "equestrian", "carriage", "riding"]],
  ["train",        ["train ride", "railway", "railroad", "train"]],
  ["fishing",      ["fishing", "angling"]],
  ["splash",       ["splash pad", "spray ground", "splash"]],
  ["swimming",     ["swim", "pool", "aquatic"]],
  ["soccer",       ["soccer", "football"]],
  ["stem",         ["stem", "coding", "robot", "lego", "science", "maker", "tech"]],
  ["ballet",       ["ballet", "nutcracker", "dance"]],
  /* "children's museum" / "kids museum" is a distinct thing from a gallery,
     and it is one of the most common cards we render. */
  ["museum",       ["children's museum", "childrens museum", "kids museum", "discovery museum",
                    "discovery center", "museum", "winchester", "exploratorium"]],
  ["library",      ["storytime", "story time", "library", "reading", "book"]],
  ["gymnastics",   ["gymnastics", "trampoline", "tumbling", "kidstrong"]],
  ["music",        ["music", "instrument", "piano", "guitar", "sing"]],
  ["art",          ["art", "paint", "pottery", "clay", "craft"]],
  ["skating",      ["ice skating", "ice rink", "skating", "skate"]],
  ["hiking",       ["hike", "hiking", "trail", "nature walk", "creek", "nature"]],
  ["farm",         ["petting zoo", "farm", "zoo", "animal", "barnyard"]],
  ["climbing",     ["rock climbing", "climbing", "ropes course", "zip line"]],
  ["cooking",      ["cooking", "baking", "chef", "kitchen"]],
  ["tennis",       ["tennis", "pickleball"]],
  ["yoga",         ["yoga"]],
  ["beach",        ["beach", "boardwalk", "pier", "tide pool"]],
  ["bowling",      ["bowling"]],
  ["festival",     ["street fair", "festival", "fair", "carnival", "parade"]],
  ["playground",   ["playground", "park"]],
  ["camp",         ["day camp", "summer camp", "camp", "galileo", "kidventure", "ymca",
                    "afterschool", "after school"]],
];

function getCategory(name, desc) {
  const t = (name + " " + (desc || "")).toLowerCase();
  for (const [category, phrases] of RULES) {
    for (const p of phrases) if (t.includes(p)) return category;
  }
  return "default";
}

/* The query handed to Pexels. `hint`, when a caller supplies one, is used
   verbatim: the seasonal hubs keep curated phrases per event type in
   config/seasonal-hubs.js and know better than any keyword rule. */
function buildQuery(name, desc, hint, date) {
  if (hint && hint.trim()) return { query: hint.trim().slice(0, 120), category: "hint" };
  const category = getCategory(name, desc || "");
  let query = CATEGORY_QUERIES[category] || CATEGORY_QUERIES.default;
  if (SEASON_SENSITIVE.has(category)) {
    query = SEASON_WORD[SEASON_BY_MONTH[(date || new Date()).getMonth()]] + " " + query;
  }
  return { query, category };
}

// Marker so the self-test can prove which build is actually serving. Bump it
// whenever this file changes in a way you need to confirm reached production.
const BUILD = "2026-08-31-photos-selftest";

/**
 * GET /api/photos?selftest=1
 *
 * Diagnostic only, mirroring /api/subscribe?selftest=1. Without this, a
 * missing or wrong PEXELS_API_KEY is invisible: the request 401s, data.photos
 * comes back undefined, and the handler answers {url:null} — which is exactly
 * what "no photo matched this query" looks like. Pages then degrade silently
 * and correctly, and nobody can tell misconfiguration from a genuine miss.
 *
 * Never returns the key, only its length and last four characters — enough to
 * spot a truncated or quote-wrapped paste.
 */
async function selftest(res) {
  const key = process.env.PEXELS_API_KEY || "";
  const out = {
    build: BUILD,
    provider: "pexels",
    keyPresent: Boolean(key),
    keyLength: key.length,
    keyTail: key ? key.slice(-4) : null,
    keyLooksQuoted: /^["']|["']$/.test(key),
    cacheEntries: CACHE.size,
  };
  if (!key) {
    out.verdict = "PEXELS_API_KEY is not set — /api/photos will return url:null for every request.";
    return res.status(200).json(out);
  }
  try {
    const r = await fetch(
      "https://api.pexels.com/v1/search?query=kids%20park&per_page=1",
      { headers: { Authorization: key } }
    );
    out.providerStatus = r.status;
    const body = await r.text();
    out.providerBody = body.slice(0, 200);
    out.verdict = r.ok
      ? "OK — key is valid and Pexels is answering."
      : "Key is set but Pexels rejected it (see providerStatus/providerBody).";
  } catch (e) {
    out.providerStatus = "fetch-failed";
    out.providerBody = String(e && e.message).slice(0, 200);
    out.verdict = "Could not reach Pexels at all.";
  }
  return res.status(200).json(out);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "GET" && /selftest=1/.test(req.url || "")) {
    res.setHeader("Cache-Control", "no-store");
    return selftest(res);
  }

  const { name, desc, hint } = req.query;
  if (!name) return res.status(400).json({ error: "name required" });

  /* Fail loudly on misconfiguration instead of impersonating "no match".
     Callers still degrade gracefully — every one of them checks d.url — but
     the reason is now in the payload and the status code. */
  if (!process.env.PEXELS_API_KEY) {
    return res.status(503).json({ url: null, reason: "no-api-key", build: BUILD });
  }

  const { query, category } = buildQuery(name, desc, hint);
  /* Keyed on the query too, not the name alone: the same venue is a pumpkin
     patch in October and a tree farm in December, and a name-only key served
     October's photo for the rest of the year. */
  const cacheKey = name.toLowerCase().trim() + "|" + query;

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
    /* A 401/429 from Pexels used to fall through as "no photos", which is
       indistinguishable from a genuine miss. Name it. */
    if (!r.ok) {
      const body = await r.text();
      return res.status(502).json({
        url: null, reason: "provider-error",
        providerStatus: r.status, providerBody: body.slice(0, 200), build: BUILD,
      });
    }
    const data = await r.json();
    const photos = data.photos || [];
    if (photos.length === 0) return res.json({ url: null, reason: "no-match", category });
    const pick = photos[Math.floor(Math.random() * photos.length)];
    CACHE.set(cacheKey, { url: pick.src.large, ts: Date.now() });
    return res.json({ url: pick.src.large, category, cached: false });
  } catch(e) {
    return res.status(500).json({ url: null, reason: "exception", error: e.message, build: BUILD });
  }
}
