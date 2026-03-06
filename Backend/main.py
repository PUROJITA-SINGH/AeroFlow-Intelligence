from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from contextlib import asynccontextmanager
from auth import get_db, hash_password, verify_password, create_access_token
from database import User
from routes import zones, live, history, predictions, alerts
from ws_manager import manager
from simulator import run_simulator
from alert_engine import run_alert_engine
import threading
import time
from generate_predictions import *

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Generate predictions on startup
    import subprocess
    import sys
    subprocess.Popen([sys.executable, r"C:\Users\HP\Desktop\AeroFlow\AeroFlow-Intelligence\Backend\generate_predictions.py"])
    print("🔮 Generating predictions...")

    # Alert engine first
    t2 = threading.Thread(target=run_alert_engine, daemon=True)
    t2.start()
    print("🚨 Alert engine started in background")

    # Then simulator
    t1 = threading.Thread(target=run_simulator, daemon=True)
    t1.start()
    print("🚀 Simulator started in background")

    yield
    print("🛑 AeroFlow API shutting down")

app = FastAPI(
    title="AeroFlow Intelligence API",
    description="AI-Powered Smart Airport Operations System",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(zones.router)
app.include_router(live.router)
app.include_router(history.router)
app.include_router(predictions.router)
app.include_router(alerts.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: str = "viewer"

class LoginRequest(BaseModel):
    username: str
    password: str

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

@app.get("/", tags=["Root"])
def root():
    return {"message": "✈️ AeroFlow Intelligence API is running!"}

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)