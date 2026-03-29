import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { C, MiniRadar, CockpitCSS } from '../cockpit';

const LINKS = [
  { path:'/live',         code:'SYS-01', label:'LIVE FEED',    color:C.green  },
  { path:'/predictions',  code:'SYS-02', label:'FORECAST',     color:C.blue   },
  { path:'/alerts',       code:'SYS-03', label:'ALERTS',       color:C.red    },
  { path:'/historical',   code:'SYS-04', label:'HISTORY',      color:C.orange },
  { path:'/model-health', code:'SYS-05', label:'MODEL HEALTH', color:C.green  },
];

const ROLE_COLOR = { admin:C.red, operations:C.orange, viewer:C.green };

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const role      = localStorage.getItem('role')     || 'viewer';
  const username  = localStorage.getItem('username') || 'OPERATOR';
  const [time,    setTime]    = useState('');
  const [tick,    setTick]    = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toTimeString().slice(0,8));
      setTick(t => t+1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const roleColor = ROLE_COLOR[role] || C.green;

  const logout = () => { localStorage.clear(); navigate('/login'); };

  return (
    <>
      <CockpitCSS />
      <nav style={{
        position:'fixed', top:0, left:0,
        width:'220px', height:'100vh',
        backgroundColor:C.bg,
        borderRight:`1px solid ${C.green}20`,
        display:'flex', flexDirection:'column',
        fontFamily:"'Courier New',monospace",
        zIndex:100, overflow:'hidden',
      }}>
        {/* scanlines on nav */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.06) 3px,rgba(0,0,0,0.06) 4px)'
        }} />

        {/* ── Brand ── */}
        <div style={{ padding:'16px 16px 12px', borderBottom:`1px solid ${C.green}15`, position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            <MiniRadar size={40} color={C.green} />
            <div>
              <p style={{ color:`${C.green}60`, fontSize:'7px', letterSpacing:'3px', marginBottom:'2px' }}>✈ AEROFLOW</p>
              <p style={{ color:C.green, fontSize:'11px', fontWeight:'bold', letterSpacing:'2px', textShadow:`0 0 8px ${C.green}60` }}>INTELLIGENCE</p>
            </div>
          </div>
          {/* clock */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ color:`${C.green}40`, fontSize:'7px', letterSpacing:'1px' }}>UTC+05:30</span>
            <span style={{ color:C.green, fontSize:'11px', fontWeight:'bold', letterSpacing:'2px', textShadow:`0 0 6px ${C.green}` }}>{time}</span>
          </div>
          {/* live pulse bar */}
          <div style={{ display:'flex', gap:'2px', marginTop:'8px' }}>
            {Array.from({length:18}).map((_,i) => (
              <div key={i} style={{ flex:1, height:'2px',
                backgroundColor: (tick+i)%5===0 ? C.green : `${C.green}20`,
                transition:'background-color 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* ── System status lights ── */}
        <div style={{ padding:'10px 16px', borderBottom:`1px solid ${C.green}10`, display:'flex', justifyContent:'space-between' }}>
          {[
            { label:'PWR', color:C.green,  on:true },
            { label:'NET', color:C.green,  on:true },
            { label:'DB',  color:C.green,  on:true },
            { label:'AI',  color:C.blue,   on:true },
            { label:'ALT', color:C.red,    on:tick%4===0 },
          ].map((l,i) => (
            <div key={i} style={{ textAlign:'center' }}>
              <div style={{
                width:'8px', height:'8px', borderRadius:'50%', margin:'0 auto 3px',
                backgroundColor: l.on ? l.color : `${l.color}15`,
                boxShadow: l.on ? `0 0 8px ${l.color}` : 'none',
                border:`1px solid ${l.color}40`,
                transition:'all 0.3s',
              }} />
              <span style={{ color:`${l.color}40`, fontSize:'6px', letterSpacing:'1px' }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* ── Nav links ── */}
        <div style={{ flex:1, padding:'8px 0', overflowY:'auto' }}>
          {LINKS.map(({ path, code, label, color }) => {
            const active = location.pathname === path || (path==='/live' && location.pathname==='/');
            return (
              <button key={path} onClick={() => navigate(path)} style={{
                width:'100%', padding:'10px 16px',
                display:'flex', alignItems:'center', gap:'10px',
                backgroundColor: active ? `${color}10` : 'transparent',
                border:'none',
                borderLeft: active ? `2px solid ${color}` : '2px solid transparent',
                cursor:'pointer', textAlign:'left', transition:'all 0.15s',
              }}
              onMouseEnter={e => { if(!active) e.currentTarget.style.backgroundColor=`${color}08`; }}
              onMouseLeave={e => { if(!active) e.currentTarget.style.backgroundColor='transparent'; }}
              >
                {/* active indicator */}
                <div style={{
                  width:'6px', height:'6px', borderRadius:'50%',
                  backgroundColor: active ? color : `${color}20`,
                  boxShadow: active ? `0 0 8px ${color}` : 'none',
                  flexShrink:0,
                }} />
                <div style={{ flex:1 }}>
                  <p style={{ color:`${color}40`, fontSize:'7px', letterSpacing:'2px', marginBottom:'1px' }}>{code}</p>
                  <p style={{ color: active ? color : `${color}50`, fontSize:'10px', letterSpacing:'2px', fontWeight: active?'bold':'normal', textShadow: active?`0 0 6px ${color}`:'none' }}>{label}</p>
                </div>
                {active && (
                  <div style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width:'3px', height:'3px', backgroundColor:`${color}60` }} />)}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* ── User panel ── */}
        <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.green}10` }}>
          {/* role bar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px' }}>
            <div>
              <p style={{ color:`${C.green}30`, fontSize:'7px', letterSpacing:'2px', marginBottom:'2px' }}>OPERATOR</p>
              <p style={{ color:C.green, fontSize:'10px', letterSpacing:'2px' }}>{username.toUpperCase()}</p>
            </div>
            <span style={{ padding:'2px 8px', backgroundColor:`${roleColor}12`, border:`1px solid ${roleColor}30`, color:roleColor, fontSize:'7px', letterSpacing:'2px' }}>
              {role.toUpperCase()}
            </span>
          </div>

          <button onClick={logout} style={{
            width:'100%', padding:'7px',
            backgroundColor:'transparent',
            border:`1px solid ${C.red}20`,
            color:`${C.red}40`, fontSize:'8px', letterSpacing:'3px',
            cursor:'pointer', fontFamily:"'Courier New',monospace", transition:'all 0.2s',
          }}
          onMouseEnter={e => { e.target.style.backgroundColor=`${C.red}10`; e.target.style.color=C.red; e.target.style.borderColor=`${C.red}50`; }}
          onMouseLeave={e => { e.target.style.backgroundColor='transparent'; e.target.style.color=`${C.red}40`; e.target.style.borderColor=`${C.red}20`; }}
          >
            LOGOUT
          </button>

          <p style={{ color:`${C.green}15`, fontSize:'7px', letterSpacing:'1px', textAlign:'center', marginTop:'8px' }}>
            AEROFLOW IDS v1.0.0
          </p>
        </div>
      </nav>
    </>
  );
}