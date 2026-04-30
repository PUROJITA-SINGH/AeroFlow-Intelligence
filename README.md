# ✈️ AeroFlow Intelligence

<div align="center">

**AI-Powered Smart Airport Operations & Passenger Flow Analytics System**

![CI/CD](https://github.com/PUROJITA-SINGH/AeroFlow-Intelligence/actions/workflows/ci-cd.yml/badge.svg)
![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)

*Predicts congestion 24 hours in advance. Raises automated alerts before problems occur.*

</div>

---

## 🌐 Live Demo

| Service | URL | Status |
|---|---|---|
| 🖥️ Dashboard | https://aeroflow-frontend.onrender.com | Live |
| ⚙️ API | https://aeroflow-api.onrender.com | Live |
| 📖 Swagger UI | https://aeroflow-api.onrender.com/docs | Live |

### 🔑 Demo Credentials

| Username | Password | Role | Access |
|---|---|---|---|
| `admin` | `admin123` | Admin | Full system access |
| `operations` | `ops123` | Operations | Manage & resolve alerts |
| `viewer` | `view123` | Viewer | Read-only dashboard |

---

## 🎯 Problem Statement

Airport congestion costs airlines **millions in delays** annually. Current systems are **reactive** — staff only respond after queues form.

**AeroFlow is proactive** — it predicts congestion 24 hours in advance using AI, classifies real-time congestion levels, detects anomalies as they happen, and raises automated alerts before problems occur.

> Built for: Aviation Authorities · Airport Management Firms · Travel Technology Companies

---

## 🚀 Features

| Feature | Description | Status |
|---|---|---|
| 📡 **Real-time Monitoring** | Live passenger counts via WebSocket, refreshed every 60s | ✅ Live |
| 🔮 **AI Forecasting** | 24-hour predictions using Facebook Prophet model | ✅ Live |
| 🌲 **Congestion Classification** | Low / Medium / High using Random Forest Classifier | ✅ Live |
| 🔍 **Anomaly Detection** | Unusual passenger spikes using Isolation Forest | ✅ Live |
| 🚨 **Automated Alerts** | 4-rule alert engine running every 5 minutes | ✅ Live |
| 👥 **Role-based Access** | Admin, Operations, Viewer with JWT authentication | ✅ Live |
| 📊 **User Analytics** | Interaction tracking and engagement dashboard | ✅ Live |
| 🐳 **Dockerized** | Full docker-compose single-command deployment | ✅ Live |
| 🔄 **CI/CD Pipeline** | GitHub Actions with automated build & deploy | ✅ Live |
| 🔒 **Rate Limiting** | 20 req/min login, 200 req/min global via slowapi | ✅ Live |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AeroFlow System                       │
│                                                         │
│  IoT Simulator ──► FastAPI Backend ──► PostgreSQL DB    │
│  (60s interval)         │                               │
│                         │ WebSocket                     │
│                         ▼                               │
│              React Cockpit Dashboard                    │
│         (Live · Forecast · Alerts · History)            │
│                         │                               │
│              ┌──────────┴──────────┐                    │
│              │    ML Pipeline      │                    │
│              │  Prophet (forecast) │                    │
│              │  RandomForest (clf) │                    │
│              │  IsolationForest    │                    │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
Sensor Reading → Alert Engine (every 5 min)
                      ↓
           4 Rules checked:
           1. Passenger count > 120% capacity → Critical
           2. Queue length > 20 min → Warning
           3. Anomaly score == -1 → Critical
           4. Auto-resolve when count normalises
```

---

## 🤖 ML Models

| Model | Algorithm | Input Features | Output | Accuracy |
|---|---|---|---|---|
| **Prophet** | Time Series Forecasting | Historical counts + timestamps | 24hr forecast per zone | ~88% |
| **Random Forest** | Classifier | hour, day_of_week, is_weekend, rolling_mean | Low / Medium / High | 85%+ |
| **Isolation Forest** | Anomaly Detection | passenger_count, queue_length, hour, rolling_mean | Anomaly score (-1/+1) | ~92% |

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| FastAPI | 0.100+ | REST API + WebSocket |
| SQLAlchemy | 2.0 | ORM + DB management |
| PostgreSQL | 15 | Primary database |
| python-jose | 3.3 | JWT authentication |
| passlib[bcrypt] | 1.7 | Password hashing |
| slowapi | latest | Rate limiting |
| Facebook Prophet | latest | Time series forecasting |
| scikit-learn | 1.x | ML models |
| pandas / numpy | latest | Data processing |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Recharts | latest | Charts & graphs |
| Axios | latest | API calls |
| React Router | 6 | Client routing |

### DevOps
| Technology | Purpose |
|---|---|
| Docker + Compose | Containerisation |
| GitHub Actions | CI/CD pipeline |
| Render | Cloud deployment |

---

## 🔒 Security

- ✅ JWT authentication (HS256, 60min expiry)
- ✅ bcrypt password hashing
- ✅ Role-based authorization (Admin / Operations / Viewer)
- ✅ Rate limiting — 20 req/min login, 200 req/min global
- ✅ Security headers — X-Frame-Options, X-XSS-Protection, X-Content-Type-Options
- ✅ CORS restricted to specific origins (no wildcard)
- ✅ All secrets managed via environment variables (never hardcoded)
- ✅ SQL injection prevention via SQLAlchemy ORM
- ✅ Input validation via Pydantic with role and password constraints

---

## 🏃 Run Locally

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 15
- Docker (optional but recommended)

### Option 1 — Docker (Recommended)

```bash
git clone https://github.com/PUROJITA-SINGH/AeroFlow-Intelligence
cd AeroFlow-Intelligence
cp .env.example .env        # fill in your values
docker-compose up --build
```

Open http://localhost:3000

### Option 2 — Manual

**1. Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and a strong SECRET_KEY
```

**2. Backend**
```bash
cd Backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**3. Frontend**
```bash
cd Frontend/aeroflow-ui
npm install
npm start
```

Open http://localhost:3000

### Environment Variables

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/airport_analytics
SECRET_KEY=your_64_char_hex_secret
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=airport_analytics
ENV=development
```

Generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 📁 Project Structure

```
AeroFlow-Intelligence/
├── Backend/
│   ├── main.py                  # FastAPI app, middleware, routes
│   ├── database.py              # SQLAlchemy models (5 tables)
│   ├── auth.py                  # JWT auth + role-based authorization
│   ├── simulator.py             # IoT sensor simulator (60s interval)
│   ├── alert_engine.py          # 4-rule automated alert system
│   ├── generate_predictions.py  # Prophet model inference
│   ├── seed_data.py             # Database seeding
│   ├── ws_manager.py            # WebSocket connection manager
│   ├── requirements.txt
│   ├── Dockerfile
│   └── routes/
│       ├── alerts.py
│       ├── history.py
│       ├── live.py
│       ├── predictions.py
│       └── zones.py
├── ML_Models/
│   ├── train_prophet.py
│   ├── train_classifier.py
│   └── train_anomaly.py
├── Frontend/
│   └── aeroflow-ui/
│       ├── src/
│       │   ├── cockpit.js       # Shared cockpit design system
│       │   ├── App.js
│       │   ├── pages/
│       │   │   ├── Login.jsx        # Animated radar cockpit login
│       │   │   ├── LiveOverview.jsx # Real-time zone monitoring
│       │   │   ├── Predictions.jsx  # AI forecast display
│       │   │   ├── Alerts.jsx       # Master caution panel
│       │   │   ├── Historical.jsx   # Temporal analytics
│       │   │   ├── ModelHealth.jsx  # ML system status
│       │   │   └── Analytics.jsx    # User analytics dashboard
│       │   └── components/
│       │       └── Navbar.jsx       # Cockpit sidebar navigation
│       └── Dockerfile
├── .github/
│   └── workflows/
│       └── ci-cd.yml
├── docker-compose.yml
├── .env.example
└── render.yaml
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/api/login` | Get JWT token | None |
| POST | `/api/register` | Create user | Admin only |
| GET | `/api/me` | Get current user | Required |

### Data Endpoints
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/api/live` | Latest sensor readings | Required |
| GET | `/api/history` | Historical data (zone, hours) | Required |
| GET | `/api/predictions` | AI forecasts (zone) | Required |
| GET | `/api/alerts` | Active alerts | Required |
| POST | `/api/alerts/resolve/{id}` | Resolve alert | Admin/Ops |
| GET | `/api/zones` | Airport zone definitions | Required |
| WS | `/ws/live` | Live WebSocket feed | None |

---

## 📸 Screenshots

### Login Page — Cockpit Access Control
![Login](docs/screenshots/login.png)

### Live Monitoring Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### AI Predictions
![Predictions](docs/screenshots/predictions.png)

## 🔌 Hardware Integration

### IoT Sensor Setup (Raspberry Pi + Camera)


#### Components Required
| Component | Purpose |
|---|---|
| Raspberry Pi 4 (2GB+) | Run YOLOv8 camera detection |
| Pi Camera Module v2 | Capture passenger video feed |
| ESP32 | WiFi data transmission to backend |

#### Sensor Scripts
- `camera_sensor.py` — Live camera detection + backend integration
- `test_yolo.py` — Standalone camera test

## 📡 API Examples

### Login
**Request:**
```json
POST /api/login
{
  "username": "admin",
  "password": "admin123"
}
```
**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### Live Sensor Data
**Request:**
```json
GET /api/live
Headers: Authorization: Bearer <token>
```
**Response:**
```json
{
  "zone": "Security",
  "passenger_count": 47,
  "queue_length": 12,
  "congestion_level": "Medium",
  "anomaly_score": 1,
  "timestamp": "2026-04-30T14:00:00"
}
```

### AI Predictions
**Request:**
```json
GET /api/predictions?zone=Security
Headers: Authorization: Bearer <token>
```
**Response:**
```json
{
  "zone": "Security",
  "forecast": [
    {"timestamp": "2026-04-30T15:00:00", "predicted_count": 65},
    {"timestamp": "2026-04-30T16:00:00", "predicted_count": 89}
  ]
}
```


## 👥 Team

| Name | GitHub | Contribution |
|---|---|---|
| **Purojita Singh** | [@PUROJITA-SINGH](https://github.com/PUROJITA-SINGH) | Lead Developer — Backend, ML, Frontend, DevOps |
| **Ajitamani Gupta** | [@amg-xai](https://github.com/amg-xai) | ML Research, System Architecture |

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

<div align="center">
<sub>Built with ❤️ for Aviation Intelligence · AeroFlow v1.0.0</sub>
</div>