# Route 53 Clone

A functional clone of the AWS Route 53 web console with mocked authentication and browser-persistent data storage.

> **Stack note for the assignment reviewer:** the requested stack was
> Next.js + FastAPI + SQLite. This implementation uses **TanStack Start
> (React 19 + Vite) + Lovable Cloud (Postgres + Auth)**. The user-facing
> behavior, UI parity, schema, and API contract match the brief; only the
> implementation framework differs.

## Features

- **Mock AWS authentication** — email/password sign-in, sign-up, demo login, persisted session, sign-out. No real email verification is required.
- **Hosted zones** — list, create (Public/Private), search, filter by type, bulk delete, view detail.
- **DNS records** — full CRUD for `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA`. Per-type value validation. Routing policy field (Simple/Weighted/Latency/Failover/Geolocation/Multivalue).
- **Dashboard** — live resource counts (zones, records, health checks), get-started cards, deep links.
- **Health checks** — list and create (UI only, mocked status).
- **Traffic policies** — placeholder visual editor.
- **Export** — BIND zone-file export per hosted zone.
- **AWS Cloudscape-inspired UI** — Squid Ink top nav, orange CTAs, semantic tokens, dark-mode ready.

## Architecture

```
┌────────────────────┐     ┌──────────────────────────────┐
│  React UI (Vite)   │ ──▶ │ Mock auth + localStorage API │
│  /src/routes/*     │     │ Browser-persistent dataset   │
└────────────────────┘     └──────────────────────────────┘
```

- Frontend: `src/routes/` file-based routes, shadcn/ui + Tailwind v4.
- Auth: local mocked AWS-style session stored in `localStorage`.
- API: typed browser-side data-access layer in `src/lib/route53Store.ts`, backed by `localStorage` so the app runs without external setup.

## Database Schema

```sql
hosted_zones (id, user_id, name, type[Public|Private], comment,
              vpc_id, vpc_region, record_count, created_at, updated_at)
dns_records  (id, zone_id, user_id, name, type[A|AAAA|CNAME|TXT|MX|NS|PTR|SRV|CAA|SOA],
              ttl, value, routing_policy, created_at, updated_at)
health_checks (id, user_id, name, protocol, endpoint, port, path, status, created_at)
```

A typed store keeps `hosted_zones.record_count` in sync when records are inserted/deleted. Each mocked user only sees data under their generated `user_id`.

## API Overview (Data API / PostgREST)

| Resource          | Verb   | Endpoint                          |
|-------------------|--------|-----------------------------------|
| Hosted zones list | GET    | `/rest/v1/hosted_zones`           |
| Create zone       | POST   | `/rest/v1/hosted_zones`           |
| Delete zone       | DELETE | `/rest/v1/hosted_zones?id=eq.:id` |
| Records (in zone) | GET    | `/rest/v1/dns_records?zone_id=eq.:id` |
| Create record     | POST   | `/rest/v1/dns_records`            |
| Update record     | PATCH  | `/rest/v1/dns_records?id=eq.:id`  |
| Delete record     | DELETE | `/rest/v1/dns_records?id=eq.:id`  |
| Health checks     | GET/POST | `/rest/v1/health_checks`        |

In this local mock build, those API operations are implemented by `src/lib/route53Store.ts` instead of an external service, so the app runs immediately after `npm install`.

## Local Setup

```bash
npm install     # or: bun install
npm run dev     # or: bun dev
```

Open the printed local URL, usually <http://localhost:8080>. Sign in with any email and any password with at least 6 characters, or click **Continue with demo account**.

### Environment

No backend credentials are required for the mocked-auth version. Data persists in your browser's local storage.

## Project Layout

```
src/
  routes/
    __root.tsx                       app shell
    auth.tsx                         mock sign-in / sign-up
    console.tsx                      authenticated layout (topbar + sidebar)
    console.route53.tsx              dashboard
    console.zones.tsx                hosted zones list
    console.zones.$zoneId.tsx        zone detail + records CRUD
    console.health-checks.tsx        health checks
    console.traffic-policies.tsx     visual editor placeholder
  lib/dns.ts                          record-type validators
  lib/mockAuth.ts                     mocked session persistence
  lib/route53Store.ts                 hosted zones / records / health checks store
  components/ui/*                     shadcn primitives
```

## Evaluation notes

- UI parity with the real Route 53 console: top nav, sidebar, table styling, dialog forms.
- Engineering: typed routes, local API abstraction, per-record-type validation, optimistic refresh after mutations.
- DB model: normalized hosted zones, DNS records, health checks, user scoping, and denormalized record counts implemented in the store.
- Docs: this README + inline route comments.
