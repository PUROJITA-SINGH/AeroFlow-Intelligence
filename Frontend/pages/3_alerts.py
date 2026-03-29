import streamlit as st
import requests

API_URL = "http://localhost:8000"

# ── Auth Check ────────────────────────────────────────────
if "token" not in st.session_state or st.session_state.token is None:
    st.error("❌ Please login first from the main page")
    st.stop()

st.set_page_config(page_title="Alerts", page_icon="🚨", layout="wide")
st.markdown("## 🚨 Alerts")
st.markdown("Active alerts and alert history")
st.divider()

# ── Fetch Alerts ──────────────────────────────────────────
def get_alerts():
    try:
        response = requests.get(f"{API_URL}/api/alerts")
        return response.json() if response.status_code == 200 else []
    except:
        return []

def resolve_alert(alert_id, token):
    try:
        response = requests.post(
            f"{API_URL}/api/alerts/resolve/{alert_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        return response.status_code == 200
    except:
        return False

alerts = get_alerts()

# ── Active Alerts ─────────────────────────────────────────
if alerts:
    st.markdown(f"### 🔴 Active Alerts ({len(alerts)})")
    for alert in alerts:
        if alert['severity'] == "Critical":
            color = "🔴"
            box   = "error"
        elif alert['severity'] == "Warning":
            color = "🟡"
            box   = "warning"
        else:
            color = "🔵"
            box   = "info"

        col1, col2 = st.columns([4, 1])
        with col1:
            if box == "error":
                st.error(f"{color} **{alert['severity']}** | {alert['location']} | {alert['message']}")
            elif box == "warning":
                st.warning(f"{color} **{alert['severity']}** | {alert['location']} | {alert['message']}")
            else:
                st.info(f"{color} **{alert['severity']}** | {alert['location']} | {alert['message']}")
        with col2:
            if st.session_state.role in ["admin", "operations"]:
                if st.button(f"Resolve", key=f"resolve_{alert['id']}"):
                    if resolve_alert(alert['id'], st.session_state.token):
                        st.success("✅ Resolved!")
                        st.rerun()
                    else:
                        st.error("❌ Failed to resolve")
else:
    st.success("✅ No active alerts — all zones are normal!")

st.divider()

# ── Filter Options ────────────────────────────────────────
st.markdown("### 📋 Alert Filters")
col1, col2 = st.columns(2)
with col1:
    severity_filter = st.selectbox("Filter by Severity", ["All", "Critical", "Warning", "Info"])
with col2:
    zone_filter = st.selectbox("Filter by Zone", ["All", "Security Checkpoint", "Gate B", "Baggage Claim", "Check-in"])

st.caption("🔄 Refresh the page to see latest alerts")