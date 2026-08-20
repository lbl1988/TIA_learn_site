require('dotenv').config();

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

// ============================================================
// 1. 环境 & 常量
// ============================================================
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'tia-learn-site-dev-secret-change-in-prod';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '30d';
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'app.sqlite3');
const BUILD_ID = 'tia-learn-v2-' + (process.env.RENDER_GIT_COMMIT || 'local');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ============================================================
// 2. 数据库初始化
// ============================================================
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    page_key TEXT NOT NULL,
    section_key TEXT DEFAULT '',
    note_text TEXT DEFAULT '',
    progress TEXT NOT NULL DEFAULT 'not_started',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, page_key, section_key)
  );

  CREATE INDEX IF NOT EXISTS idx_notes_user_page ON notes(user_id, page_key);
`);

// ============================================================
// 3. Express 实例 & 通用中间件
//    —— /api/* 路由永远注册在静态托管之前 ——
// ============================================================
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// 版本指纹：响应头 + /api/version 接口
app.use((req, res, next) => {
  res.setHeader('X-Tia-Version', BUILD_ID);
  next();
});

app.get('/api/version', (req, res) => {
  res.json({ build: BUILD_ID, time: new Date().toISOString(), uptime: process.uptime() });
});

// ============================================================
// 4. JWT 鉴权中间件（单一可信身份源：token → user）
//    notes 接口中以 req.user.id 为唯一 user_id，禁止客户端传 user_id
// ============================================================
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized', detail: '缺少 token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(payload.sub);
    if (!user) return res.status(401).json({ error: 'unauthorized', detail: '用户不存在' });
    req.user = user; // 后续路由使用 req.user.id
    next();
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized', detail: 'token 无效或过期' });
  }
}

// ============================================================
// 5. 认证路由 /api/auth/*
// ============================================================
const authRouter = express.Router();

// POST /api/auth/register —— 注册
authRouter.post('/register', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '参数错误', detail: '用户名与密码必填' });
  if (username.length < 2 || username.length > 32) return res.status(400).json({ error: '参数错误', detail: '用户名长度 2-32 字符' });
  if (password.length < 6) return res.status(400).json({ error: '参数错误', detail: '密码至少 6 位' });

  const exists = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: '用户名已存在', detail: '换个用户名试试' });

  if (email && email.length > 0) {
    const emailExists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (emailExists) return res.status(409).json({ error: '邮箱已被注册', detail: '换个邮箱或留空' });
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
    .run(username, email || null, password_hash);
  const user = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.status(201).json({ user, token });
});

// POST /api/auth/login —— 登录（支持用户名或邮箱）
authRouter.post('/login', (req, res) => {
  const { username, email, password } = req.body || {};
  const identifier = username || email;
  if (!identifier || !password) return res.status(400).json({ error: '参数错误', detail: '账号与密码必填' });

  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(identifier, identifier);
  if (!user) return res.status(401).json({ error: '账号或密码错误' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: '账号或密码错误' });

  const safeUser = { id: user.id, username: user.username, email: user.email, created_at: user.created_at };
  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({ user: safeUser, token });
});

// GET /api/auth/me —— 取当前登录用户（鉴权）
authRouter.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/reset-password —— 忘记密码重置（通过用户名+邮箱验证）
authRouter.post('/reset-password', (req, res) => {
  const { username, email, newPassword } = req.body || {};
  if (!username || !newPassword) return res.status(400).json({ error: '参数错误', detail: '用户名与新密码必填' });
  if (newPassword.length < 6) return res.status(400).json({ error: '参数错误', detail: '新密码至少 6 位' });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) return res.status(404).json({ error: '用户不存在', detail: '请检查用户名拼写' });

  // 如果用户注册时填写了邮箱，必须匹配邮箱才能重置
  if (user.email) {
    if (!email || email !== user.email) {
      return res.status(403).json({ error: '邮箱不匹配', detail: '该账号绑定了邮箱，请输入注册时的邮箱' });
    }
  } else {
    // 没绑定邮箱的用户，通过用户名即可重置（学习站简化方案）
    if (email) return res.status(403).json({ error: '该账号未绑定邮箱', detail: '请留空邮箱字段' });
  }

  const password_hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(password_hash, user.id);
  const safeUser = { id: user.id, username: user.username, email: user.email, created_at: user.created_at };
  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({ user: safeUser, token, message: '密码重置成功' });
});

app.use('/api/auth', authRouter);

// ============================================================
// 6. 笔记 / 学习进度路由 /api/notes（全鉴权）
//    —— user_id 一律取自 req.user.id，禁止客户端写入 ——
// ============================================================
const notesRouter = express.Router();
notesRouter.use(authRequired);

const PROGRESS_ENUM = new Set(['not_started', 'learning', 'completed']);

// GET /api/notes
//   查询参数：
//     - page_key: 可选，只返回指定页面
//     - group: 可选 "by_page" 时按 page_key 分组
notesRouter.get('/', (req, res) => {
  const { page_key, group } = req.query;
  let rows;
  if (page_key) {
    rows = db.prepare(`
      SELECT id, page_key, section_key, note_text, progress, created_at, updated_at
      FROM notes WHERE user_id = ? AND page_key = ?
      ORDER BY section_key ASC, id ASC
    `).all(req.user.id, page_key);
  } else {
    rows = db.prepare(`
      SELECT id, page_key, section_key, note_text, progress, created_at, updated_at
      FROM notes WHERE user_id = ?
      ORDER BY updated_at DESC
    `).all(req.user.id);
  }
  if (group === 'by_page') {
    const grouped = {};
    for (const r of rows) {
      grouped[r.page_key] = grouped[r.page_key] || [];
      grouped[r.page_key].push(r);
    }
    return res.json({ grouped, list: rows });
  }
  res.json({ list: rows });
});

// GET /api/notes/stats —— 学习统计
notesRouter.get('/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) AS c FROM notes WHERE user_id = ?').get(req.user.id).c;
  const completed = db.prepare(`SELECT COUNT(*) AS c FROM notes WHERE user_id = ? AND progress = 'completed'`).get(req.user.id).c;
  const learning = db.prepare(`SELECT COUNT(*) AS c FROM notes WHERE user_id = ? AND progress = 'learning'`).get(req.user.id).c;
  const pages = db.prepare('SELECT COUNT(DISTINCT page_key) AS c FROM notes WHERE user_id = ?').get(req.user.id).c;
  const withNote = db.prepare(`SELECT COUNT(*) AS c FROM notes WHERE user_id = ? AND LENGTH(COALESCE(note_text,'')) > 0`).get(req.user.id).c;
  res.json({ total, completed, learning, not_started: total - completed - learning, pages, withNote });
});

// POST /api/notes —— 创建或更新（按 UNIQUE(user_id, page_key, section_key)）
//   body: { page_key, section_key?, note_text?, progress? }
notesRouter.post('/', (req, res) => {
  const { page_key, section_key, note_text, progress } = req.body || {};
  if (!page_key || typeof page_key !== 'string') {
    return res.status(400).json({ error: '参数错误', detail: 'page_key 必填' });
  }
  const sk = (typeof section_key === 'string') ? section_key : '';
  const p = (typeof progress === 'string' && PROGRESS_ENUM.has(progress)) ? progress : 'not_started';
  const nt = (typeof note_text === 'string') ? note_text : '';

  // UPSERT：存在则更新 note_text/progress，不存在则插入
  const info = db.prepare(`
    INSERT INTO notes (user_id, page_key, section_key, note_text, progress)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, page_key, section_key) DO UPDATE SET
      note_text = COALESCE(EXCLUDED.note_text, notes.note_text),
      progress  = COALESCE(EXCLUDED.progress,  notes.progress),
      updated_at = datetime('now')
  `).run(req.user.id, page_key, sk, nt, p);

  let row;
  if (info.changes > 0) {
    row = db.prepare(`
      SELECT id, page_key, section_key, note_text, progress, created_at, updated_at
      FROM notes WHERE user_id = ? AND page_key = ? AND section_key = ?
    `).get(req.user.id, page_key, sk);
  } else {
    row = null;
  }
  res.status(200).json({ note: row });
});

// PUT /api/notes/:id —— 更新笔记 / 进度
notesRouter.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'id 非法' });

  const existing = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!existing) return res.status(404).json({ error: '笔记不存在' });

  const { note_text, progress } = req.body || {};
  const newText = (typeof note_text === 'string') ? note_text : existing.note_text;
  const newProgress = (typeof progress === 'string' && PROGRESS_ENUM.has(progress)) ? progress : existing.progress;

  db.prepare(`
    UPDATE notes SET note_text = ?, progress = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?
  `).run(newText, newProgress, id, req.user.id);

  const row = db.prepare(`
    SELECT id, page_key, section_key, note_text, progress, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?
  `).get(id, req.user.id);
  res.json({ note: row });
});

// DELETE /api/notes/:id
notesRouter.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: 'id 非法' });
  const info = db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: '笔记不存在' });
  res.json({ deleted: id });
});

app.use('/api/notes', notesRouter);

// ============================================================
// 7. 静态资源托管（/index.html、/courses/、/assets/、*.scl 等）
// ============================================================
const staticOpts = {
  extensions: ['html'],
  index: 'index.html',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.scl')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment');
    }
  }
};
app.use(express.static(__dirname, staticOpts));

// 兜底：非 /api 且不存在的路径 → 交给 404（express.static 已处理 404，这里留一个健康检查）
app.get('/healthz', (req, res) => {
  res.json({ ok: true, build: BUILD_ID, db: db.prepare('SELECT COUNT(*) AS c FROM users').get() });
});

// ============================================================
// 8. 启动
// ============================================================
const server = app.listen(PORT, '0.0.0.0', () => {
  const addr = server.address();
  console.log(`[TIA Learn v2] 启动成功 → http://localhost:${addr.port}`);
  console.log(`[TIA Learn v2] 数据库路径 → ${DB_PATH}`);
  console.log(`[TIA Learn v2] Build ID → ${BUILD_ID}`);
  console.log(`[TIA Learn v2] JWT 有效期 → ${JWT_EXPIRES}`);
});
