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
| Fall   | `hero-fall.jpg` + `.webp`   | **TODO** — warm low sun, bare branches, overcast |
| Winter | `hero-winter.jpg` + `.webp` | **TODO** — cool blue-grey, low contrast |

Spring and summer are seasonally adjacent and are meant to share one asset:
save the same source image under both names.

Until a file exists the hero falls back to the original warm gradient with
dark text — nothing breaks, and no request is made for a missing image.

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
