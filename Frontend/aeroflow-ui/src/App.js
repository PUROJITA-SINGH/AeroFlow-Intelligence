import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import LiveOverview from './pages/LiveOverview';
import Predictions from './pages/Predictions';
import Alerts from './pages/Alerts';
import Historical from './pages/Historical';
import ModelHealth from './pages/ModelHealth';
import Navbar from './components/Navbar';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <div style={{ display: 'flex' }}>
              <Navbar />
              <div style={{ marginLeft: '220px', padding: '30px', width: '100%' }}>
                <LiveOverview />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/live" element={
          <ProtectedRoute>
            <div style={{ display: 'flex' }}>
              <Navbar />
              <div style={{ marginLeft: '220px', padding: '30px', width: '100%' }}>
                <LiveOverview />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/predictions" element={
          <ProtectedRoute>
            <div style={{ display: 'flex' }}>
              <Navbar />
              <div style={{ marginLeft: '220px', padding: '30px', width: '100%' }}>
                <Predictions />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/alerts" element={
          <ProtectedRoute>
            <div style={{ display: 'flex' }}>
              <Navbar />
              <div style={{ marginLeft: '220px', padding: '30px', width: '100%' }}>
                <Alerts />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/historical" element={
          <ProtectedRoute>
            <div style={{ display: 'flex' }}>
              <Navbar />
              <div style={{ marginLeft: '220px', padding: '30px', width: '100%' }}>
                <Historical />
              </div>
            </div>
          </ProtectedRoute>
        } />
        <Route path="/model-health" element={
          <ProtectedRoute>
            <div style={{ display: 'flex' }}>
              <Navbar />
              <div style={{ marginLeft: '220px', padding: '30px', width: '100%' }}>
                <ModelHealth />
              </div>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;