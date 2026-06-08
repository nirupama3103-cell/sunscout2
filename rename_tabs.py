#!/usr/bin/env python3
# Renames the Free/Paid TAB labels to "Free Summer" / "Paid Summer"
# across every filter UI, without touching price badges, the About list,
# meta titles, or the bottom nav.

import sys

PATH = "public/index.html"

# (old, new) — each old must appear exactly once.
REPLACEMENTS = [
    # dtE dropdown chips (plain text)
    ('''onclick="dtE('free','Free',event)">Free</div>''',
     '''onclick="dtE('free','Free Summer',event)">Free Summer</div>'''),
    ('''onclick="dtE('paid','Paid',event)">Paid</div>''',
     '''onclick="dtE('paid','Paid Summer',event)">Paid Summer</div>'''),
    # ssSelExplore dropdown chips (emoji + text)
    ('''onclick="ssSelExplore('free','Free',event)">🆓 Free</div>''',
     '''onclick="ssSelExplore('free','Free Summer',event)">🆓 Free Summer</div>'''),
    ('''onclick="ssSelExplore('paid','Paid',event)">💰 Paid</div>''',
     '''onclick="ssSelExplore('paid','Paid Summer',event)">💰 Paid Summer</div>'''),
    # hidden canonical tab bar (drop "Activities" so it reads cleanly)
    ('''<span class="tab-label">Free Summer Activities</span>''',
     '''<span class="tab-label">Free Summer</span>'''),
    ('''<span class="tab-label">Paid Summer Activities</span>''',
     '''<span class="tab-label">Paid Summer</span>'''),
]

with open(PATH, "r", encoding="utf-8") as f:
    html = f.read()

errors = []
for old, new in REPLACEMENTS:
    n = html.count(old)
    if n != 1:
        errors.append(f"  [{n}x] expected 1: {old[:60]}...")
        continue
    html = html.replace(old, new)
    print(f"  OK  -> {new.split('>')[-2] if '>' in new else new[:40]}")

if errors:
    print("\nABORTED — these did not match exactly once (no file written):")
    print("\n".join(errors))
    sys.exit(1)

with open(PATH, "w", encoding="utf-8") as f:
    f.write(html)

print(f"\nDone. {len(REPLACEMENTS)} labels updated in {PATH}.")
