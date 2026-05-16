path = "/workspaces/sunscout2/public/index.html"
with open(path, "r", encoding="utf-8") as f:
    html = f.read()

# ── 1. Hide My List button in hero on mobile ──────────────────────────────────
html = html.replace(
    'onclick="openMyList()" style="position:relative;background:linear-gradient(135deg,#ff4e50,#f9d423)',
    'onclick="openMyList()" class="hide-on-mobile" style="position:relative;background:linear-gradient(135deg,#ff4e50,#f9d423)',
    1
)
print("✅ My List hidden on mobile")

# ── 2. Insert Airbnb bar right after </section> (after hero section) ──────────
AIRBNB_BAR = '''
<!-- ══ SUNSCOUT AIRBNB BAR (mobile only) ══ -->
<div id="ssAirbnbBar" style="display:none;padding:10px 12px 0;max-width:640px;margin:0 auto;">

  <!-- Weather chip -->
  <div style="text-align:center;margin-bottom:8px;">
    <span id="ssWeatherChip" style="display:inline-flex;align-items:center;gap:6px;background:#FFF8E1;border:0.5px solid #FFD580;border-radius:99px;padding:5px 14px;font-size:12px;font-weight:700;color:#c05e00;font-family:Nunito,sans-serif;">🌤️ Loading weather...</span>
  </div>

  <!-- The bar -->
  <div style="background:#fff;border-radius:99px;border:1px solid #e0e0e0;display:flex;align-items:stretch;box-shadow:0 2px 12px rgba(0,0,0,.08);position:relative;font-family:Nunito,sans-serif;">

    <!-- City section -->
    <div id="ss-sec-city" onclick="ssTog('city',event)" style="flex:1;padding:9px 12px;cursor:pointer;border-radius:99px;position:relative;min-width:0;">
      <div style="font-size:9px;font-weight:800;color:#999;letter-spacing:.06em;margin-bottom:1px;">📍 CITY</div>
      <div id="ss-val-city" style="font-size:12px;font-weight:700;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Pick city</div>
      <!-- City dropdown -->
      <div id="ss-drop-city" style="display:none;position:absolute;top:calc(100% + 8px);left:0;background:#fff;border-radius:16px;border:0.5px solid #e0e0e0;box-shadow:0 8px 32px rgba(0,0,0,.14);z-index:999;padding:12px;min-width:230px;font-family:Nunito,sans-serif;">
        <div style="font-size:9px;font-weight:800;color:#999;letter-spacing:.06em;margin-bottom:10px;">SUGGESTED CITIES</div>
        <div class="ss-city-row" onclick="ssSel('city','Sunnyvale',event)"><span class="ss-city-ico">☀️</span><div><div class="ss-city-name">Sunnyvale</div><div class="ss-city-sub">257 sunny days/year</div></div></div>
        <div class="ss-city-row" onclick="ssSel('city','San Jose',event)"><span class="ss-city-ico">🏙️</span><div><div class="ss-city-name">San Jose</div><div class="ss-city-sub">200+ parks for families</div></div></div>
        <div class="ss-city-row" onclick="ssSel('city','Cupertino',event)"><span class="ss-city-ico">🍎</span><div><div class="ss-city-name">Cupertino</div><div class="ss-city-sub">Great STEM activities</div></div></div>
        <div class="ss-city-row" onclick="ssSel('city','Mountain View',event)"><span class="ss-city-ico">⛰️</span><div><div class="ss-city-name">Mountain View</div><div class="ss-city-sub">Parks &amp; trails</div></div></div>
        <div class="ss-city-row" onclick="ssSel('city','Palo Alto',event)"><span class="ss-city-ico">🎓</span><div><div class="ss-city-name">Palo Alto</div><div class="ss-city-sub">Museums &amp; camps</div></div></div>
        <div class="ss-city-row" onclick="ssSel('city','Saratoga',event)"><span class="ss-city-ico">🌲</span><div><div class="ss-city-name">Saratoga</div><div class="ss-city-sub">Nature &amp; outdoor fun</div></div></div>
      </div>
    </div>

    <div style="width:1px;background:#e0e0e0;margin:8px 0;flex-shrink:0;"></div>

    <!-- Explore section -->
    <div id="ss-sec-explore" onclick="ssTog('explore',event)" style="flex:1;padding:9px 12px;cursor:pointer;border-radius:99px;position:relative;min-width:0;">
      <div style="font-size:9px;font-weight:800;color:#999;letter-spacing:.06em;margin-bottom:1px;">🎯 EXPLORE</div>
      <div id="ss-val-explore" style="font-size:12px;font-weight:700;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">Activity</div>
      <!-- Explore dropdown -->
      <div id="ss-drop-explore" style="display:none;position:absolute;top:calc(100% + 8px);left:-60px;background:#fff;border-radius:16px;border:0.5px solid #e0e0e0;box-shadow:0 8px 32px rgba(0,0,0,.14);z-index:999;padding:12px;min-width:220px;font-family:Nunito,sans-serif;">
        <div style="font-size:9px;font-weight:800;color:#999;letter-spacing:.06em;margin-bottom:10px;">WHAT KIND OF FUN?</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
          <div class="ss-exp-card" style="color:#c05e00;border-color:#FFD580;background:#FFFBEE;" onclick="ssSel('explore','🆓 Free',event)">🆓<br>Free</div>
          <div class="ss-exp-card" style="color:#991b1b;border-color:#fca5a5;background:#FFF5F5;" onclick="ssSel('explore','💰 Paid',event)">💰<br>Paid</div>
          <div class="ss-exp-card" style="color:#15803d;border-color:#86efac;background:#F0FDF4;" onclick="ssSel('explore','🌳 Outdoor',event)">🌳<br>Outdoor</div>
          <div class="ss-exp-card" style="color:#1d4ed8;border-color:#93c5fd;background:#EFF6FF;" onclick="ssSel('explore','🏛️ Indoor',event)">🏛️<br>Indoor</div>
          <div class="ss-exp-card" style="color:#6d28d9;border-color:#c4b5fd;background:#F5F3FF;" onclick="ssSel('explore','📅 Weekend',event)">📅<br>Weekend</div>
          <div class="ss-exp-card" style="color:#c05e00;border-color:#FF9900;background:#FFFBEE;" onclick="ssSel('explore','🎲 Surprise',event)">🎲<br>Surprise!</div>
        </div>
      </div>
    </div>

    <div style="width:1px;background:#e0e0e0;margin:8px 0;flex-shrink:0;"></div>

    <!-- Age section -->
    <div id="ss-sec-age" onclick="ssTog('age',event)" style="flex:1;padding:9px 12px;cursor:pointer;border-radius:99px;position:relative;min-width:0;">
      <div style="font-size:9px;font-weight:800;color:#999;letter-spacing:.06em;margin-bottom:1px;">👶 AGE</div>
      <div id="ss-val-age" style="font-size:12px;font-weight:700;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">All ages</div>
      <!-- Age dropdown -->
      <div id="ss-drop-age" style="display:none;position:absolute;top:calc(100% + 8px);right:0;background:#fff;border-radius:16px;border:0.5px solid #e0e0e0;box-shadow:0 8px 32px rgba(0,0,0,.14);z-index:999;padding:12px;min-width:200px;font-family:Nunito,sans-serif;">
        <div style="font-size:9px;font-weight:800;color:#999;letter-spacing:.06em;margin-bottom:10px;">YOUR KID\'S AGE</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
          <div class="ss-age-card" onclick="ssSelAge('all','⭐ All',event)">⭐ All</div>
          <div class="ss-age-card" onclick="ssSelAge('0','👶 0–2',event)">👶 0–2</div>
          <div class="ss-age-card" onclick="ssSelAge('1','🧸 3–5',event)">🧸 3–5</div>
          <div class="ss-age-card" onclick="ssSelAge('2','🎒 6–12',event)">🎒 6–12</div>
          <div class="ss-age-card" style="grid-column:span 2;" onclick="ssSelAge('3','🛹 Teen',event)">🛹 Teen 13–19</div>
        </div>
      </div>
    </div>

    <!-- Orange search button -->
    <button onclick="ssDoSearch()" style="background:#FF9900;border:none;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;margin:auto 5px auto 0;font-size:16px;" aria-label="Search">🔍</button>

  </div>
</div>

<style>
.ss-city-row{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;cursor:pointer;}
.ss-city-row:hover{background:#FFF3E0;}
.ss-city-ico{width:32px;height:32px;border-radius:8px;background:#FFF3E0;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:16px;text-align:center;line-height:32px;}
.ss-city-name{font-size:13px;font-weight:700;color:#1a1a1a;font-family:Nunito,sans-serif;}
.ss-city-sub{font-size:10px;color:#999;font-family:Nunito,sans-serif;}
.ss-exp-card{padding:10px 6px;border-radius:12px;border:0.5px solid #eee;font-size:11px;font-weight:800;cursor:pointer;text-align:center;line-height:1.5;font-family:Nunito,sans-serif;transition:transform .1s;}
.ss-exp-card:hover{transform:scale(1.04);}
.ss-age-card{padding:10px;border-radius:12px;border:0.5px solid #eee;background:#f9f9f9;font-size:12px;font-weight:700;cursor:pointer;text-align:center;font-family:Nunito,sans-serif;transition:all .12s;}
.ss-age-card:hover{background:#FF9900;color:#fff;border-color:#FF9900;}
@media(max-width:640px){#ssAirbnbBar{display:block!important;}}
@media(min-width:641px){#ssAirbnbBar{display:none!important;}}
</style>
'''

# Insert after </section> (end of hero)
insert_marker = '</section>\n<div class="header"'
if insert_marker in html:
    html = html.replace(insert_marker, '</section>\n' + AIRBNB_BAR + '\n<div class="header"', 1)
    print("✅ Airbnb bar inserted after hero section")
else:
    print("ERROR: insertion point not found")

# ── 3. JS for the bar ─────────────────────────────────────────────────────────
SS_JS = '''
// ── SunScout Airbnb Bar JS ──
var ssFields = ['city','explore','age'];

function ssTog(id, e) {
  e.stopPropagation();
  ssFields.forEach(function(d) {
    var drop = document.getElementById('ss-drop-'+d);
    if (!drop) return;
    if (d === id) {
      var isOpen = drop.style.display !== 'none';
      drop.style.display = isOpen ? 'none' : 'block';
    } else {
      drop.style.display = 'none';
    }
  });
}

function ssSel(field, val, e) {
  if (e) e.stopPropagation();
  var v = document.getElementById('ss-val-'+field);
  if (v) { v.textContent = val; v.style.color = '#1a1a1a'; }
  var drop = document.getElementById('ss-drop-'+field);
  if (drop) drop.style.display = 'none';
  if (field === 'city') {
    var cityName = val;
    if (typeof setCity === 'function') {
      var btn = document.querySelector('.city-btn[data-city="'+cityName+'"]');
      if (btn) setCity(btn, cityName);
      else { activeCity = cityName; if (typeof loadActivities === 'function') { showCount = typeof getPageSize === 'function' ? getPageSize() : 10; loadActivities(); } }
    }
    ssUpdateWeather(cityName);
  }
  if (field === 'explore') {
    var tabMap = {'🆓 Free':'free','💰 Paid':'paid','🌳 Outdoor':'outdoor','🏛️ Indoor':'indoor','📅 Weekend':'weekend','🎲 Surprise':'surprise'};
    var tabKey = tabMap[val];
    if (tabKey === 'surprise') { if (typeof doSurprise === 'function') doSurprise(); }
    else {
      var btn = document.querySelector('.tab-btn[data-tab="'+tabKey+'"]') || document.querySelector('.m-tab-card[data-tab="'+tabKey+'"]');
      if (btn && typeof setTab === 'function') setTab(btn);
      else if (typeof activeTab !== 'undefined') { activeTab = tabKey; if (typeof loadActivities === 'function') loadActivities(); }
    }
  }
}

function ssSelAge(ageVal, label, e) {
  if (e) e.stopPropagation();
  var v = document.getElementById('ss-val-age');
  if (v) { v.textContent = label; v.style.color = '#1a1a1a'; }
  var drop = document.getElementById('ss-drop-age');
  if (drop) drop.style.display = 'none';
  if (typeof activeAge !== 'undefined') {
    activeAge = ageVal === 'all' ? 'all' : parseInt(ageVal);
    if (typeof loadActivities === 'function' && typeof activeCity !== 'undefined' && activeCity) loadActivities();
  }
}

function ssDoSearch() {
  ssFields.forEach(function(d) {
    var drop = document.getElementById('ss-drop-'+d);
    if (drop) drop.style.display = 'none';
  });
  if (typeof activeCity !== 'undefined' && activeCity && typeof loadActivities === 'function') loadActivities();
  var cards = document.getElementById('cards');
  if (cards) cards.scrollIntoView({behavior:'smooth'});
}

function ssUpdateWeather(city) {
  var chip = document.getElementById('ssWeatherChip');
  if (!chip) return;
  if (typeof CITY_COORDS !== 'undefined' && CITY_COORDS[city]) {
    var coords = CITY_COORDS[city];
    fetch('https://api.open-meteo.com/v1/forecast?latitude='+coords.lat+'&longitude='+coords.lon+'&current_weather=true&temperature_unit=fahrenheit')
      .then(function(r){return r.json();})
      .then(function(d){
        var temp = Math.round(d.current_weather.temperature);
        var msg = temp > 90 ? '🥵 '+temp+'°F in '+city+' — Check Indoor tab!' : temp > 75 ? '☀️ '+temp+'°F in '+city+' — Great outdoor day!' : '🌤️ '+temp+'°F in '+city+' — Perfect day out!';
        chip.textContent = msg;
        chip.style.background = temp > 90 ? '#FFF0F0' : '#FFF8E1';
        chip.style.color = temp > 90 ? '#991b1b' : '#c05e00';
        chip.style.borderColor = temp > 90 ? '#fca5a5' : '#FFD580';
      }).catch(function(){});
  } else {
    chip.textContent = '🌤️ '+city+' — Have a sunny day!';
  }
}

document.addEventListener('click', function() {
  ssFields.forEach(function(d) {
    var drop = document.getElementById('ss-drop-'+d);
    if (drop) drop.style.display = 'none';
  });
});
'''

last_script = html.rfind('</script>')
if last_script != -1:
    html = html[:last_script] + SS_JS + '\n</script>' + html[last_script+9:]
    print("✅ JS injected")

with open(path, "w", encoding="utf-8") as f:
    f.write(html)

print("\n🎉 Done! Run: cd /workspaces/sunscout2 && git add -A && git commit -m 'feat: Airbnb-style search bar on mobile' && git push")
