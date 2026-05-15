path = "/workspaces/sunscout2/public/index.html"
with open(path) as f:
    html = f.read()

hero_css = """
/* ── HERO SECTION ── */
.hero {
  position: relative;
  background: linear-gradient(180deg, #e0f4ff 0%, #bae6fd 60%, #f0f9ff 100%);
  padding: 48px 16px 36px;
  text-align: center;
  overflow: hidden;
}
.hero-title {
  font-size: 2.6rem; font-weight: 900; color: #0c4a6e;
  letter-spacing: -1px; line-height: 1.1; margin-bottom: 6px;
  position: relative; z-index: 2;
}
.hero-title span { color: #FF9900; }
.hero-sub {
  font-size: 1.05rem; color: #0369a1; font-weight: 600;
  margin-bottom: 20px; position: relative; z-index: 2;
}
.hero-search {
  display: flex; align-items: center;
  max-width: 480px; margin: 0 auto 16px;
  background: #fff; border-radius: 99px;
  box-shadow: 0 4px 20px rgba(0,0,0,.12);
  padding: 6px 6px 6px 18px;
  position: relative; z-index: 2;
}
.hero-search input {
  flex: 1; border: none; outline: none; font-size: 15px;
  font-family: Nunito, sans-serif; font-weight: 600;
  background: transparent; color: #1a1a1a;
}
.hero-search input::placeholder { color: #aaa; }
.hero-search button {
  background: #FF9900; color: #fff; border: none;
  border-radius: 99px; padding: 8px 20px;
  font-size: 14px; font-weight: 800; cursor: pointer;
  font-family: Nunito, sans-serif; transition: background .15s;
}
.hero-search button:hover { background: #e68900; }
.hero-meta {
  font-size: 13px; color: #0369a1; font-weight: 700;
  position: relative; z-index: 2;
}
/* Clouds */
.cloud {
  position: absolute; background: #fff;
  border-radius: 99px; opacity: .85; z-index: 1;
}
.cloud::before, .cloud::after {
  content: ''; position: absolute;
  background: #fff; border-radius: 50%;
}
.cloud-1 { width:120px; height:36px; top:18px; left:-140px; animation: drift 22s linear infinite; }
.cloud-1::before { width:60px; height:52px; top:-28px; left:18px; }
.cloud-1::after  { width:44px; height:40px; top:-20px; left:52px; }
.cloud-2 { width:90px; height:28px; top:55px; left:-110px; animation: drift 30s linear infinite; animation-delay:-10s; opacity:.6; }
.cloud-2::before { width:44px; height:40px; top:-22px; left:12px; }
.cloud-2::after  { width:34px; height:30px; top:-15px; left:38px; }
.cloud-3 { width:140px; height:40px; top:24px; left:-170px; animation: drift 38s linear infinite; animation-delay:-20s; opacity:.7; }
.cloud-3::before { width:70px; height:58px; top:-32px; left:22px; }
.cloud-3::after  { width:50px; height:44px; top:-24px; left:60px; }
@keyframes drift {
  from { transform: translateX(0); }
  to   { transform: translateX(calc(100vw + 200px)); }
}
@media(max-width:640px) {
  .hero { padding: 36px 16px 28px; }
  .hero-title { font-size: 1.9rem; }
  .hero-sub { font-size: 0.9rem; }
}
"""

hero_html = (
    '<section class="hero">\n'
    '  <div class="cloud cloud-1"></div>\n'
    '  <div class="cloud cloud-2"></div>\n'
    '  <div class="cloud cloud-3"></div>\n'
    '  <div class="hero-title">Sun<span>Scout</span> &#127780;</div>\n'
    '  <div class="hero-sub">Free &amp; Paid Summer Activities for Bay Area Kids</div>\n'
    '  <div class="hero-search">\n'
    '    <input type="search" id="heroSearch" placeholder="Search camps, splash pads, museums..." autocomplete="off" oninput="handleSearch(this.value)" />\n'
    '    <button onclick="handleSearch(document.getElementById(\'heroSearch\').value)">Search</button>\n'
    '  </div>\n'
    '  <div class="hero-meta"><span id="heroCountdown"></span></div>\n'
    '</section>'
)

# Inject hero CSS before closing </style>
html = html.replace("</style>", hero_css + "\n</style>", 1)

# Insert hero BEFORE the existing .header div
html = html.replace('<div class="header">', hero_html + '\n<div class="header">', 1)

# Mirror countdown into hero
# Add heroCountdown update alongside existing countdown update
old_countdown = 'if (el) el.textContent = days > 0 ? "\u23f3 "+days+" days of summer left!" : "\U0001f342 Summer has ended!";'
new_countdown = (
    'if (el) el.textContent = days > 0 ? "\u23f3 "+days+" days of summer left!" : "\U0001f342 Summer has ended!";\n'
    '  var el2 = document.getElementById("heroCountdown");\n'
    '  if (el2) el2.textContent = days > 0 ? "\u23f3 "+days+" days of summer left!" : "\U0001f342 Summer has ended!";'
)
html = html.replace(old_countdown, new_countdown)

with open(path, "w") as f:
    f.write(html)

print("Hero section added successfully!")
print("Clouds, search bar, and sky gradient are live.")
print("Now run: cd /workspaces/sunscout2 && git add -A && git commit -m 'Add hero section with sky gradient and clouds' && git push")
