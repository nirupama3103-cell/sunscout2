# Optional photos for two deals

Two Local Table deals ship without a photograph and draw a designed plate
instead - a CSS panel with the cuisine set as a ghosted wordmark behind the
dish emoji. That is the intended finished state, not a placeholder, so
nothing here is blocking.

| File | Deal | Would show |
|---|---|---|
| `mcdonalds-meal.jpg` | `d7` McDonald's free item | Burger, drink and fries on a tray |
| `valley-goat-grazing.jpg` | `d11` Valley Goat grazing hour | Mezze spread, flatbread, cocktail |

Dropping either file in at these exact paths swaps the plate for the photo
automatically - the markup renders the plate only when `img` is empty, so
point the deal's `img` at the new file in `PHOTO` and it takes over.

JPEG, ~900px wide, under 60 KB. Cards crop 16:9 from the centre.

## Check the file is not empty before committing

An earlier upload produced two correctly-sized but blank files: 900x506,
16:9, 7.7 KB each, solid grey. Verify real content first:

```bash
python3 - <<'EOF' path/to/photo.jpg
import zlib, sys
for f in sys.argv[1:]:
    d = open(f, 'rb').read(); s = d[d.find(b'\xff\xda'):]
    r = len(zlib.compress(s, 9)) / len(s)
    print(f, f'{len(d)/1024:.1f} KB', 'EMPTY' if r < 0.3 else 'ok')
EOF
```

A real photo's scan data is already dense and will not compress further, so
the ratio sits near 1.0; an empty canvas compresses to under 1%. A genuine
900px food photo lands around 20-60 KB.
