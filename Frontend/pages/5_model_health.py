import streamlit as st
import pickle
import pandas as pd
import os

# ── Auth Check ────────────────────────────────────────────
if "token" not in st.session_state or st.session_state.token is None:
    st.error("❌ Please login first from the main page")
    st.stop()

st.set_page_config(page_title="Model Health", page_icon="🤖", layout="wide")
st.markdown("## 🤖 Model Health")
st.markdown("ML model performance metrics and status")
st.divider()

ML_DIR = r"C:\Users\HP\Desktop\AeroFlow\AeroFlow-Intelligence\ML_Models"

# ── Prophet Model ─────────────────────────────────────────
st.markdown("### 📈 Model 1 — Prophet (Passenger Forecasting)")
prophet_path = os.path.join(ML_DIR, 'model_prophet.pkl')
if os.path.exists(prophet_path):
    st.success("✅ model_prophet.pkl loaded successfully")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Algorithm", "Facebook Prophet")
    with col2:
        st.metric("Type", "Time Series Forecasting")
    with col3:
        st.metric("Forecast Horizon", "24 hours")
else:
    st.error("❌ Prophet model not found — run train_prophet.py")

st.divider()

# ── Classifier Model ──────────────────────────────────────
st.markdown("### 🌲 Model 2 — Random Forest (Congestion Classifier)")
clf_path = os.path.join(ML_DIR, 'model_classifier.pkl')
if os.path.exists(clf_path):
    st.success("✅ model_classifier.pkl loaded successfully")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Algorithm", "Random Forest")
    with col2:
        st.metric("Classes", "Low / Medium / High")
    with col3:
        st.metric("Features", "4")
else:
    st.error("❌ Classifier model not found — run train_classifier.py")

st.divider()

# ── Anomaly Model ─────────────────────────────────────────
st.markdown("### 🔍 Model 3 — Isolation Forest (Anomaly Detection)")
anomaly_path = os.path.join(ML_DIR, 'model_anomaly.pkl')
if os.path.exists(anomaly_path):
    st.success("✅ model_anomaly.pkl loaded successfully")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Algorithm", "Isolation Forest")
    with col2:
        st.metric("Contamination", "1%")
    with col3:
        st.metric("Features", "6")
else:
    st.error("❌ Anomaly model not found — run train_anomaly.py")

st.divider()
st.caption("💡 To retrain models, run the training scripts in /ML_Models folder")