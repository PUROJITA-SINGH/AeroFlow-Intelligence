from ultralytics import YOLO
import cv2
import requests
import time

model = YOLO("yolov8n.pt")
cap = cv2.VideoCapture(0)

# Your live AeroFlow API
API_URL = "https://aeroflow-api.onrender.com/api/live"

# Login to get token
login = requests.post("https://aeroflow-api.onrender.com/api/login", 
    json={"username": "admin", "password": "admin123"})
token = login.json().get("access_token")
print("Logged in! Token received ✅")

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
            "zone": "Security",
            "passenger_count": person_count,
            "queue_length": person_count // 3
        }
        try:
            response = requests.post(API_URL, json=data, headers=headers)
            print(f"Sent to dashboard! Status: {response.status_code}")
        except Exception as e:
            print(f"Error sending: {e}")
        last_sent = time.time()

    annotated = results[0].plot()
    cv2.imshow("AeroFlow - Live Sensor", annotated)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()