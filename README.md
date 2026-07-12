<div align="center">

# 🚛 TransitOps
### Smart Transport Operations Platform

*Built at Oddo Hackathon — 8 Hours of Engineering*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38BDF8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## 📌 Problem Statement

> **Many logistics companies still rely on spreadsheets and manual logbooks to manage their transport operations.**

This creates a cascade of real-world problems:

| Problem | Impact |
|---------|--------|
| 📋 Manual scheduling in spreadsheets | Conflicts, double-bookings, missed trips |
| 🔑 No license expiry tracking | Drivers operating with expired licenses — safety risk |
| 🔧 Reactive maintenance | Vehicles break down mid-trip, costly emergency repairs |
| ⛽ Inconsistent fuel logging | Fuel theft, inaccurate cost tracking |
| 📊 No operational visibility | Managers can't see fleet health in real time |
| 💸 Scattered expense records | Inaccurate P&L, audit failures |

**TransitOps** solves all of this with a single, centralized platform — real-time fleet visibility, enforced business rules, automated state transitions, and actionable analytics.

---

## 📸 Screenshots

> *(Add screenshots here after deployment)*

### Dashboard
<!-- Replace with actual screenshot -->
```
📁 Add screenshot: screenshots/dashboard.png
```
![Dashboard](screenshots/dashboard.png)

---

### Fleet Management
<!-- Replace with actual screenshot -->
```
📁 Add screenshot: screenshots/fleet.png
```
![Fleet Management](screenshots/fleet.png)

---

### Trip Dispatch
<!-- Replace with actual screenshot -->
```
📁 Add screenshot: screenshots/trips.png
```
![Trip Dispatch](screenshots/trips.png)

---

### Analytics
<!-- Replace with actual screenshot -->
```
📁 Add screenshot: screenshots/analytics.png
```
![Analytics](screenshots/analytics.png)

---

### Login Page
<!-- Replace with actual screenshot -->
```
📁 Add screenshot: screenshots/login.png
```
![Login](screenshots/login.png)

---

## ✨ Features

### 🚗 Fleet Management
- Register and track vehicles (Van, Truck, Bus, Bike)
- Real-time status: `AVAILABLE` → `ON_TRIP` → `IN_SHOP` → `RETIRED`
- Filter by type, status, and region
- Full maintenance + fuel + trip history per vehicle

### 👨‍✈️ Driver Management
- Driver profiles with license category, expiry, and safety scores
- Auto-computed `isExpired` and `expiringSoon` (30-day) flags
- Status lifecycle: `AVAILABLE` → `ON_TRIP` → `OFF_DUTY` / `SUSPENDED`

### 📦 Trip Dispatch (State Machine)
- Create trip in `DRAFT` with pre-flight validation
- **Dispatch** → locks vehicle + driver simultaneously
- **Complete** → requires odometer + fuel reading; frees resources
- **Cancel** → frees vehicle + driver if dispatched

### 🔧 Maintenance Management
- Log any service (engine, oil change, tyres, etc.)
- Opening a maintenance record automatically sets vehicle to `IN_SHOP`
- Closing it restores vehicle to `AVAILABLE`

### ⛽ Fuel & Expense Tracking
- Log fuel fills per vehicle or per trip
- Categorized expenses (Toll, Parking, Bridge Fee, etc.)
- Aggregated summaries: total liters, cost, and expense amounts

### 📊 Analytics Engine
- **Fleet Utilization** — real-time % of non-retired vehicles on trips
- **Fuel Efficiency** — km/liter per vehicle and overall fleet
- **Operational Cost** — fuel + maintenance + expenses breakdown
- **Monthly Trend** — last 6 months trip volume and distance
- **Vehicle ROI** — revenue vs. total operational cost

### 🔐 Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| `FLEET_MANAGER` | Vehicles, Maintenance, Analytics, Settings |
| `DISPATCHER` | Trips, Drivers |
| `SAFETY_OFFICER` | Drivers, Analytics |
| `FINANCIAL_ANALYST` | Finance, Analytics |

---

## 🏗️ Architecture

```
TransitOps/
│
├── server/                          ← Backend (Next.js 14 API-only)
│   ├── app/api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/       ← NextAuth session handler
│   │   │   └── check/              ← Credential validation endpoint
│   │   ├── vehicles/               ← CRUD + status (business rules only)
│   │   ├── drivers/                ← CRUD + license expiry annotation
│   │   ├── trips/                  ← CRUD + dispatch/complete/cancel
│   │   ├── maintenance/            ← CRUD + open/close transitions
│   │   ├── fuel/                   ← Fuel log CRUD
│   │   ├── expenses/               ← Expense log CRUD
│   │   ├── dashboard/              ← KPI aggregation
│   │   ├── analytics/              ← Full analytics computation
│   │   ├── finance/summary/        ← Per-vehicle cost breakdown
│   │   └── users/                  ← User + role management
│   │
│   ├── lib/
│   │   ├── prisma.ts               ← Singleton Prisma client
│   │   ├── auth.ts                 ← NextAuth config
│   │   ├── business-rules.ts       ← ALL state machine transitions
│   │   ├── rbac.ts                 ← Role → Permission matrix
│   │   └── api.ts                  ← handleRoute/success/failure
│   │
│   ├── prisma/
│   │   ├── schema.prisma           ← 6 models, 6 enums
│   │   └── seed.ts                 ← Demo data seed
│   │
│   └── types/index.ts              ← ApiResponse<T> envelope
│
└── client/                          ← Frontend (Next.js 14 App Router)
    ├── app/
    │   ├── (auth)/login/           ← Login page
    │   ├── (app)/
    │   │   ├── dashboard/          ← KPI cards + charts
    │   │   ├── fleet/              ← Vehicle registry
    │   │   ├── drivers/            ← Driver management
    │   │   ├── trips/              ← Dispatch control
    │   │   ├── maintenance/        ← Service logs
    │   │   ├── fuel/               ← Fuel logs
    │   │   ├── expenses/           ← Expense tracker
    │   │   ├── analytics/          ← Charts + reports
    │   │   └── settings/           ← RBAC + users
    │   └── api/auth/[...nextauth]/ ← Client auth handler
    │
    └── lib/
        ├── auth.ts                 ← NextAuth client config
        ├── api.ts                  ← Typed API fetch helpers
        └── types.ts                ← Shared TypeScript types
```

---

## 🛢️ Data Model

```
User ──────────────────────────────── (4 roles)
Vehicle ───┬── Trip[] ────┬── FuelLog[]
           ├── MaintenanceLog[]      └── Expense[]
           ├── FuelLog[]
           └── Expense[]

Driver ────── Trip[]
```

### Enums

```typescript
VehicleStatus:    AVAILABLE | ON_TRIP | IN_SHOP | RETIRED
DriverStatus:     AVAILABLE | ON_TRIP | OFF_DUTY | SUSPENDED
TripStatus:       DRAFT | DISPATCHED | COMPLETED | CANCELLED
MaintenanceStatus: ACTIVE | CLOSED
Role:             FLEET_MANAGER | DISPATCHER | SAFETY_OFFICER | FINANCIAL_ANALYST
VehicleType:      VAN | TRUCK | BUS | BIKE
```

---

## ⚙️ Business Rules Engine

All state transitions are enforced server-side in `lib/business-rules.ts`. The UI **never** mutates status directly.

```
TRIP DISPATCH guards:
  ✅ Vehicle must be AVAILABLE
  ✅ Driver must be AVAILABLE (not SUSPENDED)
  ✅ Driver license must not be expired
  ✅ Cargo weight ≤ vehicle maxLoadKg
  → Sets Vehicle: ON_TRIP, Driver: ON_TRIP

TRIP COMPLETE:
  ✅ Trip must be DISPATCHED
  ✅ Requires actualOdometer + fuelConsumed
  → Sets Vehicle: AVAILABLE, Driver: AVAILABLE, updates odometer

TRIP CANCEL:
  ✅ Only DRAFT or DISPATCHED trips
  → If DISPATCHED: frees Vehicle + Driver

MAINTENANCE OPEN:
  ✅ Vehicle must not be RETIRED
  → Sets Vehicle: IN_SHOP

MAINTENANCE CLOSE:
  ✅ Log must be ACTIVE
  → Sets Vehicle: AVAILABLE (if IN_SHOP)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v20+
- PostgreSQL 15+ running on `localhost:5432`
- Two terminals

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd TransitOps
```

### 2. Setup & Start Backend

```bash
cd server

# Configure environment
# Edit .env — update DB password if needed:
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/transitops"

# Install dependencies
npm install

# Run database migration
npx prisma migrate dev --name init

# Seed demo data
npx prisma db seed

# Start backend server
npm run dev
# → Runs on http://localhost:3000
```

### 3. Setup & Start Frontend

```bash
# In a NEW terminal:
cd client

# Configure environment
# Edit .env.local:
# NEXTAUTH_URL="http://localhost:3001"
# NEXTAUTH_SECRET="transitops-secret-2024"
# NEXT_PUBLIC_API_URL="http://localhost:3000"

# Install dependencies
npm install

# Start frontend
npm run dev
# → Runs on http://localhost:3001
```

### 4. Login

Open **http://localhost:3001** and use any demo account:

| Email | Password | Role |
|-------|----------|------|
| `fleet@transitops.com` | `password123` | Fleet Manager |
| `dispatch@transitops.com` | `password123` | Dispatcher |
| `safety@transitops.com` | `password123` | Safety Officer |
| `finance@transitops.com` | `password123` | Financial Analyst |

---

## 🌐 API Reference

All endpoints return `ApiResponse<T>`:
```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": "message" }
```

### Authentication
```http
POST /api/auth/check
Body: { "email": "...", "password": "..." }
→ Returns user object (id, name, email, role)
```

### Vehicles
```http
GET    /api/vehicles?type=VAN&status=AVAILABLE&region=West
POST   /api/vehicles        { regNo, name, type, maxLoadKg, acquisitionCost, odometer, region }
GET    /api/vehicles/:id    → Full detail with trips, maintenance, fuel, expenses
PATCH  /api/vehicles/:id    { name, maxLoadKg, ... }  ← status NOT allowed
DELETE /api/vehicles/:id    → Only if AVAILABLE + no active trips
```

### Drivers
```http
GET    /api/drivers?status=AVAILABLE   → includes isExpired, expiringSoon flags
POST   /api/drivers                    { name, licenseNo, licenseCategory, licenseExpiry, contact, safetyScore }
GET    /api/drivers/:id
PATCH  /api/drivers/:id
DELETE /api/drivers/:id                → Only if AVAILABLE
```

### Trips
```http
GET    /api/trips?status=DRAFT&vehicleId=...
POST   /api/trips                      { source, destination, vehicleId, driverId, cargoWeightKg, plannedDistanceKm }
PATCH  /api/trips/:id                  { action: "dispatch" }
PATCH  /api/trips/:id                  { action: "complete", actualOdometer: 100, fuelConsumed: 20 }
PATCH  /api/trips/:id                  { action: "cancel" }
DELETE /api/trips/:id                  → Only DRAFT trips
```

### Maintenance
```http
GET    /api/maintenance?vehicleId=...&status=ACTIVE
POST   /api/maintenance                { vehicleId, serviceType, cost, date, notes }
PATCH  /api/maintenance/:id            { action: "close" }
```

### Fuel & Expenses
```http
GET    /api/fuel                       → { items: [...], summary: { totalLiters, totalCost } }
POST   /api/fuel                       { vehicleId, tripId?, liters, cost, date }
DELETE /api/fuel/:id

GET    /api/expenses                   → { items: [...], summary: { totalAmount } }
POST   /api/expenses                   { vehicleId, tripId?, type, amount, date, notes? }
DELETE /api/expenses/:id
```

### Aggregates
```http
GET    /api/dashboard     → KPIs, recentTrips, vehicleStatusBreakdown
GET    /api/analytics     → fuelEfficiency, operationalCost, vehicleROI, fleetUtilization, monthlyTrend, topVehicles
GET    /api/finance/summary → perVehicle cost breakdown + grandTotals
GET    /api/users         → All users (no passwordHash)
PATCH  /api/users/:id     → { role: "DISPATCHER" }
```

---

## 🧪 Business Rule Verification

```bash
# These should all return 422:
POST /api/trips  { cargoWeightKg: 9999, ... }   → Cargo exceeds max load
POST /api/trips  { vehicleId: <IN_SHOP_ID>, ... } → Vehicle not available
POST /api/trips  { driverId: <SUSPENDED_ID>, ... } → Driver not available

# State machine:
PATCH /api/trips/:id { action: "dispatch" }
  → Vehicle becomes ON_TRIP, Driver becomes ON_TRIP

PATCH /api/trips/:id { action: "complete", actualOdometer: 200, fuelConsumed: 30 }
  → Vehicle becomes AVAILABLE, Driver becomes AVAILABLE

POST /api/maintenance  { vehicleId: ... }
  → Vehicle becomes IN_SHOP

PATCH /api/maintenance/:id  { action: "close" }
  → Vehicle becomes AVAILABLE
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | Next.js 14 (App Router) |
| **Backend Framework** | Next.js 14 (API Routes) |
| **Language** | TypeScript 5 |
| **Database** | PostgreSQL 15 |
| **ORM** | Prisma 5.22 |
| **Authentication** | NextAuth.js 4 (JWT + Credentials) |
| **Styling** | Tailwind CSS 3 |
| **Validation** | Zod |
| **Forms** | React Hook Form + Zod Resolver |
| **Icons** | Lucide React |
| **Password Hashing** | bcryptjs |

---

## 👥 Team

Built during **Oddo Hackathon** — 8 hours

| Person | Role |
|--------|------|
| Person 1 | Backend — API, Business Rules, Database, Auth |
| Person 2 | Frontend — UI Pages, Components |
| Person 3 | Frontend — Styling, Analytics, Integration |

---

## 📄 License

MIT License — built for hackathon demonstration purposes.

---

<div align="center">
  <sub>Built with ❤️ and ☕ in 8 hours · TransitOps © 2026</sub>
</div>
