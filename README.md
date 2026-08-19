# 博途学习站 · TIA Portal 从入门到精通

> 系统化学习路线：三阶主线（入门→进阶→精通）+ 工程化能力横向贯穿 + 6 大支撑模块。
> 配套可导入博途的 **SCL 源文件** 与浏览器内直接运行的 **HMI 仿真器**，无硬件也能边学边练。
>
> **v2 新特性**（2026）：内置 **用户注册/登录系统 + 学习记录与笔记绑定账号**
> - 进度三态：未开始 / 学习中 / 已完成，章节卡片可一键切换
> - 笔记系统：每章节独立笔记，输入后自动保存，跨设备同步
> - 「我的学习」聚合页：按页面查看完成度、学习统计、笔记列表

<br>

## 🧭 网站架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    西门子博途学习站（本仓库）                       │
├─────────────────────────────────────────────────────────────────┤
│  ① 入门篇（约 2 周 · 打基础）                                      │
│   · PLC 原理与数据类型   · TIA Portal 安装界面                     │
│   · LAD 梯形图基础       · 位逻辑/定时器/计数器                    │
│   · 点灯仿真与快捷键     · 硬件组态与下载                          │
│  ② 进阶篇（约 1 月 · 架构化）                                      │
│   · 结构化编程 OB/FC/FB/DB                                       │
│   · SCL 结构化文本         │ → 配套 FB_PID.scl + PID HMI          │
│   · FBD / S7-GRAPH 顺控                                           │
│   · ISA-88 架构/状态机    │ → 配套 FB_BatchPhase.scl + 状态机 HMI │
│   · PROFINET 通信与 HMI   · 模拟量处理与 PID                      │
│  ③ 精通篇（约 2 月+ · 攻高级）                                     │
│   · 运动控制与伺服 V90   · 功能安全 S7-1200F/1500F                │
│   · WinCC SCADA 系统     · 诊断与冗余 R/H · MRP                   │
│   · 工业物联网 OPC UA    · TRACE 轨迹与数据采集                   │
├─────────────────────────────────────────────────────────────────┤
│  工程化能力（横向贯穿三阶 · 实战交付必备）                          │
│   🧩 UDT/程序库    📐 项目规范    🔀 版本管理 VCI-Git-AI Copilot │
│   🎮 虚拟调试      🔐 安全编程（Know-How/访问控制）              │
├─────────────────────────────────────────────────────────────────┤
│  支撑功能模块（6 大模块 赋能学习全程）                              │
│   📚 课程体系   🏭 实战项目库   🧪 仿真实验室                      │
│   📦 资源下载   💬 互动社区     🛠 工具箱                          │
└─────────────────────────────────────────────────────────────────┘
```

- **紫色/蓝色标记主题 = 高级语言/架构主线**
- **绿色 ●配套 标记 = 已提供 SCL 源文件 + 网页 HMI 仿真**

<br>

## 📂 仓库目录

```
TIA_learn_site/
├── server.js                               # ✅ v2 Express 后端：静态托管 + /api/*（auth/notes）+ SQLite
├── package.json                            # v2 依赖：express / better-sqlite3 / bcryptjs / jsonwebtoken / cors / dotenv
├── data/                                   # SQLite 数据文件目录（自动创建，已加入 .gitignore）
│   └── app.sqlite3                         # 用户表 + 笔记表（自动初始化）
├── index.html                              # 首页：Hero + 架构SVG + 三阶/工程化/支撑/配套速览
├── assets/
│   ├── css/style.css                       # 全局暗色主题 + 响应式（适配移动端）
│   └── js/
│       ├── auth.js                         # ✅ v2 前端鉴权：token 管理、登录/注册模态框、导航按钮
│       └── notes.js                        # ✅ v2 笔记面板：进度切换、笔记编辑、我的学习页
├── courses/
│   ├── beginner.html                       # 入门篇：6章 + 快捷键表 + 6项配套练习
│   ├── intermediate.html                   # 进阶篇：6章 + SCL代码示例 + 配套标记
│   └── advanced.html                       # 精通篇：6章 + 冗余对比表 + 3个毕业项目
├── my-learning/
│   └── index.html                          # ✅ v2 我的学习聚合页：学习统计 / 按页面进度 / 笔记概览
├── engineering/
│   └── index.html                          # 工程化能力：UDT/规范/VCI-Git/虚拟调试/安全编程
├── lab/
│   ├── index.html                          # 仿真实验室首页（仿真器入口目录）
│   ├── pid-hmi.html                        # ✅ PID 温度控制 HMI（实时整定+趋势图）
│   └── isa88-hmi.html                      # ✅ ISA-88 批次状态机 HMI（6状态+4工艺子步）
├── projects/
│   └── index.html                          # 实战项目库：入门3/进阶3/精通3 项目卡片
├── resources/
│   ├── index.html                          # 资源下载中心：速查表+官方索引+导入步骤
│   ├── FB_PID.scl                          # ✅ 位置式 PID（抗饱和/无扰动切换/首拍防突跳）
│   └── FB_BatchPhase.scl                   # ✅ ISA-88 Phase 6 状态机（CASE 实现）
├── community/
│   └── index.html                          # 互动社区：Top10报错速查 + 避坑帖 + 提问模板
└── tools/
    └── index.html                          # 工具箱：进制+工程量+CRC16+CPU选型表
```

### 🔐 v2 用户系统：数据模型

```sql
-- 用户表：用户名唯一，密码用 bcrypt 加盐哈希（绝不会保存明文）
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email    TEXT,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT NOW
);

-- 笔记/进度表：按 UNIQUE(user_id, page_key, section_key) 隔离
-- page_key    = 相对根路径的稳定页面标识（例：courses/beginner.html）
-- section_key = 章节 key（课程页为 chap-01..chap-NN，普通页为空字符串表示"整页"）
-- progress    = not_started | learning | completed  三态
CREATE TABLE notes (
  id INTEGER PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_key      TEXT    NOT NULL,
  section_key   TEXT    DEFAULT '',
  note_text     TEXT    DEFAULT '',
  progress      TEXT    NOT NULL DEFAULT 'not_started',
  created_at    DATETIME DEFAULT NOW,
  updated_at    DATETIME DEFAULT NOW,
  UNIQUE(user_id, page_key, section_key)
);
```

### 📡 v2 REST API 一览

| Method | 路径 | 鉴权 | 说明 |
|---|---|---|---|
| GET  | `/api/version` | ❌ | 版本与构建指纹（`X-Tia-Version` 响应头也会返回） |
| POST | `/api/auth/register` | ❌ | 注册：`{ username, password, email? }` → `{ user, token }` |
| POST | `/api/auth/login`    | ❌ | 登录（支持用户名/邮箱）：`{ username, password }` → `{ user, token }` |
| GET  | `/api/auth/me`       | ✅ | 取当前登录用户 |
| GET  | `/api/notes?page_key=X&group=by_page` | ✅ | 拉取笔记，`group=by_page` 会额外返回 `{ [page]: [...] }` 分组 |
| POST | `/api/notes`         | ✅ | 创建或更新（按 UNIQUE 冲突 UPSERT）：`{ page_key, section_key?, note_text?, progress? }` |
| PUT  | `/api/notes/:id`     | ✅ | 按 id 修改 note_text / progress |
| DELETE | `/api/notes/:id`  | ✅ | 删除笔记与进度 |
| GET  | `/api/notes/stats`   | ✅ | 统计：`{ total, completed, learning, not_started, pages, withNote }` |
| GET  | `/healthz`           | ❌ | 健康检查（含用户数） |

> 🔒 安全要点：notes 接口中 **user_id 一律由 JWT 鉴权中间件从 token 解出并注入**（`req.user.id`），**不接受**客户端传 user_id 参数，从源头避免越权。

<br>

## 🧪 已配套可交互工程

| 主题 | PLC 端（可导入博途） | HMI 端（浏览器直接运行） | 算法同步 |
|---|---|---|---|
| **S7 位置式 PID** | `resources/FB_PID.scl` | `lab/pid-hmi.html` | ✅ 1:1（抗饱和 + 无扰动切换 + 首拍防突跳 + 高低报警） |
| **ISA-88 批次 Phase 状态机** | `resources/FB_BatchPhase.scl` | `lab/isa88-hmi.html` | ✅ 1:1（6 状态 + 4 工艺子步 + 1 周期状态延迟 + Abort 命令优先） |

### 导入博途步骤（3 步）

```bash
1. 项目树 → 程序块文件夹 → 右键 → 从源生成块
2. 选择 .scl 文件（如 FB_PID.scl）→ 自动生成功能块
3. 在 OB1 或 OB35 中调用，生成背景 DB
   —— FB_PID 推荐放 OB35（循环中断 100ms），Ts 参数与周期一致
```

<br>

## 🖥 本地预览

本仓库同时支持**纯静态预览**（只看课程/HMI 仿真）和**Express 动态服务**（启用用户注册/登录 + 笔记/进度账号绑定）。

### ✨ 推荐：Express 动态服务（含用户系统 v2）

```bash
cd TIA_learn_site
npm install

# 方式 D-1：使用默认参数
npm start
# → 浏览器打开 http://localhost:3001  （/api/* + 静态页同一端口）

# 方式 D-2：自定义端口 + JWT 密钥（生产必改！）
# macOS / Linux:
PORT=8080 JWT_SECRET='请替换为一段足够长的随机字符串' npm start
# Windows PowerShell:
$env:PORT=8080; $env:JWT_SECRET='请替换为一段足够长的随机字符串'; npm start
```

首次启动会自动在 `data/app.sqlite3` 创建 `users` 与 `notes` 表（SQLite WAL 模式）。

### 纯静态预览（无用户系统）

```bash
# 方式 A：Python 3
cd TIA_learn_site
python -m http.server 8000
# → 浏览器打开 http://localhost:8000

# 方式 B：Node（需先 npm i -g serve）
serve -s .

# 方式 C：直接双击 index.html（部分浏览器 file:// 协议的在线工具 JS 可能受限，推荐 A/B）
```

<br>

## 🌐 部署

由于 v2 引入了用户系统（Node/Express + SQLite），请按你需要的部署方式选择：

### ✅ 推荐 A：Render Web Service（Node + 持久化 SQLite）—— 用户系统完整可用

> ⚠️ **注意**：如果你之前把本仓库部署为 **Render Static Site**，用户系统无法运行（静态站无 Node 运行时）。请把原服务删除或另建一个 **Web Service**（Node 环境）。

步骤（6 步）：

```
1. Render Dashboard → 右上角「New +」→ Web Service
2. 选择本仓库（TIA_learn_site）→ Next
3. Name:    tia-learn-site    （可自定义）
   Region:  Singapore（离国内近） 或 Oregon
   Runtime: Node
   Branch:  main
   Root Directory: （留空，或仓库不在根时填 repo/）
   Build Command:  npm install
   Start Command:  npm start
4. 点「Advanced」→  Add Environment Variable：
     Key:   JWT_SECRET
     Value: 打开 https://1password.com/password-generator/ 生成一段 32+ 字符的随机串（生产必改！）
5. 【关键：SQLite 持久化】→ Add Disk：
     Name:      tia-learn-data
     Mount Path: /opt/render/project/src/data        （对应仓库内 data/ 目录；如 Root Directory 填了子目录则相应调整）
     Size:      1 GB   （存用户+笔记绰绰有余，够用 5+ 年）
6. Create Web Service → 等待 1~3 分钟部署完成，访问 https://<你的服务名>.onrender.com
```

> 📌 `data/` 目录已加入 `.gitignore`，数据库不会提交到 Git。**Render 上如果没挂载 Disk，每次重新部署数据库会被清空（用户和笔记全丢），一定要加第 5 步。**
>
> 📌 健康检查：部署后访问 `https://<域名>/healthz` 或 `https://<域名>/api/version`，有 JSON 返回即表示服务正常。

### 部署 B：GitHub Pages / Vercel / Netlify / Cloudflare Pages（仅静态，用户系统不可用）

这些平台的"纯静态"模式无法运行 Node 服务端。仅部署静态版本时：
- 课程内容、HMI 仿真器、SCL 源文件下载 **全部可用**
- **用户注册/登录、笔记、学习进度会被禁用**（前端会提示需要动态服务端）

```bash
# GitHub Pages:
Settings → Pages → Source: main 分支 / root 目录 → 保存
# → https://<username>.github.io/TIA_learn_site
```

Vercel / Netlify / Cloudflare Pages：Import 本仓库即可，零配置。

<br>

## 📚 参考资料

| 资料 | 链接 |
|---|---|
| S7-1200 学习路径主题页（官方） | https://www.ad.siemens.com.cn/topicportal/index_46.html |
| 1847 西门子学习平台（官方视频） | https://1847.siemens.com.cn/ |
| 工业支持中心（手册+找答案） | https://support.industry.siemens.com/cs/cn/zh/ |
| TIA University（官方基础系列） | https://www.siemens.com/fi-fi/training/tia-university/ |
| TRACE 功能指南 | https://www.ad.siemens.com.cn/productportal/prods/s7-1200_plc_easy_plus/08-Function/18-Trace.html |
| MRP 介质冗余配置 | https://www.ad.siemens.com.cn/productportal/Prods/S7-1200_PLC_EASY_PLUS/11-Comm/02-Bus/02-Profinet/05-MRP.htm |
| S7-1500 R/H 冗余系统手册 | https://assets.new.siemens.com/siemens/assets/api/uuid:78a25a61-8f7a-4390-a44c-1b990bd0e13a/v17-launch-webinar-s71500rh-with-safety.pdf |
| 新人博途上手路线（避坑） | http://siemens.weisizhineng.com/company/news/itemid-10176.shtml |
| PLC 系统化学习路径 | https://huizhou0154038.11467.com/m/news/15054200.asp |
| 纠结梯形图还是 SCL？实例干货 | http://m.toutiao.com/group/7542384056151966248/ |

<br>

## 🗺 学习路线建议

```
入门篇 2 周 → 进阶篇 1 月 → 精通篇 2 月+
    ↓            ↓             ↓
  ┌─────────── 工程化能力（贯穿全程）────────────┐
  │ UDT库  →  项目规范  →  版本管理  →  虚拟调试  →  安全编程 │
  └────────────────────────────────────────────┘
```

### 关键原则
- **S7-1200 为练手首选**：兼容性好、PLCSIM 仿真齐全、无硬件门槛
- **LAD 优先入门，1-2 周熟练后再学 SCL**：位逻辑用 LAD（监控直观），批量运算/解析用 SCL（简洁），顺控用 GRAPH
- **M 区是坏习惯**：所有变量进 DB，符号寻址（`"DB".Tag`）
- **TIA 安装路径千万不能有中文**：C:\TIA\Proj 这种纯英文最稳
- **配套工程必手敲一遍**：打开仿真 → 改参数 → 改代码 → 对照 SCL 源文件导入博途

<br>

## ⚠️ 免责声明

- 本站内容与西门子博途配套工程**仅供个人学习交流使用**
- 实际工业项目请严格遵循 Siemens 官方手册与企业电气安全规范
- 所有西门子产品名、商标权属 **Siemens AG** 所有
- 配套 PLC 工程未经过 SIL/CE/UL 等认证，**禁止直接用于生产现场**

---

*本仓库持续更新，欢迎 Star / Issue 反馈补充内容。*
