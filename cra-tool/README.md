# CRA Comply

Full-stack platform for **EU Cyber Resilience Act (CRA)** product compliance and **PSIRT vulnerability management**, built for the Innomotics Perfect Harmony GH180 medium-voltage drive product line.

Two modules in one workspace:

1. **CRA Compliance** — track all 31 CRA requirements per product with evidence, status, and live deadline countdowns.
2. **Vulnerability Management** — a guided PSIRT case workflow implementing the VDMA *CRA Vulnerability Handling Guideline* (Figure 7 process graph) and the CRA **Article 14** reporting obligations (24-hour early warning, 72-hour notification, final report).

---

## Stack

- **Frontend** — React 18 (Create React App) + **TypeScript**, React Router v6, Axios
- **Backend** — Node.js, Express 4 + **TypeScript** (ts-node in dev, compiled `dist/` in production)
- **Database** — MongoDB Atlas (Mongoose)
- **Auth** — JWT + bcryptjs
- **Styling** — CSS design tokens + inline styles (see *UI Architecture* below)

---

## Project Structure

```
cra-tool/
├── client/                        React + TS frontend
│   └── src/
│       ├── api.ts                 Axios instance with JWT interceptor
│       ├── App.tsx                Router, shells, route guards
│       ├── types.ts               Shared domain types (Ticket, Report, Advisory…)
│       ├── pages/                 CRA module + auth + settings pages
│       ├── components/            CRA sidebar
│       ├── shared/                Theme, dialogs, footer, title manager, CSV export
│       │   ├── theme.ts           Dark/light mode (localStorage + data-theme)
│       │   └── layout/            VM sidebar, module switcher
│       ├── styles/index.css       Design tokens — dark & light palettes
│       └── vm/                    Vulnerability Management module
│           ├── api/vmApi.ts       Typed API layer
│           ├── components/        Workflow tracker, clocks, advisory form…
│           ├── pages/             VM dashboard, ticket queue/detail, advisories
│           └── utils/             Deadline math, flow phases
└── server/                        Express + TS backend
    ├── index.ts                   App entry
    ├── seed.ts                    Seeds the 31 CRA requirements
    ├── types.d.ts                 Express Request augmentation (req.user)
    ├── middleware/auth.ts         JWT verification
    ├── models/                    User, Product, Requirement, ComplianceItem,
    │                              Ticket, StatusHistory, Notification, Report, Advisory
    ├── controllers/               VM ticket / report / advisory logic
    ├── services/
    │   ├── stateMachine.ts        VDMA Figure 7 ticket state machine (19 states)
    │   └── clockService.ts        CRA Art. 14 deadline computation
    └── routes/                    auth, products, requirements, vm/*
```

---

## Setup

### Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 1. Environment variables

Create `server/.env`:

```env
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
```

> The database name in the URI matters — omitting it silently uses the `test` database.

### 2. Install

```bash
cd cra-tool/server && npm install
cd ../client && npm install
```

### 3. Seed the 31 CRA requirements (once)

```bash
cd cra-tool/server
npm run seed
```

### 4. Run (two terminals)

```bash
# Backend — nodemon + ts-node on :5000
cd cra-tool/server
npm run dev

# Frontend — CRA dev server on :3000
cd cra-tool/client
npm start
```

### Production build

```bash
# Server: compile to dist/ then run
npm run build && npm start        # (start = node dist/index.js)

# Client
npm run build                     # static build/ for Vercel etc.
```

---

## API Reference

All routes except register/login require `Authorization: Bearer <token>`.

### Auth & Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account → JWT |
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Profile (email, name, orgName) |
| PATCH | `/api/auth/me` | Update name/orgName; change password (verifies current) |

### Products & Compliance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | User's products |
| POST | `/api/products` | Create product + 31 compliance items |
| PATCH | `/api/products/:id` | Edit product fields |
| DELETE | `/api/products/:id` | Delete product + its compliance items |
| GET | `/api/requirements` | The 31 raw requirements |
| GET | `/api/requirements/summary/all` | **One-call dashboard payload** — all products + light compliance items |
| GET | `/api/requirements/:productId` | Compliance items for one product |
| PATCH | `/api/requirements/item/:itemId` | Update status / notes / evidence |

### Vulnerability Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/vm/tickets` | List / create tickets (`PSIRT-YYYY-NNNN`) |
| GET/PATCH | `/api/vm/tickets/:id` | Read / edit ticket fields |
| POST | `/api/vm/tickets/:id/transition` | Advance the workflow (validated by the state machine) |
| GET | `/api/vm/tickets/:id/history` | Audit trail |
| GET | `/api/vm/tickets/:id/notifications` | Standard responses logged to finder / users / authority |
| GET/POST/PATCH/DELETE | `/api/vm/reports` | ENISA report drafts (24h / 72h / final) with due dates |
| GET/POST/PATCH | `/api/vm/advisories` | Security advisories (draft → auto-published on transition) |

---

## The VM Workflow (VDMA Figure 7)

Tickets move through a 19-state machine — server-enforced in `services/stateMachine.ts`:

- **Intake → Validation → Report-type triage** — an *actively-exploited* claim branches to urgent verification
- **Confirming active exploitation starts the CRA clock** (`clockStartedAt`): 24h early warning and 72h notification to ENISA; final report due 14 days after mitigation (1 month after notification for incidents)
- **Remediation loop** — root cause → develop → deploy → residual-risk assessment, looping until acceptable
- **Disclosure** — advisory drafted and published; researcher acknowledged per the PCERT standard responses
- Five terminal exits (invalid / not reproducible / not exploitable (VEX) / not verified / closed), each auto-logging the researcher notification with the case manager's reason

---

## CRA Requirements Coverage

| Pillar | Source | Count |
|--------|--------|-------|
| Security Properties | Annex I, Part I | 13 |
| Vulnerability Handling | Annex I, Part II | 8 |
| Incident Reporting | Article 14 | 4 |
| Documentation | Annex VII | 6 |
| **Total** | | **31** |

Key deadlines: **11 Sep 2026** (Article 14 reporting obligations) · **11 Dec 2027** (full enforcement).

---

## UI Architecture

Deliberately **zero UI dependencies** — no component library, no CSS framework:

- All colors, shadows, and surfaces are **CSS custom properties** in `styles/index.css`, defined twice: the dark palette on `:root`, the corporate light palette on `:root[data-theme="light"]`. The theme toggle just flips one attribute; every component styles through tokens.
- Components use inline styles referencing those tokens. Trade-off, made knowingly: no library lock-in, no version churn, tiny bundle (~106 kB gzipped total), full control over the compliance-specific visuals (workflow tracker, deadline clocks, lifecycle journey) that no library provides. The cost is verbosity — accepted for a tool of this size.
- Print styles turn advisories/reports into clean PDF output (`Ctrl+P`); CSV export is dependency-free (`shared/exportCsv.ts`).

---

## Disclaimer

This tool is for **compliance awareness and internal tracking only**. It does not constitute legal advice, formal certification, or a Declaration of Conformity. Consult qualified legal and cybersecurity professionals for official CRA compliance.
