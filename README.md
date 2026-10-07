# The Vigil

*A daily watch on AI safety*, kept by Benjamin Truong.

A newspaper-style front page for AI safety. It gathers news, research papers, lab
posts, YouTube videos, podcasts and incident reports from public feeds. It ranks
them and links every story back to its original source. An **Incident Atlas**
puts stories on a live world map, in red for incidents and risk and in mint for
good news.

## Run it locally

```bash
npm.cmd install
npm.cmd run collect   # read the feeds → src/data/feed.json
npm.cmd run dev       # http://localhost:4321
```

To test the production build with the real security headers:

```bash
npm.cmd run build
npm.cmd run serve     # http://localhost:4322, same CSP as vercel.json
```

## How it works

| Piece | File |
|---|---|
| Every source we read (feeds, trust, filter level) | `scripts/sources.ts` |
| Collector: fetch, filter, rank, merge, tone, map placement | `scripts/collect.ts` |
| Place and organisation gazetteer for the map | `scripts/places.ts` |
| Pages: front page, atlas, sources, field guide | `src/pages/` |
| The map (canvas, d3-geo) | `src/scripts/atlas.ts` |

**Ranking:** `score = 0.45·relevance + 0.25·trust + 0.30·freshness + coverage`.
The method is explained in plain words on the `/sources` page.

**Updates:** a GitHub Action (`.github/workflows/refresh.yml`) pings a Vercel deploy
hook every hour. Vercel runs the collector and rebuilds the site. It uses free
tiers only, with no API keys or paid services.

## Principles

- Every story links to its source. We show headlines and short excerpts only.
- No tracking, cookies, ads or AI-generated summaries.
- Strict Content-Security-Policy, with no inline scripts. Feed text is never inserted as HTML.

## Adding a source

Add one line to `scripts/sources.ts` with the feed URL, a trust weight (0–1) and
a filter level, then run `npm.cmd run collect`.
