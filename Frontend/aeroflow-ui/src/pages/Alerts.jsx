import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

export default function Alerts() {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const role                  = localStorage.getItem('role');
  const token                 = localStorage.getItem('token');

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(`${API}/api/alerts`);
      setAlerts(res.data);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const resolveAlert = async (id) => {
    try {
      await axios.post(
        `${API}/api/alerts/resolve/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('✅ Alert resolved successfully!');
      fetchAlerts();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Failed to resolve alert');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getSeverityStyle = (severity) => {
    if (severity === 'Critical') return { border: '#ef4444', bg: '#450a0a', badge: '#ef4444' };
    if (severity === 'Warning')  return { border: '#f59e0b', bg: '#451a03', badge: '#f59e0b' };
    return                              { border: '#0ea5e9', bg: '#0c1a2e', badge: '#0ea5e9' };
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'Critical') return '🔴';
    if (severity === 'Warning')  return '🟡';
    return '🔵';
  };

  if (loading) return <p style={{ color: 'white' }}>Loading...</p>;

  return (
    <div>
      <h1 style={{ color: '#38bdf8', marginBottom: '8px' }}>🚨 Alerts</h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>
        Active alerts — refreshes every 10 seconds
      </p>

      {/* ── Message ── */}
      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px',
          backgroundColor: message.includes('✅') ? '#052e16' : '#450a0a',
          border: `1px solid ${message.includes('✅') ? '#22c55e' : '#ef4444'}`,
          color: message.includes('✅') ? '#22c55e' : '#ef4444'
        }}>
          {message}
        </div>
      )}

      {/* ── Alert Count ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '30px' }}>
        {[
          { label: '🔴 Critical', count: alerts.filter(a => a.severity === 'Critical').length, color: '#ef4444' },
          { label: '🟡 Warning',  count: alerts.filter(a => a.severity === 'Warning').length,  color: '#f59e0b' },
          { label: '🔵 Info',     count: alerts.filter(a => a.severity === 'Info').length,     color: '#0ea5e9' },
        ].map((m, i) => (
          <div key={i} style={{
            backgroundColor: '#1e293b', padding: '20px',
            borderRadius: '12px', border: `1px solid ${m.color}`
          }}>
            <p style={{ color: m.color, fontSize: '13px' }}>{m.label}</p>
            <p style={{ color: 'white', fontSize: '32px', fontWeight: 'bold', marginTop: '8px' }}>{m.count}</p>
          </div>
        ))}
      </div>

      {/* ── Alerts List ── */}
      {alerts.length === 0 ? (
        <div style={{
          backgroundColor: '#1e293b', padding: '40px',
          borderRadius: '12px', border: '1px solid #334155',
          textAlign: 'center'
        }}>
          <p style={{ color: '#22c55e', fontSize: '18px' }}>✅ No active alerts — all zones are normal!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {alerts.map((alert) => {
            const style = getSeverityStyle(alert.severity);
            return (
              <div key={alert.id} style={{
                backgroundColor: style.bg, padding: '20px',
                borderRadius: '12px', border: `1px solid ${style.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{
                      backgroundColor: style.badge, color: 'white',
                      padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold'
                    }}>
                      {getSeverityIcon(alert.severity)} {alert.severity}
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>{alert.location}</span>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ color: 'white', fontSize: '15px' }}>{alert.message}</p>
                </div>

                {/* ── Resolve Button ── */}
                {(role === 'admin' || role === 'operations') && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    style={{
                      padding: '8px 16px', marginLeft: '20px',
                      backgroundColor: '#22c55e', color: 'white',
                      border: 'none', borderRadius: '8px',
                      cursor: 'pointer', fontSize: '13px',
                      fontWeight: 'bold', whiteSpace: 'nowrap'
                    }}
                  >
                    ✓ Resolve
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}