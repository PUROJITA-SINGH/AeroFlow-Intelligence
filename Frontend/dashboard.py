import streamlit as st
import requests

# ── Page Config ───────────────────────────────────────────
st.set_page_config(
    page_title = "AeroFlow Intelligence",
    page_icon  = "✈️",
    layout     = "wide"
)

API_URL = "http://localhost:8000"

# ── Login Function ────────────────────────────────────────
def login(username, password):
    try:
        response = requests.post(
            f"{API_URL}/api/login",
            json={"username": username, "password": password}
        )
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None

# ── Check if logged in ────────────────────────────────────
if "token" not in st.session_state:
    st.session_state.token = None
if "role" not in st.session_state:
    st.session_state.role = None
if "username" not in st.session_state:
    st.session_state.username = None

# ── Login Screen ──────────────────────────────────────────
if st.session_state.token is None:
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown("## ✈️ AeroFlow Intelligence")
        st.markdown("### AI-Powered Smart Airport Operations")
        st.divider()

        username = st.text_input("Username")
        password = st.text_input("Password", type="password")

        if st.button("Login", use_container_width=True):
            if username and password:
                result = login(username, password)
                if result:
                    st.session_state.token    = result["access_token"]
                    st.session_state.role     = result["role"]
                    st.session_state.username = username
                    st.success(f"✅ Welcome, {username}!")
                    st.rerun()
                else:
                    st.error("❌ Invalid username or password")
            else:
                st.warning("Please enter username and password")

# ── Main Dashboard (after login) ──────────────────────────
else:
    st.markdown(f"## ✈️ AeroFlow Intelligence Dashboard")
    st.markdown(f"Welcome **{st.session_state.username}** | Role: `{st.session_state.role}`")
    st.divider()

    st.info("👈 Use the sidebar to navigate between pages")

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("🟢 System Status", "Online")
    with col2:
        st.metric("👤 Logged in as", st.session_state.username)
    with col3:
        st.metric("🔑 Role", st.session_state.role)

    if st.button("Logout"):
        st.session_state.token    = None
        st.session_state.role     = None
        st.session_state.username = None
        st.rerun()