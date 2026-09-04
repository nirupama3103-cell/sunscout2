# Seasonal hero photographs

`applySeason()` points the hero background at `SEASON.heroBg` (see
`/public/config/seasons.js`). Each season needs **two** files — a `.jpg`
and a matching `.webp`; the CSS uses `image-set()` and takes the webp where
supported, falling back to the jpg.

## Status

| Season | Files | Status |
| ------ | ----- | ------ |
| Spring | `hero-spring.jpg` + `.webp` | ✅ sunset sky (shared with summer) |
| Summer | `hero-summer.jpg` + `.webp` | ✅ sunset sky (shared with spring) |
| Fall   | `hero-fall.jpg` + `.webp`   | ✅ sunset sky, graded warm |
| Winter | `hero-winter.jpg` + `.webp` | ✅ sunset sky, graded cool and flat |

Spring and summer are seasonally adjacent and share one asset: the same
source image saved under both names.

Fall and winter are that same sky, graded — see
`scripts/build-season-heroes.js`. Grading rather than sourcing four
photographs is deliberate: this sky has no subject in it, so there is no
edge for a headline to land on and the luminance barely moves across the
frame. A scene with branches and a horizon would put hard contrast under
the type. Both grades stay light on purpose, because the hero sets dark
text on a light ground.

The photograph sits UNDER the hero's translucent sunset panel rather than
replacing it — see the `[data-hero-img="on"]` block in
`/public/css/editorial.css`. index.html's own rules for that attribute
belong to an earlier navy hero and would flip the headline to white.

Until a file exists the hero falls back to the warm gradient — nothing
breaks, and no request is made for a missing image.

## Adding one

```sh
node scripts/optimise-hero.js ~/path/to/photo.jpg summer
```

That resizes to 1600px wide (never upscaling), re-encodes both formats at
quality 0.72, writes them here and prints the byte sizes. Keep the jpg
under 200KB.

Then **re-check contrast** — the ratio depends entirely on how bright that
particular photograph is:

```sh
python3 -m http.server 8765 --directory public &
node scripts/check-hero-contrast.js "http://localhost:8765/?season=summer"
```

It samples the real rendered pixels behind the top, middle and bottom of
the hero text and fails (exit 1) if anything falls below 4.5:1.

## Resolution

The optimiser **never upscales**, so the source sets the ceiling. Below
1600px wide it prints a warning and the hero will look soft on a wide
desktop — the current sunset sky is 913px and does exactly that. Nothing
downstream can recover detail that was not in the file.

## Choosing an image

The scrim is tuned for skies that are **darker at the top and paler at the
bottom**. An image that is bright across the whole frame — or bright in the
upper-left where the headline sits — will need the scrim raised. The
contrast checker will tell you.
