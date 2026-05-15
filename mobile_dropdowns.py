path = "/workspaces/sunscout2/public/index.html"
with open(path) as f:
    html = f.read()

# Replace the mobile filter panels HTML with dropdown style
old_panels = """<!-- CITY PANEL -->
<div class="mobile-filter-panel active" id="mfp-city">
  <div class="m-city-grid" id="m-city-grid"></div>
</div>

<!-- EXPLORE PANEL -->
<div class="mobile-filter-panel" id="mfp-explore">
  <div class="m-tab-grid">
    <button class="m-tab-card on" style="background:#FF9900;" onclick="setMobileTab('free',this)">
      <span class="m-tab-card-icon">🆓</span>Free Summer
    </button>
    <button class="m-tab-card" style="background:#E53935;" onclick="setMobileTab('paid',this)">
      <span class="m-tab-card-icon">🎟️</span>Paid Summer
    </button>
    <button class="m-tab-card" style="background:#0288D1;" onclick="setMobileTab('indoor',this)">
      <span class="m-tab-card-icon">🏛️</span>Indoor
    </button>
    <button class="m-tab-card" style="background:#2E7D32;" onclick="setMobileTab('outdoor',this)">
      <span class="m-tab-card-icon">🌳</span>Outdoor
    </button>
    <button class="m-tab-card" style="background:#8E24AA;grid-column:1/-1;" onclick="setMobileTab('weekend',this)">
      <span class="m-tab-card-icon">📅</span>Weekend Only
    </button>
  </div>
</div>

<!-- AGE PANEL -->
<div class="mobile-filter-panel" id="mfp-age">
  <div class="m-age-grid">
    <button class="m-age-btn on" onclick="setMobileAge('all',this)">🌟 All Ages</button>
    <button class="m-age-btn" onclick="setMobileAge('0',this)">👶 0–2</button>
    <button class="m-age-btn" onclick="setMobileAge('1',this)">🧸 3–5</button>
    <button class="m-age-btn" onclick="setMobileAge('2',this)">🎒 6–12</button>
    <button class="m-age-btn" onclick="setMobileAge('3',this)">🛹 Teen</button>
  </div>
</div>"""

new_panels = """<!-- DROPDOWNS -->
<div style="position:relative;z-index:100;padding:0 12px;">

  <!-- City Dropdown -->
  <div id="dd-city" style="display:none;background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.12);padding:8px;margin-bottom:4px;">
    <div class="m-city-grid" id="m-city-grid"></div>
  </div>

  <!-- Explore Dropdown -->
  <div id="dd-explore" style="display:none;background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.12);padding:8px;margin-bottom:4px;">
    <div class="m-tab-grid">
      <button class="m-tab-card on" style="background:#FF9900;" onclick="setMobileTab('free',this)"><span class="m-tab-card-icon">🆓</span>Free Summer</button>
      <button class="m-tab-card" style="background:#E53935;" onclick="setMobileTab('paid',this)"><span class="m-tab-card-icon">🎟️</span>Paid Summer</button>
      <button class="m-tab-card" style="background:#0288D1;" onclick="setMobileTab('indoor',this)"><span class="m-tab-card-icon">🏛️</span>Indoor</button>
      <button class="m-tab-card" style="background:#2E7D32;" onclick="setMobileTab('outdoor',this)"><span class="m-tab-card-icon">🌳</span>Outdoor</button>
      <button class="m-tab-card" style="background:#8E24AA;grid-column:1/-1;" onclick="setMobileTab('weekend',this)"><span class="m-tab-card-icon">📅</span>Weekend Only</button>
    </div>
  </div>

  <!-- Age Dropdown -->
  <div id="dd-age" style="display:none;background:#fff;border-radius:16px;box-shadow:0 8px 24px rgba(0,0,0,0.12);padding:8px;margin-bottom:4px;">
    <div class="m-age-grid">
      <button class="m-age-btn on" onclick="setMobileAge('all',this)">🌟 All Ages</button>
      <button class="m-age-btn" onclick="setMobileAge('0',this)">👶 0–2</button>
      <button class="m-age-btn" onclick="setMobileAge('1',this)">🧸 3–5</button>
      <button class="m-age-btn" onclick="setMobileAge('2',this)">🎒 6–12</button>
      <button class="m-age-btn" onclick="setMobileAge('3',this)">🛹 Teen</button>
    </div>
  </div>

</div>"""

html = html.replace(old_panels, new_panels, 1)

# Replace switchMFT to toggle dropdowns instead
old_fn = """function switchMFT(tab) {
  console.log("switchMFT called:", tab);
  ['city','explore','age'].forEach(function(t) {
    document.getElementById('mft-'+t).classList.toggle('active', t===tab);
    document.getElementById('mfp-'+t).classList.toggle('active', t===tab);
  });
}"""

new_fn = """function switchMFT(tab) {
  var dds = ['city','explore','age'];
  dds.forEach(function(t) {
    var dd = document.getElementById('dd-'+t);
    var btn = document.getElementById('mft-'+t);
    var isOpen = dd && dd.style.display !== 'none';
    var isThis = t === tab;
    if(dd) dd.style.display = (isThis && !isOpen) ? 'block' : 'none';
    if(btn) btn.classList.toggle('active', isThis && !isOpen);
  });
  buildMobileCities();
}"""

html = html.replace(old_fn, new_fn, 1)

with open(path, 'w') as f:
    f.write(html)

print("Dropdowns built!")
print("Run: git add -A && git commit -m 'Mobile filter dropdowns' && git push")
