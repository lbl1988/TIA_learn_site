/* ========================================================================
 * notes.js —— 博途学习站 v2 学习笔记与进度系统（和用户绑定，按 page_key 隔离）
 * 依赖：auth.js（ window.TIA 命名空间）
 *
 * 在以下页面自动启用：
 *   1) 课程页 /courses/*.html → 自动扫描 .chapter，为每章生成进度/笔记（section_key=chap-{NN}）
 *   2) 其他所有页面          → 全页面一条笔记（section_key=''，整个页面一个进度）
 *
 * 暴露：window.TIA.notes
 *   - TIA.notes.state        状态：{ page_key, bySection: Map<sk, note> }
 *   - TIA.notes.init()
 *   - TIA.notes.refresh()
 *   - TIA.notes.open(section_key?)  打开笔记面板（可选直接展开某节）
 *   - TIA.notes.renderMyLearningPage()  渲染"我的学习"聚合页
 * ====================================================================== */
(function () {
  'use strict';

  const TIA = window.TIA || (window.TIA = {});
  if (!TIA.api || !TIA.api.fetchAuth) {
    console.error('[notes] 需要先加载 auth.js');
    return;
  }
  const qs = TIA.$ ? TIA.$.qs : (s, r) => (r || document).querySelector(s);
  const htmlEl = TIA.$ ? TIA.$.html : (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; };
  const toast = TIA.api.toast;
  const pageKey = TIA.api.currentPageKey();
  const isCoursePage = /^courses\/[^/]+\.html$/.test(pageKey);
  const isMyLearningPage = /^my-learning\/index\.html$/.test(pageKey);

  // ================ 1. 样式注入 ================
  const CSS = `
/* 笔记面板（右下角浮窗） */
.tia-notes-panel {
  position:fixed; right:20px; bottom:20px; z-index:500;
  width:min(420px, calc(100vw - 40px)); max-height:calc(100vh - 120px);
  background:var(--panel); border:1px solid var(--line); border-radius:14px;
  box-shadow:0 20px 50px #0008; display:flex; flex-direction:column; overflow:hidden;
  transition:transform .18s ease, opacity .18s ease;
}
.tia-notes-panel.collapsed { height:54px; max-height:54px; }
.tia-notes-panel.hidden { transform:translateY(calc(100% + 30px)); opacity:0; pointer-events:none; }
.tia-notes-panel .np-head {
  padding:12px 14px; display:flex; align-items:center; justify-content:space-between;
  background:linear-gradient(135deg,#0ea5e915,#7c5cff15); border-bottom:1px solid var(--line);
  user-select:none; cursor:pointer;
}
.tia-notes-panel .np-head .ttl { font-size:14px; font-weight:600; }
.tia-notes-panel .np-head .summ { font-size:12px; color:var(--muted); margin-left:10px; }
.tia-notes-panel .np-head .act { display:flex; gap:6px; align-items:center; }
.tia-notes-panel .np-head .pill { font-size:11px; padding:3px 8px; border-radius:10px; border:1px solid var(--line); color:var(--muted); background:var(--panel-2); }
.tia-notes-panel .np-head button { background:transparent; border:none; color:var(--muted); cursor:pointer; font-size:18px; padding:2px 6px; border-radius:6px; }
.tia-notes-panel .np-head button:hover { background:var(--panel-2); color:var(--text); }
.tia-notes-panel .np-body { flex:1; overflow:auto; padding:12px 14px 16px; }
.tia-notes-panel .np-body.empty { color:var(--muted); text-align:center; padding:40px 20px; font-size:13px; }
.tia-notes-panel .np-body .pg-hero {
  padding:14px; background:var(--panel-2); border-radius:10px; margin-bottom:14px; border:1px solid var(--line);
  display:grid; grid-template-columns:repeat(4,1fr); gap:8px; text-align:center; font-size:12px;
}
.tia-notes-panel .np-body .pg-hero b { display:block; font-size:18px; font-family:Consolas,monospace; margin-bottom:2px; }
.tia-notes-panel .np-body .pg-hero .n span { color:var(--muted); }
.tia-notes-panel .np-body .pg-hero .n.l b { color:var(--cyan); }
.tia-notes-panel .np-body .pg-hero .n.i b { color:var(--warn); }
.tia-notes-panel .np-body .pg-hero .n.c b { color:var(--ok); }
.tia-notes-panel .np-body .pg-hero .n.n b { color:var(--muted); }

.tia-notes-panel .sec { padding:10px 0; border-top:1px dashed var(--line); }
.tia-notes-panel .sec:first-of-type { border-top:none; padding-top:0; }
.tia-notes-panel .sec-row { display:flex; align-items:flex-start; gap:10px; }
.tia-notes-panel .sec-title { flex:1; cursor:pointer; }
.tia-notes-panel .sec-title .name { font-size:13.5px; font-weight:600; }
.tia-notes-panel .sec-title .time { font-size:11px; color:var(--muted); margin-top:3px; }
.tia-notes-panel .sec-actions { display:flex; gap:6px; flex-shrink:0; }
.tia-notes-panel .pg-btn {
  width:30px; height:30px; border-radius:8px; background:var(--panel-2); border:1px solid var(--line);
  cursor:pointer; color:var(--muted); display:inline-flex; align-items:center; justify-content:center; font-size:14px;
}
.tia-notes-panel .pg-btn:hover { border-color:var(--brand); color:var(--text); }
.tia-notes-panel .pg-btn.not_started { color:var(--muted); }
.tia-notes-panel .pg-btn.learning { color:var(--warn); border-color:#f59e0b66; background:#f59e0b12; }
.tia-notes-panel .pg-btn.completed { color:var(--ok); border-color:#4ade8066; background:#4ade8012; }
.tia-notes-panel .note-btn {
  width:30px; height:30px; border-radius:8px; background:var(--panel-2); border:1px solid var(--line);
  cursor:pointer; color:var(--muted); display:inline-flex; align-items:center; justify-content:center; font-size:14px;
}
.tia-notes-panel .note-btn.has-note { color:var(--brand); border-color:#7c5cff66; background:#7c5cff12; }
.tia-notes-panel .note-area { margin-top:10px; position:relative; display:none; }
.tia-notes-panel .note-area.open { display:block; }
.tia-notes-panel .note-area textarea {
  width:100%; min-height:100px; padding:10px; box-sizing:border-box;
  background:var(--panel-2); color:var(--text); border:1px solid var(--line); border-radius:8px;
  font-family:Consolas,Menlo,monospace; font-size:12.5px; line-height:1.55; resize:vertical;
}
.tia-notes-panel .note-area textarea:focus { outline:none; border-color:var(--brand); }
.tia-notes-panel .note-area .meta { display:flex; justify-content:space-between; align-items:center; margin-top:6px; font-size:11px; color:var(--muted); }
.tia-notes-panel .note-area .saving { color:var(--warn); }
.tia-notes-panel .note-area .saved { color:var(--ok); }
.tia-notes-panel .note-area .del { background:transparent; border:none; color:#ff7b8b; cursor:pointer; font-size:11px; }

/* 章节卡片上的小进度条（课程页 .chapter） */
.chapter { position:relative; }
.chapter .ch-progress {
  position:absolute; top:14px; right:14px; display:flex; align-items:center; gap:8px;
  font-size:11px; color:var(--muted); background:var(--panel);
  padding:3px 8px; border-radius:8px; border:1px solid var(--line);
}
.chapter .ch-progress .dot { width:8px; height:8px; border-radius:50%; background:#8886; }
.chapter .ch-progress.pg-n .dot { background:#8886; }
.chapter .ch-progress.pg-i .dot { background:var(--warn); box-shadow:0 0 0 3px #f59e0b22; }
.chapter .ch-progress.pg-c .dot { background:var(--ok); box-shadow:0 0 0 3px #4ade8022; }

/* 浮动小按钮（未展开时显示右下角小入口） */
.tia-notes-launcher {
  position:fixed; right:20px; bottom:20px; z-index:499; width:54px; height:54px; border-radius:50%;
  background:linear-gradient(135deg,var(--brand),#7c5cff); color:#fff; border:none; cursor:pointer;
  box-shadow:0 10px 30px #000a; display:none; align-items:center; justify-content:center; font-size:22px;
}
.tia-notes-launcher.show { display:inline-flex; }

/* 我的学习页样式 */
.my-learn-hero { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
.my-learn-hero .cc { padding:16px; background:var(--panel-2); border:1px solid var(--line); border-radius:12px; }
.my-learn-hero .cc b { font-size:26px; font-family:Consolas,monospace; display:block; margin-bottom:4px; }
.my-learn-hero .cc span { font-size:12px; color:var(--muted); }
.my-learn-progressbar { width:100%; height:10px; background:var(--panel-2); border-radius:6px; overflow:hidden; margin:6px 0 0; border:1px solid var(--line); }
.my-learn-progressbar > div { height:100%; background:linear-gradient(90deg,var(--ok),var(--brand)); transition:width .3s; }
.ml-pages { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
.ml-page { padding:14px; background:var(--panel); border:1px solid var(--line); border-radius:12px; }
.ml-page .tt { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
.ml-page .tt a { font-weight:600; font-size:13.5px; color:var(--text); text-decoration:none; }
.ml-page .tt a:hover { color:var(--brand); }
.ml-page .pgl { width:100%; height:8px; background:var(--panel-2); border-radius:4px; overflow:hidden; border:1px solid var(--line); margin:8px 0; }
.ml-page .pgl > div { height:100%; background:linear-gradient(90deg,#22d3ee,var(--brand)); }
.ml-page .meta { display:flex; justify-content:space-between; font-size:11px; color:var(--muted); }
.ml-page .chips { display:flex; flex-wrap:wrap; gap:4px; margin-top:8px; }
.ml-page .chips .c { font-size:10px; padding:2px 7px; border-radius:10px; border:1px solid var(--line); color:var(--muted); background:var(--panel-2); }
.ml-page .chips .c.c { color:var(--ok); border-color:#4ade8044; background:#4ade8010; }
.ml-page .chips .c.i { color:var(--warn); border-color:#f59e0b44; background:#f59e0b10; }
.ml-page .chips .c.note { color:var(--brand); border-color:#7c5cff44; background:#7c5cff10; }

@media (max-width: 780px) {
  .ml-pages { grid-template-columns:repeat(1,1fr); }
  .my-learn-hero { grid-template-columns:repeat(2,1fr); }
  .tia-notes-panel .np-body .pg-hero { grid-template-columns:repeat(2,1fr); }
}
`;
  const s = document.createElement('style');
  s.setAttribute('data-tia', 'notes');
  s.textContent = CSS;
  document.head.appendChild(s);

  // ================ 2. 进度工具 ================
  const PROG_ORDER = ['not_started', 'learning', 'completed'];
  const PROG_LABEL = { not_started: '未开始', learning: '学习中', completed: '已完成' };
  const PROG_ICON  = { not_started: '○', learning: '◐', completed: '✓' };
  function nextProgress(p) {
    const i = PROG_ORDER.indexOf(p || 'not_started');
    return PROG_ORDER[(i + 1) % PROG_ORDER.length];
  }

  // ================ 3. 章节结构（课程页扫描） ================
  const sections = []; // [{ key, title, el }]
  function detectSections() {
    if (!isCoursePage) return sections;
    sections.length = 0;
    const chapters = document.querySelectorAll('.chapters .chapter');
    chapters.forEach((el, idx) => {
      const noEl = el.querySelector('.no');
      const no = noEl ? noEl.textContent.trim() : String(idx + 1).padStart(2, '0');
      const h3 = el.querySelector('h3');
      const title = h3 ? h3.textContent.trim() : `章节 ${no}`;
      const key = 'chap-' + no;
      // 给章节卡片挂 id（用于锚点跳转）
      if (!el.id) el.id = key;
      // 右侧小进度条
      let prog = el.querySelector('.ch-progress');
      if (!prog) {
        prog = htmlEl(`<div class="ch-progress pg-n"><span class="dot"></span><span class="lbl">未开始</span></div>`);
        el.appendChild(prog);
      }
      sections.push({ key, title, el, progEl: prog });
    });
    return sections;
  }

  // ================ 4. 状态 + API ================
  const state = {
    page_key: pageKey,
    bySection: new Map(), // section_key(String) -> note({id, progress, note_text, updated_at})
    stats: { total: 0, completed: 0, learning: 0, not_started: 0, pages: 0, withNote: 0 },
    allNotes: [],         // 我的学习页使用
    loading: false,
    openSectionKey: null,
    collapsed: false,
    saveTimers: new Map() // section_key -> debounce timer
  };

  function getNote(sk) { return state.bySection.get(sk || '') || null; }
  function setNote(sk, note) { if (note) state.bySection.set(sk || '', note); else state.bySection.delete(sk || ''); }

  async function refreshNotesForPage() {
    if (!TIA.auth.state.user) {
      state.bySection = new Map();
      renderNotesPanel();
      renderSectionCardsBadges();
      return;
    }
    state.loading = true;
    const { ok, data } = await TIA.api.fetchAuth('/api/notes?page_key=' + encodeURIComponent(pageKey), { method: 'GET' });
    state.loading = false;
    state.bySection = new Map();
    if (ok && data && data.list) {
      data.list.forEach(n => state.bySection.set(n.section_key || '', n));
    }
    renderNotesPanel();
    renderSectionCardsBadges();
  }

  async function refreshStats() {
    if (!TIA.auth.state.user) return;
    const { ok, data } = await TIA.api.fetchAuth('/api/notes/stats', { method: 'GET' });
    if (ok) state.stats = Object.assign({}, state.stats, data);
  }

  async function saveNote({ section_key, progress, note_text }) {
    if (!TIA.auth.requireAuth()) return null;
    const body = { page_key: pageKey };
    if (typeof section_key === 'string') body.section_key = section_key;
    if (typeof progress === 'string') body.progress = progress;
    if (typeof note_text === 'string') body.note_text = note_text;
    const { ok, data } = await TIA.api.fetchAuth('/api/notes', { method: 'POST', body: body });
    if (ok && data?.note) {
      setNote(data.note.section_key || '', data.note);
      refreshStats();
      return data.note;
    } else {
      toast(data?.error || '保存失败', 'err');
      return null;
    }
  }

  async function deleteNote(section_key, id) {
    if (!id) return false;
    const { ok } = await TIA.api.fetchAuth('/api/notes/' + id, { method: 'DELETE' });
    if (ok) {
      setNote(section_key || '', null);
      refreshStats();
      return true;
    }
    return false;
  }

  async function loadAllNotes() {
    if (!TIA.auth.state.user) return [];
    const { ok, data } = await TIA.api.fetchAuth('/api/notes?group=by_page', { method: 'GET' });
    if (ok && data) {
      state.allNotes = data.list || [];
      return { grouped: data.grouped || {}, list: data.list || [] };
    }
    return { grouped: {}, list: [] };
  }

  // ================ 5. 渲染：章节卡片上的小进度 ================
  function renderSectionCardsBadges() {
    if (!isCoursePage) return;
    sections.forEach(({ key, progEl }) => {
      const note = getNote(key);
      const p = note?.progress || 'not_started';
      progEl.classList.remove('pg-n', 'pg-i', 'pg-c');
      if (p === 'not_started') progEl.classList.add('pg-n');
      if (p === 'learning') progEl.classList.add('pg-i');
      if (p === 'completed') progEl.classList.add('pg-c');
      const lbl = progEl.querySelector('.lbl');
      if (lbl) lbl.textContent = PROG_LABEL[p];
    });
  }

  // ================ 6. 渲染：主笔记面板 ================
  let panelEl = null;
  let launcherEl = null;

  function computeProgressSummary() {
    let total, c = 0, i = 0, n = 0, wn = 0;
    if (isCoursePage && sections.length > 0) {
      total = sections.length;
      sections.forEach(({ key }) => {
        const nt = getNote(key);
        const p = nt?.progress || 'not_started';
        if (p === 'completed') c++;
        else if (p === 'learning') i++;
        else n++;
        if (nt && (nt.note_text || '').length > 0) wn++;
      });
    } else {
      total = 1;
      const pageNote = getNote('');
      const p = pageNote?.progress || 'not_started';
      if (p === 'completed') c = 1; else if (p === 'learning') i = 1; else n = 1;
      if (pageNote && (pageNote.note_text || '').length > 0) wn = 1;
    }
    return { total, c, i, n, wn, percent: total ? Math.round(c * 100 / total) : 0 };
  }

  function ensurePanel() {
    if (panelEl) return panelEl;
    panelEl = htmlEl(`
<div class="tia-notes-panel hidden collapsed" id="tiaNotesPanel">
  <div class="np-head">
    <div style="display:flex; align-items:center">
      <span class="ttl">📖 我的学习笔记</span>
      <span class="summ" id="npSumm"></span>
    </div>
    <div class="act">
      <span class="pill" id="npPill">0%</span>
      <button id="npToggle" title="展开/收起">−</button>
      <button id="npClose" title="隐藏面板">×</button>
    </div>
  </div>
  <div class="np-body" id="npBody"></div>
</div>`);
    document.body.appendChild(panelEl);

    panelEl.querySelector('#npClose').addEventListener('click', (e) => {
      e.stopPropagation();
      panelEl.classList.add('hidden');
      if (launcherEl) launcherEl.classList.add('show');
    });
    panelEl.querySelector('#npToggle').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCollapse();
    });
    panelEl.querySelector('.np-head').addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      toggleCollapse();
    });

    // 右下角展开入口按钮
    launcherEl = htmlEl(`<button class="tia-notes-launcher" title="打开我的学习笔记">📖</button>`);
    launcherEl.addEventListener('click', () => {
      launcherEl.classList.remove('show');
      panelEl.classList.remove('hidden');
      openPanel();
    });
    document.body.appendChild(launcherEl);

    return panelEl;
  }

  function toggleCollapse() {
    if (!panelEl) return;
    state.collapsed = !state.collapsed;
    panelEl.classList.toggle('collapsed', state.collapsed);
    panelEl.querySelector('#npToggle').textContent = state.collapsed ? '+' : '−';
  }
  function openPanel() {
    if (!panelEl) ensurePanel();
    state.collapsed = false;
    panelEl.classList.remove('collapsed', 'hidden');
    panelEl.querySelector('#npToggle').textContent = '−';
  }

  function renderNotesPanel() {
    ensurePanel();
    const summ = qs('#npSumm', panelEl);
    const pill = qs('#npPill', panelEl);
    const body = qs('#npBody', panelEl);
    const s = computeProgressSummary();
    if (summ) summ.textContent = `已完成 ${s.c}/${s.total} · 学习中 ${s.i}`;
    if (pill) pill.textContent = s.percent + '%';

    if (!TIA.auth.state.user) {
      body.classList.add('empty');
      body.innerHTML = `<div>
        <div style="font-size:26px;margin-bottom:10px">👤</div>
        <div style="margin-bottom:10px">登录后可记录学习笔记与进度<br>进度会与账号永久绑定，换设备也能看到</div>
        <button class="btn primary" style="margin-top:6px" id="npLoginBtn">立即登录 / 注册</button>
      </div>`;
      body.querySelector('#npLoginBtn').addEventListener('click', () => TIA.auth.login());
      return;
    }
    body.classList.remove('empty');

    // 头部进度统计 + 进度条
    body.innerHTML = `
      <div class="pg-hero">
        <div class="n l"><b>${s.total}</b><span>总章节</span></div>
        <div class="n n"><b>${s.n}</b><span>未开始</span></div>
        <div class="n i"><b>${s.i}</b><span>学习中</span></div>
        <div class="n c"><b>${s.c}</b><span>已完成</span></div>
      </div>
      <div style="padding:6px 0 12px; display:flex; justify-content:space-between; align-items:center; font-size:12px">
        <span style="color:var(--muted)">本页完成度</span>
        <b style="color:var(--brand)">${s.percent}%</b>
      </div>
      <div style="height:8px;background:var(--panel-2);border-radius:6px;overflow:hidden;border:1px solid var(--line);margin-bottom:12px">
        <div style="height:100%;width:${s.percent}%;background:linear-gradient(90deg,#22d3ee,var(--ok))"></div>
      </div>
      <div id="npSecList"></div>`;
    const list = qs('#npSecList', body);

    // 渲染章节条目
    let rows;
    if (isCoursePage && sections.length > 0) {
      rows = sections.map(sec => ({ key: sec.key, title: sec.title, anchor: sec.el?.id || sec.key }));
    } else {
      rows = [{ key: '', title: document.title || '本页笔记', anchor: null }];
    }

    rows.forEach(row => {
      const note = getNote(row.key);
      const prog = note?.progress || 'not_started';
      const hasNote = !!(note && (note.note_text || '').length > 0);
      const up = note?.updated_at ? new Date(note.updated_at) : null;
      const upStr = up ? (up.toLocaleDateString() + ' ' + up.toLocaleTimeString().slice(0, 5)) : '';
      const item = htmlEl(`
<div class="sec" data-sk="${row.key}">
  <div class="sec-row">
    <div class="sec-title" data-jump="${row.anchor || ''}">
      <div class="name">${row.title}</div>
      <div class="time">${upStr ? '最后保存：' + upStr : '尚未记录'}</div>
    </div>
    <div class="sec-actions">
      <button class="pg-btn ${prog}" title="进度：${PROG_LABEL[prog]}（点击切换）">${PROG_ICON[prog]}</button>
      <button class="note-btn ${hasNote ? 'has-note' : ''}" title="写笔记 / 查看笔记">✎</button>
    </div>
  </div>
  <div class="note-area ${state.openSectionKey === row.key ? 'open' : ''}">
    <textarea placeholder="这里写本节/本页的学习笔记，支持换行。会与账号永久绑定。…" spellcheck="false"></textarea>
    <div class="meta">
      <span class="st"></span>
      <button class="del">删除</button>
    </div>
  </div>
</div>`);
      if (note && typeof note.note_text === 'string') {
        item.querySelector('textarea').value = note.note_text;
      }
      // 绑定事件
      item.querySelector('.sec-title').addEventListener('click', () => {
        if (row.anchor) {
          const a = document.getElementById(row.anchor);
          if (a) a.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
      item.querySelector('.pg-btn').addEventListener('click', async () => {
        if (!TIA.auth.requireAuth()) return;
        const cur = getNote(row.key)?.progress || 'not_started';
        const next = nextProgress(cur);
        const saved = await saveNote({ section_key: row.key, progress: next });
        if (saved) {
          renderNotesPanel();
          renderSectionCardsBadges();
          toast('进度已更新：' + PROG_LABEL[next], 'ok');
        }
      });
      const noteBtn = item.querySelector('.note-btn');
      const noteArea = item.querySelector('.note-area');
      noteBtn.addEventListener('click', () => {
        if (!TIA.auth.requireAuth()) return;
        const open = noteArea.classList.toggle('open');
        state.openSectionKey = open ? row.key : null;
        const ta = noteArea.querySelector('textarea');
        if (open) setTimeout(() => ta.focus(), 50);
      });
      // 笔记文本：debounce 保存
      const ta = item.querySelector('textarea');
      const stEl = item.querySelector('.st');
      ta.addEventListener('input', () => {
        stEl.className = 'st saving'; stEl.textContent = '保存中…';
        if (state.saveTimers.has(row.key)) clearTimeout(state.saveTimers.get(row.key));
        const timer = setTimeout(async () => {
          const val = ta.value;
          const cur = getNote(row.key);
          const saved = await saveNote({
            section_key: row.key,
            note_text: val,
            progress: cur?.progress || undefined
          });
          if (saved) {
            stEl.className = 'st saved'; stEl.textContent = '已保存 ✓';
            renderNotesPanel(); // 重新刷新最后保存时间等
            renderSectionCardsBadges();
          } else {
            stEl.className = 'st'; stEl.textContent = '';
          }
        }, 700);
        state.saveTimers.set(row.key, timer);
      });
      ta.addEventListener('blur', () => {
        if (state.saveTimers.has(row.key)) {
          clearTimeout(state.saveTimers.get(row.key));
          state.saveTimers.delete(row.key);
        }
        const val = ta.value;
        if ((getNote(row.key)?.note_text || '') === val) return;
        stEl.className = 'st saving'; stEl.textContent = '保存中…';
        saveNote({ section_key: row.key, note_text: val }).then(saved => {
          if (saved) {
            stEl.className = 'st saved'; stEl.textContent = '已保存 ✓';
            renderNotesPanel(); renderSectionCardsBadges();
          } else {
            stEl.className = 'st'; stEl.textContent = '';
          }
        });
      });
      item.querySelector('.del').addEventListener('click', async () => {
        if (!confirm('确定删除这条笔记和进度吗？')) return;
        const n = getNote(row.key);
        const ok = await deleteNote(row.key, n?.id);
        if (ok) {
          ta.value = '';
          renderNotesPanel(); renderSectionCardsBadges();
          toast('已删除');
        }
      });
      list.appendChild(item);
    });
  }

  // ================ 7. "我的学习"聚合页渲染 ================
  const PAGE_TITLE_MAP = {
    'index.html': '首页',
    'courses/beginner.html': '入门篇',
    'courses/intermediate.html': '进阶篇',
    'courses/advanced.html': '精通篇',
    'engineering/index.html': '工程化能力',
    'lab/index.html': '仿真实验室',
    'lab/pid-hmi.html': '仿真 · PID 温度控制 HMI',
    'lab/isa88-hmi.html': '仿真 · ISA-88 批次状态机 HMI',
    'resources/index.html': '资源下载',
    'projects/index.html': '项目库',
    'tools/index.html': '工具与模板',
    'my-learning/index.html': '我的学习'
  };
  function friendlyPageTitle(p) {
    if (PAGE_TITLE_MAP[p]) return PAGE_TITLE_MAP[p];
    const m = p.match(/([^/]+)\/index\.html$/);
    if (m) return m[1];
    const m2 = p.match(/([^/]+)\.html$/);
    if (m2) return m2[1].replace(/-/g, ' ');
    return p;
  }

  async function renderMyLearningPage() {
    const root = qs('.wrap .my-learning-root');
    if (!root) return;
    if (!TIA.auth.state.user) {
      root.innerHTML = `
        <section class="card" style="text-align:center;padding:60px 20px">
          <div style="font-size:48px;margin-bottom:14px">👤</div>
          <h2 style="margin-bottom:8px">登录后查看你的学习记录与笔记</h2>
          <p class="hint" style="max-width:520px;margin:0 auto 20px">所有学习进度、章节笔记都与你的账号绑定，跨设备同步，随时可查。</p>
          <button class="btn primary" id="mlLoginBtn">立即登录 / 注册</button>
        </section>`;
      root.querySelector('#mlLoginBtn').addEventListener('click', () => TIA.auth.login());
      return;
    }
    root.innerHTML = `<section class="card"><div class="hint" style="color:var(--muted)">加载中…</div></section>`;
    const [{ grouped, list }] = await Promise.all([loadAllNotes(), refreshStats()]);
    await refreshStats();

    const stats = state.stats;
    // 计算总体完成度：按"已完成 / 总标记进度数"（所有笔记项中不是 not_started 的即标记过）
    const totalProgress = (stats.total || 0) + list.length * 0;
    const total = stats.total || 0;
    const pct = total ? Math.round((stats.completed || 0) * 100 / total) : 0;

    root.innerHTML = `
      <section class="card" style="padding:20px 22px">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">
          <div>
            <h2 style="margin:0 0 4px">👋 你好，${TIA.auth.state.user.username}</h2>
            <div class="hint">创建账号于 ${new Date(TIA.auth.state.user.created_at).toLocaleString()}。坚持学习，你已经比昨天更进一步！</div>
          </div>
          <div style="min-width:280px">
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:6px"><span>总体进度</span><b style="color:var(--brand)">${pct}%</b></div>
            <div class="my-learn-progressbar"><div style="width:${pct}%"></div></div>
          </div>
        </div>
      </section>

      <div class="my-learn-hero" style="margin-top:18px">
        <div class="cc"><b style="color:var(--cyan)">${stats.total || 0}</b><span>章节/页面已标记</span></div>
        <div class="cc"><b style="color:var(--ok)">${stats.completed || 0}</b><span>已完成章节</span></div>
        <div class="cc"><b style="color:var(--warn)">${stats.learning || 0}</b><span>正在学习中</span></div>
        <div class="cc"><b style="color:var(--brand)">${stats.withNote || 0}</b><span>写过的笔记</span></div>
      </div>

      <section class="card" style="margin-top:4px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
          <h2 style="margin:0">按页面查看</h2>
          <div class="hint">共 ${stats.pages || 0} 个页面有记录</div>
        </div>
        <div class="ml-pages" id="mlPagesGrid"></div>
      </section>
    `;
    const grid = qs('#mlPagesGrid', root);
    if (!grouped || Object.keys(grouped).length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; padding:40px 10px; text-align:center; color:var(--muted)">
        还没有学习记录～<br>去任意课程页点击「📖 我的学习笔记」开始记录吧。
      </div>`;
    } else {
      const entries = Object.entries(grouped).sort((a, b) => {
        const la = Math.max(...a[1].map(x => new Date(x.updated_at).getTime()));
        const lb = Math.max(...b[1].map(x => new Date(x.updated_at).getTime()));
        return lb - la;
      });
      entries.forEach(([pk, rows]) => {
        const t = rows.length;
        const c = rows.filter(r => r.progress === 'completed').length;
        const i = rows.filter(r => r.progress === 'learning').length;
        const hasNote = rows.filter(r => (r.note_text || '').length > 0).length;
        const pct = t ? Math.round(c * 100 / t) : 0;
        const card = htmlEl(`
<div class="ml-page">
  <div class="tt">
    <a href="${getRelative(pk)}" target="_blank" rel="noopener">${friendlyPageTitle(pk)}</a>
    <span class="cpg" style="font-size:12px;font-family:Consolas,monospace;color:var(--ok);font-weight:700">${pct}%</span>
  </div>
  <div class="pgl"><div style="width:${pct}%"></div></div>
  <div class="meta">
    <span>${c} / ${t} 完成 · ${i} 学习中</span>
    <span>${hasNote ? '📝 ' + hasNote + ' 条笔记' : '无笔记'}</span>
  </div>
  <div class="chips"></div>
</div>`);
        const chips = card.querySelector('.chips');
        if (c > 0) chips.appendChild(chip(`✓ ${c} 已完成`, 'c'));
        if (i > 0) chips.appendChild(chip(`◐ ${i} 学习中`, 'i'));
        if (hasNote > 0) chips.appendChild(chip(`✎ ${hasNote} 有笔记`, 'note'));
        grid.appendChild(card);
      });
    }
  }
  function chip(t, cls) { const x = document.createElement('span'); x.className = 'c ' + (cls || ''); x.textContent = t; return x; }
  function getRelative(targetPage) {
    // 从 my-learning/index.html 跳转到任意页。targetPage 已定义为相对于根路径
    // root 相对 my-learning/index.html 是 ../
    return '../' + targetPage;
  }

  // ================ 8. 启动 ================
  let inited = false;
  function init() {
    if (inited) return;
    inited = true;
    detectSections();
    ensurePanel();

    // 登录状态变化：刷新笔记
    TIA.auth.onChange(() => {
      if (isMyLearningPage) renderMyLearningPage();
      else {
        refreshNotesForPage();
        refreshStats();
      }
    });

    // auth.js 发出的刷新事件（登录/注册/退出）
    window.addEventListener('tia:notes:refresh', () => {
      if (isMyLearningPage) renderMyLearningPage();
      else {
        refreshNotesForPage();
        refreshStats();
      }
    });

    if (isMyLearningPage) {
      renderMyLearningPage();
    } else {
      // 默认在课程/其他页面：加载笔记；先收起面板（由用户点 launcher 或面板展开）
      refreshNotesForPage();
      refreshStats();
      state.collapsed = true;
      panelEl.classList.add('collapsed');
      panelEl.classList.remove('hidden');
      panelEl.querySelector('#npToggle').textContent = '+';
    }
  }

  TIA.notes = {
    state: state,
    init: init,
    refresh: () => { if (isMyLearningPage) renderMyLearningPage(); else { refreshNotesForPage(); refreshStats(); } },
    open: (sk) => {
      state.openSectionKey = sk || null;
      openPanel();
      renderNotesPanel();
    },
    renderMyLearningPage: renderMyLearningPage,
    saveNote: saveNote
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
