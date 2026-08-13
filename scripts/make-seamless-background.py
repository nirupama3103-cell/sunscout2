#!/usr/bin/env python3
"""
Regenerate public/assets/page-background.webp as a seamlessly tileable image.

The source art (a 556px lowpoly square) is not tileable: opposite edges differ
by a mean of ~55/255 where adjacent interior columns differ by ~1.4, so tiling
it shows a hard grid at every tile boundary.

Fix: shift the image by half a tile and cross-fade toward the shifted copy near
each border. Border pixels then come from the *interior* of the original, which
is continuous across the wrap, so tile N's last column and tile N+1's first
column are neighbours in the original art.

The two passes must be SEPARABLE (one axis at a time). A single 2D min(x, y)
mask dips near the top and bottom edges along the tile's vertical centre line,
which re-exposes the original seam there. Blending one axis at a time keeps the
rolled copy's own discontinuity at full mask weight, where it contributes zero.

Usage:  python3 scripts/make-seamless-background.py <source-image>
Requires: pillow, numpy.
"""

import sys
import pathlib
import numpy as np
from PIL import Image

# Blend radius as a FRACTION of the tile edge, not a pixel count, so the heal
# does not silently regress if the source tile ever changes size.
# 0.16 of a 556px tile ~= 89px. Larger = smoother transition but flatter
# contrast; smaller = more contrast retained but a tighter blend band.
BLEND_RATIO = 0.16

WEBP_QUALITY = 84
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "assets" / "page-background.webp"


def smoothstep(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def heal(a, blend_ratio=BLEND_RATIO):
    """Return a seamlessly tileable copy of RGB float array `a`."""
    h, w, _ = a.shape

    # Pass 1 - horizontal only. Mask depends on x alone, so the rolled copy's
    # vertical discontinuity (at x == w/2, where the mask is 1) contributes nothing.
    dx = max(1.0, blend_ratio * w)
    mx = smoothstep(np.minimum(np.arange(w), w - 1 - np.arange(w)) / dx)[None, :, None]
    a = a * mx + np.roll(a, w // 2, axis=1) * (1.0 - mx)

    # Pass 2 - vertical only, same argument by symmetry.
    dy = max(1.0, blend_ratio * h)
    my = smoothstep(np.minimum(np.arange(h), h - 1 - np.arange(h)) / dy)[:, None, None]
    a = a * my + np.roll(a, h // 2, axis=0) * (1.0 - my)

    return a


def report(original, healed):
    """Print the checks that matter. A tile is seamless when the step across the
    join is no larger than the largest step already present inside the tile."""
    o = healed.astype(int)
    print("  edge delta   H %.2f  V %.2f" % (
        abs(o[:, -1, :] - o[:, 0, :]).mean(),
        abs(o[-1, :, :] - o[0, :, :]).mean()))
    print("  interior ref %.2f" % abs(o[:, 278 % o.shape[1], :] - o[:, (278 % o.shape[1]) + 1, :]).mean())

    g = healed.mean(2)
    for name, tiled in (("horizontal", np.concatenate([g, g], axis=1)),
                        ("vertical", np.concatenate([g, g], axis=0).T)):
        d = abs(np.diff(tiled, axis=1)).mean(0)
        join = d[g.shape[1] - 1] if name == "horizontal" else d[g.shape[0] - 1]
        print("  %-10s join step %.2f vs worst interior %.2f  %s"
              % (name, join, d.max(), "OK" if join <= d.max() else "SEAM"))

    print("  contrast retained %.0f%%" % (100 * healed.mean(2).std() / original.mean(2).std()))


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = pathlib.Path(sys.argv[1])
    original = np.asarray(Image.open(src).convert("RGB")).astype(float)
    if original.shape[0] != original.shape[1]:
        print("note: source is %dx%d, not square" % (original.shape[1], original.shape[0]))

    healed = heal(original)
    report(original, healed)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(healed.round().clip(0, 255).astype("uint8")).save(
        OUT, "WEBP", quality=WEBP_QUALITY, method=6)
    print("wrote %s (%d bytes)" % (OUT, OUT.stat().st_size))


if __name__ == "__main__":
    main()
