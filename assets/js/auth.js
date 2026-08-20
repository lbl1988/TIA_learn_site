/* ========================================================================
 * auth.js —— 博途学习站 v2 用户系统（注册/登录/鉴权/导航按钮/模态框）
 * 暴露全局命名空间 window.TIA ，其中:
 *   - TIA.auth.state       状态{ user, token, initialized }
 *   - TIA.auth.init()      初始化（DOM + /me）
 *   - TIA.auth.showModal(tab)  tab='login' | 'register'
 *   - TIA.auth.logout()    退出登录
 *   - TIA.auth.onChange(fn) 订阅用户状态变化
 *   - TIA.api.fetchAuth(url, opts)  自动带 token 头，401 时清态
 * ====================================================================== */
(function () {
  'use strict';

  // ================ 1. 样式注入 ================
  const CSS = `
/* ---- 导航区鉴权按钮 ---- */
.nav-auth { display:flex; align-items:center; gap:10px; margin-left:12px; flex-shrink:0; }
.nav-auth button, .nav-auth a {
  background:var(--panel-2); color:var(--text); border:1px solid var(--line);
  border-radius:8px; padding:6px 12px; font-size:13px; cursor:pointer; text-decoration:none;
}
.nav-auth .primary { background:linear-gradient(135deg,var(--brand),#7c5cff); color:#fff; border-color:transparent; }
.nav-auth .user-chip { position:relative; display:inline-flex; align-items:center; gap:6px; padding:6px 10px; cursor:pointer; border-radius:8px; background:var(--panel-2); border:1px solid var(--line); font-size:13px; }
.nav-auth .avatar { width:22px; height:22px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#22d3ee,#7c5cff); color:#fff; font-size:11px; font-weight:700; }
.nav-auth .user-menu { position:absolute; top:calc(100% + 6px); right:0; background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:6px; min-width:160px; box-shadow:0 12px 30px #0006; z-index:2000; display:none; }
.nav-auth .user-chip.open .user-menu { display:block; }
.nav-auth .user-menu a, .nav-auth .user-menu button { display:block; width:100%; text-align:left; background:transparent; border:none; padding:8px 10px; border-radius:6px; color:var(--text); cursor:pointer; font-size:13px; }
.nav-auth .user-menu a:hover, .nav-auth .user-menu button:hover { background:var(--panel-2); }
.nav-auth .user-menu .divider { height:1px; background:var(--line); margin:4px 0; }

/* ---- 通用模态框 ---- */
.tia-modal-mask { position:fixed; inset:0; background:#000a; display:flex; align-items:center; justify-content:center; z-index:9999; }
.tia-modal { width:90%; max-width:420px; background:var(--panel); border:1px solid var(--line); border-radius:14px; overflow:hidden; box-shadow:0 20px 60px #000a; }
.tia-modal .tm-head { padding:16px 20px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; }
.tia-modal .tm-head h3 { margin:0; font-size:16px; }
.tia-modal .tm-close { background:transparent; border:none; color:var(--muted); cursor:pointer; font-size:20px; }
.tia-modal .tm-tabs { display:flex; gap:0; padding:0 20px; border-bottom:1px solid var(--line); }
.tia-modal .tm-tab { background:transparent; border:none; padding:10px 14px; color:var(--muted); cursor:pointer; font-size:13px; border-bottom:2px solid transparent; }
.tia-modal .tm-tab.active { color:var(--brand); border-bottom-color:var(--brand); }
.tia-modal .tm-tab.forgot-link { margin-left:auto; color:var(--muted); font-size:12px; border-bottom:none; }
.tia-modal .tm-tab.forgot-link.active { color:var(--brand); }
.tia-modal .tm-body { padding:20px; }
.tia-modal .field { margin-bottom:12px; }
.tia-modal .field label { display:block; font-size:12px; color:var(--muted); margin-bottom:6px; }
.tia-modal .field input { width:100%; padding:10px 12px; background:var(--panel-2); color:var(--text); border:1px solid var(--line); border-radius:8px; font-size:14px; box-sizing:border-box; }
.tia-modal .field input:focus { outline:none; border-color:var(--brand); }
.tia-modal .tm-submit { width:100%; padding:11px; background:linear-gradient(135deg,var(--brand),#7c5cff); color:#fff; border:none; border-radius:8px; cursor:pointer; font-size:14px; font-weight:600; margin-top:4px; }
.tia-modal .tm-submit[disabled] { opacity:0.6; cursor:not-allowed; }
.tia-modal .tm-err { background:#ff3b5c15; color:#ff7b8b; padding:10px 12px; border-radius:8px; margin-bottom:12px; font-size:13px; border:1px solid #ff3b5c33; display:none; }
.tia-modal .tm-err.show { display:block; }
.tia-modal .tm-hint { font-size:12px; color:var(--muted); margin-top:12px; text-align:center; }
.tia-modal .tm-hint a { color:var(--brand); cursor:pointer; text-decoration:underline; background:none; border:none; padding:0; font-size:12px; }

/* ---- 吐司提示 ---- */
.tia-toast { position:fixed; top:20px; right:20px; background:var(--panel); border:1px solid var(--line); padding:12px 16px; border-radius:10px; z-index:99999; box-shadow:0 8px 22px #0008; animation:toastIn .2s ease; max-width:320px; font-size:13px; }
.tia-toast.ok { border-color:#4ade8055; }
.tia-toast.err { border-color:#ff3b5c55; }
@keyframes toastIn { from { transform:translateX(20px); opacity:0 } to { transform:none; opacity:1 } }
`;
  const styleEl = document.createElement('style');
  styleEl.setAttribute('data-tia', 'auth');
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ================ 2. 公共工具 ================
  function toast(msg, type) {
    const t = document.createElement('div');
    t.className = 'tia-toast ' + (type || '');
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .2s'; }, 2200);
    setTimeout(() => t.remove(), 2600);
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function html(s) { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; }

  function currentPageKey() {
    // 生成稳定的 page_key：相对根路径
    const p = location.pathname.replace(/\/+/g, '/').replace(/^\/+/, '');
    if (!p || p === '') return 'index.html';
    if (p.endsWith('/')) return p + 'index.html';
    return p;
  }

  // ================ 3. 模态框 DOM ================
  let modalMounted = false;
  function ensureModal() {
    if (modalMounted) return;
    modalMounted = true;
    const modal = html(`
<div class="tia-modal-mask" id="tiaAuthModal" style="display:none">
  <div class="tia-modal">
    <div class="tm-head">
      <h3 id="tm-title">登录</h3>
      <button class="tm-close" id="tm-close" aria-label="关闭">×</button>
    </div>
    <div class="tm-tabs">
      <button class="tm-tab active" data-tab="login">登录</button>
      <button class="tm-tab" data-tab="register">注册</button>
      <button class="tm-tab forgot-link" data-tab="forgot">忘记密码</button>
    </div>
    <div class="tm-body">
      <div class="tm-err" id="tm-err"></div>
      <!-- 登录 -->
      <form id="tm-login" data-tab="login">
        <div class="field"><label>用户名 / 邮箱</label><input type="text" name="username" autocomplete="username" required></div>
        <div class="field"><label>密码</label><input type="password" name="password" autocomplete="current-password" required></div>
        <button class="tm-submit" type="submit">登 录</button>
        <div class="tm-hint">还没有账号？<button type="button" data-tab-switch="register">立即注册</button>　·　<button type="button" data-tab-switch="forgot">忘记密码</button></div>
      </form>
      <!-- 注册 -->
      <form id="tm-register" data-tab="register" style="display:none">
        <div class="field"><label>用户名 (2-32 字符)</label><input type="text" name="username" autocomplete="username" required minlength="2" maxlength="32"></div>
        <div class="field"><label>邮箱（可选，用于找回密码）</label><input type="email" name="email" autocomplete="email"></div>
        <div class="field"><label>密码（≥6 位）</label><input type="password" name="password" autocomplete="new-password" required minlength="6"></div>
        <button class="tm-submit" type="submit">创建账号</button>
        <div class="tm-hint">已有账号？<button type="button" data-tab-switch="login">去登录</button></div>
      </form>
      <!-- 忘记密码 -->
      <form id="tm-forgot" data-tab="forgot" style="display:none">
        <div class="field"><label>用户名</label><input type="text" name="username" autocomplete="username" required></div>
        <div class="field"><label>注册邮箱（注册时填了邮箱则必填）</label><input type="email" name="email" autocomplete="email" placeholder="未绑定邮箱则留空"></div>
        <div class="field"><label>新密码（≥6 位）</label><input type="password" name="newPassword" autocomplete="new-password" required minlength="6"></div>
        <div class="field"><label>确认新密码</label><input type="password" name="confirmPassword" autocomplete="new-password" required minlength="6"></div>
        <button class="tm-submit" type="submit">重置密码</button>
        <div class="tm-hint">想起来了？<button type="button" data-tab-switch="login">去登录</button></div>
      </form>
    </div>
  </div>
</div>`);
    document.body.appendChild(modal);

    // 绑定事件
    modal.addEventListener('click', function (e) {
      if (e.target.id === 'tm-close' || e.target.classList.contains('tia-modal-mask')) hideModal();
      const tab = e.target.getAttribute && e.target.getAttribute('data-tab');
      if (tab) switchTab(tab);
      const sw = e.target.getAttribute && e.target.getAttribute('data-tab-switch');
      if (sw) switchTab(sw);
    });

    modal.querySelector('#tm-login').addEventListener('submit', onLoginSubmit);
    modal.querySelector('#tm-register').addEventListener('submit', onRegisterSubmit);
    modal.querySelector('#tm-forgot').addEventListener('submit', onForgotSubmit);
  }

  function switchTab(tab) {
    const mask = qs('#tiaAuthModal');
    mask.querySelectorAll('.tm-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    mask.querySelectorAll('form[data-tab]').forEach(f => { f.style.display = f.dataset.tab === tab ? '' : 'none'; });
    qs('#tm-title').textContent = tab === 'login' ? '登录' : tab === 'register' ? '注册新账号' : '重置密码';
    qs('#tm-err').classList.remove('show');
    const input = mask.querySelector(`form[data-tab="${tab}"] input`);
    if (input) setTimeout(() => input.focus(), 50);
  }

  function showModal(tab) {
    ensureModal();
    qs('#tiaAuthModal').style.display = '';
    switchTab(tab || 'login');
  }
  function hideModal() { const m = qs('#tiaAuthModal'); if (m) m.style.display = 'none'; }
  function setErr(msg) { const e = qs('#tm-err'); if (!e) return; if (!msg) { e.classList.remove('show'); return; } e.textContent = msg; e.classList.add('show'); }

  // ================ 4. TIA API 封装 ================
  const TOKEN_KEY = 'tia_auth_token_v2';
  const state = { user: null, token: null, initialized: false, _subs: [] };

  function persistToken(tok) {
    state.token = tok || null;
    if (tok) localStorage.setItem(TOKEN_KEY, tok);
    else localStorage.removeItem(TOKEN_KEY);
  }
  function readToken() {
    try { return localStorage.getItem(TOKEN_KEY) || null; } catch (_) { return null; }
  }

  async function apiRequest(url, opts) {
    const o = opts || {};
    const headers = Object.assign({ 'Content-Type': 'application/json' }, o.headers || {});
    if (state.token) headers.Authorization = 'Bearer ' + state.token;
    if (o.body && typeof o.body !== 'string' && !(o.body instanceof FormData)) o.body = JSON.stringify(o.body);
    const resp = await fetch(url, Object.assign({}, o, { headers, body: o.body }));
    let data = null;
    try { data = await resp.json(); } catch (_) { data = null; }
    if (!resp.ok && resp.status === 401) {
      // 鉴权失败 → 清除状态
      persistToken(null);
      state.user = null;
      emitChange();
    }
    return { ok: resp.ok, status: resp.status, data: data, response: resp };
  }

  // ================ 5. 登录/注册提交 ================
  async function onLoginSubmit(e) {
    e.preventDefault(); setErr(null);
    const fd = new FormData(e.currentTarget);
    const payload = { username: (fd.get('username') || '').toString().trim(), password: (fd.get('password') || '').toString() };
    e.currentTarget.querySelector('.tm-submit').disabled = true;
    const { ok, data } = await apiRequest('/api/auth/login', { method: 'POST', body: payload });
    e.currentTarget.querySelector('.tm-submit').disabled = false;
    if (!ok) return setErr((data?.error ? data.error + (data?.detail ? '：' + data.detail : '') : '') || '登录失败，请检查用户名和密码');
    persistToken(data.token);
    state.user = data.user;
    emitChange();
    renderAuthWidget();
    hideModal();
    toast('欢迎回来，' + data.user.username + '！', 'ok');
    window.dispatchEvent(new CustomEvent('tia:notes:refresh'));
  }

  async function onRegisterSubmit(e) {
    e.preventDefault(); setErr(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      username: (fd.get('username') || '').toString().trim(),
      email:    (fd.get('email')    || '').toString().trim() || null,
      password: (fd.get('password') || '').toString()
    };
    if (payload.username.length < 2) return setErr('用户名长度 2-32 字符');
    if (payload.password.length < 6) return setErr('密码至少 6 位');
    e.currentTarget.querySelector('.tm-submit').disabled = true;
    const { ok, data } = await apiRequest('/api/auth/register', { method: 'POST', body: payload });
    e.currentTarget.querySelector('.tm-submit').disabled = false;
    if (!ok) return setErr((data?.error ? data.error + (data?.detail ? '：' + data.detail : '') : '') || '注册失败，请检查输入');
    persistToken(data.token);
    state.user = data.user;
    emitChange();
    renderAuthWidget();
    hideModal();
    toast('账号已创建，开始学习吧！', 'ok');
    window.dispatchEvent(new CustomEvent('tia:notes:refresh'));
  }

  // ================ 5b. 忘记密码提交 ================
  async function onForgotSubmit(e) {
    e.preventDefault(); setErr(null);
    const fd = new FormData(e.currentTarget);
    const username = (fd.get('username') || '').toString().trim();
    const email = (fd.get('email') || '').toString().trim() || null;
    const newPassword = (fd.get('newPassword') || '').toString();
    const confirmPassword = (fd.get('confirmPassword') || '').toString();
    if (!username) return setErr('请输入用户名');
    if (newPassword.length < 6) return setErr('新密码至少 6 位');
    if (newPassword !== confirmPassword) return setErr('两次输入的密码不一致');
    e.currentTarget.querySelector('.tm-submit').disabled = true;
    const { ok, data } = await apiRequest('/api/auth/reset-password', { method: 'POST', body: { username, email, newPassword } });
    e.currentTarget.querySelector('.tm-submit').disabled = false;
    if (!ok) return setErr((data?.error ? data.error + (data?.detail ? '：' + data.detail : '') : '') || '重置失败');
    persistToken(data.token);
    state.user = data.user;
    emitChange();
    renderAuthWidget();
    hideModal();
    toast('密码已重置，欢迎回来！', 'ok');
    window.dispatchEvent(new CustomEvent('tia:notes:refresh'));
  }

  function logout() {
    persistToken(null);
    state.user = null;
    emitChange();
    renderAuthWidget();
    toast('已退出登录');
    window.dispatchEvent(new CustomEvent('tia:notes:refresh'));
  }

  // ================ 6. 导航区鉴权按钮渲染 ================
  let authWdigetEl = null;
  function ensureWidget() {
    if (authWdigetEl) return authWdigetEl;
    // 放到 nav-inner 中 menu 后面
    const inner = qs('.nav .nav-inner');
    if (!inner) return null;
    const wrap = html('<div class="nav-auth" id="tiaAuthWidget"></div>');
    inner.appendChild(wrap);
    // 点击外部关闭 user-chip 菜单
    document.addEventListener('click', (e) => {
      const chip = wrap.querySelector('.user-chip');
      if (chip && !wrap.contains(e.target)) chip.classList.remove('open');
    });
    authWdigetEl = wrap;
    return wrap;
  }

  function renderAuthWidget() {
    const w = ensureWidget();
    if (!w) return;
    if (!state.initialized) return; // 未初始化不渲染
    w.innerHTML = '';
    if (state.user) {
      const letter = (state.user.username || '?').charAt(0).toUpperCase();
      const chip = html(`
<div class="user-chip" id="tiaUserChip">
  <span class="avatar">${letter}</span>
  <span class="uname">${state.user.username}</span>
  <div class="user-menu">
    <a href="my-learning/index.html">📖 我的学习</a>
    <div class="divider"></div>
    <button id="tiaBtnLogout">退出登录</button>
  </div>
</div>`);
      chip.addEventListener('click', (e) => {
        if (e.target.closest('#tiaBtnLogout')) return; // 退出按钮自己处理
        e.stopPropagation();
        chip.classList.toggle('open');
      });
      w.appendChild(chip);
      chip.querySelector('#tiaBtnLogout').addEventListener('click', (e) => {
        e.stopPropagation();
        logout();
      });
    } else {
      const login = document.createElement('button');
      login.textContent = '登录';
      login.addEventListener('click', () => showModal('login'));
      const reg = document.createElement('button');
      reg.className = 'primary';
      reg.textContent = '注册';
      reg.addEventListener('click', () => showModal('register'));
      w.appendChild(login);
      w.appendChild(reg);
    }
  }

  // ================ 7. 订阅/事件 ================
  function emitChange() {
    (state._subs || []).forEach(fn => { try { fn(state.user, state); } catch (_) {} });
  }
  function onChange(fn) { if (typeof fn !== 'function') return; state._subs = state._subs || []; state._subs.push(fn); }

  async function init() {
    state.token = readToken();
    if (state.token) {
      const { ok, data } = await apiRequest('/api/auth/me', { method: 'GET' });
      if (ok && data?.user) state.user = data.user;
      else { persistToken(null); state.user = null; }
    }
    state.initialized = true;
    renderAuthWidget();
    emitChange();
  }

  // ================ 8. 暴露命名空间 ================
  window.TIA = window.TIA || {};
  window.TIA.auth = {
    state: state,
    init: init,
    login: () => showModal('login'),
    register: () => showModal('register'),
    showModal: showModal,
    hideModal: hideModal,
    logout: logout,
    onChange: onChange,
    requireAuth: function () {
      if (state.user) return true;
      toast('请先登录', 'err');
      setTimeout(() => showModal('login'), 200);
      return false;
    }
  };
  window.TIA.api = {
    fetchAuth: apiRequest,
    currentPageKey: currentPageKey,
    toast: toast
  };
  window.TIA.$ = { qs: qs, html: html };

  // 若 DOM 已就绪立即 init，否则等 DOMContentLoaded
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
