from ultralytics import YOLO
import cv2
import os
import requests
import time

model = YOLO("yolov8n.pt")
cap = cv2.VideoCapture(0)

API_BASE = os.environ["AEROFLOW_API_URL"].rstrip("/")
USERNAME = os.environ["AEROFLOW_SENSOR_USERNAME"]
PASSWORD = os.environ["AEROFLOW_SENSOR_PASSWORD"]

# Login to get token
login = requests.post(
    f"{API_BASE}/api/login",
    json={"username": USERNAME, "password": PASSWORD},
    timeout=10,
)
login.raise_for_status()
token = login.json()["access_token"]
print("Logged in. Token received.")

headers = {"Authorization": f"Bearer {token}"}

last_sent = time.time()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame, classes=[0])
    person_count = len(results[0].boxes)
    print(f"People in frame: {person_count}")

    # Send to backend every 60 seconds
    if time.time() - last_sent >= 60:
        data = {
            "sensor_id": "CAM-001",
            "location": "Security Checkpoint",
            "passenger_count": person_count,
            "queue_length": person_count // 3
        }
        try:
            response = requests.post(
                f"{API_BASE}/api/sensor-readings",
                json=data,
                headers=headers,
                timeout=10,
            )
            response.raise_for_status()
            print(f"Sent to dashboard. Status: {response.status_code}")
        except Exception as e:
            print(f"Error sending: {e}")
        last_sent = time.time()

    annotated = results[0].plot()
    cv2.imshow("AeroFlow - Live Sensor", annotated)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
