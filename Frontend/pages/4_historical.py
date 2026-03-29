import streamlit as st
import requests
import plotly.express as px
import plotly.graph_objects as go
import pandas as pd

API_URL = "http://localhost:8000"

# ── Auth Check ────────────────────────────────────────────
if "token" not in st.session_state or st.session_state.token is None:
    st.error("❌ Please login first from the main page")
    st.stop()

st.set_page_config(page_title="Historical Analysis", page_icon="📊", layout="wide")
st.markdown("## 📊 Historical Analysis")
st.divider()

# ── Controls ──────────────────────────────────────────────
col1, col2 = st.columns(2)
with col1:
    zone  = st.selectbox("Select Zone", ["Security Checkpoint", "Gate B", "Baggage Claim", "Check-in"])
with col2:
    hours = st.selectbox("Time Range", [24, 48, 72, 168], format_func=lambda x: f"Last {x} hours")

# ── Fetch Data ────────────────────────────────────────────
def get_history(zone, hours):
    try:
        response = requests.get(f"{API_URL}/api/history", params={"zone": zone, "hours": hours})
        return response.json() if response.status_code == 200 else []
    except:
        return []

history = get_history(zone, hours)

if history:
    df = pd.DataFrame(history)
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['hour']      = df['timestamp'].dt.hour
    df['day']       = df['timestamp'].dt.day_name()

    # ── Trend Line Chart ──────────────────────────────────
    st.markdown("### 📈 Passenger Count Trend")
    fig = px.line(df, x='timestamp', y='passenger_count',
                  title=f"Passenger Trend — {zone}")
    st.plotly_chart(fig, use_container_width=True)

    # ── Heatmap ───────────────────────────────────────────
    st.markdown("### 🌡️ Hourly Heatmap")
    pivot = df.pivot_table(
        values  = 'passenger_count',
        index   = 'day',
        columns = 'hour',
        aggfunc = 'mean'
    ).fillna(0)

    fig2 = go.Figure(go.Heatmap(
        z    = pivot.values,
        x    = pivot.columns.tolist(),
        y    = pivot.index.tolist(),
        colorscale = 'RdYlGn_r'
    ))
    fig2.update_layout(
        title       = "Average Passengers by Hour and Day",
        xaxis_title = "Hour of Day",
        yaxis_title = "Day of Week",
        height      = 400
    )
    st.plotly_chart(fig2, use_container_width=True)

    # ── Stats ─────────────────────────────────────────────
    st.divider()
    st.markdown("### 📊 Summary Statistics")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Average", f"{df['passenger_count'].mean():.0f}")
    with col2:
        st.metric("Peak", df['passenger_count'].max())
    with col3:
        st.metric("Minimum", df['passenger_count'].min())
    with col4:
        st.metric("Total Readings", len(df))
else:
    st.warning("⚠️ No historical data available for this zone.")