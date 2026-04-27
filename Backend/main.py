import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from contextlib import asynccontextmanager

from auth import get_db, hash_password, verify_password, create_access_token, get_current_user
from database import User
from routes import zones, live, history, predictions, alerts
from ws_manager import manager
from simulator import run_simulator
from alert_engine import run_alert_engine
from generate_predictions import generate_predictions

import threading

load_dotenv()

# ── Rate Limiter ──────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ── Security Headers Middleware ───────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"]        = "DENY"
        response.headers["X-XSS-Protection"]       = "1; mode=block"
        response.headers["Referrer-Policy"]        = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"]     = "geolocation=(), microphone=()"
        return response

# ── Lifespan ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        generate_predictions()
    except Exception as e:
        print(f"⚠️ Predictions error: {e}")

    t_alerts    = threading.Thread(target=run_alert_engine, daemon=True)
    t_simulator = threading.Thread(target=run_simulator,    daemon=True)
    t_alerts.start()
    t_simulator.start()

    yield
    print("🛑 AeroFlow API shutting down")

# ── App ───────────────────────────────────────────────────
app = FastAPI(
    title="AeroFlow Intelligence API",
    description="AI-Powered Smart Airport Operations System",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if os.environ.get("ENV") != "production" else None,
    redoc_url=None,
)

# ── Middleware ────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-aeroflow-frontend-url.up.railway.app",
    "https://aeroflow-frontend.onrender.com",
    "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)

# ── Routers ───────────────────────────────────────────────
app.include_router(zones.router)
app.include_router(live.router)
app.include_router(history.router)
app.include_router(predictions.router)
app.include_router(alerts.router)

# ── Schemas ───────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "viewer"

    @field_validator("role")
    @classmethod
    def role_must_be_valid(cls, v):
        if v not in {"viewer", "operations", "admin"}:
            raise ValueError("Role must be one of: viewer, operations, admin")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v

class LoginRequest(BaseModel):
    username: str
    password: str

# ── Auth Routes ───────────────────────────────────────────
@app.post("/api/register", tags=["Authentication"])
@limiter.limit("10/minute")
def register(
    request: Request,
    body: RegisterRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Register a new user — admin only"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can register new users")
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    new_user = User(
        username        = body.username,
        hashed_password = hash_password(body.password),
        role            = body.role
    )
    db.add(new_user)
    db.commit()
    return {"message": f"✅ User '{body.username}' registered with role '{body.role}'"}

@app.post("/api/login", tags=["Authentication"])
@limiter.limit("20/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    """Login and receive JWT token"""
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    token = create_access_token(data={"sub": user.username, "role": user.role})
    return {
        "access_token": token,
        "token_type"  : "bearer",
        "role"        : user.role
    }

@app.get("/api/me", tags=["Authentication"])
def me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user info"""
    return {"username": current_user.username, "role": current_user.role}

@app.get("/", tags=["Root"])
def root():
    return {"message": "✈️ AeroFlow Intelligence API is running!"}

# ── WebSocket ─────────────────────────────────────────────
@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)