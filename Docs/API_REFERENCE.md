# AeroFlow Intelligence — API Reference

**Base URL (Production):** `https://aeroflow-api.onrender.com`  
**Base URL (Local):** `http://localhost:8000`  
**Version:** 1.0.0

---

## Authentication

AeroFlow uses **JWT Bearer tokens**. All endpoints except `/`, `/api/login` require authentication.

### Get Token

```http
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "admin"
}
```

Use the token in all subsequent requests:
```http
Authorization: Bearer <access_token>
```

---

## Endpoints

### Root

#### `GET /`
Health check endpoint.

**Response:**
```json
{ "message": "✈️ AeroFlow Intelligence API is running!" }
```

---

### Authentication

#### `POST /api/login`
Authenticate and receive JWT token.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | ✅ | Registered username |
| password | string | ✅ | User password |

**Rate limit:** 20 requests/minute

**Responses:**
- `200` — Token returned
- `401` — Invalid credentials

---

#### `POST /api/register`
Register a new user. **Admin only.**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| username | string | ✅ | Must be unique |
| password | string | ✅ | Min 8 characters |
| role | string | ❌ | viewer / operations / admin (default: viewer) |

**Rate limit:** 10 requests/minute

**Responses:**
- `200` — User created
- `400` — Username already exists
- `403` — Not an admin
- `422` — Validation failed

---

#### `GET /api/me`
Get current authenticated user info.

**Response:**
```json
{
  "username": "admin",
  "role": "admin"
}
```

**Responses:**
- `200` — User info returned
- `401` — Not authenticated

---

### Live Data

#### `GET /api/live`
Returns the latest sensor reading per zone. Falls back to most recent if no reading in last 60 seconds.

**Auth required:** ✅

**Response:**
```json
[
  {
    "sensor_id": "S001",
    "location": "Security Checkpoint",
    "passenger_count": 98,
    "queue_length": 19,
    "timestamp": "2026-03-26T08:00:00"
  }
]
```

**Responses:**
- `200` — List of zone readings
- `401` — Not authenticated

---

### Historical Data

#### `GET /api/history`
Returns historical sensor readings for a specific zone.

**Auth required:** ✅

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| zone | string | ✅ | — | Zone name (e.g. `Security Checkpoint`) |
| hours | integer | ❌ | 24 | Hours to look back (min: 1) |

**Example:**
```http
GET /api/history?zone=Security Checkpoint&hours=24
```

**Response:**
```json
[
  {
    "timestamp": "2026-03-25T08:00:00",
    "sensor_id": "S001",
    "passenger_count": 98,
    "queue_length": 19
  }
]
```

---

### Predictions

#### `GET /api/predictions`
Returns 24-hour AI forecast for a specific zone using the Facebook Prophet model.

**Auth required:** ✅

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| zone | string | ✅ | Zone name (e.g. `Gate B`) |

**Response:**
```json
[
  {
    "timestamp": "2026-03-26T08:00:00",
    "location": "Gate B",
    "predicted_count": 119.4,
    "confidence_level": 0.78
  }
]
```

---

### Alerts

#### `GET /api/alerts`
Returns all active alerts sorted by severity (Critical → Warning → Info).

**Auth required:** ✅

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": "2026-03-26T08:15:00",
    "severity": "Critical",
    "location": "Gate B",
    "message": "Passenger count 134 exceeds 120% of capacity (80)",
    "status": "Active"
  }
]
```

---

#### `POST /api/alerts/resolve/{alert_id}`
Resolve an active alert. **Admin and Operations only.**

**Auth required:** ✅  
**Roles:** admin, operations

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| alert_id | integer | ID of the alert to resolve |

**Response:**
```json
{ "message": "✅ Alert 1 resolved successfully" }
```

**Responses:**
- `200` — Alert resolved
- `403` — Insufficient role
- `404` — Alert not found

---

### Zones

#### `GET /api/zones`
Returns all configured airport zones.

**Auth required:** ✅

**Response:**
```json
[
  {
    "zone_id": 1,
    "name": "Security Checkpoint",
    "capacity": 100,
    "zone_type": "security"
  }
]
```

---

### WebSocket

#### `WS /ws/live`
Real-time live data stream. Broadcasts new sensor readings every 60 seconds.

**Auth required:** ❌

**Connection:**
```javascript
const ws = new WebSocket('wss://aeroflow-api.onrender.com/ws/live');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message here"
}
```

| Code | Meaning |
|------|---------|
| 400 | Bad request (e.g. duplicate username) |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient role |
| 404 | Resource not found |
| 422 | Validation error |
| 429 | Rate limit exceeded |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| `POST /api/login` | 20 req/min |
| `POST /api/register` | 10 req/min |
| All others | 200 req/min |

---

## Security Headers

All responses include:

| Header | Value |
|--------|-------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| X-XSS-Protection | 1; mode=block |
| Referrer-Policy | strict-origin-when-cross-origin |