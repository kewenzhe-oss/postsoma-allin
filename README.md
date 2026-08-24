# POSTSOMA · ALLIN

**先看懂局面，再寻找答案。**

POSTSOMA · ALLIN 是一个开源的扑克决策思考工具。它通过 **Hand → Context → Range → Price → Risk** 五问流程，帮助用户在行动前分清已知信息、题设假设与仍然存在的不确定性。

[在线体验](https://www.205033.xyz/) · [English](README_EN.md) · [方法与证据边界](https://www.205033.xyz/about/) · [源码仓库](https://github.com/postsoma-2050/Poker)

## 产品定位

这个项目的核心不是刷题、背 Chart 或让 AI 替用户裁定策略，而是建立一套可以迁移到不同牌局的思考习惯：

1. **Hand · 手牌**：我拿到什么？当前牌力、改善可能、blocker 与翻后潜力是什么？
2. **Context · 局面**：我处于什么位置、有效筹码、底池状态和前序行动中？
3. **Range · 范围**：我与对手可能有什么？哪些行动属于主要倾向、混合频率或边界？
4. **Price · 价格**：继续投入后最终底池是多少？最低需要多少 equity？
5. **Risk · 风险**：脏 outs、rake、未来街投入、信息不足与结果导向会怎样影响判断？

> 本项目不是完整 GTO Solver、权威策略数据库、真钱扑克平台或已验证的 AI 策略裁判。

## 当前能力

### Learn · 学会五问

- Decision Guide：无需输入牌面即可理解五问流程。
- 中英文全局界面，语言偏好保存在浏览器本地。
- 清楚区分数学事实、版本化范围参考、AI 解释、用户观察与单手结果。

### Tools · 看清一个问题

- **Range Reference**：169 格 HU 翻前范围矩阵与版本化频率说明。
- **Preflop Reference Drill**：在限定场景中对照 Raise / Limp / Fold 倾向。
- **Price Builder**：亲手建立最终底池、计算 required equity，再比较题设 equity 假设。
- **Explorer**：观察 Hero Hand、Flop、成牌、听牌命中概率、牌面纹理与简化价格实验。
- **Scenario Library**：以可重放 seed、证据等级和透明调度组织现有可信概念；不伪造完整牌局 continuation。

### Apply · 应用五问

- 私人 Heads-up 好友房间。
- BYOK AI 自由对局，支持 OpenAI-compatible、Gemini 等已配置 provider。
- FastAPI + WebSocket 的服务端权威牌桌状态。

好友或 AI 对局属于自由应用环境，不提供已验证训练评分；AI 和一次 runout 都不是训练裁判。

## 数据与证据边界

| 数据 / 功能 | 证据性质 | 适用范围与限制 |
|---|---|---|
| `hu-btn-rfi-100bb-v1` / `baseline-v1` | 内部版本化训练参考 | 仅适用于 Heads-up · SB/Button · 100 BB · Unopened Pot · Open 2.5 BB；不是 Solver 输出，不适用于 6-max、MTT、BB defend 或其它 stack/rake/open size |
| `pot-odds-v1` | 可验证数学事实 + 冻结题设 | Hero equity 是题目给定假设，不是系统根据牌面或对手范围计算出的真实 equity |
| Explorer 的 outs / Rule of 2/4 | 概念提示 | 听牌命中概率不等于对对手范围的真实 equity，不能单独裁定 Call/Fold |
| Scenario Library | 现有真值的可追溯编排 | Price Bridge 是独立概念迁移，不是该手牌的真实后续策略 |
| Friend / BYOK AI | 自由对局结果与解释 | 不覆盖数学事实，也不构成权威策略评分 |

更完整的机器可读说明见 [llms-full.txt](frontend/poker_llm_web/public/llms-full.txt)。

## 技术架构

```text
Browser
├── Vue 3 + Vite + Vue Router
├── Pinia + Element Plus + GSAP
├── 固定训练数据 / seed / localStorage
└── HTTP + WebSocket
        │
        ▼
FastAPI
├── 私人房间与连接管理
├── 服务端权威扑克状态机
├── BYOK provider adapter
└── 内存房间状态（当前没有账户数据库）
```

| 层 | 技术 |
|---|---|
| Frontend | Vue 3、Vite、Vue Router、Pinia、Element Plus、GSAP |
| Backend | Python、FastAPI、Pydantic、WebSocket、Uvicorn / Gunicorn |
| Training data | 版本化 JavaScript snapshot、固定数学题、localStorage |
| Online state | FastAPI 进程内存；房间销毁或服务重启后不保证保留 |
| Frontend deployment | Vercel 配置已包含 SPA、About 静态入口与索引边界 |

## 项目结构

```text
Poker/
├── frontend/poker_llm_web/       # Vue 3 前端、训练工具、SEO/GEO 资产
├── online/                       # FastAPI 房间、WebSocket、AI provider 与牌桌 session
├── tests/                        # 在线引擎和 API 回归测试
├── docs/                         # API / WebSocket 与架构说明
├── prompt/                       # Legacy CLI prompt 模板
├── poker_engine.py               # 传统扑克引擎
├── game_controller.py            # Legacy CLI 对局控制器
├── main.py                       # Legacy 多 AI 命令行入口
├── requirements.txt              # Python 运行依赖
└── LICENSE                       # MIT License
```

## 本地开发

### 环境要求

- Node.js 18+
- npm
- Python 3.10+

### 1. 克隆项目

```bash
git clone https://github.com/postsoma-2050/Poker.git
cd Poker
```

### 2. 启动前端

Preflop、Price Builder、Decision Guide 与 Explorer 不需要 API Key 或后端即可使用。

```bash
cd frontend/poker_llm_web
npm install
npm run dev
```

浏览器打开 `http://localhost:5173`。

### 3. 启动在线房间后端

在新的终端中回到仓库根目录：

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
ALLOWED_ORIGINS=http://localhost:5173 uvicorn online.app:app --reload --port 8000
```

Windows PowerShell 激活虚拟环境：

```powershell
.venv\Scripts\Activate.ps1
```

然后在 `frontend/poker_llm_web/.env.local` 中指定后端：

```env
VITE_API_URL=http://localhost:8000
```

健康检查：`http://localhost:8000/health`。

### 4. 可选：Legacy CLI 多 AI 对局

复制环境变量示例并填入自己拥有的 provider 凭证：

```bash
cp .env.example .env
python3 main.py
```

不要提交 `.env` 或任何 API Key。训练工具本身不依赖 LLM；只有 BYOK 自由对局和 Legacy CLI 会调用模型服务。

## 前端命令

在 `frontend/poker_llm_web` 中运行：

| 命令 | 用途 |
|---|---|
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 生成 SEO 资产、构建前端并生成 `/about/` 静态入口 |
| `npm run preview` | 预览生产构建 |
| `npm run check:preflop-range` | 校验 169 手牌、频率、矩阵坐标与解释映射 |
| `npm run check:pot-odds` | 校验 Pot Odds 公式、EV 边界和固定题库 |
| `npm run check:scenario-library` | 校验证据、adapter、节点、调度与安全 storage |
| `npm run check:seo-geo` | 校验 canonical、JSON-LD、robots、sitemap 与机器知识文件 |

## Python 测试

```bash
python3 -m pip install -r requirements.txt -r requirements-dev.txt
python3 -m pytest
```

## BYOK、隐私与安全

- 训练答案、语言偏好和复习记录保存在浏览器 localStorage / sessionStorage；当前没有学习账户数据库。
- BYOK 配置可包含缓存在浏览器 localStorage 的 API Key。连接测试与 AI 对局会把该凭证传给 POSTSOMA 后端和所选 provider。
- 房间 token 与实时状态属于运行数据，不写入 sitemap、JSON-LD 或 `llms.txt`。
- 当前房间状态保存在服务器内存中，不承诺跨重启恢复。
- 开发或部署时应限制 `ALLOWED_ORIGINS`，使用 HTTPS/WSS，并避免在日志中输出 API Key 或玩家 token。

## API 与协议

- HTTP / WebSocket 契约：[docs/api-ws-contract.md](docs/api-ws-contract.md)
- 在线 1v1 架构说明：[docs/online-1v1-architecture.md](docs/online-1v1-architecture.md)
- FastAPI 入口：`online.app:app`
- WebSocket：`/ws/rooms/{room_id}?token={player_token}`

## SEO / GEO

- 正式域名：<https://www.205033.xyz/>
- 方法、证据与引用指南：<https://www.205033.xyz/about/>
- AI / LLM 索引：[llms.txt](frontend/poker_llm_web/public/llms.txt) · [llms-full.txt](frontend/poker_llm_web/public/llms-full.txt)
- Sitemap：[sitemap.xml](frontend/poker_llm_web/public/sitemap.xml)
- 项目维护规范：[GEO / SEO Skill](.agents/skills/geo-seo-optimization/SKILL.md)

这些资产提升机器可读性，但不保证搜索排名、AI 引用或 Rich Result 展示。

## 贡献

欢迎通过 [Issues](https://github.com/postsoma-2050/Poker/issues) 报告可复现问题，或提交范围清楚的 Pull Request。涉及范围、赔率或策略数据时，请同时说明来源、版本、场景假设、许可证与验证方式；未经核验的数据不能作为训练真值。

## License

项目代码采用 [MIT License](LICENSE)。扑克训练内容、第三方 provider 与外部服务仍受各自条款和适用法律约束。
