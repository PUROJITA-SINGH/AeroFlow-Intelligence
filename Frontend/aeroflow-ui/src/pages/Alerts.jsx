import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { C, Scanlines, GridBg, CockpitPanel, DataTag, StatusBadge, CockpitCSS } from '../cockpit';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SEV_MAP = {
  Critical:{ color:C.red,    code:'MASTER CAUTION', pulse:true  },
  Warning: { color:C.orange, code:'CAUTION',         pulse:false },
  Info:    { color:C.blue,   code:'ADVISORY',        pulse:false },
};

function MasterCautionPanel({ counts }) {
  const [blink, setBlink] = useState(true);
  useEffect(() => { const id=setInterval(()=>setBlink(b=>!b),600); return ()=>clearInterval(id); }, []);
  return (
    <CockpitPanel accent={C.red} label="MASTER WARNING PANEL" style={{ padding:'16px', marginBottom:'14px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px' }}>
        {[
          { label:'MASTER CAUTION', sublabel:'CRITICAL', count:counts.Critical, color:C.red,    active:counts.Critical>0 },
          { label:'CAUTION',        sublabel:'WARNING',  count:counts.Warning,  color:C.orange, active:counts.Warning>0  },
          { label:'ADVISORY',       sublabel:'INFO',     count:counts.Info,     color:C.blue,   active:counts.Info>0     },
        ].map((w,i) => (
          <div key={i} style={{
            backgroundColor: w.active ? `${w.color}12` : '#000',
            border:`1px solid ${w.active ? w.color : w.color+'20'}`,
            padding:'14px 16px', textAlign:'center',
            boxShadow: w.active ? `0 0 20px ${w.color}20, inset 0 0 20px ${w.color}08` : 'none',
            transition:'all 0.3s',
          }}>
            <p style={{
              color: w.active ? (i===0 && blink ? w.color : w.color) : `${w.color}20`,
              fontSize:'9px', letterSpacing:'3px', marginBottom:'6px',
              textShadow: w.active ? `0 0 10px ${w.color}` : 'none',
              animation: w.active && i===0 ? 'cockpitBlink 0.6s infinite' : 'none',
            }}>{w.label}</p>
            <p style={{ color:w.active?w.color:`${w.color}15`, fontSize:'36px', fontWeight:'bold',
              textShadow: w.active ? `0 0 20px ${w.color}` : 'none' }}>
              {w.count}
            </p>
            <p style={{ color:`${w.color}40`, fontSize:'7px', letterSpacing:'2px', marginTop:'4px' }}>{w.sublabel} ALERTS</p>
          </div>
        ))}
      </div>
    </CockpitPanel>
  );
}

export default function Alerts() {
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg,     setMsg]     = useState('');
  const role  = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  const fetchAlerts = async () => {
    try { const res=await axios.get(`${API}/api/alerts`); setAlerts(res.data); }
    catch(e){ console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchAlerts(); const id=setInterval(fetchAlerts,10000); return ()=>clearInterval(id); }, []);

  const resolveAlert = async (id) => {
    try {
      await axios.post(`${API}/api/alerts/resolve/${id}`,{},{ headers:{ Authorization:`Bearer ${token}` } });
      setMsg('RESOLVED'); fetchAlerts();
    } catch { setMsg('FAILED'); }
    setTimeout(()=>setMsg(''),3000);
  };

  const counts = {
    Critical: alerts.filter(a=>a.severity==='Critical').length,
    Warning:  alerts.filter(a=>a.severity==='Warning').length,
    Info:     alerts.filter(a=>a.severity==='Info').length,
  };

  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',backgroundColor:C.bg }}>
      <p style={{ color:`${C.red}60`,fontFamily:"'Courier New',monospace",letterSpacing:'4px',fontSize:'10px' }}>SCANNING THREATS...</p>
    </div>
  );

  return (
    <div style={{ backgroundColor:C.bg, minHeight:'100vh', position:'relative', fontFamily:"'Courier New',monospace" }}>
      <CockpitCSS /><Scanlines /><GridBg color={C.red} />
      <div style={{ position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', borderBottom:`1px solid ${C.red}15`, paddingBottom:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <p style={{ color:`${C.red}40`, fontSize:'8px', letterSpacing:'4px' }}>INCIDENT MANAGEMENT SYSTEM</p>
            {counts.Critical>0 && <StatusBadge label="MASTER CAUTION ACTIVE" color={C.red} pulse />}
          </div>
          <DataTag label="TOTAL INCIDENTS" value={alerts.length} color={alerts.length>0?C.red:C.green} size="sm" />
        </div>

        {/* Master caution panel */}
        <MasterCautionPanel counts={counts} />

        {/* Toast */}
        {msg && (
          <div style={{ padding:'10px 14px', marginBottom:'14px', border:`1px solid ${msg==='RESOLVED'?C.green:C.red}50`, backgroundColor:`${msg==='RESOLVED'?C.green:C.red}08`, display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ width:'6px',height:'6px',borderRadius:'50%',backgroundColor:msg==='RESOLVED'?C.green:C.red,boxShadow:`0 0 8px ${msg==='RESOLVED'?C.green:C.red}` }} />
            <span style={{ color:msg==='RESOLVED'?C.green:C.red, fontSize:'9px', letterSpacing:'3px' }}>
              {msg==='RESOLVED' ? 'ALERT RESOLVED — SYSTEM UPDATED' : 'RESOLUTION FAILED — RETRY'}
            </span>
          </div>
        )}

        {/* Alert list */}
        {alerts.length === 0 ? (
          <CockpitPanel accent={C.green} style={{ padding:'40px', textAlign:'center' }}>
            <StatusBadge label="ALL SYSTEMS NOMINAL" color={C.green} />
            <p style={{ color:`${C.green}30`, fontSize:'9px', letterSpacing:'2px', marginTop:'12px' }}>NO ACTIVE INCIDENTS DETECTED</p>
          </CockpitPanel>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {alerts.map((alert,idx) => {
              const s = SEV_MAP[alert.severity] || SEV_MAP.Info;
              return (
                <CockpitPanel key={alert.id} accent={s.color} style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px' }}>
                        <StatusBadge label={s.code} color={s.color} pulse={s.pulse} />
                        <span style={{ color:`${s.color}50`, fontSize:'8px', letterSpacing:'2px' }}>
                          {alert.location.toUpperCase()}
                        </span>
                        <span style={{ color:`${C.green}25`, fontSize:'8px', letterSpacing:'1px' }}>
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                        <span style={{ color:`${C.blue}40`, fontSize:'7px', letterSpacing:'1px', marginLeft:'auto' }}>
                          INC-{String(idx+1).padStart(3,'0')}
                        </span>
                      </div>
                      <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'12px', letterSpacing:'1px' }}>
                        {alert.message}
                      </p>
                    </div>
                    {(role==='admin'||role==='operations') && (
                      <button onClick={()=>resolveAlert(alert.id)} style={{
                        marginLeft:'20px', padding:'8px 14px',
                        backgroundColor:`${C.green}08`, border:`1px solid ${C.green}30`,
                        color:C.green, fontSize:'8px', letterSpacing:'3px',
                        cursor:'pointer', fontFamily:"'Courier New',monospace", transition:'all 0.2s',
                      }}
                      onMouseEnter={e=>{e.target.style.backgroundColor=`${C.green}18`;e.target.style.boxShadow=`0 0 10px ${C.green}30`;}}
                      onMouseLeave={e=>{e.target.style.backgroundColor=`${C.green}08`;e.target.style.boxShadow='none';}}
                      >
                        RESOLVE
                      </button>
                    )}
                  </div>
                </CockpitPanel>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}