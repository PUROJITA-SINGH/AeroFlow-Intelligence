import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const ZONES = ['Security Checkpoint', 'Gate B', 'Baggage Claim', 'Check-in'];
const HOURS = [6, 12, 24, 48, 72];

export default function Historical() {
  const [zone,    setZone]    = useState(ZONES[0]);
  const [hours,   setHours]   = useState(24);
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (z, h) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/history`, {
        params: { zone: z, hours: h }
      });
      setData(res.data);
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchHistory(zone, hours); }, [zone, hours]);

  const formatTime = (ts) => {
    const d = new Date(ts);
    return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:00`;
  };

  const chartData = data.map(d => ({
    time:       formatTime(d.timestamp),
    passengers: d.passenger_count,
    queue:      d.queue_length
  }));

  // ── Summary Stats ──
  const counts     = data.map(d => d.passenger_count);
  const avgCount   = counts.length ? Math.round(counts.reduce((a,b) => a+b, 0) / counts.length) : 0;
  const maxCount   = counts.length ? Math.max(...counts) : 0;
  const minCount   = counts.length ? Math.min(...counts) : 0;
  const totalReads = data.length;

  return (
    <div>
      <h1 style={{ color: '#38bdf8', marginBottom: '8px' }}>📊 Historical Data</h1>
      <p style={{ color: '#64748b', marginBottom: '24px' }}>Analyse past passenger trends by zone</p>

      {/* ── Filters ── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '30px' }}>
        <select
          value={zone}
          onChange={e => setZone(e.target.value)}
          style={{
            padding: '10px 16px', backgroundColor: '#1e293b',
            color: 'white', border: '1px solid #334155',
            borderRadius: '8px', fontSize: '14px', cursor: 'pointer'
          }}
        >
          {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
        </select>

        <select
          value={hours}
          onChange={e => setHours(Number(e.target.value))}
          style={{
            padding: '10px 16px', backgroundColor: '#1e293b',
            color: 'white', border: '1px solid #334155',
            borderRadius: '8px', fontSize: '14px', cursor: 'pointer'
          }}
        >
          {HOURS.map(h => <option key={h} value={h}>Last {h} hours</option>)}
        </select>
      </div>

      {loading ? <p style={{ color: 'white' }}>Loading...</p> : (
        <>
          {/* ── Summary Stats ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px', marginBottom: '30px'
          }}>
            {[
              { label: '📈 Average',    value: avgCount,   color: '#0ea5e9' },
              { label: '🔴 Peak',       value: maxCount,   color: '#ef4444' },
              { label: '🟢 Minimum',    value: minCount,   color: '#22c55e' },
              { label: '📋 Readings',   value: totalReads, color: '#a78bfa' },
            ].map((s, i) => (
              <div key={i} style={{
                backgroundColor: '#1e293b', padding: '20px',
                borderRadius: '12px', border: `1px solid ${s.color}`
              }}>
                <p style={{ color: '#64748b', fontSize: '13px' }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Passenger Trend ── */}
          <div style={{
            backgroundColor: '#1e293b', padding: '24px',
            borderRadius: '12px', border: '1px solid #334155',
            marginBottom: '24px'
          }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>
              Passenger Count — {zone} — Last {hours}h
            </h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} labelStyle={{ color: 'white' }} />
                  <Legend />
                  <Line type="monotone" dataKey="passengers" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Passengers" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#64748b' }}>No data available for this period.</p>
            )}
          </div>

          {/* ── Queue Length Chart ── */}
          <div style={{
            backgroundColor: '#1e293b', padding: '24px',
            borderRadius: '12px', border: '1px solid #334155'
          }}>
            <h2 style={{ color: 'white', marginBottom: '20px' }}>
              Queue Length (mins) — {zone} — Last {hours}h
            </h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} labelStyle={{ color: 'white' }} />
                  <Legend />
                  <Bar dataKey="queue" fill="#a78bfa" radius={[4,4,0,0]} name="Queue (mins)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: '#64748b' }}>No data available.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}