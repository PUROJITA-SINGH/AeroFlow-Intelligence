# AeroFlow Intelligence — System Architecture

## Overview

AeroFlow is a cloud-deployed, microservice-inspired airport analytics platform built on a modern Python/React stack with three AI models running in the backend.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   React Dashboard (Cockpit UI)                                  │
│   ├── Live Overview    (WebSocket + REST)                       │
│   ├── AI Predictions   (REST)                                   │
│   ├── Alerts           (REST, polling 10s)                      │
│   ├── Historical       (REST)                                   │
│   ├── Model Health     (REST)                                   │
│   └── Analytics        (localStorage)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS / WSS
┌────────────────────────▼────────────────────────────────────────┐
│                        API LAYER                                │
│                                                                 │
│   FastAPI (Python)                                              │
│   ├── Auth middleware (JWT + Role-based)                        │
│   ├── Rate limiting (slowapi)                                   │
│   ├── Security headers middleware                               │
│   ├── CORS (restricted origins)                                 │
│   └── Routes: /api/live, /api/alerts, /api/history,            │
│               /api/predictions, /api/zones, /api/me            │
└──────┬─────────────────┬──────────────────┬─────────────────────┘
       │                 │                  │
┌──────▼──────┐  ┌───────▼───────┐  ┌──────▼──────────────────────┐
│  PostgreSQL │  │  ML Pipeline  │  │  Background Threads          │
│             │  │               │  │                              │
│  5 Tables:  │  │  Prophet      │  │  Simulator (60s interval)    │
│  - users    │  │  RandomForest │  │  Alert Engine (5min interval)│
│  - sensors  │  │  IsoForest    │  │                              │
│  - alerts   │  │               │  │                              │
│  - preds    │  └───────────────┘  └──────────────────────────────┘
│  - zones    │
└─────────────┘
```

---

## Component Breakdown

### Frontend (React)

| Component | File | Description |
|-----------|------|-------------|
| App Router | `App.js` | Route definitions + analytics tracking |
| Login | `pages/Login.jsx` | Animated radar cockpit login |
| Live Overview | `pages/LiveOverview.jsx` | Real-time zone monitoring |
| Predictions | `pages/Predictions.jsx` | 24h AI forecast display |
| Alerts | `pages/Alerts.jsx` | Master caution panel |
| Historical | `pages/Historical.jsx` | Temporal analytics |
| Model Health | `pages/ModelHealth.jsx` | ML system status |
| Analytics | `pages/Analytics.jsx` | User interaction tracking |
| Navbar | `components/Navbar.jsx` | Cockpit sidebar navigation |
| Design System | `cockpit.js` | Shared tokens + components |

### Backend (FastAPI)

| Module | File | Description |
|--------|------|-------------|
| Main App | `main.py` | App init, middleware, auth routes |
| Database | `database.py` | SQLAlchemy models (5 tables) |
| Auth | `auth.py` | JWT, bcrypt, role-based deps |
| Simulator | `simulator.py` | IoT sensor data generation |
| Alert Engine | `alert_engine.py` | 4-rule automated alert system |
| Predictions | `generate_predictions.py` | Prophet model inference |
| WS Manager | `ws_manager.py` | WebSocket connection pool |
| Routes | `routes/` | REST endpoint handlers |

---

## Database Schema

```
users
├── id (PK)
├── username (UNIQUE)
├── hashed_password
└── role

sensor_readings
├── id (PK)
├── timestamp (indexed)
├── sensor_id
├── location (indexed)
├── passenger_count
└── queue_length

predictions
├── id (PK)
├── timestamp
├── location
├── predicted_count
└── confidence_level

alerts
├── id (PK)
├── timestamp
├── severity
├── location
├── message
└── status

airport_zones
├── zone_id (PK)
├── name
├── capacity
└── zone_type
```

---

## Data Flow

### Real-time Monitoring
```
Simulator (every 60s)
    → Generate reading for each zone
    → INSERT into sensor_readings
    → Broadcast via WebSocket to connected clients
    → Frontend polls /api/live every 10s as fallback
```

### Alert Generation
```
Alert Engine (every 5 min)
    → Query latest sensor_readings
    → Run 4 rules:
        Rule 1: count > capacity × 1.2 → Critical
        Rule 2: queue > 20 min → Warning
        Rule 3: isolation_forest(reading) == -1 → Critical
        Rule 4: count < capacity × 0.7 → Auto-resolve
    → INSERT new alerts / UPDATE resolved alerts
```

### AI Forecasting
```
Startup (generate_predictions.py)
    → Load Prophet model per zone
    → Generate 24 future timestamps
    → Run Prophet.predict()
    → INSERT into predictions table
    → Frontend fetches via /api/predictions?zone=X
```

---

## Security Architecture

```
Request
   │
   ▼
Rate Limiter (slowapi)
   │ 429 if exceeded
   ▼
Security Headers Middleware
   │ Adds X-Frame-Options, X-XSS-Protection etc.
   ▼
CORS Middleware
   │ Blocks disallowed origins
   ▼
Route Handler
   │
   ▼
Depends(get_current_user)  ← JWT validation
   │ 401 if invalid
   ▼
Role Check (if applicable)
   │ 403 if insufficient role
   ▼
Business Logic
   │
   ▼
SQLAlchemy ORM  ← SQL injection prevention
   │
   ▼
PostgreSQL
```

---

## Deployment Architecture

```
GitHub Repository
       │
       │ git push
       ▼
GitHub Actions (CI/CD)
       │
       ├── Run pytest (29 tests)
       ├── Build React frontend
       └── Deploy to Render
              │
              ├── Backend Service (aeroflow-api)
              │   └── Docker container
              │       └── FastAPI + ML models
              │
              ├── Frontend Service (aeroflow-frontend)
              │   └── Static React build
              │
              └── PostgreSQL (Render managed DB)
```

---

## Performance Characteristics

| Metric | Value |
|--------|-------|
| API response time (avg) | < 100ms |
| WebSocket latency | < 50ms |
| Simulator interval | 60 seconds |
| Alert engine interval | 5 minutes |
| Prophet inference time | ~2 seconds (startup) |
| ML classification time | < 1ms per reading |
| DB query time (indexed) | < 10ms |

---

## Technology Decisions

### Why FastAPI over Django/Flask?
- Native async support for WebSocket
- Automatic OpenAPI/Swagger documentation
- Pydantic validation built-in
- ~3× faster than Flask for I/O bound operations

### Why PostgreSQL over SQLite?
- Production-grade concurrent access
- Native datetime indexing for time-series queries
- Supported by Render managed database
- Horizontal scaling capability

### Why Prophet over ARIMA/LSTM?
- Handles missing data automatically
- No hyperparameter tuning required
- Robust to outliers and anomalies
- Interpretable seasonality components
- Fast training on small datasets (< 1000 rows)

### Why React over Vue/Angular?
- Recharts ecosystem for data visualization
- Large component library availability
- Team familiarity
- CRA for zero-config deployment