# Open Graph share images

`applySeason()` points `og:image` / `twitter:image` at `SEASON.og`, swapping
it in only once the file is confirmed to load — so a missing card falls back
to `/og-image.jpg` rather than producing a broken share preview.

All 1200 × 630 JPG, matching the `og:image:width` / `og:image:height` meta.

| File | Status | Source |
| ---- | ------ | ------ |
| `og-spring.jpg` | ✅ | `scripts/build-og-seasons.js` |
| `og-summer.jpg` | ✅ | `scripts/build-og-seasons.js` |
| `og-fall.jpg` | ✅ | `scripts/build-og-seasons.js` |
| `og-winter.jpg` | ✅ | `scripts/build-og-seasons.js` |
| `og-halloween.jpg` | ✅ | `scripts/og-halloween.template.html` |

## Regenerating the four seasonal cards

```sh
node scripts/build-og-seasons.js
```

The copy is read out of `public/config/seasons.js` at render time — the chip,
both hero lines and the opening clause of the sub — so a card can never
contradict the site. **Re-run this after editing any season's copy**, or the
share preview will quote wording the page no longer uses.

Art direction lives in `scripts/og-season.template.html`; each season
contributes only a palette, defined in the `PALETTE` map in the build script.
The hairline grid and corner ticks mirror the site hero so the cards and the
page read as one system.

## Fonts

The renderer pulls Nunito from Google Fonts. Where that is unreachable it
falls back to a system sans and the cards still render, just not in the brand
face — regenerate somewhere with network access if the type looks wrong.
