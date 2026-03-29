import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { C, Scanlines, GridBg, CockpitPanel, DataTag, StatusBadge, CapacityBar, MiniRadar, CockpitCSS } from '../cockpit';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const ZONE_CODES = { 'Security Checkpoint':'SEC-01', 'Gate B':'GTE-02', 'Baggage Claim':'BAG-03', 'Check-in':'CHK-04' };

function getStatus(count) {
  if (count >= 100) return { label:'CRITICAL', color:C.red    };
  if (count >= 50)  return { label:'CAUTION',  color:C.orange };
  return                    { label:'NOMINAL',  color:C.green  };
}

const CockpitTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor:'#000', border:`1px solid ${C.green}40`, padding:'8px 12px', fontFamily:"'Courier New',monospace" }}>
      <p style={{ color:`${C.green}60`, fontSize:'8px', letterSpacing:'2px', marginBottom:'4px' }}>{label}</p>
      <p style={{ color:C.green, fontSize:'14px', fontWeight:'bold' }}>{payload[0].value} <span style={{ fontSize:'8px', color:`${C.green}60` }}>PAX</span></p>
    </div>
  );
};

export default function LiveOverview() {
  const [liveData,    setLiveData]    = useState([]);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tick,        setTick]        = useState(0);

  const fetchData = async () => {
    try {
      const [liveRes, histRes] = await Promise.all([
        axios.get(`${API}/api/live`),
        axios.get(`${API}/api/history`, { params:{ zone:'Security Checkpoint', hours:6 } }),
      ]);
      setLiveData(liveRes.data);
      setHistory(histRes.data.slice(-20));
      setLastUpdated(new Date());
    } catch(e){ console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); const id=setInterval(fetchData,10000); return ()=>clearInterval(id); }, []);
  useEffect(() => { const id=setInterval(()=>setTick(t=>t+1),1000); return ()=>clearInterval(id); }, []);

  const unique = Object.values(liveData.reduce((acc,r) => {
    if(!acc[r.location]||r.passenger_count>acc[r.location].passenger_count) acc[r.location]=r;
    return acc;
  }, {}));

  const total   = unique.reduce((s,r)=>s+r.passenger_count,0);
  const busiest = unique.reduce((m,r)=>r.passenger_count>(m?.passenger_count||0)?r:m,null);
  const avgQ    = unique.length ? Math.round(unique.reduce((s,r)=>s+r.queue_length,0)/unique.length) : 0;
  const criticalCount = unique.filter(r=>r.passenger_count>=100).length;

  const histChart = history.map(d=>({
    time: new Date(d.timestamp).getHours()+':00',
    passengers: d.passenger_count,
  }));

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',backgroundColor:C.bg }}>
      <div style={{ textAlign:'center' }}>
        <MiniRadar size={60} color={C.green} />
        <p style={{ color:`${C.green}60`,fontFamily:"'Courier New',monospace",letterSpacing:'4px',marginTop:'16px',fontSize:'10px' }}>ACQUIRING SIGNAL...</p>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor:C.bg, minHeight:'100vh', position:'relative', fontFamily:"'Courier New',monospace" }}>
      <CockpitCSS /><Scanlines /><GridBg />
      <div style={{ position:'relative', zIndex:1 }}>

        {/* ── Top status bar ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', marginBottom:'16px', borderBottom:`1px solid ${C.green}15` }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <p style={{ color:`${C.green}40`, fontSize:'8px', letterSpacing:'4px' }}>TERMINAL OPERATIONS CENTER</p>
            <StatusBadge label="LIVE" color={C.green} pulse />
            {criticalCount > 0 && <StatusBadge label={`${criticalCount} CRITICAL`} color={C.red} pulse />}
          </div>
          <div style={{ display:'flex', gap:'20px', alignItems:'center' }}>
            <DataTag label="REFRESH" value="10S" color={`${C.green}60`} size="sm" />
            {lastUpdated && <DataTag label="LAST UPDATE" value={lastUpdated.toLocaleTimeString()} color={C.green} size="sm" />}
          </div>
        </div>

        {/* ── Main stats row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'14px' }}>
          {[
            { label:'TOTAL PAX',   value:total,                    color:C.green,  sub:null },
            { label:'BUSIEST',     value:busiest?.location||'—',   color:C.orange, sub:`${busiest?.passenger_count||0} PAX` },
            { label:'AVG QUEUE',   value:`${avgQ}M`,               color:C.blue,   sub:'MINUTES' },
            { label:'CRITICAL ZONES', value:criticalCount,         color:criticalCount>0?C.red:C.green, sub:criticalCount>0?'ATTENTION REQ':'ALL CLEAR' },
          ].map((s,i) => (
            <CockpitPanel key={i} accent={s.color} style={{ padding:'14px 16px' }}>
              <DataTag label={s.label} value={s.value} color={s.color} size="lg" />
              {s.sub && <p style={{ color:`${s.color}40`, fontSize:'8px', letterSpacing:'2px', marginTop:'4px' }}>{s.sub}</p>}
            </CockpitPanel>
          ))}
        </div>

        {/* ── Zone cards + chart row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>

          {/* Zone cards */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            {unique.map((r,i) => {
              const st  = getStatus(r.passenger_count);
              const pct = Math.min(100,(r.passenger_count/150)*100);
              const code= ZONE_CODES[r.location]||'ZNE-??';
              return (
                <CockpitPanel key={i} accent={st.color} label={code} style={{ padding:'14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                    <div>
                      <p style={{ color:`${st.color}50`, fontSize:'7px', letterSpacing:'2px', marginBottom:'4px' }}>{r.location.toUpperCase()}</p>
                      <StatusBadge label={st.label} color={st.color} pulse={st.color===C.red} />
                    </div>
                    <MiniRadar size={36} color={st.color} />
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
                    <DataTag label="PAX" value={r.passenger_count} color={st.color} size="md" />
                    <DataTag label="QUEUE" value={`${r.queue_length}M`} color={C.blue} size="md" />
                  </div>
                  <CapacityBar pct={pct} color={st.color} label="CAPACITY" />
                </CockpitPanel>
              );
            })}
          </div>

          {/* Bar chart */}
          <CockpitPanel accent={C.blue} label="PAX DISTRIBUTION" style={{ padding:'16px' }}>
            <div style={{ marginBottom:'12px', display:'flex', justifyContent:'space-between' }}>
              <DataTag label="ZONES MONITORED" value={unique.length} color={C.blue} size="sm" />
              <DataTag label="TOTAL LOAD" value={`${Math.round((total/600)*100)}%`} color={total>400?C.red:C.orange} size="sm" />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={unique} barSize={28}>
                <CartesianGrid strokeDasharray="2 4" stroke={`${C.green}08`} vertical={false} />
                <XAxis dataKey="location" tick={{ fill:`${C.green}40`, fontSize:8, fontFamily:'Courier New' }} axisLine={false} tickLine={false}
                  tickFormatter={v=>ZONE_CODES[v]||v} />
                <YAxis tick={{ fill:`${C.green}30`, fontSize:8, fontFamily:'Courier New' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CockpitTooltip />} cursor={{ fill:'rgba(0,255,65,0.04)' }} />
                <Bar dataKey="passenger_count" radius={[2,2,0,0]}>
                  {unique.map((r,i) => <Cell key={i} fill={getStatus(r.passenger_count).color} opacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CockpitPanel>
        </div>

        {/* ── History sparkline ── */}
        <CockpitPanel accent={C.green} label="SEC-01 · HISTORICAL TREND · LAST 6H" style={{ padding:'16px' }}>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={histChart}>
              <defs>
                <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.green} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 6" stroke={`${C.green}08`} vertical={false} />
              <XAxis dataKey="time" tick={{ fill:`${C.green}30`, fontSize:8, fontFamily:'Courier New' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<CockpitTooltip />} />
              <Area type="monotone" dataKey="passengers" stroke={C.green} strokeWidth={1.5} fill="url(#gGreen)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CockpitPanel>

      </div>
    </div>
  );
}