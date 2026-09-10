# RiverTwin — Flood & Dam-Break Digital Twin

Explore flood scenarios in Nepal. Simulate inundation, understand community impact, and plan earlier.

Interactive digital twin for Melamchi River, Dudh Koshi River, and Trishuli River — with dam-breach / glacial-lake modeling, settlement impact timeline, MapLibre visualization, and evacuation briefing.

> **Disclaimer:** Model-based guidance only. Settlements, exposure data, and source geometry are illustrative. Confirm decisions with Nepal DHM and local emergency authorities.

## Features

- **Scenario simulator** — river, source, water volume, breach %, rainfall
- **Interactive basin map** — MapLibre GL with flood route, source marker, settlement markers
- **Impact timeline** — T+0 to T+60min playback, population affected, roads, depth
- **Evacuation briefing** — rule-based assistant (`/api/assistant`) with infrastructure mode
- **Scenario history** — save/load last 30 runs in Postgres
- **Export** — report table + CSV download
- **Responsive** — desktop + mobile layout

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- MapLibre GL 6
- Drizzle ORM + `pg` (PostgreSQL)
- Playwright (smoke test)

## Project structure

```
src/
  app/
    page.tsx              # home -> <Dashboard/>
    api/
      scenarios/route.ts  # GET history, POST simulate+save (needs DB)
      assistant/route.ts  # POST evacuation briefing (stateless)
      health/route.ts     # GET DB health check
  components/
    dashboard.tsx         # main UI
    basin-map.tsx         # MapLibre map
  lib/
    simulation.ts         # simulate(), validParams(), metricsAt()
  db/
    schema.ts             # flood_scenarios table
    index.ts              # drizzle pool (needs DATABASE_URL)
scripts/smoke.mjs         # Playwright end-to-end smoke test
```

## APIs

| Method | Endpoint | Body | Description |
| ------ | -------- | ---- | ----------- |
| GET | `/api/scenarios` | — | Last 30 saved scenarios |
| POST | `/api/scenarios` | `{ parameters: { river, source, volume, breach, rainfall } }` | Validate, simulate, save, return record |
| POST | `/api/assistant` | `{ parameters, question }` | Evacuation briefing text + disclaimer |
| GET | `/api/health` | — | `{ ok: true }` if DB reachable |

Valid ranges: `volume 0.5–20`, `breach 5–100`, `rainfall 0–100`, `river` must be one of the 3 basins.

## Getting started

Requirements: Node.js 20+, PostgreSQL 15+.

```powershell
# 1. Install
npm install

# 2. Configure DB
# copy example and edit
$env:DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/app_db"

# 3. Create table
npx drizzle-kit push

# 4. Run dev
npm run dev
# open http://localhost:3000

# 5. Checks
npm run lint
npm run typecheck
```

PowerShell persistent env:

```powershell
[Environment]::SetEnvironmentVariable("DATABASE_URL", "postgresql://postgres:postgres@127.0.0.1:5432/app_db", "User")
```

## Smoke test

```powershell
npm run dev
# in another terminal
node scripts/smoke.mjs
```

## License

For learning / demo / research use. No warranty.
