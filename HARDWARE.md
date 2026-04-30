\# 🔧 Hardware Integration Guide



\## Components Required

| Component | Purpose | Cost |

|---|---|---|

| Raspberry Pi 4 (2GB+) | Run YOLOv8 camera detection | 

| Pi Camera Module v2 | Capture passenger video feed | 

| ESP32 | WiFi data transmission | 

| MicroSD Card 32GB | Raspberry Pi OS storage | 



\## Setup Flow

Camera → Raspberry Pi → YOLOv8 → ESP32 → FastAPI → Dashboard



\## Files

\- `test\_yolo.py` — Camera detection test

\- `camera\_sensor.py` — Full sensor with backend integration



\## Installation

```bash

pip install opencv-python ultralytics

python test\_yolo.py

```

