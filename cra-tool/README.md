# CRA Comply

Full-stack compliance tracking tool for the **Innomotics Perfect Harmony GH180** medium voltage drive under the **EU Cyber Resilience Act (CRA)**.

---

## Stack

- **Frontend** — React 18 (Create React App), React Router v6, Axios
- **Backend** — Node.js, Express 4
- **Database** — MongoDB Atlas (Mongoose)
- **Auth** — JWT + bcryptjs
- **Styling** — Inline styles, Space Grotesk + Inter fonts, no UI library

---

## Project Structure

```
cra-tool/
├── client/                      React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── api.js               Axios instance with JWT interceptor
│       ├── App.js               Router + protected/public route guards
│       ├── index.js
│       ├── components/
│       │   └── Navbar.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   ├── Dashboard.jsx
│       │   ├── ProductForm.jsx
│       │   └── Requirements.jsx
│       └── styles/
│           └── index.css
└── server/                      Express backend
    ├── .env                     Environment variables (not committed)
    ├── index.js                 App entry point
    ├── seed.js                  One-time database seeder (31 requirements)
    ├── middleware/
    │   └── auth.js              JWT verification middleware
    ├── models/
    │   ├── User.js
    │   ├── Product.js
    │   ├── Requirement.js
    │   └── ComplianceItem.js
    └── routes/
        ├── auth.js              POST /register, POST /login
        ├── products.js          GET / POST / DELETE /products
        └── requirements.js      GET / PATCH compliance items
```

---

## Setup

### Prerequisites

- Node.js 18+
- A [MongoDB Atlas](https://www.mongodb.com/atlas) account and cluster

### 1. Configure environment variables

Edit `server/.env`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
PORT=5000
```

To get your Atlas URI: Atlas dashboard → cluster → **Connect** → **Drivers** → copy the string and replace `<password>`.

### 2. Install dependencies

```bash
# Backend
cd cra-tool/server
npm install

# Frontend
cd ../client
npm install
```

### 3. Seed the database

Run once to insert all 31 CRA requirements:

```bash
cd cra-tool/server
node seed.js
```

### 4. Start the backend

```bash
cd cra-tool/server
node index.js
```

Runs on `http://localhost:5000`

### 5. Start the frontend

```bash
cd cra-tool/client
npm start
```

Opens at `http://localhost:3000`

---

## API Reference

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{ email, password }` | Create account, returns JWT |
| POST | `/api/auth/login` | `{ email, password }` | Login, returns JWT |

All routes below require `Authorization: Bearer <token>`.

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products for the logged-in user |
| POST | `/api/products` | Create product + auto-generate 31 compliance items |
| DELETE | `/api/products/:id` | Delete product and all its compliance items |

### Requirements / Compliance Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/requirements` | List all 31 raw requirements |
| GET | `/api/requirements/:productId` | Get compliance items for a product (populated) |
| PATCH | `/api/requirements/item/:itemId` | Update `status`, `notes`, or `evidenceDescription` |

---

## CRA Requirements Coverage

The seed script inserts 31 requirements across four pillars:

| Pillar | Source | Count |
|--------|--------|-------|
| Security Properties | Annex I, Part I | 13 |
| Vulnerability Handling | Annex I, Part II | 8 |
| Incident Reporting | Article 14 | 4 |
| Documentation | Annex VII | 6 |
| **Total** | | **31** |

Article 14 items are flagged `urgent: true` and display an **⚡ Sept 2026** badge — the reporting deadline is 11 September 2026, ahead of full enforcement on 11 December 2027.

---

## CRA Classification Logic

On product creation the app applies a simplified classification:

| Condition | Result |
|-----------|--------|
| `soldInEU = false` | Error — CRA does not apply |
| `hasNetworkInterface = false` | Warning — product may be out of scope |
| All other cases | **Default Class** — Module A self-certification |

The GH180 is not listed in CRA Annex III, so it falls into the Default Class. No notified body is required; Innomotics conducts its own conformity assessment and issues a Declaration of Conformity.

---

## Key Deadlines

| Date | Milestone |
|------|-----------|
| 11 September 2026 | Vulnerability and incident reporting obligations begin (Article 14) |
| 11 December 2027 | Full CRA enforcement — all Annex I requirements apply |

---

## Design Tokens

| Token | Value |
|-------|-------|
| Background | `#07070f` |
| Card | `#0f0f1a` |
| Border | `#22223a` |
| Accent | `#3b82f6` |
| Urgent / Warning | `#f97316` |
| Success | `#34d399` |
| Text | `#e8e8f0` |
| Muted | `#6b6b8a` |
| Heading font | Space Grotesk |
| Body font | Inter |

---

## Disclaimer

This tool is for **compliance awareness and internal tracking only**. It does not constitute legal advice, formal certification, or a Declaration of Conformity. Consult qualified legal and cybersecurity professionals for official CRA compliance.
