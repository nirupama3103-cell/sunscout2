const DEFAULT_IMAGES = {
  camp:       "https://cdn-icons-png.flaticon.com/512/3870/3870019.png",
  stem:       "https://cdn-icons-png.flaticon.com/512/2103/2103658.png",
  art:        "https://cdn-icons-png.flaticon.com/512/3135/3135823.png",
  dance:      "https://cdn-icons-png.flaticon.com/512/3048/3048127.png",
  sports:     "https://cdn-icons-png.flaticon.com/512/857/857463.png",
  music:      "https://cdn-icons-png.flaticon.com/512/3659/3659784.png",
  toddler:    "https://cdn-icons-png.flaticon.com/512/3774/3774278.png",
  museum:     "https://cdn-icons-png.flaticon.com/512/2784/2784461.png",
  gymnastics: "https://cdn-icons-png.flaticon.com/512/3048/3048122.png",
  soccer:     "https://cdn-icons-png.flaticon.com/512/857/857418.png",
  ymca:       "https://cdn-icons-png.flaticon.com/512/2534/2534844.png",
  indoor:     "https://cdn-icons-png.flaticon.com/512/3774/3774274.png",
  bowling:    "https://cdn-icons-png.flaticon.com/512/857/857401.png",
  skating:    "https://cdn-icons-png.flaticon.com/512/3048/3048134.png",
  laser:      "https://cdn-icons-png.flaticon.com/512/2103/2103686.png",
  climbing:   "https://cdn-icons-png.flaticon.com/512/3048/3048139.png",
  trampoline: "https://cdn-icons-png.flaticon.com/512/3048/3048150.png",
  swimming:   "https://cdn-icons-png.flaticon.com/512/2534/2534826.png",
  library:    "https://cdn-icons-png.flaticon.com/512/2784/2784403.png",
  pottery:    "https://cdn-icons-png.flaticon.com/512/3135/3135853.png",
  default:    "https://cdn-icons-png.flaticon.com/512/3870/3870041.png",
};

function getDefaultImage(name, desc) {
  const t = (name + " " + (desc||"")).toLowerCase();
  if (t.includes("bowl"))                                      return DEFAULT_IMAGES.bowling;
  if (t.includes("skat"))                                      return DEFAULT_IMAGES.skating;
  if (t.includes("laser") || t.includes("lazer"))             return DEFAULT_IMAGES.laser;
  if (t.includes("climb"))                                     return DEFAULT_IMAGES.climbing;
  if (t.includes("trampoline") || t.includes("altitude"))     return DEFAULT_IMAGES.trampoline;
  if (t.includes("swim") || t.includes("pool") || t.includes("aquatic")) return DEFAULT_IMAGES.swimming;
  if (t.includes("library") || t.includes("storytime"))       return DEFAULT_IMAGES.library;
  if (t.includes("potter") || t.includes("clay"))             return DEFAULT_IMAGES.pottery;
  if (t.includes("ymca") || t.includes("community center"))   return DEFAULT_IMAGES.ymca;
  if (t.includes("ballet") || t.includes("dance"))            return DEFAULT_IMAGES.dance;
  if (t.includes("stem") || t.includes("coding") || t.includes("robot") || t.includes("tech") || t.includes("ai")) return DEFAULT_IMAGES.stem;
  if (t.includes("art") || t.includes("studio") || t.includes("paint")) return DEFAULT_IMAGES.art;
  if (t.includes("soccer") || t.includes("sport") || t.includes("tennis")) return DEFAULT_IMAGES.sports;
  if (t.includes("music") || t.includes("gymboree"))          return DEFAULT_IMAGES.music;
  if (t.includes("museum") || t.includes("discovery"))        return DEFAULT_IMAGES.museum;
  if (t.includes("gymnastic") || t.includes("little gym") || t.includes("kidstrong")) return DEFAULT_IMAGES.gymnastics;
  if (t.includes("toddler") || t.includes("infant") || t.includes("baby") || t.includes("safari") || t.includes("preschool")) return DEFAULT_IMAGES.toddler;
  if (t.includes("indoor") || t.includes("playground"))       return DEFAULT_IMAGES.indoor;
  if (t.includes("camp") || t.includes("galileo"))            return DEFAULT_IMAGES.camp;
  return DEFAULT_IMAGES.default;
}

// ============================================================
// SunScout — api/activities.js
// Live data: Eventbrite + Google Places + Ticketmaster
// Keys server-side only — never exposed to browser
// ============================================================

const CACHE = new Map();
const TTL = 1 * 60 * 1000; // 60 min

const TAB_KEYWORDS = {
  free:    ["free kids summer park","free splash pad children","free library storytime","free family park","free museum kids day"],
  paid:    ["Gymboree Play Music Sunnyvale","KidStrong Sunnyvale","Little Gym Mountain View","Safari Kid Sunnyvale","summer camp","kids class","art studio kids","dance studio","martial arts","swim school","YMCA","gymnastics","coding kids","Snapology Sunnyvale","Genius Kids Sunnyvale","Club Scikidz Silicon Valley","Coach Ken Soccer Academy","iD Tech Camp","Integem AI AR Camp","Steve Kate Camp","Galileo Camp","Kidventure Camp","STEM4Kids","Legarza Sports Camp","Spartans Sports Camp","Lifetime Activities Sunnyvale","Palo Alto Junior Museum Zoo","Children Discovery Museum San Jose","Super Safari Preschool Sunnyvale","preschool summer camp","toddler class summer","infant toddler program summer"],
  indoor:  ["children discovery museum","indoor playground kids","trampoline park kids","indoor rock climbing kids","laser tag kids","bowling kids","ice skating kids","YMCA indoor pool","arcade kids","escape room family","kids museum","indoor mini golf","roller skating kids","VR experience kids"],
  outdoor: ["petting zoo family","fruit picking kids","hiking family trail","nature camp outdoor","outdoor adventure kids"],
  weekend: ["weekend kids festival","Saturday family fun","Sunday kids event","farmers market family","community kids weekend"],
};

const TAB_GOOGLE = {
  free:    "park",
  paid:    "establishment|gym|camp|school",
  indoor:  "museum",
  outdoor: "park",
  weekend: "event_venue",
};

const TAB_TM = {
  free:    "family",
  paid:    "family",
  indoor:  "arts & theatre",
  outdoor: "family",
  weekend: "family",
};

const CITY_COORDS = {
  "Sunnyvale":     { lat: 37.3688,  lng: -122.0363 },
  "San Jose":      { lat: 37.3382,  lng: -121.8863 },
  "Cupertino":     { lat: 37.3230,  lng: -122.0322 },
  "Mountain View": { lat: 37.3861,  lng: -122.0839 },
  "Palo Alto":     { lat: 37.4419,  lng: -122.1430 },
  "Saratoga":      { lat: 37.2638,  lng: -122.0230 },
  "Fremont":       { lat: 37.5485,  lng: -121.9886 },
};


const HARDCODED_PAID = [
  // ── SUNNYVALE ──
  { id:"hc-sv-1",  city:"Sunnyvale", source:"google", name:"Camp Galileo Sunnyvale", desc:"Creative arts, STEM and outdoor adventure for K-8", address:"1500 Partridge Ave, Sunnyvale, CA 94087", phone:"(800) 854-3684", website:"https://www.galileo-camps.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Camp+Galileo+Sunnyvale" },
  { id:"hc-sv-2",  city:"Sunnyvale", source:"google", name:"El Camino YMCA Summer Camp", desc:"Day camp for kids at El Camino YMCA Sunnyvale", address:"1717 Pruneridge Ave, Sunnyvale, CA 94087", phone:"(408) 739-9622", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/El+Camino+YMCA+Sunnyvale" },
  { id:"hc-sv-3",  city:"Sunnyvale", source:"google", name:"Sunnyvale Community Center Kids Camp", desc:"Summer programs at Sunnyvale Community Center", address:"550 E Remington Dr, Sunnyvale, CA 94087", phone:"(408) 730-7350", website:"https://www.sunnyvale.ca.gov", image:"/festival.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Sunnyvale+Community+Center" },
  { id:"hc-sv-4",  city:"Sunnyvale", source:"google", name:"KidStrong Sunnyvale", desc:"Brain and body milestone classes for ages 1-11", address:"Sunnyvale, CA 94087", phone:null, website:"https://kidstrong.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/KidStrong+Sunnyvale" },
  { id:"hc-sv-5",  city:"Sunnyvale", source:"google", name:"Gymboree Play & Music Sunnyvale", desc:"Developmental play classes for infants and toddlers", address:"Sunnyvale, CA 94087", phone:null, website:"https://www.gymboree.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Gymboree+Sunnyvale" },
  { id:"hc-sv-6",  city:"Sunnyvale", source:"google", name:"Snapology of Sunnyvale", desc:"LEGO, robotics and STEM camps for kids 2-14", address:"Sunnyvale, CA 94087", phone:null, website:"https://www.snapology.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Snapology+Sunnyvale" },
  { id:"hc-sv-7",  city:"Sunnyvale", source:"google", name:"Steve & Kate's Camp Sunnyvale", desc:"Self-directed summer camp with tech, sports, baking", address:"Sunnyvale, CA 94087", phone:null, website:"https://steveandkates.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Steve+Kates+Camp+Sunnyvale" },
  { id:"hc-sv-8",  city:"Sunnyvale", source:"google", name:"Sunnyvale Alliance Soccer Club Camp", desc:"Soccer camp for all skill levels ages 4-14", address:"Sunnyvale, CA 94087", phone:null, website:"https://www.sasc-soccer.org", image:"/sports.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Sunnyvale+Alliance+Soccer" },
  { id:"hc-sv-9",  city:"Sunnyvale", source:"google", name:"Lifetime Activities Sunnyvale", desc:"Tennis, pickleball and sports classes for kids and teens", address:"Sunnyvale, CA 94087", phone:null, website:"https://www.lifetimeactivities.com", image:"/sports.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Lifetime+Activities+Sunnyvale" },
  { id:"hc-sv-10", city:"Sunnyvale", source:"google", name:"Integem AI & AR Camp Sunnyvale", desc:"Augmented reality and AI coding camp for ages 7-18", address:"Sunnyvale, CA 94087", phone:null, website:"https://integem.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-16", endDate:"2026-08-15", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Integem+AI+Camp+Sunnyvale" },
  { id:"hc-sv-11", city:"Sunnyvale", source:"google", name:"My First Ballet Sunnyvale", desc:"Ballet classes for toddlers and preschoolers", address:"Sunnyvale, CA 94087", phone:null, website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1"], a11y:[], mapsUrl:"https://www.google.com/maps/search/ballet+kids+Sunnyvale" },
  { id:"hc-sv-12", city:"Sunnyvale", source:"google", name:"Safari Kid Sunnyvale", desc:"Preschool summer program with Montessori approach", address:"Sunnyvale, CA 94087", phone:null, website:"https://safarikid.com", image:"/camp.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Safari+Kid+Sunnyvale" },

  // ── SAN JOSE ──
  { id:"hc-sj-1", city:"San Jose", source:"google", name:"YMCA of Silicon Valley - San Jose Camp", desc:"Day camp programs at San Jose YMCA", address:"San Jose, CA 95110", phone:"(408) 351-6400", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/YMCA+San+Jose" },
  { id:"hc-sj-2", city:"San Jose", source:"google", name:"San Jose Community Center Summer Camp", desc:"City of San Jose summer programs for kids", address:"San Jose, CA 95110", phone:"(408) 535-3500", website:"https://www.sanjoseca.gov", image:"/festival.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/San+Jose+Community+Center" },
  { id:"hc-sj-3", city:"San Jose", source:"google", name:"Club Scikidz Silicon Valley", desc:"Science and STEM summer camps for K-8", address:"San Jose, CA 95110", phone:null, website:"https://www.scikidz.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Club+Scikidz+San+Jose" },
  { id:"hc-sj-4", city:"San Jose", source:"google", name:"Children's Discovery Museum San Jose", desc:"Hands-on learning museum for kids of all ages", address:"180 Woz Way, San Jose, CA 95110", phone:"(408) 298-5437", website:"https://www.cdm.org", image:"/museum.jpg", isFree:false, price:"$17 admission", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Children+Discovery+Museum+San+Jose" },
  { id:"hc-sj-5", city:"San Jose", source:"google", name:"Galileo Camp San Jose", desc:"Creative arts, STEM and outdoor adventure for K-8", address:"San Jose, CA 95110", phone:"(800) 854-3684", website:"https://www.galileo-camps.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Galileo+Camp+San+Jose" },

  // ── CUPERTINO ──
  { id:"hc-cu-1", city:"Cupertino", source:"google", name:"Cupertino Community Center Summer Camp", desc:"City of Cupertino summer programs for kids", address:"21251 Stevens Creek Blvd, Cupertino, CA 95014", phone:"(408) 777-3120", website:"https://www.cupertino.org", image:"/festival.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Cupertino+Community+Center" },
  { id:"hc-cu-2", city:"Cupertino", source:"google", name:"YMCA Cupertino Summer Camp", desc:"Day camp at Cupertino YMCA location", address:"Cupertino, CA 95014", phone:"(408) 739-9622", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/YMCA+Cupertino" },
  { id:"hc-cu-3", city:"Cupertino", source:"google", name:"Galileo Camp Cupertino", desc:"Creative arts, STEM and outdoor adventure for K-8", address:"Cupertino, CA 95014", phone:"(800) 854-3684", website:"https://www.galileo-camps.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Galileo+Camp+Cupertino" },
  { id:"hc-cu-4", city:"Cupertino", source:"google", name:"STEM4Kids Cupertino", desc:"Hands-on STEM classes for school-age kids", address:"Cupertino, CA 95014", phone:null, website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/STEM4Kids+Cupertino" },
  { id:"hc-cu-5", city:"Cupertino", source:"google", name:"Lifetime Activities Cupertino", desc:"Tennis and sports classes for kids and teens", address:"Cupertino, CA 95014", phone:null, website:"https://www.lifetimeactivities.com", image:"/sports.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Lifetime+Activities+Cupertino" },

  // ── MOUNTAIN VIEW ──
  { id:"hc-mv-1", city:"Mountain View", source:"google", name:"Mountain View Community Center Summer Camp", desc:"City of Mountain View summer programs for kids", address:"201 S Rengstorff Ave, Mountain View, CA 94040", phone:"(650) 903-6331", website:"https://www.mountainview.gov", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Mountain+View+Community+Center" },
  { id:"hc-mv-2", city:"Mountain View", source:"google", name:"Northwest YMCA Summer Camp Mountain View", desc:"Day camp at Northwest YMCA Mountain View", address:"YMCA Mountain View, CA 94040", phone:"(650) 903-0500", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Northwest+YMCA+Mountain+View" },
  { id:"hc-mv-3", city:"Mountain View", source:"google", name:"The Little Gym Mountain View", desc:"Gymnastics and play programs for toddlers and kids", address:"Mountain View, CA 94040", phone:null, website:"https://www.thelittlegym.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Little+Gym+Mountain+View" },
  { id:"hc-mv-4", city:"Mountain View", source:"google", name:"Coach Ken Soccer Academy Mountain View", desc:"Youth soccer training for ages 3-14", address:"Mountain View, CA 94040", phone:null, website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Coach+Ken+Soccer+Mountain+View" },

  // ── PALO ALTO ──
  { id:"hc-pa-1", city:"Palo Alto", source:"google", name:"Palo Alto Community Center Summer Camp", desc:"City of Palo Alto summer programs for kids", address:"450 Bryant St, Palo Alto, CA 94301", phone:"(650) 329-2261", website:"https://www.cityofpaloalto.org", image:"/festival.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Palo+Alto+Community+Center" },
  { id:"hc-pa-2", city:"Palo Alto", source:"google", name:"YMCA Palo Alto Summer Camp", desc:"Day camp at Palo Alto YMCA location", address:"Palo Alto, CA 94301", phone:"(650) 326-9622", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/YMCA+Palo+Alto" },
  { id:"hc-pa-3", city:"Palo Alto", source:"google", name:"iD Tech Camps - Stanford University", desc:"Coding, game design, AI, robotics for ages 7-19", address:"Stanford University, Palo Alto, CA 94305", phone:"(888) 709-8324", website:"https://www.idtech.com", image:"/park.jpg", isFree:false, price:"From $999/week", stars:5, startDate:"2026-06-16", endDate:"2026-08-15", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Stanford+University+Palo+Alto" },
  { id:"hc-pa-4", city:"Palo Alto", source:"google", name:"Palo Alto Junior Museum and Zoo", desc:"Interactive museum and zoo for young children", address:"1451 Middlefield Rd, Palo Alto, CA 94301", phone:"(650) 329-2111", website:"https://www.pajmz.org", image:"/museum.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Palo+Alto+Junior+Museum+Zoo" },
  { id:"hc-pa-5", city:"Palo Alto", source:"google", name:"Palo Alto Junior Intermediate Tennis Camp", desc:"Tennis camp for juniors in Palo Alto", address:"Palo Alto, CA 94301", phone:null, website:null, image:"/sports.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Palo+Alto+Junior+Tennis+Camp" },

  // ── SARATOGA ──
  { id:"hc-sa-1", city:"Saratoga", source:"google", name:"Saratoga Community Center Summer Camp", desc:"City of Saratoga summer programs for kids", address:"19655 Allendale Ave, Saratoga, CA 95070", phone:"(408) 868-1249", website:"https://www.saratoga.ca.us", image:"/festival.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Saratoga+Community+Center" },
  { id:"hc-sa-2", city:"Saratoga", source:"google", name:"YMCA Saratoga Summer Camp", desc:"Day camp at Saratoga YMCA location", address:"Saratoga, CA 95070", phone:"(408) 739-9622", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/YMCA+Saratoga" },
  { id:"hc-sa-3", city:"Saratoga", source:"google", name:"Galileo Camp Saratoga", desc:"Creative arts, STEM and outdoor adventure for K-8", address:"Saratoga, CA 95070", phone:"(800) 854-3684", website:"https://www.galileo-camps.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Galileo+Camp+Saratoga" },
  { id:"hc-sa-4", city:"Saratoga", source:"google", name:"Nature Art Summer Camp Saratoga", desc:"Outdoor nature and art summer camp for kids", address:"Saratoga, CA 95070", phone:null, website:null, image:"/trail.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/nature+art+camp+Saratoga" },
];

const HARDCODED_INDOOR = [
  // ── SUNNYVALE ──
  { id:"hi-sv-1", city:"Sunnyvale", source:"google", name:"Lifetime Activities Sunnyvale Indoor Pool", desc:"Indoor swimming lessons and water play for all ages", address:"Sunnyvale, CA 94087", phone:null, website:"https://www.lifetimeactivities.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Lifetime+Activities+Sunnyvale" },
  { id:"hi-sv-2", city:"Sunnyvale", source:"google", name:"Snapology Sunnyvale Indoor STEM", desc:"Indoor LEGO and robotics workshops for kids", address:"Sunnyvale, CA 94087", phone:null, website:"https://www.snapology.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Snapology+Sunnyvale" },
  { id:"hi-sv-3", city:"Sunnyvale", source:"google", name:"Sunnyvale Public Library Story Time", desc:"Free indoor storytime and reading programs for toddlers", address:"665 W Olive Ave, Sunnyvale, CA 94086", phone:"(408) 730-7300", website:"https://www.sunnyvale.ca.gov/library", image:"/library.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Sunnyvale+Public+Library" },
  { id:"hi-sv-4", city:"Sunnyvale", source:"google", name:"ArtCircle Studio Sunnyvale", desc:"Indoor art classes and workshops for kids of all ages", address:"542 S Murphy Ave, Sunnyvale, CA 94086", phone:"(408) 736-2019", website:"http://artcircle.studio", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/ArtCircle+Studio+Sunnyvale" },
  { id:"hi-sv-5", city:"Sunnyvale", source:"google", name:"We Rock the Spectrum Sunnyvale", desc:"Sensory-safe indoor gym with ziplines and hammocks for all abilities", address:"Sunnyvale, CA 94087", phone:null, website:"https://werockthespectrum.com", image:"/festival.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🧠 Sensory-Safe","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/We+Rock+Spectrum+Sunnyvale" },
  { id:"hi-sv-6", city:"Sunnyvale", source:"google", name:"El Camino YMCA Indoor Programs", desc:"Indoor pool, gym and kids classes at El Camino YMCA", address:"1717 Pruneridge Ave, Sunnyvale, CA 94087", phone:"(408) 739-9622", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/El+Camino+YMCA+Sunnyvale" },
  { id:"hi-sv-7", city:"Sunnyvale", source:"google", name:"Winchester Mystery House", image:"/festival.jpg", desc:"Tour 110 rooms of architectural oddities — doors to nowhere, upside-down stairs", address:"525 S Winchester Blvd, San Jose, CA 95128", phone:"(408) 247-2101", website:"https://www.winchestermysteryhouse.com", isFree:false, price:"From $29", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Winchester+Mystery+House" },
  { id:"hi-sv-8", city:"Sunnyvale", source:"google", name:"Altitude Trampoline Park Sunnyvale", desc:"Massive indoor trampoline park with toddler zones and foam pits", address:"Sunnyvale, CA 94087", phone:null, website:"https://www.altitudetrampoline.com", image:"/park.jpg", isFree:false, price:"From $15", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Altitude+Trampoline+Park+Sunnyvale" },

  // ── SAN JOSE ──
  { id:"hi-sj-1", city:"San Jose", source:"google", name:"Children's Discovery Museum San Jose", desc:"Hands-on learning museum for kids of all ages", address:"180 Woz Way, San Jose, CA 95110", phone:"(408) 298-5437", website:"https://www.cdm.org", image:"/museum.jpg", isFree:false, price:"$17 admission", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Children+Discovery+Museum+San+Jose" },
  { id:"hi-sj-2", city:"San Jose", source:"google", name:"The Tech Interactive San Jose", desc:"Science and technology museum with AI Dream Garden exhibits", address:"201 S Market St, San Jose, CA 95113", phone:"(408) 294-8324", website:"https://www.thetech.org", image:"/park.jpg", isFree:false, price:"$25 admission", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/The+Tech+Interactive+San+Jose" },
  { id:"hi-sj-3", city:"San Jose", source:"google", name:"Ice Centre of San Jose", desc:"Indoor ice skating rink for all ages and skill levels", address:"1500 S 10th St, San Jose, CA 95112", phone:"(408) 279-6000", website:"https://icecenter.com", image:"/park.jpg", isFree:false, price:"From $12", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Ice+Centre+San+Jose" },
  { id:"hi-sj-4", city:"San Jose", source:"google", name:"Winchester Mystery House San Jose", image:"/festival.jpg", desc:"110 rooms of architectural oddities — doors to nowhere, stairs to ceiling", address:"525 S Winchester Blvd, San Jose, CA 95128", phone:"(408) 247-2101", website:"https://www.winchestermysteryhouse.com", isFree:false, price:"From $29", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Winchester+Mystery+House+San+Jose" },
  { id:"hi-sj-5", city:"San Jose", source:"google", name:"Lost Worlds Funtropolous San Jose", desc:"Indoor Bazooka Ball, laser tag and climbing adventure", address:"San Jose, CA", phone:null, website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Lost+Worlds+Funtropolous+San+Jose" },
  { id:"hi-sj-6", city:"San Jose", source:"google", name:"Color Me Mine San Jose", desc:"Paint-your-own pottery studio — drop in any time", address:"San Jose, CA 95110", phone:null, website:"https://www.colormemine.com", image:"/park.jpg", isFree:false, price:"Studio fee + pottery", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Color+Me+Mine+San+Jose" },
  { id:"hi-sj-7", city:"San Jose", source:"google", name:"YMCA Silicon Valley San Jose Indoor", desc:"Indoor pool, gym and kids programs at San Jose YMCA", address:"San Jose, CA 95110", phone:"(408) 351-6400", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/YMCA+San+Jose" },

  // ── MOUNTAIN VIEW ──
  { id:"hi-mv-1", city:"Mountain View", source:"google", name:"Mountain View Aquatics Center", desc:"One of Bay Area's best new indoor aquatics centers for kids", address:"201 Rengstorff Ave, Mountain View, CA 94040", phone:"(650) 903-6331", website:"https://www.mountainview.gov", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Mountain+View+Aquatics+Center" },
  { id:"hi-mv-2", city:"Mountain View", source:"google", name:"The Little Gym Mountain View", desc:"Indoor gymnastics and movement for toddlers and kids", address:"Mountain View, CA 94040", phone:null, website:"https://www.thelittlegym.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Little+Gym+Mountain+View" },
  { id:"hi-mv-3", city:"Mountain View", source:"google", name:"Northwest YMCA Mountain View Indoor", desc:"Indoor pool and kids programs at Northwest YMCA", address:"Mountain View, CA 94040", phone:"(650) 903-0500", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Northwest+YMCA+Mountain+View" },
  { id:"hi-mv-4", city:"Mountain View", source:"google", name:"Mountain View Public Library Kids Programs", desc:"Indoor storytime and reading programs for toddlers and kids", address:"585 Franklin St, Mountain View, CA 94041", phone:"(650) 903-6337", website:"https://www.mountainview.gov/library", image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Mountain+View+Library" },

  // ── CUPERTINO ──
  { id:"hi-cu-1", city:"Cupertino", source:"google", name:"Cupertino Community Center Indoor Pool", desc:"Indoor swim lessons and aquatics programs for kids", address:"21251 Stevens Creek Blvd, Cupertino, CA 95014", phone:"(408) 777-3120", website:"https://www.cupertino.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Cupertino+Community+Center+Pool" },
  { id:"hi-cu-2", city:"Cupertino", source:"google", name:"YMCA Cupertino Indoor Programs", desc:"Indoor pool, gym and kids classes at Cupertino YMCA", address:"Cupertino, CA 95014", phone:"(408) 739-9622", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/YMCA+Cupertino" },
  { id:"hi-cu-3", city:"Cupertino", source:"google", name:"Cupertino Library Indoor Kids Programs", desc:"Free indoor storytime and summer reading at Cupertino Library", address:"10800 Torre Ave, Cupertino, CA 95014", phone:"(408) 446-1677", website:"https://www.sccld.org", image:"/library.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Cupertino+Library" },

  // ── PALO ALTO ──
  { id:"hi-pa-1", city:"Palo Alto", source:"google", name:"Rinconada Pool Palo Alto", desc:"Indoor and outdoor pool with swim lessons for all ages", address:"777 Embarcadero Rd, Palo Alto, CA 94301", phone:"(650) 463-4930", website:"https://www.cityofpaloalto.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Rinconada+Pool+Palo+Alto" },
  { id:"hi-pa-2", city:"Palo Alto", source:"google", name:"Palo Alto Junior Museum and Zoo", desc:"Interactive museum with Rainbow Tunnel light and optics exhibit", address:"1451 Middlefield Rd, Palo Alto, CA 94301", phone:"(650) 329-2111", website:"https://www.pajmz.org", image:"/park.jpg", isFree:false, price:"Free admission", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Palo+Alto+Junior+Museum+Zoo" },
  { id:"hi-pa-3", city:"Palo Alto", source:"google", name:"YMCA Palo Alto Indoor Programs", desc:"Indoor pool, gym and kids classes at Palo Alto YMCA", address:"Palo Alto, CA 94301", phone:"(650) 326-9622", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/YMCA+Palo+Alto" },
  { id:"hi-pa-4", city:"Palo Alto", source:"google", name:"Palo Alto Main Library Kids Programs", desc:"Free indoor storytime and summer reading programs", address:"1213 Newell Rd, Palo Alto, CA 94303", phone:"(650) 329-2436", website:"https://www.cityofpaloalto.org/library", image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Palo+Alto+Main+Library" },

  // ── SARATOGA ──
  { id:"hi-sa-1", city:"Saratoga", source:"google", name:"Saratoga Library Indoor Programs", desc:"Indoor storytime, reading and kids programs at Saratoga Library", address:"13650 Saratoga Ave, Saratoga, CA 95070", phone:"(408) 867-6126", website:"https://www.sccld.org", image:"/library.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Saratoga+Library" },
  { id:"hi-sa-2", city:"Saratoga", source:"google", name:"YMCA Saratoga Indoor Programs", desc:"Indoor pool and kids classes at Saratoga YMCA", address:"Saratoga, CA 95070", phone:"(408) 739-9622", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/YMCA+Saratoga" },
  // ── EXTRA CUPERTINO INDOOR ──
  { id:"hi-cu-4", city:"Cupertino", source:"google", name:"Snapology Cupertino Indoor STEM", desc:"Indoor LEGO and robotics workshops for kids", address:"Cupertino, CA 95014", phone:null, website:"https://www.snapology.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Snapology+Cupertino" },
  { id:"hi-cu-5", city:"Cupertino", source:"google", name:"Color Me Mine Cupertino", desc:"Paint-your-own pottery studio — drop in any time", address:"Cupertino, CA 95014", phone:null, website:"https://www.colormemine.com", image:"/park.jpg", isFree:false, price:"Studio fee + pottery", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Color+Me+Mine+Cupertino" },
  { id:"hi-cu-6", city:"Cupertino", source:"google", name:"Blackberry Farm Indoor Recreation Cupertino", desc:"Indoor recreation and kids programs at Blackberry Farm", address:"21979 San Fernando Ave, Cupertino, CA 95014", phone:"(408) 777-3140", website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Blackberry+Farm+Cupertino" },
  // ── EXTRA PALO ALTO INDOOR ──
  { id:"hi-pa-5", city:"Palo Alto", source:"google", name:"Color Me Mine Palo Alto", desc:"Paint-your-own pottery — creative drop-in fun for kids", address:"Palo Alto, CA 94301", phone:null, website:"https://www.colormemine.com", image:"/park.jpg", isFree:false, price:"Studio fee + pottery", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Color+Me+Mine+Palo+Alto" },
  { id:"hi-pa-6", city:"Palo Alto", source:"google", name:"Snapology Palo Alto Indoor STEM", desc:"Indoor LEGO robotics and STEM camps for kids", address:"Palo Alto, CA 94301", phone:null, website:"https://www.snapology.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Snapology+Palo+Alto" },
  { id:"hi-pa-7", city:"Palo Alto", source:"google", name:"Gymnastics Zone Palo Alto", desc:"Indoor gymnastics classes for kids of all levels", address:"Palo Alto, CA 94301", phone:null, website:null, image:"/festival.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Gymnastics+Palo+Alto" },
  // ── EXTRA SARATOGA INDOOR ──
  { id:"hi-sa-4", city:"Saratoga", source:"google", name:"Hakone Gardens Indoor Exhibit Saratoga", desc:"Indoor Japanese art and cultural exhibit at Hakone Gardens", address:"21000 Big Basin Way, Saratoga, CA 95070", phone:"(408) 741-4994", website:"https://www.hakone.com", image:"/park.jpg", isFree:false, price:"$10 adults, kids free", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Hakone+Gardens+Saratoga" },
  { id:"hi-sa-5", city:"Saratoga", source:"google", name:"Color Me Mine Saratoga", desc:"Paint-your-own pottery studio near Saratoga", address:"Saratoga, CA 95070", phone:null, website:"https://www.colormemine.com", image:"/park.jpg", isFree:false, price:"Studio fee + pottery", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Color+Me+Mine+Saratoga" },
  { id:"hi-sa-6", city:"Saratoga", source:"google", name:"Saratoga Recreation Center Indoor Pool", desc:"Indoor pool and swim lessons at Saratoga Recreation Center", address:"19655 Allendale Ave, Saratoga, CA 95070", phone:"(408) 868-1249", website:"https://www.saratoga.ca.us", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Saratoga+Recreation+Center" },
  { id:"hi-sa-3", city:"Saratoga", source:"google", name:"Saratoga Community Center Indoor Classes", desc:"Indoor kids classes and programs at Saratoga Community Center", address:"19655 Allendale Ave, Saratoga, CA 95070", phone:"(408) 868-1249", website:"https://www.saratoga.ca.us", image:"/festival.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Saratoga+Community+Center" },
];

const HARDCODED_OUTDOOR = [
  // ── SUNNYVALE ──
  { id:"ho-sv-1", city:"Sunnyvale", source:"google", name:"Sunnyvale Splashpad at Las Palmas Park", desc:"Parent-and-tot splash sessions and water play for toddlers", address:"850 Russet Dr, Sunnyvale, CA 94087", phone:"(408) 730-7506", website:"https://www.sunnyvale.ca.gov", image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Las+Palmas+Park+Sunnyvale" },
  { id:"ho-sv-2", city:"Sunnyvale", source:"google", name:"Sunnyvale Alliance Soccer Club Outdoor Camp", desc:"Outdoor soccer camp for all skill levels ages 4-14", address:"Sunnyvale, CA 94087", phone:null, website:"https://www.sasc-soccer.org", image:"/sports.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Sunnyvale+Alliance+Soccer" },
  { id:"ho-sv-3", city:"Sunnyvale", source:"google", name:"Magical Bridge Playground Sunnyvale", image:"/festival.jpg", desc:"Inclusive sensory playground with accessible zones for all abilities", address:"Sunnyvale, CA 94087", phone:null, website:null, isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🧠 Sensory-Safe","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Magical+Bridge+Playground+Sunnyvale" },
  { id:"ho-sv-4", city:"Sunnyvale", source:"google", name:"Coyote Creek Parkway Nature Walk Sunnyvale", image:"/festival.jpg", desc:"Shaded nature walk along Coyote Creek — great for strollers", address:"Sunnyvale, CA 94087", phone:null, website:null, isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Coyote+Creek+Parkway+Sunnyvale" },

  // ── SAN JOSE ──
  { id:"ho-sj-1", city:"San Jose", source:"google", name:"Happy Hollow Park and Zoo San Jose", desc:"Family zoo and amusement park with rides for young kids", address:"1300 Senter Rd, San Jose, CA 95112", phone:"(408) 794-6400", website:"https://www.happyhollow.org", image:"/park.jpg", isFree:false, price:"From $12", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Happy+Hollow+Park+Zoo+San+Jose" },
  { id:"ho-sj-2", city:"San Jose", source:"google", name:"Alum Rock Park Creekside Exploration", desc:"Shaded creekside trails and nature exploration for families", address:"16240 Alum Rock Ave, San Jose, CA 95127", phone:"(408) 259-5477", website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Alum+Rock+Park+San+Jose" },
  { id:"ho-sj-3", city:"San Jose", source:"google", name:"Vasona Park Train Ride Los Gatos", desc:"Narrow-gauge heritage train ride through shaded park", address:"333 Blossom Hill Rd, Los Gatos, CA 95032", phone:"(408) 356-2729", website:null, image:"/park.jpg", isFree:false, price:"$3 train ride", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Vasona+Park+Los+Gatos" },
  { id:"ho-sj-4", city:"San Jose", source:"google", name:"Gilroy Gardens Family Theme Park", desc:"Family theme park with rides, splash zones and gardens", address:"3050 Hecker Pass Hwy, Gilroy, CA 95020", phone:"(408) 840-7100", website:"https://www.gilroygardens.org", image:"/park.jpg", isFree:false, price:"From $40", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Gilroy+Gardens" },
  { id:"ho-sj-5", city:"San Jose", source:"google", name:"Blackberry Farm Pool San Jose", desc:"Outdoor pool and recreation area for families", address:"21979 San Fernando Ave, Cupertino, CA 95014", phone:"(408) 777-3140", website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Blackberry+Farm+Cupertino" },

  // ── MOUNTAIN VIEW ──
  { id:"ho-mv-1", city:"Mountain View", source:"google", name:"Shoreline Lake Pedal Boating", desc:"Pedal boat rentals on Shoreline Lake — great for families", address:"3160 N Shoreline Blvd, Mountain View, CA 94043", phone:"(650) 903-6073", website:null, image:"/festival.jpg", isFree:false, price:"From $20/hr", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Shoreline+Lake+Mountain+View" },
  { id:"ho-mv-2", city:"Mountain View", source:"google", name:"Shoreline Lake Duck Watching", desc:"Stroller-friendly paths for duck watching and nature walks", address:"3160 N Shoreline Blvd, Mountain View, CA 94043", phone:null, website:null, image:"/trail.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Shoreline+Lake+Mountain+View" },
  { id:"ho-mv-3", city:"Mountain View", source:"google", name:"Deer Hollow Farm Mountain View", desc:"Free self-guided farm tours with animals for young children", address:"27455 Christi Ln, Mountain View, CA 94040", phone:"(650) 903-6430", website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Deer+Hollow+Farm+Mountain+View" },
  { id:"ho-mv-4", city:"Mountain View", source:"google", name:"Vasona Lake Kayaking Mountain View", desc:"Kayaking and canoeing on Vasona Lake for families", address:"Mountain View, CA 94040", phone:null, website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Vasona+Lake+Mountain+View" },

  // ── CUPERTINO ──
  { id:"ho-cu-1", city:"Cupertino", source:"google", name:"Blackberry Farm Outdoor Pool Cupertino", desc:"Outdoor pool and picnic recreation area for Cupertino families", address:"21979 San Fernando Ave, Cupertino, CA 95014", phone:"(408) 777-3140", website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Blackberry+Farm+Cupertino" },
  { id:"ho-cu-2", city:"Cupertino", source:"google", name:"Linda Vista Park Cupertino", desc:"Outdoor park with hiking trails and nature walks for families", address:"21251 Stevens Creek Blvd, Cupertino, CA 95014", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Linda+Vista+Park+Cupertino" },
  { id:"ho-cu-3", city:"Cupertino", source:"google", name:"Hidden Villa Farm Animal Sightseeing", desc:"Farm animal sightseeing and nature trails for toddlers and kids", address:"26870 Moody Rd, Los Altos Hills, CA 94022", phone:"(650) 949-8650", website:"https://www.hiddenvilla.org", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Hidden+Villa+Farm+Los+Altos" },

  // ── PALO ALTO ──
  { id:"ho-pa-1", city:"Palo Alto", source:"google", name:"Elizabeth Gamble Garden Explorations", desc:"Free garden explorations with walking trails for families", address:"1431 Waverley St, Palo Alto, CA 94301", phone:"(650) 329-1356", website:"https://www.gamblegarden.org", image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Elizabeth+Gamble+Garden+Palo+Alto" },
  { id:"ho-pa-2", city:"Palo Alto", source:"google", name:"Palo Alto Junior Museum Zoo Outdoor", desc:"Outdoor zoo with animal exhibits for young children", address:"1451 Middlefield Rd, Palo Alto, CA 94301", phone:"(650) 329-2111", website:"https://www.pajmz.org", image:"/museum.jpg", isFree:false, price:"Free admission", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Palo+Alto+Junior+Museum+Zoo" },
  { id:"ho-pa-3", city:"Palo Alto", source:"google", name:"Palo Alto Junior Tennis Camp Outdoor", desc:"Outdoor junior tennis camp for kids and teens in Palo Alto", address:"Palo Alto, CA 94301", phone:null, website:null, image:"/sports.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Palo+Alto+Junior+Tennis" },
  { id:"ho-pa-4", city:"Palo Alto", source:"google", name:"Webb Ranch Berry Picking Palo Alto", desc:"Seasonal berry and fruit picking for families", address:"1901 Old Page Mill Rd, Palo Alto, CA 94304", phone:null, website:null, image:"/park.jpg", isFree:false, price:"Pay by weight", stars:5, startDate:"2026-06-01", endDate:"2026-08-15", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Webb+Ranch+Palo+Alto" },

  // ── SARATOGA ──
  { id:"ho-sa-1", city:"Saratoga", source:"google", name:"Uvas Canyon Waterfall Loop Hike", desc:"Family hike through shaded canyon with multiple waterfalls", address:"Uvas Canyon County Park, Saratoga, CA 95070", phone:null, website:null, image:"/trail.jpg", isFree:false, price:"$6 parking", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Uvas+Canyon+Park+Saratoga" },
  { id:"ho-sa-2", city:"Saratoga", source:"google", name:"Saratoga Creek Nature Walk", desc:"Shaded creek trail walk perfect for strollers and toddlers", address:"Saratoga, CA 95070", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Saratoga+Creek+Trail" },
  { id:"ho-sa-3", city:"Saratoga", source:"google", name:"Hakone Gardens Saratoga", desc:"Japanese garden with ponds and peaceful nature trails for families", address:"21000 Big Basin Way, Saratoga, CA 95070", phone:"(408) 741-4994", website:"https://www.hakone.com", image:"/park.jpg", isFree:false, price:"$10 adults, kids free", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Hakone+Gardens+Saratoga" },
  { id:"ho-sa-4", city:"Saratoga", source:"google", name:"Lazy H Ranch Pony Rides Saratoga", desc:"Pony rides and farm animal experiences for toddlers and preschoolers", address:"Saratoga, CA 95070", phone:null, website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Lazy+H+Ranch+Saratoga" },
];



function seasonStart() { return `${new Date().getFullYear()}-06-01T00:00:00Z`; }
function seasonEnd()   { return `${new Date().getFullYear()}-08-31T23:59:59Z`; }

function detectAges(text = "") {
  const t = text.toLowerCase();
  const map = [
    { id:"0", w:["infant","baby","toddler","stroller","ages 0","ages 1","ages 2","gymboree","kidstrong","little gym","parent child","0-2","crawlers","early walkers"] },
    { id:"1", w:["preschool","pre-k","ages 3","ages 4","ages 5","junior","safari kid","super safari","3-5","genius kids"] },
    { id:"2", w:["school age","kids","children","stem","coding","cooking","ages 6","ages 7","ages 8","ages 9","ages 10","ages 11","ages 12","snapology","kidventure","galileo","legarza","bronco"] },
    { id:"3", w:["teen","teenager","youth","volunteer","ages 13","ages 14","ages 15","ages 16","ages 17","ages 18","iD tech","integem","spartan","nike camp","model united nations","idyllwild"] },
  ];
  const out = map.filter(b => b.w.some(w => t.includes(w))).map(b => b.id);
  return out.length ? out : ["1","2","3"];
}

function detectA11y(text = "") {
  const t = text.toLowerCase();
  const tags = [];
  if (["wheelchair","accessible","ada"].some(k => t.includes(k))) tags.push("♿ Wheelchair");
  if (["stroller","baby","toddler"].some(k => t.includes(k)))     tags.push("🍼 Stroller OK");
  if (["sensory","autism","special needs"].some(k => t.includes(k))) tags.push("🧠 Sensory-Safe");
  return tags;
}

function isWeekend(dateStr) {
  if (!dateStr) return true;
  const day = new Date(dateStr).getDay();
  return day === 0 || day === 6;
}

// ── Eventbrite ────────────────────────────────────────────
async function fetchEventbrite(tab, city, keywords) {
  const token = process.env.EVENTBRITE_API_KEY;
  if (!token) return [];
  const results = [];

  for (const kw of keywords.slice(0, 8)) {
    try {
      const p = new URLSearchParams({
        "location.address":       `${city}, CA`,
        "location.within":        "15km",
        "q":                      kw,
        "start_date.range_start": seasonStart(),
        "start_date.range_end":   seasonEnd(),
        "expand":                 "venue,ticket_classes",
        "page_size":              "10",
        ...(tab === "free" ? { price: "free" } : {}),
      });
      const r = await fetch(`https://www.eventbriteapi.com/v3/events/search/?${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) continue;
      const d = await r.json();
      for (const ev of (d.events || [])) {
        const v  = ev.venue || {};
        const a  = v.address || {};
        const tk = (ev.ticket_classes || [])[0] || {};
        const isFree = ev.is_free || tk.free || false;
        results.push({
          id:        `eb-${ev.id}`,
          source:    "eventbrite",
          name:      ev.name?.text || "Event",
          desc:      (ev.description?.text || "").slice(0, 200),
          address:   [a.address_1, a.city, a.region].filter(Boolean).join(", "),
          phone:     null,
          website:   ev.url,
          image:     ev.logo?.url || null,
          isFree,
          price:     isFree ? "$0 FREE" : (tk.cost?.display || "See site"),
          stars:     4,
          startDate: ev.start?.local || null,
          endDate:   ev.end?.local   || null,
          ages:      detectAges(ev.name?.text + " " + (ev.description?.text || "")),
          a11y:      detectA11y(ev.name?.text || ""),
          mapsUrl:   a.address_1 ? `https://www.google.com/maps/search/${encodeURIComponent(a.address_1 + " " + (a.city||""))}` : null,
        });
      }
    } catch (e) { console.warn("Eventbrite:", e.message); }
  }
  return results;
}

// ── Google Places ─────────────────────────────────────────
async function fetchGoogle(tab, city, coords, keywords) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return [];
  const results = [];

  for (const kw of keywords.slice(0, 4)) {
    try {
      const p = new URLSearchParams({
        query: `${kw} ${city} CA`,
        key,
        type:  TAB_GOOGLE[tab] || "establishment",
        ...(coords ? { location: `${coords.lat},${coords.lng}`, radius: "8000" } : {}),
      });
      const r  = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${p}`);
      const d  = await r.json();
      for (const pl of (d.results || []).slice(0, 4)) {
        if (pl.rating && pl.rating < 4.0) continue;
        // Skip results not in the requested city
        const addr = (pl.formatted_address || "").toLowerCase();
        const cityLower = city.toLowerCase();
        if (!addr.includes(cityLower) && !addr.includes(cityLower.split(" ")[0])) continue;
        // Get phone + hours
        let det = {};
        try {
          const dp = new URLSearchParams({ place_id: pl.place_id, fields: "formatted_phone_number,opening_hours,website", key });
          const dr = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${dp}`);
          const dd = await dr.json();
          det = dd.result || {};
        } catch {}
        const loc = pl.geometry?.location || {};
        const photoRef = (pl.photos || [])[0]?.photo_reference;
        results.push({
          id:        `gp-${pl.place_id}`,
          source:    "google",
          name:      pl.name,
          desc:      (pl.types || []).slice(0, 3).join(", "),
          address:   pl.formatted_address || "",
          phone:     det.formatted_phone_number || null,
          website:   det.website || null,
          image:     photoRef ? `/park.jpg` : "/park.jpg",
          isFree:    tab === "free",
          price:     tab === "free" ? "$0 FREE" : "See site",
          stars:     pl.rating ? Math.round(pl.rating) : 4,
          startDate: null,
          endDate:   null,
          hours:     det.opening_hours?.weekday_text || null,
          ages:      detectAges(pl.name + " " + (pl.types || []).join(" ")),
          a11y:      detectA11y(pl.name),
          mapsUrl:   `https://www.google.com/maps/place/?q=place_id:${pl.place_id}`,
        });
      }
    } catch (e) { console.warn("Google Places:", e.message); }
  }
  return results;
}

// ── Ticketmaster ──────────────────────────────────────────
async function fetchTicketmaster(tab, city, coords) {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) return [];
  try {
    const p = new URLSearchParams({
      apikey:             key,
      city,
      stateCode:          "CA",
      classificationName: "family",
      keyword:            "summer camp kids STEM coding art ballet robotics YMCA class children youth",
      startDateTime:      seasonStart(),
      endDateTime:        seasonEnd(),
      size:               "20",
      sort:               "relevance,desc",
      ...(coords ? { latlong: `${coords.lat},${coords.lng}`, radius: "15", unit: "miles" } : {}),
    });
    const r = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${p}`);
    if (!r.ok) return [];
    const d = await r.json();
    return (d._embedded?.events || []).map(ev => {
      const v    = (ev._embedded?.venues || [])[0] || {};
      const pr   = ev.priceRanges?.[0];
      const isFree = pr ? pr.min === 0 : false;
      return {
        id:        `tm-${ev.id}`,
        source:    "ticketmaster",
        name:      ev.name,
        desc:      ev.info || "",
        address:   [v.address?.line1, v.city?.name, "CA"].filter(Boolean).join(", "),
        phone:     null,
        website:   ev.url,
        image:     ev.images?.find(i => i.ratio === "4_3")?.url || ev.images?.[0]?.url || null,
        isFree,
        price:     pr ? (isFree ? "$0 FREE" : `$${pr.min}–$${pr.max}`) : "See site",
        stars:     4,
        startDate: ev.dates?.start?.localDate || null,
        endDate:   null,
        ages:      detectAges(ev.name),
        a11y:      detectA11y(ev.name),
        mapsUrl:   v.address?.line1 ? `https://www.google.com/maps/search/${encodeURIComponent(v.address.line1 + " " + (v.city?.name||"") + " CA")}` : null,
      };
    });
  } catch (e) { console.warn("Ticketmaster:", e.message); return []; }
}

// ── Main handler ──────────────────────────────────────────

const HARDCODED_WEEKEND = [
  // ── REGIONAL DAY TRIPS (all cities) ──
  { id:"hw-r-1", city:"regional", isDayTrip:true, source:"google", name:"Half Moon Bay Beach Horseback Riding", image:"/festival.jpg", desc:"Guided horseback riding on the beach for kids and families — perfect weekend day trip", address:"Half Moon Bay, CA 94019", phone:null, website:null, isFree:false, price:"From $60/hr", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Horseback+Riding+Half+Moon+Bay" },
  { id:"hw-r-2", city:"regional", isDayTrip:true, source:"google", name:"Cherry Picking Brentwood Orchards", image:"/festival.jpg", desc:"Seasonal cherry and stone fruit picking at Brentwood farms", address:"Brentwood, CA 94513", phone:null, website:null, isFree:false, price:"Pay by weight", stars:5, startDate:"2026-06-01", endDate:"2026-07-15", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Cherry+Picking+Brentwood" },
  { id:"hw-r-3", city:"regional", isDayTrip:true, source:"google", name:"Cherry Picking Morgan Hill", image:"/festival.jpg", desc:"Weekend cherry picking at Morgan Hill orchards — only in season!", address:"Morgan Hill, CA 95037", phone:null, website:null, isFree:false, price:"Pay by weight", stars:5, startDate:"2026-06-01", endDate:"2026-07-15", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Cherry+Picking+Morgan+Hill" },
  { id:"hw-r-4", city:"regional", isDayTrip:true, source:"google", name:"Santa Cruz Beach Boardwalk Pier Fishing", desc:"Family pier fishing and rides at Santa Cruz Beach Boardwalk", address:"Santa Cruz, CA 95060", phone:null, website:"https://www.beachboardwalk.com", image:"/festival.jpg", isFree:false, price:"Free fishing off pier", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Santa+Cruz+Beach+Boardwalk" },
  { id:"hw-r-5", city:"regional", isDayTrip:true, source:"google", name:"Roaring Camp Heritage Train Forest Tour", desc:"Narrow gauge train through redwood forest — magical weekend trip", address:"5401 Graham Hill Rd, Felton, CA 95018", phone:"(831) 335-4484", website:"https://www.roaringcamp.com", image:"/park.jpg", isFree:false, price:"From $28", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Roaring+Camp+Felton" },
  { id:"hw-r-6", city:"regional", isDayTrip:true, source:"google", name:"Lemos Farm Pony Rides Half Moon Bay", desc:"Train rides, pony rides and farm animals — perfect weekend outing", address:"12320 San Mateo Rd, Half Moon Bay, CA 94019", phone:"(650) 726-2342", website:"https://www.lemosfarm.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Lemos+Farm" },
  { id:"hw-r-7", city:"regional", isDayTrip:true, source:"google", name:"Ardenwood Historic Farm Horse-Drawn Carriage", desc:"Horse-drawn carriage rides and farm life at historic Ardenwood Farm", address:"34600 Ardenwood Blvd, Fremont, CA 94555", phone:"(510) 544-2797", website:null, image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Ardenwood+Historic+Farm" },
  { id:"hw-r-8", city:"regional", isDayTrip:true, source:"google", name:"Gilroy Gardens Family Theme Park", desc:"Weekend family theme park with rides, splash zones and gardens", address:"3050 Hecker Pass Hwy, Gilroy, CA 95020", phone:"(408) 840-7100", website:"https://www.gilroygardens.org", image:"/park.jpg", isFree:false, price:"From $40", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Gilroy+Gardens" },
  { id:"hw-r-9", city:"regional", isDayTrip:true, source:"google", name:"Webb Ranch Berry Picking", desc:"Seasonal strawberry and berry picking — farm fresh weekend fun", address:"1901 Old Page Mill Rd, Palo Alto, CA 94304", phone:null, website:null, image:"/park.jpg", isFree:false, price:"Pay by weight", stars:5, startDate:"2026-06-01", endDate:"2026-08-15", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Webb+Ranch+Palo+Alto" },
  { id:"hw-r-10", city:"regional", isDayTrip:true, source:"google", name:"Mount Hermon Adventures High Ropes", desc:"Weekend high ropes course and zip line adventure for older kids", address:"Mount Hermon, CA 95041", phone:null, website:"https://www.mounthermon.org", image:"/festival.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Mount+Hermon+Adventures" },

  // ── SUNNYVALE ──
  { id:"hw-sv-1", city:"Sunnyvale", source:"google", name:"Sunnyvale Farmers Market Weekend", desc:"Weekend farmers market with fresh produce and family fun", address:"Murphy Ave, Sunnyvale, CA 94086", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Sunnyvale+Farmers+Market" },
  { id:"hw-sv-2", city:"Sunnyvale", source:"google", name:"Las Palmas Park Weekend Splash", desc:"Weekend splash pad and outdoor play at Las Palmas Park", address:"850 Russet Dr, Sunnyvale, CA 94087", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Las+Palmas+Park+Sunnyvale" },
  { id:"hw-sv-3", city:"Sunnyvale", source:"google", name:"Sunnyvale Art & Wine Festival", desc:"Weekend outdoor festival with kids activities and entertainment", address:"Murphy Ave, Sunnyvale, CA 94086", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Sunnyvale+Art+Wine+Festival" },

  // ── SAN JOSE ──
  { id:"hw-sj-1", city:"San Jose", source:"google", name:"San Jose Saturday Farmers Market", desc:"Weekend farmers market at San Jose with fresh food and family fun", address:"San Jose, CA 95110", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/San+Jose+Farmers+Market" },
  { id:"hw-sj-2", city:"San Jose", source:"google", name:"Happy Hollow Park Weekend Visit", desc:"Weekend family zoo and amusement park for young kids", address:"1300 Senter Rd, San Jose, CA 95112", phone:"(408) 794-6400", website:"https://www.happyhollow.org", image:"/park.jpg", isFree:false, price:"From $12", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Happy+Hollow+Park+Zoo+San+Jose" },
  { id:"hw-sj-3", city:"San Jose", source:"google", name:"San Jose Flea Market Weekend", desc:"Giant weekend flea market with food, rides and entertainment for kids", address:"1590 Berryessa Rd, San Jose, CA 95133", phone:"(408) 453-1110", website:"https://www.sjfm.com", image:"/park.jpg", isFree:true, price:"Free entry", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/San+Jose+Flea+Market" },

  // ── MOUNTAIN VIEW ──
  { id:"hw-mv-1", city:"Mountain View", source:"google", name:"Mountain View Farmers Market Weekend", desc:"Sunday farmers market with kids activities and fresh produce", address:"Castro St, Mountain View, CA 94041", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Mountain+View+Farmers+Market" },
  { id:"hw-mv-2", city:"Mountain View", source:"google", name:"Shoreline Lake Weekend Pedal Boating", desc:"Weekend pedal boat rentals on Shoreline Lake for families", address:"3160 N Shoreline Blvd, Mountain View, CA 94043", phone:"(650) 903-6073", website:null, image:"/festival.jpg", isFree:false, price:"From $20/hr", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Shoreline+Lake+Mountain+View" },
  { id:"hw-mv-3", city:"Mountain View", source:"google", name:"Deer Hollow Farm Weekend Visit", desc:"Free weekend farm visit with animals at Deer Hollow Farm", address:"27455 Christi Ln, Mountain View, CA 94040", phone:"(650) 903-6430", website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Deer+Hollow+Farm+Mountain+View" },

  // ── CUPERTINO ──
  { id:"hw-cu-1", city:"Cupertino", source:"google", name:"Cupertino Weekend Farmers Market", desc:"Weekend farmers market with fresh produce and family activities", address:"Cupertino, CA 95014", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Cupertino+Farmers+Market" },
  { id:"hw-cu-2", city:"Cupertino", source:"google", name:"Blackberry Farm Weekend Recreation", desc:"Weekend outdoor pool and picnic recreation for Cupertino families", address:"21979 San Fernando Ave, Cupertino, CA 95014", phone:"(408) 777-3140", website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Blackberry+Farm+Cupertino" },
  { id:"hw-cu-3", city:"Cupertino", source:"google", name:"Hidden Villa Farm Weekend Visit", desc:"Weekend farm animal sightseeing and nature trails near Cupertino", address:"26870 Moody Rd, Los Altos Hills, CA 94022", phone:"(650) 949-8650", website:"https://www.hiddenvilla.org", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Hidden+Villa+Farm" },

  // ── PALO ALTO ──
  { id:"hw-pa-1", city:"Palo Alto", source:"google", name:"Palo Alto Weekend Farmers Market", desc:"Saturday farmers market with fresh produce and family activities", address:"Palo Alto, CA 94301", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Palo+Alto+Farmers+Market" },
  { id:"hw-pa-2", city:"Palo Alto", source:"google", name:"Elizabeth Gamble Garden Weekend Walk", desc:"Free weekend garden walk and nature exploration for families", address:"1431 Waverley St, Palo Alto, CA 94301", phone:"(650) 329-1356", website:"https://www.gamblegarden.org", image:"/trail.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Elizabeth+Gamble+Garden+Palo+Alto" },
  { id:"hw-pa-3", city:"Palo Alto", source:"google", name:"Palo Alto Junior Museum Weekend Programs", desc:"Weekend interactive museum and zoo programs for young kids", address:"1451 Middlefield Rd, Palo Alto, CA 94301", phone:"(650) 329-2111", website:"https://www.pajmz.org", image:"/museum.jpg", isFree:false, price:"Free admission", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Palo+Alto+Junior+Museum+Zoo" },

  // ── SARATOGA ──
  { id:"hw-sa-1", city:"Saratoga", source:"google", name:"Hakone Gardens Weekend Visit", desc:"Weekend Japanese garden walk with ponds and peaceful trails", address:"21000 Big Basin Way, Saratoga, CA 95070", phone:"(408) 741-4994", website:"https://www.hakone.com", image:"/park.jpg", isFree:false, price:"$10 adults, kids free", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Hakone+Gardens+Saratoga" },
  { id:"hw-sa-2", city:"Saratoga", source:"google", name:"Saratoga Village Farmers Market", desc:"Weekend farmers market in charming Saratoga Village", address:"Big Basin Way, Saratoga, CA 95070", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Saratoga+Village+Farmers+Market" },
  { id:"hw-sa-3", city:"Saratoga", source:"google", name:"Uvas Canyon Waterfall Hike Weekend", desc:"Weekend waterfall hike through shaded canyon for families", address:"Uvas Canyon County Park, Saratoga, CA 95070", phone:null, website:null, image:"/trail.jpg", isFree:false, price:"$6 parking", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Uvas+Canyon+Park" },
];
const HARDCODED_FREE = [
  // ── SUNNYVALE ──
  { id:"hf-sv-1", city:"Sunnyvale", source:"google", name:"Las Palmas Park Sunnyvale", desc:"Free splash pad and outdoor play area for families", address:"850 Russet Dr, Sunnyvale, CA 94087", phone:"(408) 730-7506", website:"https://www.sunnyvale.ca.gov", image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Las+Palmas+Park+Sunnyvale" },
  { id:"hf-sv-2", city:"Sunnyvale", source:"google", name:"Sunnyvale Public Library Summer Reading", desc:"Free summer reading program for kids of all ages", address:"665 W Olive Ave, Sunnyvale, CA 94086", phone:"(408) 730-7300", website:"https://www.sunnyvale.ca.gov/library", image:"/library.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Sunnyvale+Public+Library" },
  { id:"hf-sv-3", city:"Sunnyvale", source:"google", name:"Magical Bridge Playground Sunnyvale", desc:"Free inclusive sensory playground for all abilities", address:"Sunnyvale, CA 94087", phone:null, website:null, image:"/festival.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🧠 Sensory-Safe","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Magical+Bridge+Playground+Sunnyvale" },
  { id:"hf-sv-4", city:"Sunnyvale", source:"google", name:"Seven Seas Park Sunnyvale", desc:"Free community park with playground and open space", address:"1010 Morse Ave, Sunnyvale, CA 94089", phone:"(408) 730-7506", website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Seven+Seas+Park+Sunnyvale" },
  { id:"hf-sv-5", city:"Sunnyvale", source:"google", name:"Sunnyvale Bay Trail", desc:"Free paved trail along the bay — great for bikes and strollers", address:"Sunnyvale, CA 94089", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Sunnyvale+Bay+Trail" },
  // ── CUPERTINO ──
  { id:"hf-cu-1", city:"Cupertino", source:"google", name:"Memorial Park Cupertino", desc:"Free community park with splash pad and playground", address:"21251 Stevens Creek Blvd, Cupertino, CA 95014", phone:"(408) 777-3120", website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Memorial+Park+Cupertino" },
  { id:"hf-cu-2", city:"Cupertino", source:"google", name:"Cupertino Library Summer Reading", desc:"Free summer reading program for kids at Cupertino Library", address:"10800 Torre Ave, Cupertino, CA 95014", phone:"(408) 446-1677", website:"https://www.sccld.org", image:"/library.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Cupertino+Library" },
  { id:"hf-cu-3", city:"Cupertino", source:"google", name:"Linda Vista Park Cupertino", desc:"Free park with hiking trails and open space for families", address:"Cupertino, CA 95014", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Linda+Vista+Park+Cupertino" },
  { id:"hf-cu-4", city:"Cupertino", source:"google", name:"Wilson Park Cupertino", desc:"Free neighborhood park with playground for young kids", address:"10185 N Stelling Rd, Cupertino, CA 95014", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Wilson+Park+Cupertino" },
  // ── PAID EXTRA - SAN JOSE ──
  { id:"hf-sj-p1", city:"San Jose", source:"google", name:"iD Tech Camp San Jose", desc:"Coding, game design and AI camps for ages 7-19", address:"San Jose, CA 95110", phone:"(888) 709-8324", website:"https://www.idtech.com", image:"/park.jpg", isFree:false, price:"From $999/week", stars:5, startDate:"2026-06-16", endDate:"2026-08-15", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/iD+Tech+Camp+San+Jose" },
  { id:"hf-sj-p2", city:"San Jose", source:"google", name:"Galileo Camp San Jose", desc:"Creative arts STEM and outdoor adventure for K-8", address:"San Jose, CA 95110", phone:"(800) 854-3684", website:"https://www.galileo-camps.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Galileo+Camp+San+Jose" },
  { id:"hf-sj-p3", city:"San Jose", source:"google", name:"Snapology San Jose STEM Camp", desc:"LEGO robotics and STEM camps for kids 2-14", address:"San Jose, CA 95110", phone:null, website:"https://www.snapology.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Snapology+San+Jose" },
  // ── PAID EXTRA - PALO ALTO ──
  { id:"hf-pa-p1", city:"Palo Alto", source:"google", name:"Galileo Camp Palo Alto", desc:"Creative arts STEM and outdoor adventure for K-8", address:"Palo Alto, CA 94301", phone:"(800) 854-3684", website:"https://www.galileo-camps.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Galileo+Camp+Palo+Alto" },
  { id:"hf-pa-p2", city:"Palo Alto", source:"google", name:"Code Ninjas Palo Alto", desc:"Kids coding and STEM classes in Palo Alto", address:"Palo Alto, CA 94301", phone:null, website:"https://www.codeninjas.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Code+Ninjas+Palo+Alto" },
  { id:"hf-pa-p3", city:"Palo Alto", source:"google", name:"Stanford Summer Camps Palo Alto", desc:"Diverse summer camps at Stanford for school-age kids and teens", address:"Stanford University, Palo Alto, CA 94305", phone:null, website:"https://www.stanford.edu", image:"/festival.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-16", endDate:"2026-08-15", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Stanford+Summer+Camp" },
  // ── PAID EXTRA - SARATOGA ──
  { id:"hf-sa-p1", city:"Saratoga", source:"google", name:"Galileo Camp Saratoga", desc:"Creative arts STEM and outdoor adventure for K-8", address:"Saratoga, CA 95070", phone:"(800) 854-3684", website:"https://www.galileo-camps.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Galileo+Camp+Saratoga" },
  { id:"hf-sa-p2", city:"Saratoga", source:"google", name:"West Valley Community Center Kids Camp", desc:"Summer day camp at West Valley Community Center near Saratoga", address:"Saratoga, CA 95070", phone:null, website:null, image:"/festival.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/West+Valley+Community+Center+Saratoga" },
  { id:"hf-sa-p3", city:"Saratoga", source:"google", name:"Saratoga Tennis Camp", desc:"Junior tennis camp for kids and teens in Saratoga", address:"Saratoga, CA 95070", phone:null, website:null, image:"/sports.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Tennis+Camp+Saratoga" },

  // ── PALO ALTO FREE EXTRA ──
  { id:"hf-pa-f1", city:"Palo Alto", source:"google", name:"Mitchell Park Palo Alto", desc:"Free community park with splash pad and playground", address:"600 E Meadow Dr, Palo Alto, CA 94306", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Mitchell+Park+Palo+Alto" },
  { id:"hf-pa-f2", city:"Palo Alto", source:"google", name:"Rinconada Park Palo Alto", desc:"Free large community park with pool and open space", address:"777 Embarcadero Rd, Palo Alto, CA 94301", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Rinconada+Park+Palo+Alto" },
  { id:"hf-pa-f3", city:"Palo Alto", source:"google", name:"Peers Park Palo Alto", desc:"Free neighborhood park with playground for young kids", address:"Palo Alto, CA 94306", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Peers+Park+Palo+Alto" },
  // ── MOUNTAIN VIEW PAID EXTRA ──
  { id:"hf-mv-p1", city:"Mountain View", source:"google", name:"Galileo Camp Mountain View", desc:"Creative arts STEM and outdoor adventure for K-8", address:"Mountain View, CA 94040", phone:"(800) 854-3684", website:"https://www.galileo-camps.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Galileo+Camp+Mountain+View" },
  { id:"hf-mv-p2", city:"Mountain View", source:"google", name:"Code Ninjas Mountain View", desc:"Kids coding and STEM classes in Mountain View", address:"Mountain View, CA 94040", phone:null, website:"https://www.codeninjas.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Code+Ninjas+Mountain+View" },
  { id:"hf-mv-p3", city:"Mountain View", source:"google", name:"iD Tech Camp Mountain View", desc:"Coding game design AI and robotics for ages 7-19", address:"Mountain View, CA 94040", phone:"(888) 709-8324", website:"https://www.idtech.com", image:"/park.jpg", isFree:false, price:"From $999/week", stars:5, startDate:"2026-06-16", endDate:"2026-08-15", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/iD+Tech+Camp+Mountain+View" },
  // ── MOUNTAIN VIEW INDOOR EXTRA ──
  { id:"hi-mv-5", city:"Mountain View", source:"google", name:"Color Me Mine Mountain View", desc:"Paint-your-own pottery studio drop in any time", address:"Mountain View, CA 94040", phone:null, website:"https://www.colormemine.com", image:"/park.jpg", isFree:false, price:"Studio fee + pottery", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Color+Me+Mine+Mountain+View" },
  { id:"hi-mv-6", city:"Mountain View", source:"google", name:"Snapology Mountain View Indoor STEM", desc:"Indoor LEGO robotics and STEM camps for kids", address:"Mountain View, CA 94040", phone:null, website:"https://www.snapology.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Snapology+Mountain+View" },
  { id:"hi-mv-7", city:"Mountain View", source:"google", name:"Mountain View Library Kids Programs", desc:"Free indoor storytime and summer reading programs", address:"585 Franklin St, Mountain View, CA 94041", phone:"(650) 903-6337", website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Mountain+View+Library" },
];

// ── Fast hardcoded-only endpoint ─────────────────────
export async function getHardcoded(tab, city, age) {
  const hardcodedFiltered =
    tab === "paid"    ? [...HARDCODED_PAID.filter(a => a.city === city), ...HARDCODED_FREE.filter(a => a.city === city && !a.isFree)] :
    tab === "free"    ? HARDCODED_FREE.filter(a => a.city === city && a.isFree) :
    tab === "indoor"  ? HARDCODED_INDOOR.filter(a => a.city === city) :
    tab === "outdoor" ? HARDCODED_OUTDOOR.filter(a => a.city === city) :
    tab === "weekend" ? HARDCODED_WEEKEND.filter(a => a.city === city || a.city === "regional") :
    [];

  const seen = new Set();
  let activities = [
  // ── FREMONT FREE ──
  { id:"hf-fr-1", city:"Fremont", source:"google", name:"Central Park Lake Elizabeth Fremont", desc:"Free lakeside park with splash pad, playgrounds and walking trails", address:"40204 Paseo Padre Pkwy, Fremont, CA 94538", phone:"(510) 494-4300", website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Central+Park+Lake+Elizabeth+Fremont" },
  { id:"hf-fr-2", city:"Fremont", source:"google", name:"Fremont Main Library Storytimes", desc:"Free weekly storytime and summer reading programs for kids", address:"2400 Stevenson Blvd, Fremont, CA 94538", phone:"(510) 745-1400", website:"https://www.aclibrary.org", image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Fremont+Main+Library" },
  { id:"hf-fr-3", city:"Fremont", source:"google", name:"Irvington Library Reading Programs", desc:"Free summer reading and kids programs at Irvington Library", address:"41825 Greenpark Dr, Fremont, CA 94538", phone:"(510) 745-1460", website:"https://www.aclibrary.org", image:"/library.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Irvington+Library+Fremont" },
  { id:"hf-fr-4", city:"Fremont", source:"google", name:"Always Dream PlayPark Fremont", image:"/festival.jpg", desc:"Free inclusive playground for children of all abilities", address:"Fremont, CA 94538", phone:null, website:null, isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🧠 Sensory-Safe","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Always+Dream+PlayPark+Fremont" },
  { id:"hf-fr-5", city:"Fremont", source:"google", name:"Don Edwards San Francisco Bay Wildlife Refuge", desc:"Free nature walks and wildlife viewing at the bay refuge", address:"1 Marshlands Rd, Fremont, CA 94555", phone:"(510) 792-0222", website:null, image:"/trail.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Don+Edwards+Wildlife+Refuge+Fremont" },
  { id:"hf-fr-6", city:"Fremont", source:"google", name:"Niles Community Park Fremont", desc:"Free community park with playground and open space", address:"Niles Blvd, Fremont, CA 94536", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Niles+Community+Park+Fremont" },

  // ── FREMONT PAID ──
  { id:"hc-fr-1", city:"Fremont", source:"google", name:"YMCA Silicon Valley Fremont Summer Camp", desc:"Day camp programs at Fremont YMCA", address:"Fremont, CA 94538", phone:"(510) 792-2141", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/YMCA+Fremont" },
  { id:"hc-fr-2", city:"Fremont", source:"google", name:"Aqua Adventure Waterpark Fremont", desc:"Water park with slides and splash zones for kids", address:"40204 Paseo Padre Pkwy, Fremont, CA 94538", phone:"(510) 494-4300", website:null, image:"/park.jpg", isFree:false, price:"From $12", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Aqua+Adventure+Waterpark+Fremont" },
  { id:"hc-fr-3", city:"Fremont", source:"google", name:"City of Fremont Art and Cooking Camps", desc:"City-run art and cooking summer camps for kids", address:"Fremont, CA 94538", phone:"(510) 494-4300", website:"https://www.fremont.gov", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Fremont+Community+Center+Camps" },
  { id:"hc-fr-4", city:"Fremont", source:"google", name:"DIY Makers Camp Fremont", desc:"Hands-on making and building camp for curious kids", address:"Fremont, CA 94538", phone:null, website:null, image:"/festival.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/DIY+Makers+Camp+Fremont" },
  { id:"hc-fr-5", city:"Fremont", source:"google", name:"STEM Robotics Workshop Fremont", desc:"STEM and robotics summer workshops for school-age kids", address:"Fremont, CA 94538", phone:null, website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/STEM+Robotics+Fremont" },
  { id:"hc-fr-6", city:"Fremont", source:"google", name:"Camp Variety Fremont", desc:"Variety summer camp with arts sports and STEM activities", address:"Fremont, CA 94538", phone:null, website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Camp+Variety+Fremont" },

  // ── FREMONT INDOOR ──
  { id:"hi-fr-1", city:"Fremont", source:"google", name:"Children's Natural History Museum Fremont", desc:"Indoor natural history museum for kids with fossils and exhibits", address:"4020 Paseo Padre Pkwy, Fremont, CA 94555", phone:"(510) 796-5437", website:null, image:"/museum.jpg", isFree:false, price:"$5 admission", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Children+Natural+History+Museum+Fremont" },
  { id:"hi-fr-2", city:"Fremont", source:"google", name:"Niles Essanay Silent Film Museum", desc:"Unique indoor museum celebrating silent film history in Niles", address:"37417 Niles Blvd, Fremont, CA 94536", phone:"(510) 494-1411", website:null, image:"/museum.jpg", isFree:false, price:"$5 admission", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Niles+Essanay+Silent+Film+Museum" },
  { id:"hi-fr-3", city:"Fremont", source:"google", name:"Silliman Family Aquatic Center Fremont", desc:"Indoor pool with swim lessons and aquatics for all ages", address:"6800 Mowry Ave, Newark, CA 94560", phone:"(510) 578-4620", website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Silliman+Aquatic+Center+Fremont" },
  { id:"hi-fr-4", city:"Fremont", source:"google", name:"Wee Play Drop-In Playtime Fremont", desc:"Indoor drop-in play sessions for toddlers and young kids", address:"Fremont, CA 94538", phone:null, website:null, image:"/camp.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Wee+Play+Fremont" },
  { id:"hi-fr-5", city:"Fremont", source:"google", name:"Harry Pottery Clay Classes Fremont", desc:"Indoor pottery and clay art classes for kids", address:"Fremont, CA 94538", phone:null, website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Pottery+Clay+Classes+Fremont" },
  { id:"hi-fr-6", city:"Fremont", source:"google", name:"Rockin Tots Trampoline Fremont", desc:"Indoor toddler trampoline sessions in Fremont", address:"Fremont, CA 94538", phone:null, website:null, image:"/camp.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Trampoline+Toddler+Fremont" },

  // ── FREMONT OUTDOOR ──
  { id:"ho-fr-1", city:"Fremont", source:"google", name:"Ardenwood Historic Farm Fremont", image:"/festival.jpg", desc:"Farm animals, horse-drawn carriage rides and nature trails", address:"34600 Ardenwood Blvd, Fremont, CA 94555", phone:"(510) 544-2797", website:null, isFree:false, price:"$6 admission", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Ardenwood+Historic+Farm+Fremont" },
  { id:"ho-fr-2", city:"Fremont", source:"google", name:"Mission Peak Regional Preserve Hiking", image:"/festival.jpg", desc:"Popular family hiking trail with amazing bay views", address:"43600 Mission Blvd, Fremont, CA 94539", phone:null, website:null, isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Mission+Peak+Fremont" },
  { id:"ho-fr-3", city:"Fremont", source:"google", name:"Coyote Hills Regional Park Fremont", desc:"Marshland trails and nature exploration near the bay", address:"8000 Patterson Ranch Rd, Fremont, CA 94555", phone:"(510) 544-3220", website:null, image:"/park.jpg", isFree:false, price:"$5 parking", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Coyote+Hills+Regional+Park+Fremont" },
  { id:"ho-fr-4", city:"Fremont", source:"google", name:"Quarry Lakes Regional Recreation Fremont", desc:"Outdoor lake recreation with fishing swimming and picnics", address:"2100 Isherwood Way, Fremont, CA 94536", phone:"(510) 544-3220", website:null, image:"/park.jpg", isFree:false, price:"$5 parking", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Quarry+Lakes+Fremont" },
  { id:"ho-fr-5", city:"Fremont", source:"google", name:"Back to Eden Ranch Petting Zoo Fremont", desc:"Petting zoo and farm animal visits for young children", address:"Fremont, CA 94538", phone:null, website:null, image:"/museum.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Back+to+Eden+Ranch+Fremont" },
  { id:"ho-fr-6", city:"Fremont", source:"google", name:"Shinn Historical Park Fremont", desc:"Historic park and arboretum with nature walks for families", address:"1251 Peralta Blvd, Fremont, CA 94536", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Shinn+Historical+Park+Fremont" },

  // ── FREMONT WEEKEND ──
  { id:"hw-fr-1", city:"Fremont", source:"google", name:"Fremont Centerville Farmers Market", desc:"Saturday farmers market with fresh produce and family fun", address:"Centerville, Fremont, CA 94536", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Centerville+Farmers+Market+Fremont" },
  { id:"hw-fr-2", city:"Fremont", source:"google", name:"Niles Farmers Market Saturday", desc:"Saturday farmers market in charming historic Niles district", address:"Niles Blvd, Fremont, CA 94536", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Niles+Farmers+Market+Fremont" },
  { id:"hw-fr-3", city:"Fremont", source:"google", name:"Irvington Farmers Market Sunday", desc:"Sunday farmers market with kids activities and fresh food", address:"Irvington, Fremont, CA 94538", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Irvington+Farmers+Market+Fremont" },
  { id:"hw-fr-4", city:"Fremont", source:"google", name:"Ardenwood Rail Fair Weekend", desc:"Weekend rail fair with train rides at Ardenwood Historic Farm", address:"34600 Ardenwood Blvd, Fremont, CA 94555", phone:"(510) 544-2797", website:null, image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Ardenwood+Rail+Fair+Fremont" },
  { id:"hw-fr-5", city:"Fremont", source:"google", name:"Second Saturday Art Market Fremont", desc:"Monthly art market and silent disco on second Saturday", address:"Fremont, CA 94538", phone:null, website:null, image:"/park.jpg", isFree:true, price:"$0 FREE", stars:4, startDate:"2026-06-14", endDate:"2026-08-08", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Second+Saturday+Art+Market+Fremont" },

  { id:"hc-fr-7", city:"Fremont", source:"google", name:"Galileo Camp Fremont", desc:"Creative arts STEM and outdoor adventure for K-8", address:"Fremont, CA 94538", phone:"(800) 854-3684", website:"https://www.galileo-camps.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Galileo+Camp+Fremont" },
  { id:"hc-fr-8", city:"Fremont", source:"google", name:"Code Ninjas Fremont", desc:"Kids coding and STEM classes in Fremont", address:"Fremont, CA 94538", phone:null, website:"https://www.codeninjas.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Code+Ninjas+Fremont" },
  { id:"hc-fr-9", city:"Fremont", source:"google", name:"Aqua Adventure Splash Pad Fremont", desc:"Water splash pad and aquatic fun for kids at Central Park", address:"40204 Paseo Padre Pkwy, Fremont, CA 94538", phone:"(510) 494-4300", website:null, image:"/park.jpg", isFree:false, price:"From $5", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Aqua+Adventure+Fremont" },

  { id:"hi-fr-7", city:"Fremont", source:"google", name:"YMCA Fremont Indoor Pool", desc:"Indoor pool and swim lessons at Fremont YMCA", address:"Fremont, CA 94538", phone:"(510) 792-2141", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/YMCA+Fremont" },
  { id:"hi-fr-8", city:"Fremont", source:"google", name:"Fremont Main Library Indoor Programs", desc:"Free indoor reading and kids programs at Fremont Library", address:"2400 Stevenson Blvd, Fremont, CA 94538", phone:"(510) 745-1400", website:"https://www.aclibrary.org", image:"/park.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Fremont+Main+Library" },
  { id:"hi-fr-9", city:"Fremont", source:"google", name:"Children Natural History Museum Fremont Indoor", desc:"Explore fossils dinosaurs and natural history indoors", address:"4020 Paseo Padre Pkwy, Fremont, CA 94555", phone:"(510) 796-5437", website:null, image:"/festival.jpg", isFree:false, price:"$5 admission", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Children+Natural+History+Museum+Fremont" },
  { id:"hi-fr-10", city:"Fremont", source:"google", name:"Fremont Community Center Indoor Classes", desc:"Indoor summer classes and programs for kids at Fremont CC", address:"3300 Capitol Ave, Fremont, CA 94538", phone:"(510) 494-4300", website:"https://www.fremont.gov", image:"/festival.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Fremont+Community+Center" },
  { id:"hi-fr-11", city:"Fremont", source:"google", name:"Color Me Mine Fremont", desc:"Paint-your-own pottery studio in Fremont", address:"Fremont, CA 94538", phone:null, website:"https://www.colormemine.com", image:"/park.jpg", isFree:false, price:"Studio fee + pottery", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Color+Me+Mine+Fremont" },

  // ── FREMONT PAID EXTRA ──
  { id:"hc-fr-10", city:"Fremont", source:"google", name:"Galileo Camp Fremont", desc:"Creative arts STEM and outdoor adventure for K-8", address:"Fremont, CA 94538", phone:"(800) 854-3684", website:"https://www.galileo-camps.com", image:"/park.jpg", isFree:false, price:"See site", stars:5, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Galileo+Camp+Fremont" },
  { id:"hc-fr-11", city:"Fremont", source:"google", name:"iD Tech Camp Fremont", desc:"Coding game design AI and robotics for ages 7-19", address:"Fremont, CA 94538", phone:"(888) 709-8324", website:"https://www.idtech.com", image:"/park.jpg", isFree:false, price:"From $999/week", stars:5, startDate:"2026-06-16", endDate:"2026-08-15", ages:["2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/iD+Tech+Camp+Fremont" },
  { id:"hc-fr-12", city:"Fremont", source:"google", name:"Snapology Fremont STEM Camp", desc:"LEGO robotics and STEM camps for kids", address:"Fremont, CA 94538", phone:null, website:"https://www.snapology.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Snapology+Fremont" },
  { id:"hc-fr-13", city:"Fremont", source:"google", name:"YMCA Fremont Summer Day Camp", desc:"Full day summer camp at Fremont YMCA for kids", address:"Fremont, CA 94538", phone:"(510) 792-2141", website:"https://www.ymcasv.org", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-09", endDate:"2026-08-14", ages:["1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/YMCA+Fremont+Summer+Camp" },
  // ── FREMONT INDOOR EXTRA ──
  { id:"hi-fr-12", city:"Fremont", source:"google", name:"Altitude Trampoline Park Fremont", desc:"Indoor trampoline park with foam pits and toddler zones", address:"Fremont, CA 94538", phone:null, website:"https://www.altitudetrampoline.com", image:"/park.jpg", isFree:false, price:"From $15", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Altitude+Trampoline+Fremont" },
  { id:"hi-fr-13", city:"Fremont", source:"google", name:"Fremont Library Kids Summer Programs", desc:"Free indoor summer reading and kids programs", address:"2400 Stevenson Blvd, Fremont, CA 94538", phone:"(510) 745-1400", website:"https://www.aclibrary.org", image:"/library.jpg", isFree:true, price:"$0 FREE", stars:5, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2"], a11y:["♿ Wheelchair","🍼 Stroller OK"], mapsUrl:"https://www.google.com/maps/search/Fremont+Library" },
  { id:"hi-fr-14", city:"Fremont", source:"google", name:"Snapology Fremont Indoor Robotics", desc:"Indoor LEGO and robotics workshops for kids 2-14", address:"Fremont, CA 94538", phone:null, website:"https://www.snapology.com", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Snapology+Fremont" },
  { id:"hi-fr-15", city:"Fremont", source:"google", name:"Fremont Community Center Pool", desc:"Indoor pool and swim lessons at Fremont Community Center", address:"3300 Capitol Ave, Fremont, CA 94538", phone:"(510) 494-4300", website:"https://www.fremont.gov", image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["0","1","2","3"], a11y:["♿ Wheelchair"], mapsUrl:"https://www.google.com/maps/search/Fremont+Community+Center+Pool" },
  // ── MOUNTAIN VIEW INDOOR EXTRA ──
  { id:"hi-mv-8", city:"Mountain View", source:"google", name:"Altitude Trampoline Park Mountain View", desc:"Indoor trampoline park with foam pits for kids", address:"Mountain View, CA 94040", phone:null, website:"https://www.altitudetrampoline.com", image:"/park.jpg", isFree:false, price:"From $15", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Altitude+Trampoline+Mountain+View" },
  { id:"hi-mv-9", city:"Mountain View", source:"google", name:"ArtSpark Studio Mountain View", desc:"Indoor art classes and workshops for kids of all ages", address:"Mountain View, CA 94040", phone:null, website:null, image:"/park.jpg", isFree:false, price:"See site", stars:4, startDate:"2026-06-01", endDate:"2026-08-31", ages:["1","2","3"], a11y:[], mapsUrl:"https://www.google.com/maps/search/Art+Studio+Kids+Mountain+View" },
];
  for (const a of hardcodedFiltered) {
    const key = a.name.toLowerCase().slice(0, 30);
    if (!seen.has(key)) {
      seen.add(key);
      if (!a.image) a.image = null;
      activities.push(a);
    }
  }
  if (age !== "all") activities = activities.filter(a => a.ages.includes(age));
  if (tab === "weekend") activities = activities.filter(a => a.id?.startsWith("hw-") || isWeekend(a.startDate));
  return activities;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")     return res.status(405).json({ error: "Method not allowed" });

  const { tab = "free", city = "Sunnyvale", age = "all" } = req.query;
  const cacheKey = `${tab}-${city}-${age}`;
  const cached   = CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < TTL) {
    res.setHeader("X-Cache", "HIT");
    return res.status(200).json(cached.data);
  }

  const coords   = CITY_COORDS[city] || null;
  const keywords = TAB_KEYWORDS[tab] || TAB_KEYWORDS.free;

  // Inject hardcoded activities by tab
  const hardcodedFiltered = tab === "paid"
    ? [...HARDCODED_PAID.filter(a => a.city === city), ...HARDCODED_FREE.filter(a => a.city === city && !a.isFree)]
    : tab === "free"
    ? HARDCODED_FREE.filter(a => a.city === city && a.isFree)
    : tab === "indoor"
    ? HARDCODED_INDOOR.filter(a => a.city === city)
    : tab === "outdoor"
    ? HARDCODED_OUTDOOR.filter(a => a.city === city)
    : tab === "weekend"
    ? HARDCODED_WEEKEND.filter(a => a.city === city || a.city === "regional")
    : [];

  // Inject hardcoded paid activities
  
  const [ebRes, gpRes, tmRes] = await Promise.allSettled([
    fetchEventbrite(tab, city, keywords),
    fetchGoogle(tab, city, coords, keywords),
    fetchTicketmaster(tab, city, coords),
  ]);

  let activities = [];
  const seen = new Set();

  // Add hardcoded first
  for (const a of hardcodedFiltered) {
    const key = a.name.toLowerCase().slice(0, 30);
    if (!seen.has(key)) { seen.add(key); activities.push(a); }
  }

    for (const result of [ebRes, gpRes, tmRes]) {
    if (result.status === "fulfilled") {
      for (const a of result.value) {
        const key = a.name.toLowerCase().slice(0, 30);
        if (!seen.has(key)) {
          seen.add(key);
          activities.push(a);
        }
      }
    }
  }

  // Tab filters
  // Indoor: remove restaurants, bars, adult venues
  const INDOOR_EXCLUDE = ["backyard","restaurant","bar","pub","grill","brewery","winery","lounge","casino"];
  // free tab - parks/libraries are free by nature
  if (tab === "indoor") activities = activities.filter(a => {
    const t = (a.name + " " + (a.desc||"")).toLowerCase();
    return !INDOOR_EXCLUDE.some(k => t.includes(k));
  });
    if (tab === "indoor") activities = activities.filter(a => {
    const t = (a.name + " " + (a.desc||"")).toLowerCase();
    return !INDOOR_EXCLUDE.some(k => t.includes(k));
  });
  if (tab === "weekend") activities = activities.filter(a => a.id?.startsWith("hw-") || isWeekend(a.startDate));
  // Paid tab: only show activities with price info or known paid venues
  if (tab === "paid") {
    activities = activities.filter(a => {
      const name = (a.name + " " + (a.desc || "")).toLowerCase();
      const paidKeywords = ["camp","ymca","class","program","ballet","stem","coding","robotics","steam","art","gym","sport","workshop","academy","school","mystery house","community center"];
      return paidKeywords.some(k => name.includes(k));
    });
  }
  if (age !== "all")     activities = activities.filter(a => a.ages.includes(age));

  // Sort: 4+ stars first
  activities.sort((a, b) => (b.stars || 0) - (a.stars || 0));

  const payload = { tab, city, age, count: activities.length, activities, fetchedAt: new Date().toISOString() };
  CACHE.set(cacheKey, { data: payload, ts: Date.now() });
  res.setHeader("Cache-Control", "s-maxage=600,stale-while-revalidate=120");
  res.setHeader("X-Cache", "MISS");
  return res.status(200).json(payload);
}
// Wed May  6 11:42:57 UTC 2026
