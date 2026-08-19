#!/usr/bin/env python3
"""Move the moov atom ahead of mdat so playback can start before the whole
file arrives (what `ffmpeg -movflags +faststart` does). Pure container
surgery: sample data is copied byte-for-byte, nothing is re-encoded."""
import struct, sys

def atoms(buf, start=0, end=None):
    """Yield (name, header_start, body_start, body_end) for one atom level."""
    end = len(buf) if end is None else end
    p = start
    while p + 8 <= end:
        size = struct.unpack('>I', buf[p:p+8][:4])[0]
        name = buf[p+4:p+8]
        hdr = 8
        if size == 1:                      # 64-bit extended size
            size = struct.unpack('>Q', buf[p+8:p+16])[0]; hdr = 16
        elif size == 0:                    # extends to EOF
            size = end - p
        if size < hdr or p + size > end:
            raise ValueError(f'bad atom {name!r} size {size} at {p}')
        yield name, p, p + hdr, p + size
        p += size

def patch_offsets(moov, delta):
    """Add `delta` to every chunk offset in every stco/co64, at any depth."""
    out = bytearray(moov); n = 0
    def walk(s, e):
        nonlocal n
        for name, a, b, c in atoms(out, s, e):
            if name in (b'stco', b'co64'):
                cnt = struct.unpack('>I', out[b+4:b+8])[0]
                p = b + 8
                if name == b'stco':
                    for _ in range(cnt):
                        v = struct.unpack('>I', out[p:p+4])[0] + delta
                        if v > 0xFFFFFFFF:
                            raise ValueError('offset overflows 32-bit stco')
                        out[p:p+4] = struct.pack('>I', v); p += 4
                else:
                    for _ in range(cnt):
                        v = struct.unpack('>Q', out[p:p+8])[0] + delta
                        out[p:p+8] = struct.pack('>Q', v); p += 8
                n += cnt
            elif name in (b'moov', b'trak', b'mdia', b'minf', b'stbl', b'edts'):
                walk(b, c)
    walk(0, len(out))
    return bytes(out), n

def faststart(path):
    src = open(path, 'rb').read()
    top = list(atoms(src))
    names = [a[0] for a in top]
    if b'moov' not in names or b'mdat' not in names:
        return None, 'no moov/mdat'
    mi, di = names.index(b'moov'), names.index(b'mdat')
    if mi < di:
        return None, 'already faststart'
    _, ms, _, me = top[mi]
    moov = src[ms:me]
    moov, cnt = patch_offsets(moov, len(moov))
    # Keep every other atom, including `free`. Dropping free padding would
    # shift mdat by more than len(moov) and invalidate the patched offsets.
    keep = lambda a: a[0] != b'moov'
    head = b''.join(src[a[1]:a[3]] for a in top[:di] if keep(a))   # before mdat
    rest = b''.join(src[a[1]:a[3]] for a in top[di:] if keep(a))   # mdat onward
    return head + moov + rest, f'moved moov ({len(moov)} B), patched {cnt} chunk offsets'

if __name__ == '__main__':
    for p in sys.argv[1:]:
        out, msg = faststart(p)
        if out is None:
            print(f'{p}: skipped — {msg}'); continue
        open(p + '.fs', 'wb').write(out)
        print(f'{p}: {msg}')
