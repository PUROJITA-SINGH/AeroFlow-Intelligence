import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login        from './pages/Login';
import LiveOverview from './pages/LiveOverview';
import Predictions  from './pages/Predictions';
import Alerts       from './pages/Alerts';
import Historical   from './pages/Historical';
import ModelHealth  from './pages/ModelHealth';
import Analytics, { trackEvent, trackSession } from './pages/Analytics';
import Navbar       from './components/Navbar';

// ── Auth Guard ────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

// ── Dashboard Layout ──────────────────────────────────────
function DashboardLayout({ page, children }) {
  useEffect(() => {
    trackEvent(page, 'view');
  }, [page]);

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:'#030500' }}>
      <Navbar />
      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}

// ── Protected Dashboard Route ─────────────────────────────
function DashboardRoute({ page, element }) {
  return (
    <ProtectedRoute>
      <DashboardLayout page={page}>
        {element}
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// ── App ───────────────────────────────────────────────────
export default function App() {
  // track session on first load
  useEffect(() => { trackSession(); }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login"        element={<Login />} />
        <Route path="/"             element={<DashboardRoute page="/live"         element={<LiveOverview />} />} />
        <Route path="/live"         element={<DashboardRoute page="/live"         element={<LiveOverview />} />} />
        <Route path="/predictions"  element={<DashboardRoute page="/predictions"  element={<Predictions />} />} />
        <Route path="/alerts"       element={<DashboardRoute page="/alerts"       element={<Alerts />} />} />
        <Route path="/historical"   element={<DashboardRoute page="/historical"   element={<Historical />} />} />
        <Route path="/model-health" element={<DashboardRoute page="/model-health" element={<ModelHealth />} />} />
        <Route path="/analytics"    element={<DashboardRoute page="/analytics"    element={<Analytics />} />} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}