path = "/workspaces/sunscout2/public/index.html"

with open(path, "r") as f:
    content = f.read()

# --- Step 1: Inject esc() helper ---
esc_helper = (
    "\n// XSS protection — escape all API-sourced data before innerHTML\n"
    "function esc(s){ var d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }\n"
)
marker = "let favorites = [];"
if marker in content:
    content = content.replace(marker, esc_helper + marker, 1)
    print("✅ esc() helper injected")
else:
    print("❌ marker not found")

# --- Step 2: Wrap the specific innerHTML injection points ---
fixes = [
    # Detail modal title
    (
        '"<h2 class=\'detail-modal-title\'>"+(a.name||"")+"</h2>"',
        '"<h2 class=\'detail-modal-title\'>"+esc(a.name)+"</h2>"'
    ),
    # Detail modal desc
    (
        '"<p class=\'detail-modal-desc\'>"+a.desc+"</p>"',
        '"<p class=\'detail-modal-desc\'>"+esc(a.desc)+"</p>"'
    ),
    # Detail modal address
    (
        '"<div class=\'detail-modal-row\'><span>📍</span><span>"+a.address+"</span></div>"',
        '"<div class=\'detail-modal-row\'><span>📍</span><span>"+esc(a.address)+"</span></div>"'
    ),
    # Card title
    (
        '"<h3 class=\\"card-title\\">"+(a.name||"")+"</h3>"',
        '"<h3 class=\\"card-title\\">"+esc(a.name)+"</h3>"'
    ),
    # Card address
    (
        '"<p class=\\"info\\"><span>📍</span><span>"+a.address+"</span></p>"',
        '"<p class=\\"info\\"><span>📍</span><span>"+esc(a.address)+"</span></p>"'
    ),
    # Card desc
    (
        '"+a.desc.slice(0,120)+(a.desc.length>120?"…":"")+"',
        '"+esc(a.desc.slice(0,120))+(a.desc.length>120?"…":"")+"'
    ),
]

count = 0
for old, new in fixes:
    if old in content:
        content = content.replace(old, new)
        print(f"✅ Escaped: {old[:55]}...")
        count += 1
    else:
        print(f"⚠️  Not found: {old[:55]}...")

print(f"\n✅ {count}/{len(fixes)} replacements made")

with open(path, "w") as f:
    f.write(content)

print("\nVerify:")
print("  grep -n 'esc(a\\.name\|esc(a\\.desc\|esc(a\\.address' /workspaces/sunscout2/public/index.html")
