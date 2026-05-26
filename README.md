# DockMaster Pro

Dock installation company management app — fullstack.

## Stack
- **Backend**: Node.js + Express + TypeScript + SQLite3
- **Frontend**: React (built, in `frontend/dist/`)

## Local Dev
```bash
npm install
npm run dev        # tsx watch backend/src/index.ts
npm run seed       # seed the database
```

## Deploy
```bash
npm start          # production — serves API + static frontend
```

## API Routes
- `GET /api/health` — health check
- `GET /api/customers` — list customers
- `GET /api/customers/:id` — customer detail
- `POST /api/customers` — create customer
- `PUT /api/customers/:id` — update customer
- `DELETE /api/customers/:id` — delete customer
- `GET /api/docks` — list docks
- `POST /api/docks` — create dock
- `PUT /api/docks/:id` — update dock
- `DELETE /api/docks/:id` — delete dock
- `GET /api/jobs` — list jobs
- `POST /api/jobs` — create job
- `PUT /api/jobs/:id` — update job
- `PATCH /api/jobs/:id/complete` — complete job
- `DELETE /api/jobs/:id` — delete job
