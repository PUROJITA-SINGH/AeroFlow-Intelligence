import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { C, Scanlines, GridBg, CockpitPanel, DataTag, StatusBadge, CockpitCSS, MiniRadar } from '../cockpit';

const API   = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const ZONES = ['Security Checkpoint','Gate B','Baggage Claim','Check-in'];
const CODES  = { 'Security Checkpoint':'SEC-01','Gate B':'GTE-02','Baggage Claim':'BAG-03','Check-in':'CHK-04' };

const CockpitTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ backgroundColor:'#000', border:`1px solid ${C.green}30`, padding:'10px 14px', fontFamily:"'Courier New',monospace" }}>
      <p style={{ color:`${C.green}40`, fontSize:'8px', letterSpacing:'2px', marginBottom:'6px' }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color, fontSize:'12px', marginBottom:'2px', letterSpacing:'1px' }}>
          {p.name}: <span style={{ color:'white', fontWeight:'bold' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function Predictions() {
  const [zone,        setZone]        = useState(ZONES[0]);
  const [predictions, setPredictions] = useState([]);
  const [history,     setHistory]     = useState([]);
  const [loading,     setLoading]     = useState(true);

  const fetchData = async (z) => {
    setLoading(true);
    try {
      const [pRes,hRes] = await Promise.all([
        axios.get(`${API}/api/predictions`, { params:{ zone:z } }),
        axios.get(`${API}/api/history`,     { params:{ zone:z, hours:24 } }),
      ]);
      setPredictions(pRes.data);
      setHistory(hRes.data);
    } catch(e){ console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(zone); }, [zone]);

  const fmt = ts => `${new Date(ts).getHours().toString().padStart(2,'0')}:00`;

  const predMap = Object.fromEntries(predictions.map(p=>[fmt(p.timestamp),Math.round(p.predicted_count)]));
  const histMap = Object.fromEntries(history.map(h=>[fmt(h.timestamp),h.passenger_count]));
  const allTimes = [...new Set([...Object.keys(predMap),...Object.keys(histMap)])].sort();
  const chartData = allTimes.map(t=>({ time:t, predicted:predMap[t]??null, actual:histMap[t]??null }));

  const maxPred   = predictions.length ? Math.round(Math.max(...predictions.map(p=>p.predicted_count))) : 0;
  const peakHour  = predictions.length ? fmt(predictions.reduce((m,p)=>p.predicted_count>m.predicted_count?p:m).timestamp) : '—';
  const avgConf   = predictions.length ? Math.round(predictions.reduce((s,p)=>s+(p.confidence_level||0),0)/predictions.length*100) : 0;
  const trend     = predictions.length > 1 ? (predictions[predictions.length-1].predicted_count > predictions[0].predicted_count ? '▲ RISING' : '▼ FALLING') : '— STABLE';
  const trendColor= trend.includes('▲') ? C.red : C.green;

  return (
    <div style={{ backgroundColor:C.bg, minHeight:'100vh', position:'relative', fontFamily:"'Courier New',monospace" }}>
      <CockpitCSS /><Scanlines /><GridBg color={C.blue} />
      <div style={{ position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', borderBottom:`1px solid ${C.blue}15`, paddingBottom:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <p style={{ color:`${C.blue}40`, fontSize:'8px', letterSpacing:'4px' }}>AI FORECAST SYSTEM · PROPHET MODEL</p>
            <StatusBadge label="ACTIVE" color={C.blue} />
          </div>
          <DataTag label="MODEL" value="FB-PROPHET v1" color={C.blue} size="sm" />
        </div>

        {/* Zone selector tabs */}
        <div style={{ display:'flex', gap:'6px', marginBottom:'14px' }}>
          {ZONES.map(z => (
            <button key={z} onClick={()=>setZone(z)} style={{
              padding:'8px 14px',
              backgroundColor: zone===z ? `${C.blue}15` : 'transparent',
              border: zone===z ? `1px solid ${C.blue}60` : `1px solid ${C.blue}15`,
              color: zone===z ? C.blue : `${C.blue}30`,
              fontSize:'8px', letterSpacing:'2px', cursor:'pointer',
              fontFamily:"'Courier New',monospace", transition:'all 0.15s',
              textShadow: zone===z ? `0 0 8px ${C.blue}` : 'none',
            }}>
              {CODES[z]} · {z.toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex',alignItems:'center',gap:'16px',padding:'40px' }}>
            <MiniRadar size={40} color={C.blue} />
            <p style={{ color:`${C.blue}50`,letterSpacing:'4px',fontSize:'10px' }}>COMPUTING FORECAST...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'14px' }}>
              {[
                { label:'PEAK PREDICTED', value:maxPred,   color:C.red,    sub:'PAX' },
                { label:'PEAK HOUR',      value:peakHour,  color:C.orange, sub:'LOCAL TIME' },
                { label:'CONFIDENCE',     value:`${avgConf}%`, color:C.blue, sub:'AVG ACCURACY' },
                { label:'TREND',          value:trend,     color:trendColor, sub:'24H DIRECTION' },
              ].map((s,i) => (
                <CockpitPanel key={i} accent={s.color} style={{ padding:'14px 16px' }}>
                  <DataTag label={s.label} value={s.value} color={s.color} size="md" />
                  <p style={{ color:`${s.color}30`, fontSize:'7px', letterSpacing:'2px', marginTop:'4px' }}>{s.sub}</p>
                </CockpitPanel>
              ))}
            </div>

            {/* Main chart */}
            <CockpitPanel accent={C.blue} label={`${CODES[zone]} · FORECAST vs ACTUAL · 24H`} style={{ padding:'16px', marginBottom:'14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
                <div style={{ display:'flex', gap:'16px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <div style={{ width:'20px', height:'1px', backgroundColor:C.blue, borderTop:`1px dashed ${C.blue}` }} />
                    <span style={{ color:`${C.blue}60`, fontSize:'8px', letterSpacing:'2px' }}>PREDICTED</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                    <div style={{ width:'20px', height:'2px', backgroundColor:C.green }} />
                    <span style={{ color:`${C.green}60`, fontSize:'8px', letterSpacing:'2px' }}>ACTUAL</span>
                  </div>
                </div>
                <DataTag label="DATA POINTS" value={chartData.length} color={`${C.blue}60`} size="sm" />
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="2 6" stroke={`${C.green}08`} vertical={false} />
                    <XAxis dataKey="time" tick={{ fill:`${C.green}30`, fontSize:8, fontFamily:'Courier New' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill:`${C.green}25`, fontSize:8, fontFamily:'Courier New' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CockpitTooltip />} />
                    <ReferenceLine y={100} stroke={`${C.red}40`} strokeDasharray="4 4" label={{ value:'CRITICAL', fill:`${C.red}50`, fontSize:8, fontFamily:'Courier New' }} />
                    <ReferenceLine y={50}  stroke={`${C.orange}30`} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="predicted" stroke={C.blue} strokeWidth={1.5} dot={false} name="PREDICTED" strokeDasharray="6 3" connectNulls />
                    <Line type="monotone" dataKey="actual"    stroke={C.green} strokeWidth={2}   dot={false} name="ACTUAL"    connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ color:`${C.blue}30`, fontSize:'10px', padding:'40px 0', textAlign:'center', letterSpacing:'3px' }}>
                  NO FORECAST DATA — RUN generate_predictions.py
                </p>
              )}
            </CockpitPanel>

            {/* Prediction table */}
            <CockpitPanel accent={C.orange} label="HOURLY FORECAST TABLE" style={{ padding:'16px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(8,1fr)', gap:'6px' }}>
                {predictions.slice(0,16).map((p,i) => {
                  const val = Math.round(p.predicted_count);
                  const color = val>=100?C.red:val>=50?C.orange:C.green;
                  return (
                    <div key={i} style={{ backgroundColor:`${color}08`, border:`1px solid ${color}20`, padding:'8px', textAlign:'center' }}>
                      <p style={{ color:`${color}50`, fontSize:'7px', letterSpacing:'1px', marginBottom:'4px' }}>{fmt(p.timestamp)}</p>
                      <p style={{ color, fontSize:'14px', fontWeight:'bold', textShadow:`0 0 8px ${color}60` }}>{val}</p>
                    </div>
                  );
                })}
              </div>
            </CockpitPanel>
          </>
        )}
      </div>
    </div>
  );
}