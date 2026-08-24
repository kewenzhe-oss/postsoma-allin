# POSTSOMA · ALLIN Frontend

Vue 3 / Vite frontend for the POSTSOMA · ALLIN poker decision-thinking tool.

- Product: <https://www.205033.xyz/>
- Repository: <https://github.com/postsoma-2050/Poker>
- Full project guide: [English](../../README_EN.md) · [中文](../../README.md)

## Responsibilities

- Hand → Context → Range → Price → Risk Decision Guide
- Versioned HU preflop reference and drill
- Pot Odds / Price Builder
- Explorer and board/draw observation tools
- Scenario scheduling UI over admitted local truth
- Private friend-room and BYOK AI lobby/table UI
- Global English / Simplified Chinese locale
- Canonical metadata, JSON-LD, sitemap, crawler policy, and `llms` feeds

The frontend does not turn AI output, a friend result, or a single runout into verified training truth.

## Setup

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Training/reference tools work without a backend. For friend rooms or BYOK AI, run the FastAPI service from the repository root and create `.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Vite development server |
| `npm run build` | Generate SEO assets, build production files, generate `/about/` HTML |
| `npm run preview` | Preview `dist/` locally |
| `npm run generate:seo` | Regenerate `robots.txt` and `sitemap.xml` from shared metadata |
| `npm run check:preflop-range` | Validate the 169-hand snapshot and Reference parity |
| `npm run check:pot-odds` | Validate fixed formulas and question catalog |
| `npm run check:scenario-library` | Validate Scenario evidence, transitions, scheduling, and storage |
| `npm run check:seo-geo` | Validate SEO/GEO source assets; add `-- --dist` after a build |

## Key directories

```text
src/
├── components/        # Lobby, table, Decision Guide, and shared UI
├── i18n/              # Lightweight global locale state
├── seo/               # Canonical metadata and JSON-LD builders
├── stores/            # Online room/WebSocket state
├── training/          # Versioned ranges, drills, explanations, scenarios
├── utils/training/    # Pure session, scheduler, scoring, and storage helpers
└── views/             # Home, About, Room

public/
├── robots.txt
├── sitemap.xml
├── llms.txt
└── llms-full.txt
```

## Data boundaries

- `hu-btn-rfi-100bb-v1 / baseline-v1` is an internal HU Button first-in reference, not Solver/GTO truth.
- `pot-odds-v1` uses fixed math; Hero equity is a stated exercise assumption.
- Explorer draw-hit probability is not real equity against a Villain range.
- Friend and BYOK AI modes are free play with no verified training score.
- Existing training and Scenario localStorage keys are versioned and must remain backward compatible.

## Deployment

`vercel.json` provides SPA rewrites, a static `/about/` entry, and `X-Robots-Tag` protection for operational paths. The FastAPI/WebSocket backend is deployed separately; production builds must set `VITE_API_URL` to its public HTTPS origin.
