---
name: geo-seo-optimization
description: Audit or update POSTSOMA · ALLIN SEO, AEO, and GEO assets while preserving truthful provenance, crawler boundaries, structured-data accuracy, and the canonical 205033.xyz domain.
---

# POSTSOMA GEO / SEO Optimization

Use this skill for repository work involving search metadata, AI crawler access, JSON-LD, `llms.txt`, sitemaps, public authority pages, or SEO/GEO verification.

## Canonical identity

- Treat `https://www.205033.xyz` as the only canonical origin.
- Use self-referencing canonicals for public pages. Do not canonicalize every page to `/`.
- Keep `/room/`, `/api/`, `/ws/`, tokens, private game state, and user input out of public indexes and machine feeds.
- Do not reintroduce `postsoma-allin.com`, `prayselah.org`, or placeholder domains.

## Truth and provenance

- Describe POSTSOMA · ALLIN as a poker decision-thinking tool built around Hand → Context → Range → Price → Risk.
- Label `hu-btn-rfi-100bb-v1 / baseline-v1` as an internal, versioned HU Button first-in reference. It is not solver-calibrated or universally applicable.
- Label Pot Odds equity as a stated exercise assumption unless a documented range-equity calculation exists.
- Keep math facts, strategy references, AI explanations, user observations, and hand results distinct.
- Never invent credentials, legal entities, reviews, ratings, user counts, press coverage, dates, citations, partners, or `sameAs` profiles.

## Crawler policy

- Distinguish search/index crawlers, user-triggered fetchers, and model-training controls in comments and documentation.
- Allow public pages while excluding `/room/`, `/api/`, and `/ws/` for each explicit crawler group.
- Include the current approved crawler token list from `src/seo/siteMetadata.js`; do not guess new tokens without checking the operator's primary documentation.
- Remember that `Google-Extended` and `Applebot-Extended` are usage controls, not ordinary standalone search crawlers.
- Use `X-Robots-Tag: noindex` or page metadata for index exclusion; robots.txt alone does not guarantee removal from search results.

## Structured data

- JSON-LD must describe visible page content and use absolute canonical URLs.
- Connect entities with stable `@id` values.
- Use only applicable types such as `WebSite`, `Organization`, `SoftwareApplication`, `WebPage`, `AboutPage`, `HowTo`, and `BreadcrumbList`.
- Do not add `SearchAction` without a real, visible site-search experience and working target URL.
- Do not add fake `Review`, `AggregateRating`, `Person`, `Article`, or offer claims.
- Treat rich-result eligibility as possible, never guaranteed.

## Machine-readable knowledge

- Keep `llms.txt` concise: identity, public page index, primary tools, source and policy links.
- Keep `llms-full.txt` factual and auditable: product boundaries, versions, formulas, privacy behavior, citations, and limitations.
- Do not publish prompts, API keys, room tokens, WebSocket payloads, private hands, or third-party proprietary material.
- `llms.txt` is an auxiliary machine-readable convention, not a guaranteed ranking or citation mechanism.

## E-E-A-T review

Verify that public authority content exposes:

- product mission and maintained methodology;
- evidence and data-source boundaries;
- accurate privacy and BYOK handling;
- source repository and project license;
- citation format, canonical URL, access date guidance, and version identifiers;
- clear separation between free play and verified mathematical/reference feedback.

## Required verification

Run the repository's current commands rather than inventing results:

```bash
npm run generate:seo
npm run check:seo-geo
npm run check:preflop-range
npm run check:pot-odds
npm run check:scenario-library
npm run build
git diff --check
```

Also inspect built `/`, `/about/`, `robots.txt`, `sitemap.xml`, `llms.txt`, and `llms-full.txt`. Report missing lint or deployment tooling explicitly instead of claiming it ran.

## Change boundaries

- Preserve existing training truth, room protocols, backend APIs, AI prompts, and storage keys unless separately authorized.
- Keep changes small and reversible.
- Before staging, exclude unrelated debug files, `.DS_Store`, empty files, SEO experiments outside the approved set, and user-owned worktree changes.
