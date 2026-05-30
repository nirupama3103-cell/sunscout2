# 🌤️ SunScout
### Summer Activity Discovery for Bay Area Families

SunScout helps Bay Area parents instantly find free and paid activities for kids — from splash pads and library storytimes to STEM camps and petting zoos. Built as a fast, mobile-first web app with no login, no ads, and no tracking.

🔗 **Live App:** [www.sunscoutkids.com](https://www.sunscoutkids.com)
📂 **GitHub:** [github.com/nirupama3103-cell/sunscout2](https://github.com/nirupama3103-cell/sunscout2)

---

## 🎯 The Problem It Solves

Bay Area parents spend hours every summer Googling "free things to do with kids near me" — only to find outdated blog posts or generic lists. SunScout solves this with a purpose-built, always-fresh activity finder covering 7 South Bay cities.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🆓 **5 Activity Tabs** | Free, Paid, Indoor, Outdoor, Weekend — strictly categorized |
| 👶 **Age Filters** | Infant (0–2), Preschool (3–5), School Age (6–12), Teen (13–19) |
| 📅 **Plan My Day** | Guided wizard that builds a full family day itinerary |
| ❤️ **My List** | Save favorite activities to device — no account needed |
| 📝 **Notes** | Add private notes to any activity |
| 🌡️ **Weather Alerts** | Real-time heat warnings that redirect to indoor activities |
| 🗺️ **Weekend Mode** | Auto-activates on weekends, shows all-city events |
| 🔒 **Privacy First** | Zero tracking, zero ads, zero data collection |
| 📱 **Mobile Optimized** | Bottom nav, floating action pill, PWA installable |

---

## 🏙️ Cities Covered

**Santa Clara County:** Sunnyvale · San Jose · Cupertino · Mountain View · Palo Alto · Saratoga

**Alameda County:** Fremont

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML, CSS, JavaScript (no framework) |
| Data | Google Places API · Eventbrite · Ticketmaster |
| Weather | Open-Meteo API (free, no key required) |
| Hosting | Vercel (auto-deploy from GitHub) |
| Storage | localStorage (favorites, notes — device only) |
| PWA | Web App Manifest + mobile meta tags |

---

## 🏗️ Architecture
The app is intentionally framework-free for maximum performance and simplicity. No build step, no dependencies, instant load.

---

## 🚀 Running Locally

```bash

git clone https://github.com/nirupama3103-cell/sunscout2

cd SunScout

# Open public/index.html directly in a browser

# Or use any static server:

npx serve public

```

---

## 👩‍💻 Development Story

SunScout was conceived, designed, and product-managed by **Nirupama Vadapalli** as a real-world tool for Bay Area families.

The technical build used an AI-augmented workflow—complex logic, debugging, and CSS architecture were built in collaboration with **Claude (Anthropic)** as a coding partner. This project demonstrates how strong human product vision, paired with AI development tools, can rapidly ship meaningful community software.

---

## 📋 Roadmap

- [ ] Eventbrite live API integration

- [ ] Busyness meter (crowd predictions)

- [ ] Stroller accessibility badges

- [ ] Countdown to summer banner

- [ ] "Today's Pick" featured card

---

Built with ❤️ for Bay Area families · Summer 2026

