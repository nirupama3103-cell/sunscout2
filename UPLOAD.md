# Files to upload

Everything else on this branch is done. These six files are the only
outstanding items, and the code is already wired for all of them — drop the
files in at these exact paths and they work with no further code changes.

## 1. Re-encoded reel videos → `public/`

The DIY reel stalls because these four are 4–5x every other clip. The other
nine are all ~2.5 MB for the same job. Target ~2.5 MB each.

| File | Now | Target |
|---|---|---|
| `fuse-beads.mp4` | 12.4 MB | ~2.5 MB |
| `lego.mp4` | 11.6 MB | ~2.5 MB |
| `chinese-checkers.mp4` | 11.3 MB | ~2.5 MB |
| `marble-solitaire.mp4` | 11.5 MB | ~2.5 MB |

```bash
ffmpeg -i IN.mp4 -vf "scale=-2:720" -c:v libx264 -crf 28 \
       -preset slow -an -movflags +faststart OUT.mp4
```

`-an` drops audio (the reel is muted); `+faststart` lets playback begin
before the download finishes. Keep the same filenames.

## 2. Deal photos → `public/local-table/assets/lt4/`

Filenames must match exactly or the cards keep falling back to their emoji.

| File | Deal | Shows |
|---|---|---|
| `mcdonalds-meal.jpg` | `d7` McDonald's free item | Burger, drink, fries on a tray |
| `valley-goat-grazing.jpg` | `d11` Valley Goat grazing hour | Mezze spread, flatbread, cocktail |

JPEG, ~900px wide, under 60 KB — every other photo in `assets/` is 14–56 KB.
Cards crop 16:9 from the centre, so keep the subject centred.

## Optional, for polish

Four DIY card images are the weakest visuals on that page:

- `images/diy-lego.png` — only 231x222, displayed at 427x320, so it is
  upscaled ~1.9x and looks soft.
- `images/diy-fusebeads-hero.jpg` — 3024x4032 and 2.8 MB for a 427px slot.
- `images/diy-snake.png`, `images/diy-chinese.png` — white margins baked into
  the file, which is the grey banding on those cards.

Replacing them with ~900px edge-to-edge crops under 60 KB would do more for
how premium DIY feels than any further CSS.

## Nothing renders broken while you wait

Missing photos fall back to the card's emoji on a tinted panel, and reel tiles
whose photo 404s remove themselves. The page is safe to ship as-is.
