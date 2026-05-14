import re, sys, shutil, datetime

PATH = "public/index.html"
BACKUP = f"public/index.html.bak_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"

with open(PATH, "r", encoding="utf-8") as f:
    html = f.read()

shutil.copy(PATH, BACKUP)
print(f"✅ Backup saved → {BACKUP}")

original = html
