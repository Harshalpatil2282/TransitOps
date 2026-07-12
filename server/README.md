# TransitOps — Backend Server

## Quick Start

```bash
cd server
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Server runs at: `http://localhost:3000`

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signin` | Sign in (email + password) |

### Vehicles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vehicles` | List all (filter: `?type=VAN&status=AVAILABLE&region=West`) |
| POST | `/api/vehicles` | Register new vehicle |
| GET | `/api/vehicles/:id` | Full detail with trips, maintenance, fuel, expenses |
| PATCH | `/api/vehicles/:id` | Update fields (status managed by business rules only) |
| DELETE | `/api/vehicles/:id` | Delete (only AVAILABLE with no active trips) |

### Drivers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drivers` | List all (filter: `?status=AVAILABLE`) — includes `isExpired`, `expiringSoon` |
| POST | `/api/drivers` | Register driver |
| GET | `/api/drivers/:id` | Detail with trip history |
| PATCH | `/api/drivers/:id` | Update fields |
| DELETE | `/api/drivers/:id` | Delete (only AVAILABLE) |

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | List (filter: `?status=DRAFT&vehicleId=...`) |
| POST | `/api/trips` | Create trip (DRAFT) — runs pre-flight checks |
| GET | `/api/trips/:id` | Detail |
| PATCH | `/api/trips/:id` | `{ action: "dispatch" \| "complete" \| "cancel" }` |
| DELETE | `/api/trips/:id` | Delete (DRAFT only) |

### Maintenance
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/maintenance` | List (filter: `?vehicleId=...&status=ACTIVE`) |
| POST | `/api/maintenance` | Log maintenance → vehicle becomes IN_SHOP |
| GET | `/api/maintenance/:id` | Detail |
| PATCH | `/api/maintenance/:id` | `{ action: "close" }` → vehicle becomes AVAILABLE |

### Fuel & Expenses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fuel` | List + summary `{ totalLiters, totalCost }` |
| POST | `/api/fuel` | Log fuel |
| DELETE | `/api/fuel/:id` | Delete log |
| GET | `/api/expenses` | List + summary `{ totalAmount }` |
| POST | `/api/expenses` | Log expense |
| DELETE | `/api/expenses/:id` | Delete expense |

### Aggregates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | KPIs, recent trips, vehicle status breakdown |
| GET | `/api/analytics` | Full analytics payload |
| GET | `/api/finance/summary` | Per-vehicle cost breakdown |
| GET | `/api/users` | All users (no passwordHash) |
| PATCH | `/api/users/:id` | Update role |

## Business Rules

- **Dispatch**: Vehicle must be AVAILABLE, Driver must be AVAILABLE (not SUSPENDED), license not expired, cargo ≤ max load
- **Complete**: Trip must be DISPATCHED, requires `actualOdometer` + `fuelConsumed`
- **Cancel**: DRAFT or DISPATCHED trips only; if DISPATCHED, frees vehicle + driver
- **Maintenance Open**: Vehicle becomes IN_SHOP (can't be RETIRED)
- **Maintenance Close**: Vehicle returns to AVAILABLE

## Demo Accounts (password: `password123`)

| Email | Role |
|-------|------|
| fleet@transitops.com | Fleet Manager |
| dispatch@transitops.com | Dispatcher |
| safety@transitops.com | Safety Officer |
| finance@transitops.com | Financial Analyst |

## Database Setup

PostgreSQL must be running. Update `.env` with your connection string:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/transitops"
```
