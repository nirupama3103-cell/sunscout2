# Open Graph share images

<!-- TODO: create the 4 seasonal OG images listed below. -->

`applySeason()` in `public/index.html` points `og:image` / `twitter:image` at
`SEASON.og`. Each file is **1200 × 630 px JPG** (matches the existing
`og:image:width` / `og:image:height` meta tags).

Until a file exists here the page silently falls back to `/og-image.jpg` —
the swap only happens after the seasonal image is confirmed to load, so a
missing file never produces a broken share card.

| Season | File            | Suggested art                                  |
| ------ | --------------- | ---------------------------------------------- |
| Spring | `og-spring.jpg` | 🌸 Blossom trails, egg hunts, spring break camps |
| Summer | `og-summer.jpg` | ☀️ Splash pads, storytimes, summer camps         |
| Fall   | `og-fall.jpg`   | 🍂 Pumpkin patches, harvest festivals            |
| Winter | `og-winter.jpg` | ❄️ Holiday lights, ice rinks                     |

Keep the SunScout logo, Nunito type and the brand palette
(sunny orange `#FF9900` + blue `#1565c0`). Compress before committing.
