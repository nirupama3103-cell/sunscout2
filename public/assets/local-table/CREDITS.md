# Local Table — photo credits

Photos used by the deal cards in `local-table/index.html`.

**Status: skeleton — every `TBD` below is unfilled, not verified.**

The images are still hotlinked from Unsplash. This session had no network
access to `images.unsplash.com` (blocked by the environment's network policy),
so nothing that requires fetching could be recorded. Those fields are left as
`TBD` rather than guessed.

Only the CDN request URL below is verified — it is copied verbatim from the
design export. The `images.unsplash.com/photo-<id>` identifier is *not* the
same as the `unsplash.com/photos/<slug>` page id, so the human-facing photo
page cannot be derived from it and must be looked up.

## Follow-up session checklist

For each photo, preserving the original aspect ratio:

1. Fetch the photo page; record photographer name and profile URL.
2. Generate `<key>-600.webp` + `<key>-600.jpg` and `<key>-1200.webp` +
   `<key>-1200.jpg` into `assets/local-table/`.
3. Swap the `PHOTO` map in `local-table/index.html` for `<picture>` markup
   with the WebP source and JPG fallback.
4. Replace every `TBD` in this file.

The Unsplash license does not require attribution. It is recorded here in case
those terms change.

---

## burger

- **Used by:** `d11` Burger and fries drop
- **CDN request URL (verified):**
  `https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=70`
- **Unsplash photo page:** TBD
- **Photographer:** TBD
- **Photographer profile:** TBD
- **Local files:** TBD

## cafe

- **Used by:** `d7` Afternoon pastry + coffee
- **CDN request URL (verified):**
  `https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=70`
- **Unsplash photo page:** TBD
- **Photographer:** TBD
- **Photographer profile:** TBD
- **Local files:** TBD

## dimsum

- **Used by:** `d2` Late-night dim sum cart
- **CDN request URL (verified):**
  `https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=900&q=70`
- **Unsplash photo page:** TBD
- **Photographer:** TBD
- **Photographer profile:** TBD
- **Local files:** TBD

## indian

- **Used by:** `d4` Thali plate special
- **CDN request URL (verified):**
  `https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=70`
- **Unsplash photo page:** TBD
- **Photographer:** TBD
- **Photographer profile:** TBD
- **Local files:** TBD

## korean

- **Used by:** `d5` Korean fried chicken night
- **CDN request URL (verified):**
  `https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=70`
- **Unsplash photo page:** TBD
- **Photographer:** TBD
- **Photographer profile:** TBD
- **Local files:** TBD

## pho

- **Used by:** `d12` Pho after hours
- **CDN request URL (verified):**
  `https://images.unsplash.com/photo-1547928576-b822bc410bdf?auto=format&fit=crop&w=900&q=70`
- **Unsplash photo page:** TBD
- **Photographer:** TBD
- **Photographer profile:** TBD
- **Local files:** TBD

## pizza

- **Used by:** `d8` Two-slice lunch
- **CDN request URL (verified):**
  `https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=70`
- **Unsplash photo page:** TBD
- **Photographer:** TBD
- **Photographer profile:** TBD
- **Local files:** TBD

## pub

- **Used by:** `d3` Post-work happy hour
- **CDN request URL (verified):**
  `https://images.unsplash.com/photo-1436076863939-06870fe779c2?auto=format&fit=crop&w=900&q=70`
- **Unsplash photo page:** TBD
- **Photographer:** TBD
- **Photographer profile:** TBD
- **Local files:** TBD

## ramen

- **Used by:** `d1` Express lunch combo
- **CDN request URL (verified):**
  `https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=70`
- **Unsplash photo page:** TBD
- **Photographer:** TBD
- **Photographer profile:** TBD
- **Local files:** TBD

## salad

- **Used by:** `d10` Build-your-own bowl
- **CDN request URL (verified):**
  `https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=70`
- **Unsplash photo page:** TBD
- **Photographer:** TBD
- **Photographer profile:** TBD
- **Local files:** TBD

## sushi

- **Used by:** `d9` Sushi happy hour rolls
- **CDN request URL (verified):**
  `https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=900&q=70`
- **Unsplash photo page:** TBD
- **Photographer:** TBD
- **Photographer profile:** TBD
- **Local files:** TBD

## taco

- **Used by:** `d6` Off-peak taco drop
- **CDN request URL (verified):**
  `https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=70`
- **Unsplash photo page:** TBD
- **Photographer:** TBD
- **Photographer profile:** TBD
- **Local files:** TBD
