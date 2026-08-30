/* SunScout seasonal config — shared by the homepage and the /seasons/* hubs.
   Loaded as a classic script before any page script that reads SEASON.
   Single source of truth: never re-hardcode season strings in markup. */
/* ══════════════════════════════════════════════════════════════════
   SEASONAL CONFIG — single source of truth for all seasonal copy.
   Nothing seasonal should be hardcoded in the markup; edit here only.
   Does NOT affect data fetching, API calls, or activity rendering.
   ══════════════════════════════════════════════════════════════════ */
const SEASONS = {
  spring: {
    key:"spring", label:"Spring", emoji:"\uD83C\uDF38", year:2026,
    chip:"Spring 2026 \u00B7 Bay Area",
    heroLine1:"Your spring,", heroLine2:"already planned.",
    sub:"Egg hunts, blossom trails and spring break camps across seven South Bay cities \u2014 hand-checked, priced, and sorted by your kid\u2019s age.",
    tabs:{free:"Free Spring Activities", paid:"Spring Classes & Camps",
          indoor:"Indoor Activities", outdoor:"Outdoor Activities", weekend:"Weekend Activities"},
    tabSubs:{free:"Parks \u00B7 Libraries \u00B7 Gardens", paid:"Spring Break \u00B7 STEM \u00B7 Cooking",
             indoor:"Museums \u00B7 Pools \u00B7 Workshops", outdoor:"Hiking \u00B7 Farms \u00B7 Blossom Trails",
             weekend:"Sat & Sun only"},
    title:"SunScout \u2013 Free & Paid Spring Activities for Bay Area Kids",
    desc:"Discover free and paid spring activities for Bay Area kids. Filter by city, age, indoor/outdoor \u2014 Sunnyvale, San Jose, Cupertino, Mountain View, Palo Alto, Saratoga & Fremont.",
    keywords:"spring break camps Bay Area, Easter egg hunt Sunnyvale, free kids activities San Jose, family activities Cupertino",
    og:"/og/og-spring.jpg", endsOn:"05-31"
  },
  summer: {
    key:"summer", label:"Summer", emoji:"\u2600\uFE0F", year:2026,
    chip:"Summer 2026 \u00B7 Bay Area",
    heroLine1:"Your summer,", heroLine2:"already planned.",
    sub:"Splash pads, storytimes and standout camps across seven South Bay cities \u2014 hand-checked, priced, and sorted by your kid\u2019s age.",
    tabs:{free:"Free Summer Activities", paid:"Paid Summer Activities",
          indoor:"Indoor Activities", outdoor:"Outdoor Activities", weekend:"Weekend Activities"},
    tabSubs:{free:"Parks \u00B7 Libraries \u00B7 Splash Pads", paid:"YMCA \u00B7 STEM \u00B7 Cooking",
             indoor:"Museums \u00B7 Pools \u00B7 Workshops", outdoor:"Hiking \u00B7 Petting Zoos \u00B7 Farms",
             weekend:"Sat & Sun only"},
    title:"SunScout \u2013 Free & Paid Summer Activities for Bay Area Kids",
    desc:"Discover free and paid summer activities for Bay Area kids. Filter by city, age, indoor/outdoor \u2014 Sunnyvale, San Jose, Cupertino, Mountain View, Palo Alto, Saratoga & Fremont.",
    keywords:"summer camps Bay Area, free kids activities Sunnyvale, family activities San Jose, summer camps Cupertino",
    og:"/og/og-summer.jpg", endsOn:"08-31"
  },
  fall: {
    key:"fall", label:"Fall", emoji:"\uD83C\uDF42", year:2026,
    chip:"Fall 2026 \u00B7 Bay Area",
    heroLine1:"Your fall,", heroLine2:"already planned.",
    sub:"Pumpkin patches, harvest festivals and rainy-day picks across seven South Bay cities \u2014 hand-checked, priced, and sorted by your kid\u2019s age.",
    tabs:{free:"Free Fall Activities", paid:"Fall Classes & Camps",
          indoor:"Indoor Activities", outdoor:"Outdoor Activities", weekend:"Weekend Activities"},
    tabSubs:{free:"Parks \u00B7 Libraries \u00B7 Harvest Fun", paid:"Fall Break \u00B7 STEM \u00B7 Cooking",
             indoor:"Museums \u00B7 Pools \u00B7 Workshops", outdoor:"Pumpkin Patches \u00B7 Farms \u00B7 Trails",
             weekend:"Sat & Sun only"},
    title:"SunScout \u2013 Fall Activities & Halloween Fun for Bay Area Kids",
    desc:"Discover free and paid fall activities for Bay Area kids \u2014 pumpkin patches, harvest festivals, fall break camps and Halloween events across Sunnyvale, San Jose, Cupertino, Mountain View, Palo Alto, Saratoga & Fremont.",
    keywords:"pumpkin patch Bay Area, fall festival Sunnyvale, fall break camps San Jose, Halloween events for kids Cupertino",
    og:"/og/og-fall.jpg", endsOn:"11-30"
  },
  winter: {
    key:"winter", label:"Winter", emoji:"\u2744\uFE0F", year:2026,
    chip:"Winter 2026 \u00B7 Bay Area",
    heroLine1:"Your winter,", heroLine2:"already planned.",
    sub:"Holiday lights, ice rinks and winter break camps across seven South Bay cities \u2014 hand-checked, priced, and sorted by your kid\u2019s age.",
    tabs:{free:"Free Winter Activities", paid:"Winter Break Camps",
          indoor:"Indoor Activities", outdoor:"Outdoor Activities", weekend:"Weekend Activities"},
    tabSubs:{free:"Parks \u00B7 Libraries \u00B7 Light Displays", paid:"Winter Break \u00B7 STEM \u00B7 Cooking",
             indoor:"Museums \u00B7 Pools \u00B7 Workshops", outdoor:"Ice Rinks \u00B7 Trails \u00B7 Farms",
             weekend:"Sat & Sun only"},
    title:"SunScout \u2013 Winter Activities & Holiday Fun for Bay Area Kids",
    desc:"Discover free and paid winter activities for Bay Area kids \u2014 holiday lights, ice skating, winter break camps across Sunnyvale, San Jose, Cupertino, Mountain View, Palo Alto, Saratoga & Fremont.",
    keywords:"holiday lights Bay Area, winter break camps San Jose, indoor activities for kids rainy day, ice skating Sunnyvale",
    og:"/og/og-winter.jpg", endsOn:"02-28"
  }
};

// Runs ONE season ahead of the calendar (parents plan early).
// Override with ?season=fall for testing.
function getSeason(){
  const q = new URLSearchParams(location.search).get('season');
  if (q && SEASONS[q]) return SEASONS[q];
  const m = new Date().getMonth(); // 0-11
  if (m >= 7 && m <= 9)  return SEASONS.fall;    // Aug 1 \u2013 Oct 31
  if (m === 10 || m === 11 || m === 0) return SEASONS.winter; // Nov \u2013 Jan
  if (m >= 1 && m <= 3)  return SEASONS.spring;  // Feb \u2013 Apr
  return SEASONS.summer;                          // May \u2013 Jul
}
const SEASON = getSeason();
