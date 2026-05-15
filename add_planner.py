
path = "/workspaces/sunscout2/public/index.html"
with open(path) as f:
    html = f.read()

# 1. Replace Notepad + Calendar buttons with single My Planner button
html = html.replace(
    '<button onclick="openNotepad()" style="margin-top:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:99px;padding:10px 24px;font-size:14px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;">📓 Notepad</button>\n  <button onclick="openCalendar()" style="margin-top:10px;background:linear-gradient(135deg,#0ea5e9,#0369a1);color:#fff;border:none;border-radius:99px;padding:10px 24px;font-size:14px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;">📅 Calendar</button>',
    '<button onclick="openPlanner()" style="margin-top:10px;background:linear-gradient(135deg,#6366f1,#0ea5e9);color:#fff;border:none;border-radius:99px;padding:10px 24px;font-size:14px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;">📋 My Planner</button>'
)

# 2. Remove old notepad and calendar modals
import re
html = re.sub(r'<!-- NOTEPAD MODAL -->.*?<!-- CALENDAR MODAL -->.*?</div>\s*<script>', '<script>', html, flags=re.DOTALL)

# 3. Remove old notepad/calendar JS functions
html = re.sub(r'// ── NOTEPAD ──.*?// ── CALENDAR ──.*?}\s*</script>', '</script>', html, flags=re.DOTALL)

# 4. Add new My Planner modal + JS before </body>
planner = '''
<!-- MY PLANNER MODAL -->
<div id="planner-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);z-index:99999;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;">
  <div style="background:#fff;border-radius:24px;width:100%;max-width:540px;max-height:88vh;overflow:hidden;display:flex;flex-direction:column;position:relative;">
    
    <!-- Header -->
    <div style="padding:20px 24px 0;text-align:center;flex-shrink:0;">
      <button onclick="closePlanner()" style="position:absolute;top:14px;right:16px;background:none;border:none;font-size:22px;cursor:pointer;color:#888;">✕</button>
      <div style="font-size:1.8rem;">📋</div>
      <h2 style="color:#6366f1;font-family:Nunito,sans-serif;margin:4px 0 14px;font-size:1.3rem;">My Planner</h2>
    </div>

    <!-- Tabs -->
    <div style="display:flex;border-bottom:2px solid #f0f0f0;flex-shrink:0;padding:0 16px;">
      <button id="tab-btn-notes" onclick="switchTab('notes')" style="flex:1;padding:10px 4px;border:none;background:none;font-family:Nunito,sans-serif;font-weight:800;font-size:13px;cursor:pointer;border-bottom:3px solid #6366f1;color:#6366f1;">📝 Notes</button>
      <button id="tab-btn-calendar" onclick="switchTab('calendar')" style="flex:1;padding:10px 4px;border:none;background:none;font-family:Nunito,sans-serif;font-weight:800;font-size:13px;cursor:pointer;border-bottom:3px solid transparent;color:#aaa;">📅 Calendar</button>
      <button id="tab-btn-mylist" onclick="switchTab('mylist')" style="flex:1;padding:10px 4px;border:none;background:none;font-family:Nunito,sans-serif;font-weight:800;font-size:13px;cursor:pointer;border-bottom:3px solid transparent;color:#aaa;">❤️ My List</button>
    </div>

    <!-- Tab Content -->
    <div style="overflow-y:auto;flex:1;padding:16px 20px 20px;">

      <!-- NOTES TAB -->
      <div id="tab-notes">
        <p style="color:#888;font-size:13px;margin:0 0 10px;">General notes, reminders, ideas...</p>
        <textarea id="notepad-general" placeholder="Write your notes here..." style="width:100%;height:110px;border:2px solid #e0e7ff;border-radius:12px;padding:12px;font-family:Nunito,sans-serif;font-size:14px;resize:none;outline:none;box-sizing:border-box;"></textarea>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="save-btn" onclick="saveGeneralNote()" style="flex:1;background:#6366f1;color:#fff;border:none;border-radius:99px;padding:10px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;font-size:13px;">💾 Save Note</button>
          <button onclick="clearGeneralNote()" style="background:#fee2e2;color:#ef4444;border:none;border-radius:99px;padding:10px 16px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;font-size:13px;">🗑️</button>
        </div>
        <div id="activity-notes-list" style="margin-top:16px;"></div>
      </div>

      <!-- CALENDAR TAB -->
      <div id="tab-calendar" style="display:none;">
        <div id="calendar-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center;margin-bottom:14px;"></div>
        <h3 style="color:#0369a1;font-family:Nunito,sans-serif;font-size:14px;margin:0 0 10px;">📌 Plan Your Activities</h3>
        <div id="calendar-saved-list"></div>
      </div>

      <!-- MY LIST TAB -->
      <div id="tab-mylist" style="display:none;">
        <div id="mylist-content"></div>
      </div>

    </div>
  </div>
</div>

<script>
// ── MY PLANNER ──
function openPlanner() {
  var modal = document.getElementById('planner-modal');
  modal.setAttribute('style','display:flex;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);z-index:99999;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;');
  switchTab('notes');
}
function closePlanner() {
  document.getElementById('planner-modal').style.display = 'none';
}

function switchTab(tab) {
  var tabs = ['notes','calendar','mylist'];
  tabs.forEach(function(t) {
    document.getElementById('tab-'+t).style.display = t===tab ? 'block' : 'none';
    var btn = document.getElementById('tab-btn-'+t);
    if(btn) {
      btn.style.borderBottom = t===tab ? '3px solid #6366f1' : '3px solid transparent';
      btn.style.color = t===tab ? '#6366f1' : '#aaa';
    }
  });
  if(tab==='notes') { 
    var saved = localStorage.getItem('sunscout_note') || '';
    document.getElementById('notepad-general').value = saved;
    renderActivityNotes();
  }
  if(tab==='calendar') renderPlannerCalendar();
  if(tab==='mylist') renderMyListTab();
}

// NOTES
function saveGeneralNote() {
  var text = document.getElementById('notepad-general').value;
  localStorage.setItem('sunscout_note', text);
  var btn = document.querySelector('.save-btn');
  if(btn) { var o=btn.textContent; btn.textContent='✅ Saved!'; btn.style.background='#22c55e'; setTimeout(function(){btn.textContent=o;btn.style.background='#6366f1';},1500); }
}
function clearGeneralNote() {
  if(confirm('Clear your note?')) { localStorage.removeItem('sunscout_note'); document.getElementById('notepad-general').value=''; }
}
function renderActivityNotes() {
  var list = document.getElementById('activity-notes-list');
  var myList = JSON.parse(localStorage.getItem('sunscout_mylist') || '[]');
  if(myList.length === 0) { list.innerHTML = '<p style="color:#aaa;font-size:13px;text-align:center;padding:10px 0;">Heart an activity to add notes per activity.</p>'; return; }
  var h = '<h3 style="color:#6366f1;font-family:Nunito,sans-serif;font-size:14px;margin:0 0 10px;">Activity Notes</h3>';
  for(var i=0; i<myList.length; i++) {
    var a = myList[i]; var key = 'sunscout_anote_'+i; var note = localStorage.getItem(key)||'';
    h += '<div style="margin-bottom:10px;padding:10px;background:#f5f3ff;border-radius:12px;">';
    h += '<div style="font-weight:800;color:#1a1a1a;font-family:Nunito,sans-serif;font-size:13px;margin-bottom:6px;">'+(a.name||a)+'</div>';
    h += '<textarea data-key="'+key+'" placeholder="Add a note..." style="width:100%;height:56px;border:1px solid #ddd;border-radius:8px;padding:8px;font-family:Nunito,sans-serif;font-size:12px;resize:none;outline:none;box-sizing:border-box;">'+note+'</textarea>';
    h += '</div>';
  }
  list.innerHTML = h;
  list.querySelectorAll('textarea').forEach(function(t){ t.addEventListener('change',function(){ localStorage.setItem(this.getAttribute('data-key'),this.value); }); });
}

// CALENDAR
function renderPlannerCalendar() {
  var now = new Date(); var year=now.getFullYear(); var month=now.getMonth();
  var days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var firstDay=new Date(year,month,1).getDay(); var daysInMonth=new Date(year,month+1,0).getDate();
  var monthName=now.toLocaleString('default',{month:'long'});
  var grid=document.getElementById('calendar-grid');
  var h='<div style="grid-column:1/-1;font-weight:900;color:#0369a1;font-family:Nunito,sans-serif;font-size:1rem;margin-bottom:6px;text-align:center;">'+monthName+' '+year+'</div>';
  days.forEach(function(d){ h+='<div style="font-weight:800;color:#888;font-size:10px;padding:4px 0;">'+d+'</div>'; });
  for(var i=0;i<firstDay;i++) h+='<div></div>';
  for(var d=1;d<=daysInMonth;d++) {
    var isToday=d===now.getDate();
    h+='<div style="padding:5px 2px;border-radius:8px;font-size:12px;font-weight:700;font-family:Nunito,sans-serif;cursor:pointer;'+(isToday?'background:#6366f1;color:#fff;':'color:#1a1a1a;background:#f5f3ff;')+'">'+d+'</div>';
  }
  grid.innerHTML = h;

  var myList=JSON.parse(localStorage.getItem('sunscout_mylist')||'[]');
  var savedDiv=document.getElementById('calendar-saved-list');
  if(myList.length===0){ savedDiv.innerHTML='<p style="color:#aaa;font-size:13px;text-align:center;">Heart activities to plan them here.</p>'; return; }
  var sh='';
  for(var j=0;j<myList.length;j++){
    var act=myList[j]; var dateKey='sunscout_date_'+j; var savedDate=localStorage.getItem(dateKey)||'';
    sh+='<div style="padding:10px 12px;background:#f0f9ff;border-radius:12px;margin-bottom:8px;font-family:Nunito,sans-serif;">';
    sh+='<div style="font-weight:800;color:#0369a1;font-size:13px;">'+(act.name||act)+'</div>';
    sh+='<div style="font-size:12px;color:#888;margin:2px 0 6px;">'+(act.city||'Bay Area')+'</div>';
    sh+='<input type="date" data-key="'+dateKey+'" value="'+savedDate+'" style="border:1px solid #bae6fd;border-radius:8px;padding:4px 8px;font-family:Nunito,sans-serif;font-size:12px;outline:none;width:100%;box-sizing:border-box;">';
    sh+='</div>';
  }
  savedDiv.innerHTML = sh;
  savedDiv.querySelectorAll('input[type=date]').forEach(function(inp){
    inp.addEventListener('change',function(){ localStorage.setItem(this.getAttribute('data-key'),this.value); });
  });
}

// MY LIST TAB
function renderMyListTab() {
  var myList=JSON.parse(localStorage.getItem('sunscout_mylist')||'[]');
  var div=document.getElementById('mylist-content');
  if(myList.length===0){ div.innerHTML='<p style="color:#aaa;font-size:13px;text-align:center;padding:20px 0;">No saved activities yet.<br>Tap ❤️ on any activity to save it!</p>'; return; }
  var h='<p style="color:#888;font-size:13px;margin:0 0 12px;">'+myList.length+' saved activit'+(myList.length===1?'y':'ies')+'</p>';
  for(var i=0;i<myList.length;i++){
    var a=myList[i]; var dateKey='sunscout_date_'+i; var savedDate=localStorage.getItem(dateKey)||''; var noteKey='sunscout_anote_'+i; var note=localStorage.getItem(noteKey)||'';
    h+='<div style="padding:12px;background:#fafafa;border:1px solid #f0f0f0;border-radius:14px;margin-bottom:10px;font-family:Nunito,sans-serif;">';
    h+='<div style="font-weight:800;color:#1a1a1a;font-size:13px;">'+(a.name||a)+'</div>';
    h+='<div style="font-size:12px;color:#888;margin:2px 0 8px;">'+(a.city||'Bay Area')+' · '+(a.isFree?'Free':'Paid')+'</div>';
    h+='<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">';
    h+='<span style="font-size:11px;color:#0369a1;font-weight:700;">📅 Date:</span>';
    h+='<input type="date" data-key="'+dateKey+'" value="'+savedDate+'" style="flex:1;border:1px solid #ddd;border-radius:8px;padding:3px 8px;font-size:12px;font-family:Nunito,sans-serif;outline:none;">';
    h+='</div>';
    h+='<textarea data-key="'+noteKey+'" placeholder="Add a note..." style="width:100%;height:48px;border:1px solid #ddd;border-radius:8px;padding:6px 8px;font-size:12px;font-family:Nunito,sans-serif;resize:none;outline:none;box-sizing:border-box;">'+note+'</textarea>';
    h+='</div>';
  }
  div.innerHTML = h;
  div.querySelectorAll('input[type=date]').forEach(function(inp){ inp.addEventListener('change',function(){ localStorage.setItem(this.getAttribute('data-key'),this.value); }); });
  div.querySelectorAll('textarea').forEach(function(t){ t.addEventListener('change',function(){ localStorage.setItem(this.getAttribute('data-key'),this.value); }); });
}

// Keep backward compat
function openNotepad(){ openPlanner(); }
function openCalendar(){ openPlanner(); switchTab('calendar'); }
</script>
'''

html = html.replace('</body>', planner + '\n</body>', 1)

with open(path, 'w') as f:
    f.write(html)

print("My Planner built successfully!")
print("Run: git add -A && git commit -m 'Add My Planner - merged Notes, Calendar, My List tabs' && git push")
