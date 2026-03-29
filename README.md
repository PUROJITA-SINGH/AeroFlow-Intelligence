# ✈️ AeroFlow Intelligence
### AI-Powered Smart Airport Operations System

![CI/CD](https://github.com/PUROJITA-SINGH/AeroFlow-Intelligence/actions/workflows/ci-cd.yml/badge.svg)

## 🌐 Live Demo
| Service | URL |
|---|---|
| 🖥️ Dashboard | https://aeroflow-frontend.onrender.com |
| ⚙️ API | https://aeroflow-api.onrender.com |
| �docs Swagger UI | https://aeroflow-api.onrender.com/docs |

## 🔑 Demo Credentials
| Username | Password | Role |
|---|---|---|
| admin | admin123 | Full access |
| operations | ops123 | Manage alerts |
| viewer | view123 | View only |

## 🎯 Problem Statement
Airport congestion costs airlines millions in delays annually. Current systems are reactive — staff only respond after queues form. AeroFlow is proactive — it predicts congestion 24 hours in advance and raises automated alerts before problems occur.

## 🚀 Features
- 📡 **Real-time Monitoring** — Live passenger counts via WebSocket
- 🔮 **AI Forecasting** — 24-hour predictions using Facebook Prophet
- 🌲 **Congestion Classification** — Low/Medium/High using Random Forest
- 🔍 **Anomaly Detection** — Unusual spikes using Isolation Forest
- 🚨 **Automated Alerts** — 4-rule alert engine running every 5 minutes
- 👥 **Role-based Access** — Admin, Operations, Viewer roles
- 🐳 **Dockerized** — Full docker-compose deployment
- 🔄 **CI/CD Pipeline** — GitHub Actions with automated testing

## 🏗️ Architecture
```
IoT Simulator → FastAPI Backend → PostgreSQL
                      ↓
              WebSocket Broadcast
                      ↓
            React Dashboard (Recharts)
```

## 🤖 ML Models
| Model | Algorithm | Purpose |
|---|---|---|
| Prophet | Time Series | 24hr passenger forecast |
| Random Forest | Classifier | Low/Medium/High congestion |
| Isolation Forest | Anomaly Detection | Unusual spike detection |

## 🛠️ Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React, Recharts, Axios |
| Backend | FastAPI, SQLAlchemy, WebSocket |
| Database | PostgreSQL |
| ML | Prophet, Scikit-learn, Pandas |
| DevOps | Docker, GitHub Actions, Render |

## 🏃 Run Locally

### Prerequisites
- Python 3.11+
- Node.js 22+
- PostgreSQL
- Docker (optional)

### With Docker
```bash
git clone https://github.com/PUROJITA-SINGH/AeroFlow-Intelligence
cd AeroFlow-Intelligence
docker-compose up --build
```

### Without Docker

**Backend:**
```bash
cd Backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd Frontend/aeroflow-ui
npm install
npm start
```

## 📁 Project Structure
```
AeroFlow-Intelligence/
├── Backend/
│   ├── main.py              # FastAPI app
│   ├── database.py          # SQLAlchemy models
│   ├── auth.py              # JWT authentication
│   ├── simulator.py         # IoT sensor simulator
│   ├── alert_engine.py      # Automated alert system
│   ├── generate_predictions.py
│   └── routes/              # API endpoints
├── ML_Models/
│   ├── train_prophet.py
│   ├── train_classifier.py
│   └── train_anomaly.py
├── Frontend/
│   └── aeroflow-ui/         # React app
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # CI/CD pipeline
├── docker-compose.yml
└── render.yaml
```

## 👥 Team
- Ajitamani Gupta
- Purojita Singh

## 📄 License
MIT License
