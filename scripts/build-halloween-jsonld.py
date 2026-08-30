#!/usr/bin/env python3
"""Regenerate the Halloween hub's JSON-LD from events.json.

The hub ships static structured data (it is not runtime-patched), so the
ItemList has to be written into the HTML. Generating it from the same file
the page renders from means the two cannot drift apart.

Run after editing events.json:
    python3 scripts/build-halloween-jsonld.py
"""
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HUB = os.path.join(ROOT, "public", "seasons", "halloween")
PAGE = os.path.join(HUB, "index.html")
DATA = os.path.join(HUB, "events.json")
BASE = "https://www.sunscoutkids.com"
HUB_URL = BASE + "/seasons/halloween/"

with io.open(DATA, encoding="utf-8") as fh:
    events = json.load(fh)["events"]

item_list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Halloween for Bay Area Kids 2026",
    "description": (
        "Curated Halloween events for Bay Area families, rated by scare level "
        "and flagged for sensory-friendly options."
    ),
    "url": HUB_URL,
    "numberOfItems": len(events),
    "itemListOrder": "https://schema.org/ItemListUnordered",
    "itemListElement": [
        {
            "@type": "ListItem",
            "position": i + 1,
            "item": {
                "@type": "Event",
                "name": e["name"],
                "url": e["url"],
                "description": e["notes"],
                "eventStatus": "https://schema.org/EventScheduled",
                "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                "location": {
                    "@type": "Place",
                    "name": e["name"],
                    "address": {
                        "@type": "PostalAddress",
                        "streetAddress": e["address"],
                        "addressLocality": e["city"] if e["city"] != "Nearby" else "San Francisco Bay Area",
                        "addressRegion": "CA",
                        "addressCountry": "US",
                    },
                },
                "isAccessibleForFree": e["cost"] == "free",
                "typicalAgeRange": "%s-%s" % (
                    e["ages"][0].split("-")[0],
                    e["ages"][-1].split("-")[-1],
                ),
            },
        }
        for i, e in enumerate(events)
    ],
}

breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "SunScout Kids", "item": BASE + "/"},
        {"@type": "ListItem", "position": 2, "name": "Seasons", "item": BASE + "/seasons/"},
        {"@type": "ListItem", "position": 3, "name": "Halloween 2026", "item": HUB_URL},
    ],
}


def inject(html, element_id, payload):
    """Replace the body of <script type=application/ld+json id=...>."""
    pattern = re.compile(
        r'(<script type="application/ld\+json" id="%s">)(.*?)(</script>)' % re.escape(element_id),
        re.S,
    )
    if not pattern.search(html):
        raise SystemExit("could not find JSON-LD block id=%r in %s" % (element_id, PAGE))
    body = json.dumps(payload, indent=2, ensure_ascii=False)
    # </script> inside JSON string values would close the tag early.
    body = body.replace("</", "<\\/")
    return pattern.sub(lambda m: m.group(1) + body + m.group(3), html, count=1)


with io.open(PAGE, encoding="utf-8") as fh:
    html = fh.read()

html = inject(html, "ld-itemlist", item_list)
html = inject(html, "ld-breadcrumb", breadcrumb)

with io.open(PAGE, "w", encoding="utf-8") as fh:
    fh.write(html)

print("JSON-LD written: %d events, %d breadcrumbs" % (len(events), len(breadcrumb["itemListElement"])))
