from fastapi import WebSocket
from typing import List
import json

# ── Connection Manager ────────────────────────────────────
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"🔌 New client connected | Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        print(f"❌ Client disconnected | Total: {len(self.active_connections)}")

    async def broadcast(self, data: dict):
        message = json.dumps(data, default=str)
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

# ── Global Manager Instance ───────────────────────────────
manager = ConnectionManager()