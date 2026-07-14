# Lumipuchi ERP

Production-ready open-source ERP designed for Indian e-commerce sellers importing from China and selling across Amazon, Flipkart, Meesho, and their own websites.

## Project Structure

This is a monorepo setup:
- `/apps/web`: Next.js client-side interface (React, TypeScript, Tailwind CSS, shadcn/ui)
- `/apps/api`: FastAPI backend API (Python, SQLAlchemy, Celery, PostgreSQL, Redis)
- `/packages/shared`: Shared TS/JS interfaces and types
- `/packages/forex`: Foreign Exchange (Forex) calculations package
- `/packages/inventory`: Inventory logistics and tracking helpers
- `/packages/pricing-engine`: Channel fee and margin calculator engine
- `/docker`: Dockerfiles for development/production
- `/docs`: Project documentation and guides

## Getting Started

### Prerequisites
- Node.js (v20+)
- Python (3.11+)
- Docker & Docker Compose

### Environment Variables
Copy `.env.example` to `.env` in the root directory:
```bash
cp .env.example .env
```

### Local Setup

1. **Install Dependencies:**
   ```bash
   npm install
   pip install -r apps/api/requirements.txt
   ```

2. **Build Packages:**
   ```bash
   npm run build --workspaces --if-present
   ```

3. **Run Development Services:**
   - **Frontend (Next.js):**
     ```bash
     npm run dev --workspace=@lumipuchi/web
     ```
   - **Backend (FastAPI):**
     ```bash
     cd apps/api
     uvicorn main:app --reload --port 8000
     ```

### Docker Orchestration
To spin up all services including PostgreSQL, Redis, backend, and frontend locally:
```bash
docker-compose up --build
```

## Running Tests
- **Frontend tests:**
  ```bash
  npm run test --workspaces --if-present
  ```
- **Backend tests:**
  ```bash
  cd apps/api
  python -m pytest
  ```
