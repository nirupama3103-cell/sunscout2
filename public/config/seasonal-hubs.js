/* ══════════════════════════════════════════════════════════════════════════
   SEASONAL HUB CONFIG
   --------------------------------------------------------------------------
   Every seasonal hub (/seasons/<id>/) is ONE ENTRY in this object. There is no
   per-season component code and no branching on hub id anywhere in the page:
   the hub template reads its entry and drives itself from it.

   TO ADD A SEASON you edit this file and nothing else:

     1. Add an entry below with a unique key.
     2. Create /public/seasons/<key>/ containing an events.json and a copy of
        the hub template (which is season-agnostic — it reads window.HUB_ID).
     3. Drop the backdrop images in /public/images/<key>/.

     No CSS file, no template, no script needs to change. scripts/
     test-seasonal-config.js asserts exactly that.

   FIELD REFERENCE
     label        display name, used in the badge and the section header
     emoji        one glyph, used in the badge
     range        {from,to} as MM-DD. `to` is exclusive. A range whose `to` is
                  numerically <= `from` wraps the year end (see winter).
     ground       the page background colour, also the <html> inline fallback
     accent       the grid/geometric accent token (--accent)
     accentInk    text colour that sits ON accent — must clear 4.5:1
     backdrop     {wide,tall,fallback} paths under /images/<key>/
     scrim        {wide,tall} the wash over the backdrop, behind all content
     photoHints   event type -> phrase handed to /api/photos. Keep these
                  concrete and photographable; see scripts/test-photo-queries.js
   ══════════════════════════════════════════════════════════════════════════ */

const SEASONAL_HUBS = {

  halloween: {
    label: "Halloween",
    emoji: "🎃",
    range: { from: "09-20", to: "11-02" },
    ground: "#0B1723",
    accent: "#FC764A",
    accentInk: "#08192B",
    backdrop: {
      wide: "/images/halloween/hero-house",
      tall: "/images/halloween/hero-house-tall",
      fallback: "/images/halloween/hero-scene.svg",
    },
    scrim: {
      wide: "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(11,23,35,.28) 0%, rgba(11,23,35,.80) 62%)," +
            "linear-gradient(180deg, rgba(11,23,35,.62) 0%, rgba(11,23,35,.88) 46%, #0B1723 88%)",
      tall: "linear-gradient(180deg, rgba(11,23,35,.70) 0%, rgba(11,23,35,.92) 38%, #0B1723 72%)",
    },
    photoHints: {
      "pumpkin-patch":  "pumpkin patch field autumn orange pumpkins",
      "trunk-or-treat": "children halloween costumes trick or treating street",
      "festival":       "autumn harvest festival families outdoors",
      "haunt":          "haunted house at night jack o lantern",
      "storytime":      "children library storytime reading circle",
      "display":        "halloween decorations lit at night",
    },
    photoHintDefault: "autumn pumpkins halloween",
  },

  thanksgiving: {
    label: "Thanksgiving",
    emoji: "🍂",
    range: { from: "11-02", to: "11-30" },
    ground: "#1A1108",
    accent: "#E0872F",
    accentInk: "#1A1108",
    backdrop: {
      wide: "/images/thanksgiving/hero-harvest",
      tall: "/images/thanksgiving/hero-harvest-tall",
      fallback: "/images/thanksgiving/hero-scene.svg",
    },
    scrim: {
      wide: "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(26,17,8,.26) 0%, rgba(26,17,8,.78) 62%)," +
            "linear-gradient(180deg, rgba(26,17,8,.60) 0%, rgba(26,17,8,.88) 46%, #1A1108 88%)",
      tall: "linear-gradient(180deg, rgba(26,17,8,.70) 0%, rgba(26,17,8,.92) 38%, #1A1108 72%)",
    },
    photoHints: {
      "pumpkin-patch":  "autumn farm gourds squash harvest",
      "trunk-or-treat": "community gathering families autumn outdoors",
      "festival":       "harvest festival hay bales corn autumn",
      "haunt":          "misty autumn woods bare trees",
      "storytime":      "children library storytime reading circle",
      "display":        "autumn leaves golden hour park",
    },
    photoHintDefault: "autumn harvest family",
  },

  winter: {
    /* Wraps the year end: from December into January, so `to` is numerically
       lower than `from`. inSeason() handles the wrap rather than the caller. */
    label: "Winter break",
    emoji: "❄️",
    range: { from: "11-30", to: "01-08" },
    ground: "#08151F",
    accent: "#7FC7E8",
    accentInk: "#06131C",
    backdrop: {
      wide: "/images/winter/hero-lights",
      tall: "/images/winter/hero-lights-tall",
      fallback: "/images/winter/hero-scene.svg",
    },
    scrim: {
      wide: "radial-gradient(ellipse 120% 80% at 50% 0%, rgba(8,21,31,.26) 0%, rgba(8,21,31,.78) 62%)," +
            "linear-gradient(180deg, rgba(8,21,31,.60) 0%, rgba(8,21,31,.88) 46%, #08151F 88%)",
      tall: "linear-gradient(180deg, rgba(8,21,31,.70) 0%, rgba(8,21,31,.92) 38%, #08151F 72%)",
    },
    photoHints: {
      "pumpkin-patch":  "winter farm snow field",
      "trunk-or-treat": "families walking winter evening lights",
      "festival":       "winter market stalls string lights evening",
      "haunt":          "bare winter trees blue hour",
      "storytime":      "children library storytime reading circle",
      "display":        "christmas lights display night neighbourhood",
    },
    photoHintDefault: "winter holiday lights family",
  },

};

/* MM-DD comparison, wrap-aware. `to` is exclusive. */
function inSeason(hub, date) {
  const d = date || new Date();
  const md = String(d.getMonth() + 1).padStart(2, "0") + "-" +
             String(d.getDate()).padStart(2, "0");
  const { from, to } = hub.range;
  return from <= to ? (md >= from && md < to)      // ordinary range
                    : (md >= from || md < to);     // wraps the year end
}

/* The hub whose range contains `date`, or null. First match wins, so ranges
   should not overlap; test-seasonal-config.js asserts they do not. */
function hubForDate(date) {
  for (const [id, hub] of Object.entries(SEASONAL_HUBS)) {
    if (inSeason(hub, date)) return { id, ...hub };
  }
  return null;
}

/* Applies a hub entry to the document: sets the CSS custom properties the
   template styles read, and the backdrop image-set()s. This is the ONLY place
   that turns config into presentation, which is what keeps the template free
   of per-season code. */
function applyHub(id, doc) {
  const d = doc || document;
  const hub = SEASONAL_HUBS[id];
  if (!hub) return null;
  const r = d.documentElement.style;
  const set = (k, v) => r.setProperty(k, v);
  const imageSet = (base) =>
    'image-set(url("' + base + '.webp") type("image/webp"), url("' + base + '.jpg") type("image/jpeg"))';

  /* Derived accent shades, computed here rather than with color-mix() in CSS:
     support for color-mix varies, and a failed mix silently yields an
     unreadable pairing (it produced a 1.13:1 badge before this). Explicit
     rgba/hex is deterministic and testable. */
  const rgb = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = rgb(hub.accent);
  const toward = (t) => "rgb(" + [ar, ag, ab]
    .map((c) => Math.round(c + (255 - c) * t)).join(",") + ")";

  set("--ground", hub.ground);
  set("--accent", hub.accent);
  set("--accent-ink", hub.accentInk);
  set("--accent-tint", `rgba(${ar},${ag},${ab},.16)`);   // fills
  set("--accent-edge", `rgba(${ar},${ag},${ab},.55)`);   // borders
  set("--accent-soft", toward(0.62));                    // text on the dark ground
  set("--backdrop-wide", imageSet(hub.backdrop.wide));
  set("--backdrop-tall", imageSet(hub.backdrop.tall));
  set("--backdrop-fallback", 'url("' + hub.backdrop.fallback + '")');
  set("--scrim-wide", hub.scrim.wide);
  set("--scrim-tall", hub.scrim.tall);
  /* Also set the element background directly: an inline style beats the
     stylesheet, so this is what guarantees a correct ground on first paint. */
  r.setProperty("background", hub.ground);
  d.documentElement.setAttribute("data-hub", id);
  return hub;
}

/* Node (tests) and browser both, without a build step. */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SEASONAL_HUBS, inSeason, hubForDate, applyHub };
}
