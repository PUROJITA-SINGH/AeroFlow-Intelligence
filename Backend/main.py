from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from contextlib import asynccontextmanager
from auth import get_db, hash_password, verify_password, create_access_token
from database import User
from routes import zones, live, history, predictions, alerts
import threading
from simulator import run_simulator

# ── Lifespan (modern startup) ─────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    t = threading.Thread(target=run_simulator, daemon=True)
    t.start()
    print("🚀 Simulator started in background")
    yield
    print("🛑 AeroFlow API shutting down")

# ── FastAPI App ───────────────────────────────────────────
app = FastAPI(
    title="AeroFlow Intelligence API",
    description="AI-Powered Smart Airport Operations System",
    version="1.0.0",
    lifespan=lifespan
)

# ── Register Routes ───────────────────────────────────────
app.include_router(zones.router)
app.include_router(live.router)
app.include_router(history.router)
app.include_router(predictions.router)
app.include_router(alerts.router)

# ── CORS Middleware ───────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Pydantic Schemas ──────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "viewer"

class LoginRequest(BaseModel):
    username: str
    password: str

# ── POST /api/register ────────────────────────────────────
@app.post("/api/register", tags=["Authentication"])
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user with username, password and role"""
    existing = db.query(User).filter(User.username == request.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    new_user = User(
        username        = request.username,
        hashed_password = hash_password(request.password),
        role            = request.role
    )
    db.add(new_user)
    db.commit()
    return {"message": f"✅ User '{request.username}' registered successfully!"}

# ── POST /api/login ───────────────────────────────────────
@app.post("/api/login", tags=["Authentication"])
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with username and password, returns JWT token"""
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token(data={"sub": user.username})
    return {
        "access_token": token,
        "token_type"  : "bearer",
        "role"        : user.role
    }

# ── Root ──────────────────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {"message": "✈️ AeroFlow Intelligence API is running!"}