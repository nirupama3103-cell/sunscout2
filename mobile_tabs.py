path = "/workspaces/sunscout2/public/index.html"
with open(path) as f:
    html = f.read()

# 1. Add mobile filter tab CSS
mobile_tab_css = """
/* ── MOBILE FILTER TABS ── */
@media(max-width:640px) {
  .mobile-filter-tabs {
    display: flex;
    gap: 8px;
    padding: 12px 16px 0;
    justify-content: center;
  }
  .mft-btn {
    flex: 1;
    padding: 10px 6px;
    border-radius: 99px;
    border: none;
    font-family: Nunito, sans-serif;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    background: #e8f4ff;
    color: #666;
    transition: all .15s;
  }
  .mft-btn.active {
    background: #FF9900;
    color: #fff;
    box-shadow: 0 3px 12px rgba(255,153,0,0.3);
  }
  .mobile-filter-panel {
    display: none;
    padding: 10px 12px 0;
    animation: fadeIn .2s ease;
  }
  .mobile-filter-panel.active {
    display: block;
  }
  /* Hide original city bar, tab bar, age bar on mobile */
  .city-bar { display: none !important; }
  .tab-bar  { display: none !important; }
  .age-bar  { display: none !important; }

  /* Mobile city buttons inside panel */
  .m-city-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .m-city-btn {
    padding: 10px 8px;
    border-radius: 99px;
    border: 2px solid #eee;
    background: #fff;
    font-family: Nunito, sans-serif;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    color: #444;
    transition: all .15s;
  }
  .m-city-btn.on {
    background: #FF9900;
    color: #fff;
    border-color: #FF9900;
  }

  /* Mobile activity cards inside panel */
  .m-tab-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .m-tab-card {
    padding: 14px 8px;
    border-radius: 16px;
    border: none;
    font-family: Nunito, sans-serif;
    font-weight: 800;
    font-size: 12px;
    cursor: pointer;
    color: #fff;
    text-align: center;
    transition: all .15s;
    box-shadow: 0 3px 10px rgba(0,0,0,0.12);
  }
  .m-tab-card.on { transform: scale(0.96); box-shadow: none; }
  .m-tab-card-icon { font-size: 1.6rem; display: block; margin-bottom: 4px; }

  /* Mobile age buttons inside panel */
  .m-age-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  .m-age-btn {
    padding: 12px 8px;
    border-radius: 99px;
    border: 2px solid #eee;
    background: #fff;
    font-family: Nunito, sans-serif;
    font-weight: 800;
    font-size: 13px;
    cursor: pointer;
    color: #444;
    transition: all .15s;
  }
  .m-age-btn.on {
    background: #FF9900;
    color: #fff;
    border-color: #FF9900;
  }

  @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
}

/* Hide mobile tabs on desktop */
@media(min-width:641px) {
  .mobile-filter-tabs { display: none !important; }
  .mobile-filter-panel { display: none !important; }
}
"""

# Insert CSS before </style>
html = html.replace("</style>", mobile_tab_css + "\n</style>", 1)

# 2. Add mobile filter tabs HTML after weather banner / city bar area
# Insert after the weather banner div
mobile_html = """
<!-- MOBILE FILTER TABS -->
<div class="mobile-filter-tabs">
  <button class="mft-btn active" id="mft-city" onclick="switchMFT('city')">📍 Pick City</button>
  <button class="mft-btn" id="mft-explore" onclick="switchMFT('explore')">🎡 Explore</button>
  <button class="mft-btn" id="mft-age" onclick="switchMFT('age')">👶 Age</button>
</div>

<!-- CITY PANEL -->
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
</div>
"""

# Insert after weather banner
html = html.replace(
    '<div class="weather-banner" id="weatherBanner"></div>',
    '<div class="weather-banner" id="weatherBanner"></div>\n' + mobile_html
)

# 3. Add JS for mobile filter tabs
mobile_js = """
// ── MOBILE FILTER TABS ──
function switchMFT(tab) {
  ['city','explore','age'].forEach(function(t) {
    document.getElementById('mft-'+t).classList.toggle('active', t===tab);
    document.getElementById('mfp-'+t).classList.toggle('active', t===tab);
  });
}

function setMobileTab(tab, btn) {
  document.querySelectorAll('.m-tab-card').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
  // sync with main tab system
  var realBtn = document.querySelector('.tab-btn[data-tab="'+tab+'"]');
  if(realBtn) realBtn.click();
}

function setMobileAge(age, btn) {
  document.querySelectorAll('.m-age-btn').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
  // sync with main age system
  var realBtn = document.querySelector('.age-btn[data-age="'+age+'"]');
  if(realBtn) realBtn.click();
  else { activeAge = age; renderCards(); }
}

function buildMobileCities() {
  var cities = ['Sunnyvale','San Jose','Cupertino','Mountain View','Palo Alto','Saratoga','Fremont'];
  var icons  = ['☀️','🏙️','🍎','⛰️','🌿','🌸','🏘️'];
  var grid = document.getElementById('m-city-grid');
  if(!grid) return;
  grid.innerHTML = cities.map(function(c,i) {
    return '<button class="m-city-btn'+(c===activeCity?' on':'')+'" onclick="setMobileCity(\''+c+'\',this)">'+icons[i]+' '+c+'</button>';
  }).join('');
}

function setMobileCity(city, btn) {
  document.querySelectorAll('.m-city-btn').forEach(function(b){ b.classList.remove('on'); });
  btn.classList.add('on');
  // sync with main city system
  var realBtn = Array.from(document.querySelectorAll('.city-btn')).find(function(b){ return b.textContent.includes(city); });
  if(realBtn) realBtn.click();
  else { activeCity = city; loadActivities(); }
}

// Build cities on load
document.addEventListener('DOMContentLoaded', function(){ buildMobileCities(); });
setTimeout(buildMobileCities, 500);
"""

html = html.replace('</body>', '<script>\n' + mobile_js + '\n</script>\n</body>', 1)

with open(path, 'w') as f:
    f.write(html)

print("Mobile filter tabs built!")
print("Run: git add -A && git commit -m 'Add mobile filter tabs: Pick City, Explore, Age' && git push")
