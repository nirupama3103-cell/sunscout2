path = "/workspaces/sunscout2/public/index.html"
with open(path) as f:
    html = f.read()

# 1. Add Notepad + Calendar buttons in footer (before About SunScout button)
old_about = '<button onclick="document.getElementById(\'about-modal\')'
new_buttons = '''<button onclick="openNotepad()" style="margin-top:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:99px;padding:10px 24px;font-size:14px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;">📓 Notepad</button>
  <button onclick="openCalendar()" style="margin-top:10px;background:linear-gradient(135deg,#0ea5e9,#0369a1);color:#fff;border:none;border-radius:99px;padding:10px 24px;font-size:14px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;">📅 Calendar</button>
  <button onclick="document.getElementById('about-modal')'''

html = html.replace(old_about, new_buttons, 1)

# 2. Add Notepad modal + Calendar modal + JS before </body>
notepad_and_calendar = '''
<!-- NOTEPAD MODAL -->
<div id="notepad-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:99999;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;">
  <div style="background:#fff;border-radius:24px;padding:28px;max-width:520px;width:100%;max-height:85vh;overflow-y:auto;position:relative;">
    <button onclick="closeNotepad()" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:22px;cursor:pointer;">✕</button>
    <div style="font-size:2rem;text-align:center;">📓</div>
    <h2 style="text-align:center;color:#6366f1;font-family:Nunito,sans-serif;margin:8px 0 4px;">My Notepad</h2>
    <p style="text-align:center;color:#888;font-size:13px;margin-bottom:16px;">Jot down ideas, questions, or activity notes</p>
    <textarea id="notepad-general" placeholder="Write your notes here..." style="width:100%;height:120px;border:2px solid #e0e7ff;border-radius:12px;padding:12px;font-family:Nunito,sans-serif;font-size:14px;resize:vertical;outline:none;box-sizing:border-box;"></textarea>
    <div style="display:flex;gap:8px;margin-top:10px;">
      <button onclick="saveGeneralNote()" style="flex:1;background:#6366f1;color:#fff;border:none;border-radius:99px;padding:10px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;">💾 Save Note</button>
      <button onclick="clearGeneralNote()" style="background:#fee2e2;color:#ef4444;border:none;border-radius:99px;padding:10px 16px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;">🗑️</button>
    </div>
    <div id="activity-notes-list" style="margin-top:20px;"></div>
  </div>
</div>

<!-- CALENDAR MODAL -->
<div id="calendar-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:99999;align-items:center;justify-content:center;padding:20px;box-sizing:border-box;">
  <div style="background:#fff;border-radius:24px;padding:28px;max-width:560px;width:100%;max-height:85vh;overflow-y:auto;position:relative;">
    <button onclick="closeCalendar()" style="position:absolute;top:16px;right:16px;background:none;border:none;font-size:22px;cursor:pointer;">✕</button>
    <div style="font-size:2rem;text-align:center;">📅</div>
    <h2 style="text-align:center;color:#0369a1;font-family:Nunito,sans-serif;margin:8px 0 4px;">My Calendar</h2>
    <p style="text-align:center;color:#888;font-size:13px;margin-bottom:16px;">Your saved activities by date</p>
    <div id="calendar-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;margin-bottom:16px;"></div>
    <div id="calendar-saved-list" style="margin-top:8px;"></div>
  </div>
</div>

<script>
// ── NOTEPAD ──
function openNotepad() {
  var modal = document.getElementById('notepad-modal');
  modal.style.display = 'flex';
  var saved = localStorage.getItem('sunscout_note') || '';
  document.getElementById('notepad-general').value = saved;
  renderActivityNotes();
}
function closeNotepad() {
  document.getElementById('notepad-modal').style.display = 'none';
}
function saveGeneralNote() {
  var text = document.getElementById('notepad-general').value;
  localStorage.setItem('sunscout_note', text);
  alert('Note saved!');
}
function clearGeneralNote() {
  if(confirm('Clear your note?')) {
    localStorage.removeItem('sunscout_note');
    document.getElementById('notepad-general').value = '';
  }
}
function renderActivityNotes() {
  var list = document.getElementById('activity-notes-list');
  var myList = JSON.parse(localStorage.getItem('sunscout_mylist') || '[]');
  if(myList.length === 0) { list.innerHTML = '<p style="color:#aaa;font-size:13px;text-align:center;">Save activities to My List to add notes here.</p>'; return; }
  list.innerHTML = '<h3 style="color:#6366f1;font-family:Nunito,sans-serif;margin-bottom:10px;">Activity Notes</h3>' +
    myList.map(function(a, i) {
      var note = localStorage.getItem('sunscout_anote_' + i) || '';
      return '<div style="margin-bottom:12px;padding:12px;background:#f5f3ff;border-radius:12px;">' +
        '<div style="font-weight:800;color:#1a1a1a;font-family:Nunito,sans-serif;margin-bottom:6px;">' + (a.name||a) + '</div>' +
        '<textarea placeholder="Add note for this activity..." style="width:100%;height:64px;border:1px solid #ddd;border-radius:8px;padding:8px;font-family:Nunito,sans-serif;font-size:13px;resize:none;outline:none;box-sizing:border-box;" onchange="localStorage.setItem(\'sunscout_anote_' + i + '\',this.value)">' + note + '</textarea>' +
        '</div>';
    }).join('');
}

// ── CALENDAR ──
function openCalendar() {
  var modal = document.getElementById('calendar-modal');
  modal.style.display = 'flex';
  renderCalendar();
}
function closeCalendar() {
  document.getElementById('calendar-modal').style.display = 'none';
}
function renderCalendar() {
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth();
  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month+1, 0).getDate();
  var grid = document.getElementById('calendar-grid');
  var monthName = now.toLocaleString('default',{month:'long'});

  var html = '<div style="grid-column:1/-1;font-weight:900;color:#0369a1;font-family:Nunito,sans-serif;font-size:1.1rem;margin-bottom:6px;">' + monthName + ' ' + year + '</div>';
  days.forEach(function(d){ html += '<div style="font-weight:800;color:#888;font-size:11px;">' + d + '</div>'; });
  for(var i=0;i<firstDay;i++) html += '<div></div>';
  for(var d=1;d<=daysInMonth;d++) {
    var isToday = d===now.getDate();
    html += '<div style="padding:4px 0;border-radius:8px;font-size:13px;font-weight:700;font-family:Nunito,sans-serif;' +
      (isToday ? 'background:#0ea5e9;color:#fff;' : 'color:#1a1a1a;') + '">' + d + '</div>';
  }
  grid.innerHTML = html;

  // Show saved activities
  var myList = JSON.parse(localStorage.getItem('sunscout_mylist') || '[]');
  var savedDiv = document.getElementById('calendar-saved-list');
  if(myList.length === 0) {
    savedDiv.innerHTML = '<p style="color:#aaa;font-size:13px;text-align:center;">No saved activities yet. Heart an activity to add it!</p>';
  } else {
    savedDiv.innerHTML = '<h3 style="color:#0369a1;font-family:Nunito,sans-serif;margin-bottom:10px;">Saved Activities</h3>' +
      myList.map(function(a) {
        return '<div style="padding:10px 14px;background:#f0f9ff;border-radius:12px;margin-bottom:8px;font-family:Nunito,sans-serif;">' +
          '<div style="font-weight:800;color:#0369a1;">' + (a.name||a) + '</div>' +
          '<div style="font-size:12px;color:#888;margin-top:2px;">' + (a.city||'Bay Area') + ' · ' + (a.tab||'Activity') + '</div>' +
          '</div>';
      }).join('');
  }
}
</script>
'''

html = html.replace('</body>', notepad_and_calendar + '\n</body>', 1)

with open(path, 'w') as f:
    f.write(html)

print("Notepad and Calendar added successfully!")
print("Now run: git add -A && git commit -m 'Add Notepad and Calendar features' && git push")
