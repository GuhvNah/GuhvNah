# Perth Takeoff

A digital takeoff and estimating tool for construction businesses in Perth, WA. Estimators upload PDF plans, measure quantities directly on the drawing (linear runs, areas, item counts), and roll those quantities up into a priced, GST-aware project summary.

## Features

- **Multi-tenant accounts** — each signup creates an organisation; team members share clients, projects and a cost item library.
- **Clients & projects** — track jobs by client, site address, suburb/postcode and status (lead → takeoff → quoted → won/lost).
- **Digital takeoff** — upload a PDF plan, calibrate the scale against a known dimension, then measure:
  - **Linear** runs (m) — walls, skirting, framing runs, etc.
  - **Area** (m²) — slabs, flooring, roofing, etc.
  - **Count** (ea) — fixtures, downlights, doors, etc.
- **Quantity summary** — measurements roll up per project, matched against your cost item rate library, with AUD pricing and a 10% GST calculation.
- **Cost item library** — a per-organisation rate book (name, unit, unit rate, category).

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [Prisma](https://www.prisma.io) + PostgreSQL
- [NextAuth.js](https://authjs.dev) (credentials-based auth, JWT sessions)
- [pdfjs-dist](https://mozilla.github.io/pdf.js/) for in-browser PDF rendering
- [Konva](https://konvajs.org) / react-konva for the takeoff measurement canvas

## Getting started

### 1. Start a PostgreSQL database

Using Docker:

```bash
docker compose up -d
```

Or point `DATABASE_URL` at any PostgreSQL 14+ instance.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `DATABASE_URL` and generate an `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 3. Install dependencies and set up the database

```bash
pnpm install
pnpm prisma migrate dev
```

`pnpm install` also copies the pdf.js worker into `public/` (via the `postinstall` script) — re-run `node scripts/copy-pdf-worker.mjs` if you ever upgrade `pdfjs-dist` outside of a fresh install.

### 4. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to sign up and create your organisation.

## Project structure

```
prisma/schema.prisma          Data model (Organization, User, Client, Project, TakeoffDocument, TakeoffMeasurement, CostItem)
src/app/(app)/                 Authenticated app shell: dashboard, clients, projects, cost items
src/app/(takeoff)/             Full-screen takeoff workspace (no app sidebar)
src/app/api/                   REST-ish API routes for file upload, file serving, measurements
src/components/takeoff/        The PDF + Konva measurement canvas
src/lib/actions/               Server actions for client/project/cost-item CRUD
```

## Notes on production readiness

This is a working MVP. Before taking it to production, consider:

- **File storage** — uploaded plans are stored on local disk under `storage/uploads/` (gitignored). Swap `src/lib/storage.ts` for S3/R2/Blob storage for a real deployment.
- **Calibration/label UX** — calibration and per-shape labels currently use `window.prompt`/a toolbar text field for simplicity; a dedicated modal would be a nicer follow-up.
- **Team invites** — signup creates one organisation owner; there's no invite-teammate flow yet (the data model already supports multiple `Membership` rows per organisation).
- **pdfjs-dist version** — pinned to the 4.x line. Newer 5.x/6.x releases depend on `Map.prototype.getOrInsertComputed`, a very new JS API not yet supported by mainstream browsers — don't upgrade past 4.x until that lands broadly.
- **Dev server** — `next dev`/`next build` are pinned to `--webpack` rather than Turbopack; Turbopack's persistent dev cache was unstable in testing.
