path = "/workspaces/sunscout2/public/index.html"
with open(path) as f:
    html = f.read()

# 1. Fix hero search - use correct function name setSearch
html = html.replace(
    "document.getElementById('searchInput').value=this.value;handleSearch(this.value)",
    "setSearch(this.value)"
)
html = html.replace(
    "handleSearch(document.getElementById('heroSearch').value)",
    "setSearch(document.getElementById('heroSearch').value)"
)

# 2. Fix openNotepad to force display
old_notepad = "function openNotepad() {\n  var modal = document.getElementById('notepad-modal');\n  modal.style.display = 'flex';"
new_notepad = """function openNotepad() {
  var modal = document.getElementById('notepad-modal');
  modal.style.display = 'flex';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.zIndex = '99999';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';"""
html = html.replace(old_notepad, new_notepad)

# 3. Fix openCalendar to force display
old_calendar = "function openCalendar() {\n  var modal = document.getElementById('calendar-modal');\n  modal.style.display = 'flex';"
new_calendar = """function openCalendar() {
  var modal = document.getElementById('calendar-modal');
  modal.style.display = 'flex';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.zIndex = '99999';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';"""
html = html.replace(old_calendar, new_calendar)

with open(path, 'w') as f:
    f.write(html)

print("All three fixes applied!")
print("Search, Notepad and Calendar should now work.")
print("Run: git add -A && git commit -m 'Fix search setSearch, notepad and calendar modals' && git push")
