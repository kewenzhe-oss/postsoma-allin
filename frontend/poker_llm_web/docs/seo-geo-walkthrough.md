# POSTSOMA · ALLIN SEO / GEO Walkthrough

Reviewed: 2026-08-24
Canonical origin: `https://www.205033.xyz/`

## Outcome

The public discovery layer now describes POSTSOMA · ALLIN as a poker decision-thinking tool built around Hand → Context → Range → Price → Risk. It replaces the previous domain and product narrative without changing poker range data, mathematical truth, training records, room protocols, WebSocket behavior, or BYOK API contracts.

## Source of truth

`src/seo/siteMetadata.js` owns the canonical origin, public routes, private index paths, crawler tokens, page metadata, and JSON-LD builders. `npm run generate:seo` derives `robots.txt` and `sitemap.xml` from that source so their domains and public routes cannot drift independently.

## Public discovery assets

- `index.html`: crawlable home metadata, canonical, Open Graph, Twitter card, and a JSON-LD graph.
- `public/robots.txt`: public access for the approved crawler tokens, with `/room/`, `/api/`, and `/ws/` excluded.
- `public/sitemap.xml`: only the canonical home and About URLs.
- `public/llms.txt`: concise machine-readable index.
- `public/llms-full.txt`: full product knowledge, formulas, provenance, limitations, privacy behavior, and citation guidance.
- `/about/`: visible mission, evidence, privacy, scope, and citation content.
- `vercel.json`: a static `/about/` entry plus `X-Robots-Tag` protection for operational routes.

## Structured data

The home graph contains `Organization`, `WebSite`, `SoftwareApplication`, `WebPage`, and a visible five-step `HowTo`. The About graph contains `Organization`, `WebSite`, `SoftwareApplication`, `AboutPage`, and `BreadcrumbList`. Stable `@id` references connect each graph.

No `SearchAction` is emitted because the product does not expose a real site-search experience. No `Review`, `AggregateRating`, invented author, press, credential, user-count, or social-profile claim is emitted. Structured data describes visible content and does not promise a rich result.

## Runtime and static metadata

`usePageSeo()` updates title, description, robots, canonical, social metadata, and JSON-LD when Vue Router changes page or the user changes interface language. The build then generates `dist/about/index.html` with its own English fallback metadata and About JSON-LD, so a direct crawler request does not receive home metadata.

Private room pages receive runtime `noindex` metadata and deployment-level `X-Robots-Tag`. Room IDs, tokens, API keys, game state, user input, and URL query parameters are deliberately absent from public feeds.

## Evidence boundaries

- `hu-btn-rfi-100bb-v1 / baseline-v1`: internal, versioned HU Button first-in reference; not solver-calibrated or universal.
- `pot-odds-v1`: deterministic price math; Hero equity is a stated exercise assumption.
- Explorer: observation and simplified concept tool, not a strategy judge.
- Friend and BYOK AI: free play with no verified training score.
- Hand results and AI explanations never overwrite mathematical facts or a reference's stated scope.

## Deployment checklist

1. Deploy the frontend from `frontend/poker_llm_web` with the committed `vercel.json`.
2. Confirm the canonical host redirects consistently to `https://www.205033.xyz/`.
3. Fetch `/`, `/about/`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, and `/llms-full.txt` from the deployment.
4. Confirm `/room/<id>` returns `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`.
5. Submit the canonical sitemap to the selected webmaster tools after deployment.
6. Re-run `npm run check:seo-geo -- --dist` whenever public routes, crawler policy, or knowledge files change.

## Operational limits

`llms.txt` and crawler allow rules improve accessibility to machine readers; they do not guarantee crawling, ranking, AI-answer inclusion, or citation. The application remains a client-rendered Vue SPA except for generated route-specific HTML metadata entries. Further prerendering should be considered only after public content routes expand.
