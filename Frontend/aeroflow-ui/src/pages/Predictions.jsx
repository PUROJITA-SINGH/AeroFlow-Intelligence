import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const ZONES = ['Security Checkpoint', 'Gate B', 'Baggage Claim', 'Check-in'];

export default function Predictions() {
  const [zone, setZone]             = useState(ZONES[0]);
  const [predictions, setPredictions] = useState([]);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(true);

  const fetchData = async (selectedZone) => {
    setLoading(true);
    try {
      const [predRes, histRes] = await Promise.all([
        axios.get(`${API}/api/predictions`, { params: { zone: selectedZone } }),
        axios.get(`${API}/api/history`,     { params: { zone: selectedZone, hours: 24 } })
      ]);
      setPredictions(predRes.data);
      setHistory(histRes.data);
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(zone); }, [zone]);

  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${d.getHours()}:00`;
  };

  const predChart = predictions.map(p => ({
    time:      formatTime(p.timestamp),
    predicted: Math.round(p.predicted_count)
  }));

  const histChart = history.map(h => ({
    time:   formatTime(h.timestamp),
    actual: h.passenger_count
  }));

  return (
    <div>
      <h1 style={{ color: '#38bdf8', marginBottom: '8px' }}>🔮 Predictions</h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>24-hour AI forecast using Prophet model</p>

      {/* ── Zone Selector ── */}
      <select
        value={zone}
        onChange={e => setZone(e.target.value)}
        style={{
          padding: '10px 16px', marginBottom: '30px',
          backgroundColor: '#1e293b', color: 'white',
          border: '1px solid #334155', borderRadius: '8px',
          fontSize: '14px', cursor: 'pointer'
        }}
      >
        {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
      </select>

      {loading ? <p style={{ color: 'white' }}>Loading...</p> : (
        <>
          {/* ── Forecast Chart ── */}
          <div style={{
            backgroundColor: '#1e293b', padding: '24px',
            borderRadius: '12px', border: '1px solid #334155',
            marginBottom: '24px'
          }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>
              24-Hour Forecast — {zone}
            </h2>
            {predChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={predChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} labelStyle={{ color: 'white' }} />
                  <Legend />
                  <Line type="monotone" dataKey="predicted" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Predicted Passengers" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#64748b' }}>No predictions available. Run generate_predictions.py first.</p>
            )}
          </div>

          {/* ── Historical Chart ── */}
          <div style={{
            backgroundColor: '#1e293b', padding: '24px',
            borderRadius: '12px', border: '1px solid #334155'
          }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>
              Actual — Last 24 Hours — {zone}
            </h2>
            {histChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={histChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} labelStyle={{ color: 'white' }} />
                  <Legend />
                  <Line type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} dot={false} name="Actual Passengers" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#64748b' }}>No historical data available.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}