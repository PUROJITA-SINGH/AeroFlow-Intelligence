import streamlit as st
import requests
import plotly.graph_objects as go
import time

API_URL = "http://localhost:8000"

# ── Auth Check ────────────────────────────────────────────
if "token" not in st.session_state or st.session_state.token is None:
    st.error("❌ Please login first from the main page")
    st.stop()

# ── Page Config ───────────────────────────────────────────
st.set_page_config(page_title="Live Overview", page_icon="📡", layout="wide")
st.markdown("## 📡 Live Overview")
st.markdown("Real-time passenger counts across all airport zones")
st.divider()

# ── Fetch Live Data ───────────────────────────────────────
def get_live_data():
    try:
        response = requests.get(f"{API_URL}/api/live")
        return response.json() if response.status_code == 200 else []
    except:
        return []

def get_zones():
    try:
        response = requests.get(f"{API_URL}/api/zones")
        return response.json() if response.status_code == 200 else []
    except:
        return []

# ── Load Data ─────────────────────────────────────────────
live_data = get_live_data()
zones     = get_zones()

# ── Top Metrics ───────────────────────────────────────────
if live_data:
    total     = sum(r['passenger_count'] for r in live_data)
    busiest   = max(live_data, key=lambda x: x['passenger_count'])

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("👥 Total Passengers Now", total)
    with col2:
        st.metric("🔴 Busiest Zone", busiest['location'])
    with col3:
        st.metric("📊 Busiest Count", busiest['passenger_count'])

    st.divider()

    # ── Zone Status Badges ────────────────────────────────
    st.markdown("### Zone Status")
    cols = st.columns(len(live_data))

    for i, reading in enumerate(live_data):
        count = reading['passenger_count']
        if count < 50:
            badge = "🟢 Low"
            color = "green"
        elif count < 100:
            badge = "🟡 Medium"
            color = "orange"
        else:
            badge = "🔴 High"
            color = "red"

        with cols[i]:
            st.metric(
                label = f"{badge} — {reading['location']}",
                value = f"{count} passengers",
                delta = f"Queue: {reading['queue_length']}"
            )

    st.divider()

    # ── Live Bar Chart ────────────────────────────────────
    st.markdown("### Passenger Count Per Zone")
    locations = [r['location'] for r in live_data]
    counts    = [r['passenger_count'] for r in live_data]
    colors    = ['red' if c >= 100 else 'orange' if c >= 50 else 'green' for c in counts]

    fig = go.Figure(go.Bar(
        x     = locations,
        y     = counts,
        marker_color = colors,
        text  = counts,
        textposition = 'auto'
    ))
    fig.update_layout(
        title  = "Live Passenger Counts",
        xaxis_title = "Zone",
        yaxis_title = "Passengers",
        height = 400
    )
    st.plotly_chart(fig, use_container_width=True)

else:
    st.warning("⚠️ No live data available. Make sure the API is running.")

# ── Auto Refresh ──────────────────────────────────────────
st.divider()
st.caption("🔄 Page refreshes every 10 seconds")
time.sleep(10)
st.rerun()