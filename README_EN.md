# POSTSOMA · ALLIN

**Understand the spot before searching for an answer.**

POSTSOMA · ALLIN is an open-source poker decision-thinking tool. It uses the connected sequence **Hand → Context → Range → Price → Risk** to help players separate known information, stated assumptions, and remaining uncertainty before choosing an action.

[Live product](https://www.205033.xyz/) · [简体中文](README.md) · [Method & evidence](https://www.205033.xyz/about/) · [Source repository](https://github.com/postsoma-2050/Poker)

## Product position

The project is designed to build a transferable decision habit—not to reward volume, make users memorize charts, or let AI act as a strategy judge.

1. **Hand**: What do I have? Inspect made value, improvement paths, blockers, and postflop playability.
2. **Context**: What spot am I in? Confirm position, effective stack, pot state, prior action, and format.
3. **Range**: What could we each have? Think in combinations, frequencies, primary tendencies, and boundaries.
4. **Price**: What does investing more require? Build the final pot and calculate required equity.
5. **Risk**: What could distort the decision? Check dirty outs, rake, future betting, missing information, and result bias.

> This project is not a complete GTO solver, an authoritative strategy database, a real-money poker platform, or a verified AI strategy judge.

## Current capabilities

### Learn

- Decision Guide: learn the five-question process without entering cards or pot values.
- One global English / Simplified Chinese interface preference.
- Visible separation between math facts, versioned references, AI explanations, user observations, and hand results.

### Tools

- **Range Reference**: a 169-cell HU preflop matrix with versioned frequencies and assumptions.
- **Preflop Reference Drill**: compare Raise / Limp / Fold choices inside one explicitly limited scenario.
- **Price Builder**: build the final pot, calculate required equity, then compare a stated equity assumption.
- **Explorer**: inspect Hero cards, a flop, made hands, draw-hit probability, board texture, and a simplified manual price experiment.
- **Scenario Library**: deterministic scheduling and replay over admitted evidence; it does not invent a full-hand continuation.

### Apply

- Private heads-up friend rooms.
- BYOK AI free play with configured OpenAI-compatible, Gemini, and other supported providers.
- Server-authoritative table state over FastAPI and WebSocket.

Friend and AI games are free-play environments with no verified training score. AI and a single runout are not training judges.

## Data and evidence boundaries

| Data / feature | Evidence type | Scope and limitation |
|---|---|---|
| `hu-btn-rfi-100bb-v1` / `baseline-v1` | Internal versioned training reference | Only Heads-up · SB/Button · 100 BB · Unopened Pot · Open 2.5 BB; not solver output and not applicable to 6-max, MTT, BB defend, or different stack/rake/open-size assumptions |
| `pot-odds-v1` | Verifiable math + frozen exercise inputs | Hero equity is a stated exercise assumption, not equity calculated from cards or a Villain range |
| Explorer outs / Rule of 2/4 | Conceptual aid | Draw-hit probability is not real equity versus a range and cannot independently judge Call/Fold |
| Scenario Library | Traceable orchestration of admitted truth | The Price Bridge is an independent concept transfer, not the hand's real strategic continuation |
| Friend / BYOK AI | Free-play outcome and explanation | Does not override a math fact or become authoritative strategy scoring |

See [llms-full.txt](frontend/poker_llm_web/public/llms-full.txt) for the complete machine-readable product boundary.

## Architecture

```text
Browser
├── Vue 3 + Vite + Vue Router
├── Pinia + Element Plus + GSAP
├── Versioned training data / seed / localStorage
└── HTTP + WebSocket
        │
        ▼
FastAPI
├── Private rooms and connection management
├── Server-authoritative poker state machine
├── BYOK provider adapters
└── In-memory room state (no account database)
```

| Layer | Technology |
|---|---|
| Frontend | Vue 3, Vite, Vue Router, Pinia, Element Plus, GSAP |
| Backend | Python, FastAPI, Pydantic, WebSocket, Uvicorn / Gunicorn |
| Training data | Versioned JavaScript snapshots, fixed math questions, localStorage |
| Online state | FastAPI process memory; persistence across room deletion or restart is not guaranteed |
| Frontend deployment | Vercel configuration with SPA routing, a static About entry, and indexing boundaries |

## Repository structure

```text
Poker/
├── frontend/poker_llm_web/       # Vue app, learning tools, and SEO/GEO assets
├── online/                       # FastAPI rooms, WebSocket, AI providers, sessions
├── tests/                        # API and online-engine regression tests
├── docs/                         # API/WebSocket and architecture notes
├── prompt/                       # Legacy CLI prompt templates
├── poker_engine.py               # Legacy poker engine
├── game_controller.py            # Legacy CLI controller
├── main.py                       # Legacy multi-AI CLI entry
├── requirements.txt              # Python runtime dependencies
└── LICENSE                       # MIT License
```

## Local development

### Requirements

- Node.js 18+
- npm
- Python 3.10+

### 1. Clone

```bash
git clone https://github.com/postsoma-2050/Poker.git
cd Poker
```

### 2. Start the frontend

Preflop, Price Builder, Decision Guide, and Explorer work without an API key or backend.

```bash
cd frontend/poker_llm_web
npm install
npm run dev
```

Open `http://localhost:5173`.

### 3. Start the online-room backend

From the repository root in another terminal:

```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
ALLOWED_ORIGINS=http://localhost:5173 uvicorn online.app:app --reload --port 8000
```

Windows PowerShell activation:

```powershell
.venv\Scripts\Activate.ps1
```

Create `frontend/poker_llm_web/.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

Health check: `http://localhost:8000/health`.

### 4. Optional legacy multi-AI CLI

Copy the environment template and add credentials for providers you control:

```bash
cp .env.example .env
python3 main.py
```

Never commit `.env` or an API key. The learning tools do not require an LLM; only BYOK free play and the legacy CLI call model providers.

## Frontend commands

Run inside `frontend/poker_llm_web`:

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Generate SEO assets, build the app, and create the static `/about/` entry |
| `npm run preview` | Preview the production build |
| `npm run check:preflop-range` | Validate all 169 hands, frequencies, coordinates, actions, and explanations |
| `npm run check:pot-odds` | Validate pot-odds formulas, EV boundaries, and the fixed catalog |
| `npm run check:scenario-library` | Validate evidence, adapters, nodes, scheduling, and safe storage |
| `npm run check:seo-geo` | Validate canonical URLs, JSON-LD, robots, sitemap, and machine knowledge |

## Python tests

```bash
python3 -m pip install -r requirements.txt -r requirements-dev.txt
python3 -m pytest
```

## BYOK, privacy, and security

- Training answers, language preference, and review history may be stored in browser localStorage/sessionStorage. There is no learning-account database.
- BYOK configuration can include an API key cached in localStorage. Connection tests and AI games transmit that credential to the POSTSOMA backend and the selected provider.
- Room tokens and live state are operational data and are not published in the sitemap, JSON-LD, or `llms.txt`.
- Current room state lives in server memory and is not guaranteed to survive a restart.
- Production deployments should restrict `ALLOWED_ORIGINS`, use HTTPS/WSS, and never log API keys or player tokens.

## API and protocol

- HTTP / WebSocket contract: [docs/api-ws-contract.md](docs/api-ws-contract.md)
- Online 1v1 architecture: [docs/online-1v1-architecture.md](docs/online-1v1-architecture.md)
- FastAPI entry: `online.app:app`
- WebSocket: `/ws/rooms/{room_id}?token={player_token}`

## SEO / GEO

- Canonical site: <https://www.205033.xyz/>
- Method, evidence, and citation guide: <https://www.205033.xyz/about/>
- Machine index: [llms.txt](frontend/poker_llm_web/public/llms.txt) · [llms-full.txt](frontend/poker_llm_web/public/llms-full.txt)
- Sitemap: [sitemap.xml](frontend/poker_llm_web/public/sitemap.xml)
- Maintenance rules: [GEO / SEO Skill](.agents/skills/geo-seo-optimization/SKILL.md)

These assets improve machine readability; they do not guarantee search ranking, AI citation, or rich-result eligibility.

## Contributing

Use [Issues](https://github.com/postsoma-2050/Poker/issues) for reproducible reports, or open a focused Pull Request. Range, probability, or strategy data must include its source, version, scenario assumptions, license, and validation method before it can be admitted as training truth.

## License

Project code is available under the [MIT License](LICENSE). Poker content, model providers, and external services remain subject to their own terms and applicable law.
