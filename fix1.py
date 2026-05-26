import re

path = "/workspaces/sunscout2/api/activities.js"

with open(path, "r") as f:
    content = f.read()

# --- Fix 1: Restrict CORS origin ---
old_cors = 'res.setHeader("Access-Control-Allow-Origin", "*");'
new_cors = (
    'const allowedOrigins = [\n'
    '    "https://sunscout2.vercel.app",\n'
    '    "https://sun-scout-tau.vercel.app",\n'
    '    "http://localhost:5173",\n'
    '    "http://localhost:3000"\n'
    '  ];\n'
    '  const origin = req.headers.origin || "";\n'
    '  const allowed = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];\n'
    '  res.setHeader("Access-Control-Allow-Origin", allowed);\n'
    '  res.setHeader("Vary", "Origin");'
)

if old_cors in content:
    content = content.replace(old_cors, new_cors)
    print("✅ CORS restriction applied")
else:
    print("❌ CORS line not found")

# --- Fix 2: Input validation allowlist ---
old_query = '  const { tab = "free", city = "Sunnyvale", age = "all" } = req.query;'
new_query = (
    '  const { tab = "free", city = "Sunnyvale", age = "all" } = req.query;\n\n'
    '  const VALID_TABS   = ["free","paid","indoor","outdoor","weekend"];\n'
    '  const VALID_CITIES = ["Sunnyvale","San Jose","Cupertino","Mountain View","Palo Alto","Saratoga","Fremont"];\n'
    '  const VALID_AGES   = ["all","0","1","2","3"];\n'
    '  if (!VALID_TABS.includes(tab))    return res.status(400).json({ error: "Invalid tab" });\n'
    '  if (!VALID_CITIES.includes(city)) return res.status(400).json({ error: "Invalid city" });\n'
    '  if (!VALID_AGES.includes(age))    return res.status(400).json({ error: "Invalid age" });'
)

if old_query in content:
    content = content.replace(old_query, new_query)
    print("✅ Input validation added")
else:
    print("❌ req.query line not found")

with open(path, "w") as f:
    f.write(content)

print("\nVerify with:")
print("  grep -n 'allowedOrigins\\|VALID_TABS' /workspaces/sunscout2/api/activities.js")
