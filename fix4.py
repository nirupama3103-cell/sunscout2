
path = "/workspaces/sunscout2/api/activities.js"

with open(path, "r") as f:
    content = f.read()

helper_fn = (
    "\n// Shared tab filter — single source of truth\n"
    "function filterByTab(tab, city) {\n"
    "  if (tab === 'paid')    return [...HARDCODED_PAID.filter(a => a.city === city), ...HARDCODED_FREE.filter(a => a.city === city && !a.isFree)];\n"
    "  if (tab === 'free')    return HARDCODED_FREE.filter(a => a.city === city && a.isFree);\n"
    "  if (tab === 'indoor')  return HARDCODED_INDOOR.filter(a => a.city === city);\n"
    "  if (tab === 'outdoor') return HARDCODED_OUTDOOR.filter(a => a.city === city);\n"
    "  if (tab === 'weekend') return HARDCODED_WEEKEND.filter(a => a.city === city || a.city === 'regional');\n"
    "  return [];\n"
    "}\n"
)

marker = "// ── Fast hardcoded-only endpoint"
if marker in content:
    content = content.replace(marker, helper_fn + marker, 1)
    print("✅ filterByTab() injected")
else:
    print("❌ marker not found")

old2 = "  const hardcodedFiltered = tab === 'paid'\n    ? [...HARDCODED_PAID.filter(a => a.city === city), ...HARDCODED_FREE.filter(a => a.city === city && !a.isFree)]\n    : tab === 'free'\n    ? HARDCODED_FREE.filter(a => a.city === city && a.isFree)\n    : tab === 'indoor'\n    ? HARDCODED_INDOOR.filter(a => a.city === city)\n    : tab === 'outdoor'\n    ? HARDCODED_OUTDOOR.filter(a => a.city === city)\n    : tab === 'weekend'\n    ? HARDCODED_WEEKEND.filter(a => a.city === city || a.city === 'regional')\n    : [];"
new2 = "  const hardcodedFiltered = filterByTab(tab, city);"
if old2 in content:
    content = content.replace(old2, new2)
    print("✅ Main handler block replaced")
else:
    print("⚠️  Main handler block not found")

old1 = "  const hardcodedFiltered =\n    tab === 'paid'    ? [...HARDCODED_PAID.filter(a => a.city === city), ...HARDCODED_FREE.filter(a => a.city === city && !a.isFree)] :\n    tab === 'free'    ? HARDCODED_FREE.filter(a => a.city === city && a.isFree) :\n    tab === 'indoor'  ? HARDCODED_INDOOR.filter(a => a.city === city) :\n    tab === 'outdoor' ? HARDCODED_OUTDOOR.filter(a => a.city === city) :\n    tab === 'weekend' ? HARDCODED_WEEKEND.filter(a => a.city === city || a.city === 'regional') :\n    [];"
new1 = "  const hardcodedFiltered = filterByTab(tab, city);"
if old1 in content:
    content = content.replace(old1, new1)
    print("✅ getHardcoded block replaced")
else:
    print("⚠️  getHardcoded block not found")

with open(path, "w") as f:
    f.write(content)

print("\nVerify:")
print("  grep -n filterByTab /workspaces/sunscout2/api/activities.js")
