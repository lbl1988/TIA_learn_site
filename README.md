# 博途学习站 · TIA Portal 从入门到精通

> 系统化学习路线：三阶主线（入门→进阶→精通）+ 工程化能力横向贯穿 + 6 大支撑模块。
> 配套可导入博途的 **SCL 源文件** 与浏览器内直接运行的 **HMI 仿真器**，无硬件也能边学边练。

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
├── index.html                              # 首页：Hero + 架构SVG + 三阶/工程化/支撑/配套速览
├── assets/
│   └── css/style.css                       # 全局暗色主题 + 响应式（适配移动端）
├── courses/
│   ├── beginner.html                       # 入门篇：6章 + 快捷键表 + 6项配套练习
│   ├── intermediate.html                   # 进阶篇：6章 + SCL代码示例 + 配套标记
│   └── advanced.html                       # 精通篇：6章 + 冗余对比表 + 3个毕业项目
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

本仓库为 **纯静态站**，任意 HTTP 服务器都能跑。

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

## 🌐 部署（GitHub Pages）

仓库结构完全符合 GitHub Pages 要求，开启即发布：

```
Settings → Pages → Source: main 分支 / root 目录 → 保存
# 几秒后即可访问 https://<username>.github.io/TIA_learn_site
```

也可部署到 Vercel / Netlify / Cloudflare Pages，零配置，Import 本仓库即可。

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
