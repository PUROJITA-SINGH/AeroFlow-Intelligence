import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API = 'http://localhost:8000';

export default function LiveOverview() {
  const [liveData, setLiveData]   = useState([]);
  const [zones, setZones]         = useState([]);
  const [loading, setLoading]     = useState(true);

  const fetchData = async () => {
    try {
      const [liveRes, zonesRes] = await Promise.all([
        axios.get(`${API}/api/live`),
        axios.get(`${API}/api/zones`)
      ]);
      setLiveData(liveRes.data);
      setZones(zonesRes.data);
    } catch (err) {
      console.error('Error fetching live data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatus = (count) => {
    if (count >= 100) return { label: '🔴 High',   color: '#ef4444' };
    if (count >= 50)  return { label: '🟡 Medium', color: '#f59e0b' };
    return              { label: '🟢 Low',    color: '#22c55e' };
  };

  const totalPassengers = liveData.reduce((sum, r) => sum + r.passenger_count, 0);
  const busiest = liveData.reduce((max, r) => r.passenger_count > (max?.passenger_count || 0) ? r : max, null);

  // Deduplicate by location
  const uniqueByLocation = Object.values(
    liveData.reduce((acc, r) => {
      if (!acc[r.location] || r.passenger_count > acc[r.location].passenger_count) {
        acc[r.location] = r;
      }
      return acc;
    }, {})
  );

  if (loading) return <p style={{ color: 'white' }}>Loading...</p>;

  return (
    <div>
      <h1 style={{ color: '#38bdf8', marginBottom: '8px' }}>📡 Live Overview</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Real-time passenger counts — refreshes every 10 seconds</p>

      {/* ── Top Metrics ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '30px' }}>
        {[
          { label: '👥 Total Passengers', value: totalPassengers },
          { label: '🔴 Busiest Zone',     value: busiest?.location || 'N/A' },
          { label: '📊 Busiest Count',    value: busiest?.passenger_count || 0 },
        ].map((m, i) => (
          <div key={i} style={{
            backgroundColor: '#1e293b', padding: '20px',
            borderRadius: '12px', border: '1px solid #334155'
          }}>
            <p style={{ color: '#64748b', fontSize: '13px' }}>{m.label}</p>
            <p style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', marginTop: '8px' }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Zone Status Badges ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '30px' }}>
        {uniqueByLocation.map((r, i) => {
          const status = getStatus(r.passenger_count);
          return (
            <div key={i} style={{
              backgroundColor: '#1e293b', padding: '20px',
              borderRadius: '12px', border: `1px solid ${status.color}`
            }}>
              <p style={{ color: status.color, fontWeight: 'bold', marginBottom: '8px' }}>{status.label}</p>
              <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>{r.location}</p>
              <p style={{ color: '#94a3b8', marginTop: '4px' }}>👥 {r.passenger_count} passengers</p>
              <p style={{ color: '#94a3b8' }}>🕐 Queue: {r.queue_length} mins</p>
            </div>
          );
        })}
      </div>

      {/* ── Bar Chart ── */}
      <div style={{
        backgroundColor: '#1e293b', padding: '24px',
        borderRadius: '12px', border: '1px solid #334155'
      }}>
        <h2 style={{ color: 'white', marginBottom: '20px' }}>Passenger Count Per Zone</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={uniqueByLocation}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="location" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              labelStyle={{ color: 'white' }}
            />
            <Bar dataKey="passenger_count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}