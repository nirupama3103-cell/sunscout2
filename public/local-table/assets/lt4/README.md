# Photos to drop in

Two Local Table deals reference files that are not in the repo yet. Until they
are added, both cards fall back to their emoji on the tinted panel — the page
does not show a broken image either way.

| File | Deal | What the photo shows |
|---|---|---|
| `mcdonalds-meal.jpg` | `d7` — McDonald's free item | Burger, drink and fries on a tray |
| `valley-goat-grazing.jpg` | `d11` — Valley Goat grazing hour | Mezze spread, flatbread, cocktail |

Save both as JPEG, roughly 900px wide, under ~60 KB, to match the rest of
`local-table/assets/` (every other photo there is 14–56 KB). The cards crop
16:9 from the centre, so keep the subject centred.

## Check before you push

A previous upload produced two correctly-sized but **empty** files: 900x506,
16:9, 7.7 KB each, and solid grey. Both were removed rather than merged - a
flat grey rectangle reads as broken, while the emoji fallback reads as
deliberate.

Verify a file has real content before committing:

```bash
python3 - <<'PY'
import zlib, sys
for f in sys.argv[1:]:
    d = open(f, 'rb').read(); s = d[d.find(b'\xff\xda'):]
    r = len(zlib.compress(s, 9)) / len(s)
    print(f, f'{len(d)/1024:.1f} KB', 'EMPTY' if r < 0.3 else 'ok')
PY
```

Real photo scan data is already dense and will not compress further, so the
ratio sits near 1.0. An empty canvas compresses to under 1%. A genuine 900px
food photo lands around 20-60 KB; every other photo in assets/ is 14-56 KB.
