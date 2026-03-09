# AeroFlow Intelligence — System Architecture

## Overview
AeroFlow is a full-stack AI-powered airport operations system.

## Components
- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React, Recharts, Axios
- **ML Models**: Prophet, Random Forest, Isolation Forest
- **DevOps**: Docker, GitHub Actions, Render

## Data Flow
IoT Simulator → FastAPI Backend → PostgreSQL Database
                      ↓
              WebSocket Broadcast
                      ↓
            React Dashboard (Recharts)
