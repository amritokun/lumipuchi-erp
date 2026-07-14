# Architecture

Lumipuchi ERP uses a hybrid monorepo architecture separating the Next.js TypeScript frontend and FastAPI Python backend, alongside shared utility libraries.

## Component Layout

```
lumipuchi-erp/
├── apps/
│   ├── web/               # Next.js App Router (React, Tailwind CSS, shadcn/ui)
│   └── api/               # FastAPI backend (Python, PostgreSQL, Redis, Celery)
├── packages/
│   ├── pricing-engine/    # Shared pricing & margin calculation logic (TS)
│   ├── inventory/         # Shared inventory tracking definitions (TS)
│   ├── forex/             # Shared forex currency converter helpers (TS)
│   └── shared/            # Shared interfaces and types (TS)
├── docker/                # Multi-stage production Dockerfiles
│   ├── Dockerfile.api
│   └── Dockerfile.web
└── docker-compose.yml     # Local orchestration of all services
```

## Data Flow & Integration
- Core business rules, database access, background tasks (Celery), and secure APIs are handled by the FastAPI application (`apps/api`) using PostgreSQL and Redis.
- The Next.js frontend (`apps/web`) communicates with the FastAPI API via RESTful JSON endpoints.
- TypeScript helper libraries under `packages/` ensure shared business rules (such as pricing formulas and currency conversion) remain consistent and testable on the client side.
