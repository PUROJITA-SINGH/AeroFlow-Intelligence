# AeroFlow Intelligence — Setup Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.12+ | https://python.org |
| Node.js | 18+ | https://nodejs.org |
| PostgreSQL | 15 | https://postgresql.org |
| Git | Any | https://git-scm.com |
| Docker | Optional | https://docker.com |

---

## Quick Start (Docker)

The fastest way to run AeroFlow locally:

```bash
git clone https://github.com/PUROJITA-SINGH/AeroFlow-Intelligence
cd AeroFlow-Intelligence
cp .env.example .env
# Edit .env with your values
docker-compose up --build
```

Open http://localhost:3000

---

## Manual Setup

### 1. Clone the Repository

```bash
git clone https://github.com/PUROJITA-SINGH/AeroFlow-Intelligence
cd AeroFlow-Intelligence
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/airport_analytics
SECRET_KEY=your_64_char_hex_key
POSTGRES_USER=postgres
POSTGRES_PASSWORD=yourpassword
POSTGRES_DB=airport_analytics
ENV=development
```

Generate a secure SECRET_KEY:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 3. Set Up PostgreSQL

Create the database:
```sql
CREATE DATABASE airport_analytics;
```

Or using psql:
```bash
psql -U postgres -c "CREATE DATABASE airport_analytics;"
```

### 4. Backend Setup

```bash
cd Backend
pip install -r requirements.txt
```

Seed the database with initial data:
```bash
python seed_data.py
```

Train and generate ML predictions:
```bash
cd ../ML_Models
python train_prophet.py
python train_classifier.py
python train_anomaly.py
cd ../Backend
python generate_predictions.py
```

Start the backend:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API is now running at http://localhost:8000  
Swagger UI at http://localhost:8000/docs

### 5. Frontend Setup

```bash
cd Frontend/aeroflow-ui
npm install
npm start
```

Dashboard is now running at http://localhost:3000

---

## Default Login Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Full access |
| operations | ops123 | Manage alerts |
| viewer | view123 | Read-only |

---

## Running Tests

### Backend Tests
```bash
cd Backend
pip install pytest httpx
pytest -v
```

Expected: **29 passed**

### Frontend Tests
```bash
cd Frontend/aeroflow-ui
npm test -- --watchAll=false
```

---

## Project Scripts

| Script | Location | Purpose |
|--------|----------|---------|
| `seed_data.py` | Backend/ | Seed initial zones + 7 days of readings |
| `generate_predictions.py` | Backend/ | Run Prophet → save predictions to DB |
| `train_prophet.py` | ML_Models/ | Train Prophet models |
| `train_classifier.py` | ML_Models/ | Train Random Forest classifier |
| `train_anomaly.py` | ML_Models/ | Train Isolation Forest |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string |
| `SECRET_KEY` | ✅ | 64-char hex string for JWT signing |
| `POSTGRES_USER` | ✅ (Docker) | PostgreSQL username |
| `POSTGRES_PASSWORD` | ✅ (Docker) | PostgreSQL password |
| `POSTGRES_DB` | ✅ (Docker) | Database name |
| `ENV` | ❌ | `development` or `production` |

---

## Troubleshooting

### `ModuleNotFoundError`
Make sure you're in the correct directory and venv is activated:
```bash
cd Backend
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

### `psycopg2 connection refused`
PostgreSQL isn't running. Start it:
```bash
# Linux
sudo service postgresql start
# Mac
brew services start postgresql
# Windows — start via Services or pgAdmin
```

### `SECRET_KEY not set`
Make sure `.env` exists in the project root and contains `SECRET_KEY`.

### Port already in use
```bash
# Kill process on port 8000
npx kill-port 8000
# Kill process on port 3000
npx kill-port 3000
```

### Frontend can't reach backend
Check `Frontend/aeroflow-ui/.env.production`:
```env
REACT_APP_API_URL=https://your-backend-url.onrender.com
```