FROM python:3.12-slim

WORKDIR /app

COPY Backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY Backend/ .
COPY ML_Models ./ML_Models

EXPOSE 8000

CMD ["sh", "-c", "sh /app/prestart.sh && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
