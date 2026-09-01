#!/usr/bin/env node
/**
 * Before/after for the /api/photos keyword matcher.
 *
 *   node scripts/test-photo-queries.js
 *
 * Prints the query each representative event used to send to Pexels and the
 * query it sends now, then asserts the properties that made the old ones
 * wrong: no query says "summer" for a December event, seasonal event types
 * resolve to their own category rather than the generic default, and the
 * `market` category is actually reachable.
 *
 * The api file is an ES module (Vercel serves it as one), so rather than
 * importing it this evals the pure top half — everything above the BUILD
 * marker is plain functions with no imports.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'api', 'photos.js'), 'utf8');
const pure = src.slice(0, src.indexOf('// Marker so the self-test'));
const sandbox = {};
new Function('exports', pure + '\nObject.assign(exports,{getCategory,buildQuery,CATEGORY_QUERIES,RULES});')(sandbox);
const { getCategory, buildQuery, CATEGORY_QUERIES } = sandbox;

/* ── the matcher as it was, verbatim, so "before" is measured not remembered ── */
const OLD_QUERIES = {
  swimming:"children swimming pool summer fun", splash:"kids splash pad water park summer",
  soccer:"kids soccer camp field outdoor", stem:"children coding robotics stem class",
  ballet:"kids ballet dance recital class", museum:"children museum interactive exhibit",
  library:"kids library reading storytime books", camp:"summer camp kids outdoor adventure",
  gymnastics:"kids gymnastics class tumbling", music:"children music class instruments singing",
  art:"kids art painting craft class", hiking:"family hiking trail nature kids",
  horse:"kids horseback riding equestrian carriage", cherry:"cherry picking orchard family kids",
  berry:"berry picking strawberry farm family", farm:"kids petting zoo goats farm animals",
  playground:"children playground park sunny", beach:"family beach summer fun kids waves",
  climbing:"kids rock climbing gym bouldering", cooking:"kids cooking baking class chef",
  yoga:"kids yoga class stretching", tennis:"kids tennis camp court",
  market:"farmers market family outdoor produce", festival:"kids festival outdoor summer fair",
  train:"children train ride scenic railway", fishing:"kids fishing pier family outdoor",
  bowling:"kids bowling alley fun", skating:"kids ice skating rink",
  default:"kids summer activities fun outdoor",
};
function oldCategory(name, desc) {
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

/* Real cards: the first five are the event types the brief named. `on` is the
   month the card is actually shown in, which is what makes "summer" wrong. */
const EVENTS = [
  { name: "Spina Farms Pumpkin Patch", desc: "Pick your own pumpkin, hay rides and a corn maze", on: 9 },
  { name: "Vasona Park Holiday Lights", desc: "Drive-through holiday light display in Los Gatos", on: 11 },
  { name: "Los Altos Tree Lighting Ceremony", desc: "Downtown tree lighting with carols and cocoa", on: 11 },
  { name: "Mountain View Farmers Market", desc: "Sunday farmers market with produce and music", on: 4 },
  { name: "Children's Discovery Museum", desc: "Hands-on exhibits for kids in downtown San Jose", on: 2 },
  { name: "Half Moon Bay Art & Pumpkin Festival", desc: "Street festival with the Great Pumpkin weigh-off", on: 9 },
  { name: "Fremont Trunk-or-Treat", desc: "Decorated car boots, costumes welcome", on: 9 },
  { name: "Winchester Mystery House after-dark tour", desc: "Halloween candlelight tour", on: 9 },
];

const MONTH = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
console.log('\nBEFORE / AFTER — query sent to Pexels\n');
for (const e of EVENTS) {
  const before = OLD_QUERIES[oldCategory(e.name, e.desc)];
  const after = buildQuery(e.name, e.desc, null, new Date(2026, e.on, 15));
  console.log(`${e.name}  (shown in ${MONTH[e.on]})`);
  console.log(`  before  [${oldCategory(e.name, e.desc).padEnd(12)}] ${before}`);
  console.log(`  after   [${after.category.padEnd(12)}] ${after.query}`);
  console.log(`  ${before === after.query ? '=  unchanged' : '->  changed'}\n`);
}

let passed = 0, failed = 0;
function assert(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  ok ? passed++ : failed++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(60)} ${JSON.stringify(actual)}` +
              (ok ? '' : `   expected ${JSON.stringify(expected)}`));
}

console.log('The named event types land on their own category');
assert('pumpkin patch',   getCategory("Spina Farms Pumpkin Patch", "hay rides"), 'pumpkin');
assert('holiday lights',  getCategory("Vasona Park Holiday Lights", "drive-through display"), 'lights');
assert('tree lighting',   getCategory("Los Altos Tree Lighting Ceremony", "carols"), 'treelighting');
assert('farmers market',  getCategory("Mountain View Farmers Market", "produce"), 'market');
assert("kids museum",     getCategory("Children's Discovery Museum", "hands-on exhibits"), 'museum');

console.log('\nOrder is respected — a broad phrase cannot swallow a specific one');
/* "farmers" contains "farm", so the old chain answered a farmers market with
   a petting-zoo photo. "farmers market" now matches first. */
assert('old matcher read "farmers" as a farm', oldCategory("Mountain View Farmers Market", ""), 'farm');
assert('farmers market beats farm', getCategory("Mountain View Farmers Market", ""), 'market');
assert('tree lighting is not a tree farm', getCategory("Tree Lighting Ceremony", ""), 'treelighting');
assert('christmas tree farm still resolves', getCategory("Crest Ranch Christmas Tree Farm", ""), 'treefarm');
assert('pumpkin festival is a pumpkin patch, not a summer fair',
       getCategory("Half Moon Bay Art & Pumpkin Festival", ""), 'pumpkin');

console.log('\nNo query asks for the wrong season');
const wrong = [];
for (const e of EVENTS) {
  const q = buildQuery(e.name, e.desc, null, new Date(2026, e.on, 15)).query;
  const month = e.on;
  const season = ["winter","winter","spring","spring","spring","summer","summer","summer","fall","fall","fall","winter"][month];
  for (const w of ["summer", "winter", "spring", "autumn"]) {
    const mine = w === "autumn" ? "fall" : w;
    if (q.includes(w) && mine !== season) wrong.push(`${e.name}: "${w}" in ${MONTH[month]}`);
  }
}
assert('no season word contradicts the month shown', wrong, []);
assert('the generic default no longer says summer',
       /summer/.test(CATEGORY_QUERIES.default), false);

console.log('\nA caller hint wins over the rules');
const h = buildQuery("Lemos Farm", "", "pumpkin patch field autumn orange pumpkins");
assert('hint used verbatim', h.query, 'pumpkin patch field autumn orange pumpkins');
assert('hint reported as its own category', h.category, 'hint');
assert('empty hint falls back to the rules', buildQuery("Lemos Farm", "petting zoo", "  ").category, 'farm');
assert('hint is length-capped', buildQuery("x", "", "y".repeat(400)).query.length, 120);

console.log('\nEvery category a rule can return has a query');
const cats = new Set(sandbox.RULES.map(r => r[0]));
assert('no rule points at a missing query',
       [...cats].filter(c => !CATEGORY_QUERIES[c]), []);
assert('no query is unreachable dead code',
       Object.keys(CATEGORY_QUERIES).filter(c => c !== 'default' && !cats.has(c)), []);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
