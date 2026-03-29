import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { C, Scanlines, GridBg, CockpitPanel, DataTag, StatusBadge, CapacityBar, MiniRadar, CockpitCSS } from '../cockpit';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const RADAR_DATA = [
  { metric:'ACCURACY',    Prophet:88, RandomForest:85, IsolationForest:92 },
  { metric:'SPEED',       Prophet:70, RandomForest:95, IsolationForest:90 },
  { metric:'RELIABILITY', Prophet:85, RandomForest:90, IsolationForest:88 },
  { metric:'COVERAGE',    Prophet:95, RandomForest:80, IsolationForest:75 },
  { metric:'ROBUSTNESS',  Prophet:80, RandomForest:88, IsolationForest:95 },
];

export default function ModelHealth() {
  const [alerts,      setAlerts]      = useState([]);
  const [live,        setLive]        = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/api/alerts`),
      axios.get(`${API}/api/live`),
      axios.get(`${API}/api/predictions`),
    ]).then(([a,l,p])=>{ setAlerts(a.data);setLive(l.data);setPredictions(p.data); })
      .catch(console.error).finally(()=>setLoading(false));
  }, []);

  const models = [
    { code:'MDL-01', name:'PROPHET',          icon:'◈', type:'TIME SERIES FORECASTING', algorithm:'Facebook Prophet',
      input:'Historical counts + timestamps', output:'24-hour per-zone forecast',
      accuracy:88, rmse:'35–44 PAX/hr', trained:'7-day simulated data',
      status:predictions.length>0?'ONLINE':'STANDBY',
      statusColor:predictions.length>0?C.green:C.orange, color:C.blue },
    { code:'MDL-02', name:'RANDOM FOREST',    icon:'◍', type:'CONGESTION CLASSIFIER',   algorithm:'Random Forest Classifier',
      input:'hour, day_of_week, is_weekend, rolling_mean', output:'Low / Medium / High label',
      accuracy:85, rmse:'N/A (Classification)', trained:'7-day simulated data',
      status:live.length>0?'ONLINE':'STANDBY',
      statusColor:live.length>0?C.green:C.orange, color:C.green },
    { code:'MDL-03', name:'ISOLATION FOREST', icon:'◬', type:'ANOMALY DETECTION',        algorithm:'Isolation Forest',
      input:'passenger_count, queue_length, hour, rolling_mean', output:'Anomaly score (−1/+1)',
      accuracy:92, rmse:'N/A (Detection)', trained:'7-day simulated data',
      status:'ONLINE', statusColor:C.green, color:C.orange },
  ];

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',backgroundColor:C.bg }}>
      <p style={{ color:`${C.green}50`,fontFamily:"'Courier New',monospace",letterSpacing:'4px',fontSize:'10px' }}>LOADING AI SYSTEMS...</p>
    </div>
  );

  return (
    <div style={{ backgroundColor:C.bg, minHeight:'100vh', position:'relative', fontFamily:"'Courier New',monospace" }}>
      <CockpitCSS /><Scanlines /><GridBg color={C.green} />
      <div style={{ position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', borderBottom:`1px solid ${C.green}15`, paddingBottom:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <p style={{ color:`${C.green}40`, fontSize:'8px', letterSpacing:'4px' }}>FLIGHT MANAGEMENT COMPUTER · AI SUBSYSTEMS</p>
            <StatusBadge label="3/3 ONLINE" color={C.green} />
          </div>
          <div style={{ display:'flex', gap:'16px' }}>
            <DataTag label="PREDICTIONS" value={predictions.length} color={C.blue}   size="sm" />
            <DataTag label="INCIDENTS"   value={alerts.length}      color={alerts.length>0?C.red:C.green} size="sm" />
          </div>
        </div>

        {/* System summary row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'14px' }}>
          {[
            { label:'MODELS ONLINE',    value:'3 / 3',          color:C.green  },
            { label:'PREDICTIONS MADE', value:predictions.length, color:C.blue  },
            { label:'ALERTS GENERATED', value:alerts.length,     color:alerts.length>0?C.red:C.green },
          ].map((s,i)=>(
            <CockpitPanel key={i} accent={s.color} style={{ padding:'14px 16px' }}>
              <DataTag label={s.label} value={s.value} color={s.color} size="lg" />
            </CockpitPanel>
          ))}
        </div>

        {/* Model cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'14px' }}>
          {models.map((m,i)=>(
            <CockpitPanel key={i} accent={m.color} label={`${m.code} · ${m.name}`} style={{ padding:'16px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'auto 1fr auto', gap:'20px', alignItems:'start' }}>

                {/* mini radar */}
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
                  <MiniRadar size={60} color={m.color} />
                  <StatusBadge label={m.status} color={m.statusColor} pulse={m.status==='ONLINE'} />
                </div>

                {/* specs grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                  {[
                    { k:'TYPE',      v:m.type      },
                    { k:'ALGORITHM', v:m.algorithm  },
                    { k:'TRAINED',   v:m.trained    },
                    { k:'INPUT',     v:m.input      },
                    { k:'OUTPUT',    v:m.output     },
                    { k:'ERROR',     v:m.rmse       },
                  ].map((d,j)=>(
                    <div key={j} style={{ backgroundColor:'#000', border:`1px solid ${m.color}15`, padding:'8px 10px' }}>
                      <p style={{ color:`${m.color}40`, fontSize:'7px', letterSpacing:'2px', marginBottom:'4px' }}>{d.k}</p>
                      <p style={{ color:'rgba(255,255,255,0.6)', fontSize:'10px', lineHeight:1.4 }}>{d.v}</p>
                    </div>
                  ))}
                </div>

                {/* accuracy */}
                <div style={{ minWidth:'120px' }}>
                  <DataTag label="ACCURACY" value={`${m.accuracy}%`} color={m.color} size="xl" />
                  <div style={{ marginTop:'12px' }}>
                    <CapacityBar pct={m.accuracy} color={m.color} label="PERFORMANCE" />
                  </div>
                </div>
              </div>
            </CockpitPanel>
          ))}
        </div>

        {/* Radar chart */}
        <CockpitPanel accent={C.green} label="COMPARATIVE PERFORMANCE RADAR" style={{ padding:'16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:'20px', alignItems:'center' }}>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={RADAR_DATA}>
                <PolarGrid stroke={`${C.green}12`} />
                <PolarAngleAxis dataKey="metric" tick={{ fill:`${C.green}40`, fontSize:8, fontFamily:'Courier New', letterSpacing:2 }} />
                <Radar name="Prophet"          dataKey="Prophet"         stroke={C.blue}   fill={C.blue}   fillOpacity={0.08} strokeWidth={1.5} />
                <Radar name="Random Forest"    dataKey="RandomForest"    stroke={C.green}  fill={C.green}  fillOpacity={0.08} strokeWidth={1.5} />
                <Radar name="Isolation Forest" dataKey="IsolationForest" stroke={C.orange} fill={C.orange} fillOpacity={0.08} strokeWidth={1.5} />
                <Tooltip contentStyle={{ backgroundColor:'#000', border:`1px solid ${C.green}30`, fontFamily:'Courier New', fontSize:'11px' }} />
              </RadarChart>
            </ResponsiveContainer>

            {/* legend + individual scores */}
            <div style={{ display:'flex', flexDirection:'column', gap:'12px', minWidth:'160px' }}>
              {[
                { name:'MDL-01 PROPHET',    color:C.blue,   score:88 },
                { name:'MDL-02 RND FOREST', color:C.green,  score:85 },
                { name:'MDL-03 ISO FOREST', color:C.orange, score:92 },
              ].map((l,i)=>(
                <div key={i}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                    <div style={{ width:'16px', height:'2px', backgroundColor:l.color, boxShadow:`0 0 4px ${l.color}` }} />
                    <span style={{ color:`${l.color}60`, fontSize:'7px', letterSpacing:'2px' }}>{l.name}</span>
                  </div>
                  <CapacityBar pct={l.score} color={l.color} label="SCORE" />
                </div>
              ))}
            </div>
          </div>
        </CockpitPanel>
      </div>
    </div>
  );
}