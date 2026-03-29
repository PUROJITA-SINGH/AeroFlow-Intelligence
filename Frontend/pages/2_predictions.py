import streamlit as st
import requests
import plotly.graph_objects as go

API_URL = "http://localhost:8000"

# ── Auth Check ────────────────────────────────────────────
if "token" not in st.session_state or st.session_state.token is None:
    st.error("❌ Please login first from the main page")
    st.stop()

st.set_page_config(page_title="Predictions", page_icon="🔮", layout="wide")
st.markdown("## 🔮 Passenger Flow Predictions")
st.markdown("AI-powered 24-hour forecast using Prophet model")
st.divider()

# ── Zone Selector ─────────────────────────────────────────
zones = ["Security Checkpoint", "Gate B", "Baggage Claim", "Check-in"]
selected_zone = st.selectbox("Select Zone", zones)

# ── Fetch Predictions ─────────────────────────────────────
def get_predictions(zone):
    try:
        response = requests.get(f"{API_URL}/api/predictions", params={"zone": zone})
        return response.json() if response.status_code == 200 else []
    except:
        return []

def get_history(zone):
    try:
        response = requests.get(f"{API_URL}/api/history", params={"zone": zone, "hours": 24})
        return response.json() if response.status_code == 200 else []
    except:
        return []

predictions = get_predictions(selected_zone)
history     = get_history(selected_zone)

# ── Predictions Chart ─────────────────────────────────────
if predictions:
    timestamps = [p['timestamp'] for p in predictions]
    predicted  = [p['predicted_count'] for p in predictions]

    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x    = timestamps,
        y    = predicted,
        mode = 'lines+markers',
        name = 'Predicted',
        line = dict(color='blue', width=2)
    ))
    fig.update_layout(
        title       = f"24-Hour Forecast — {selected_zone}",
        xaxis_title = "Time",
        yaxis_title = "Predicted Passengers",
        height      = 400
    )
    st.plotly_chart(fig, use_container_width=True)
else:
    st.info("ℹ️ No predictions available yet. ML models need to generate forecasts first.")

st.divider()

# ── Actual vs Historical Chart ────────────────────────────
if history:
    st.markdown("### Actual Passenger Count — Last 24 Hours")
    hist_times  = [h['timestamp'] for h in history]
    hist_counts = [h['passenger_count'] for h in history]

    fig2 = go.Figure()
    fig2.add_trace(go.Scatter(
        x    = hist_times,
        y    = hist_counts,
        mode = 'lines+markers',
        name = 'Actual',
        line = dict(color='green', width=2)
    ))
    fig2.update_layout(
        title       = f"Actual Counts — Last 24 Hours — {selected_zone}",
        xaxis_title = "Time",
        yaxis_title = "Passengers",
        height      = 400
    )
    st.plotly_chart(fig2, use_container_width=True)
else:
    st.warning("⚠️ No historical data available.")