import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { C, Scanlines, GridBg, CockpitPanel, DataTag, StatusBadge, CapacityBar, CockpitCSS } from '../cockpit';

// ── Local analytics tracker ───────────────────────────────
const STORAGE_KEY = 'aeroflow_analytics';

function getAnalytics() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveAnalytics(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
  catch {}
}

export function trackEvent(page, action = 'view') {
  const data     = getAnalytics();
  const today    = new Date().toISOString().split('T')[0];
  const hour     = new Date().getHours();

  // page views
  if (!data.pageViews) data.pageViews = {};
  data.pageViews[page] = (data.pageViews[page] || 0) + 1;

  // daily sessions
  if (!data.daily) data.daily = {};
  if (!data.daily[today]) data.daily[today] = { sessions:0, events:0 };
  data.daily[today].events += 1;

  // hourly
  if (!data.hourly) data.hourly = Array(24).fill(0);
  data.hourly[hour] = (data.hourly[hour] || 0) + 1;

  // actions
  if (!data.actions) data.actions = {};
  const key = `${page}:${action}`;
  data.actions[key] = (data.actions[key] || 0) + 1;

  // session tracking
  if (!data.sessionStart) data.sessionStart = Date.now();
  data.totalEvents = (data.totalEvents || 0) + 1;

  saveAnalytics(data);
}

export function trackSession() {
  const data = getAnalytics();
  const today = new Date().toISOString().split('T')[0];
  if (!data.daily) data.daily = {};
  if (!data.daily[today]) data.daily[today] = { sessions:0, events:0 };
  data.daily[today].sessions += 1;
  data.totalSessions = (data.totalSessions || 0) + 1;
  saveAnalytics(data);
}

// ── Cockpit Tooltip ───────────────────────────────────────
const CockpitTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor:'#000', border:`1px solid ${C.green}30`, padding:'8px 12px', fontFamily:"'Courier New',monospace" }}>
      <p style={{ color:`${C.green}40`, fontSize:'8px', letterSpacing:'2px', marginBottom:'4px' }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color||C.green, fontSize:'12px' }}>
          {p.name}: <span style={{ color:'white', fontWeight:'bold' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Page labels ───────────────────────────────────────────
const PAGE_LABELS = {
  '/live':         'LIVE FEED',
  '/predictions':  'FORECAST',
  '/alerts':       'ALERTS',
  '/historical':   'HISTORY',
  '/model-health': 'MODEL HEALTH',
  '/analytics':    'ANALYTICS',
};

export default function Analytics() {
  const [data,       setData]       = useState({});
  const [sessionTime,setSessionTime]= useState(0);
  const [mounted,    setMounted]    = useState(false);

  const refresh = useCallback(() => {
    setData(getAnalytics());
  }, []);

  useEffect(() => {
    trackEvent('/analytics', 'view');
    refresh();
    setMounted(true);
    const id = setInterval(() => {
      setSessionTime(t => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  // ── Derived metrics ──
  const pageViews    = data.pageViews || {};
  const daily        = data.daily     || {};
  const hourly       = data.hourly    || Array(24).fill(0);
  const totalEvents  = data.totalEvents  || 0;
  const totalSessions= data.totalSessions|| 0;

  const pageViewData = Object.entries(pageViews).map(([page, count]) => ({
    page: PAGE_LABELS[page] || page,
    views: count,
  })).sort((a,b) => b.views - a.views);

  const topPage = pageViewData[0]?.page || '—';

  const dailyData = Object.entries(daily)
    .sort(([a],[b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, d]) => ({
      date: date.slice(5),
      sessions: d.sessions || 0,
      events:   d.events   || 0,
    }));

  const hourlyData = hourly.map((count, h) => ({
    hour: `${String(h).padStart(2,'0')}:00`,
    activity: count,
  }));

  const peakHour = hourly.indexOf(Math.max(...hourly));

  const pieData = pageViewData.slice(0,5).map((p,i) => ({
    name:  p.page,
    value: p.views,
    color: [C.green, C.blue, C.orange, C.red, '#a78bfa'][i],
  }));

  const sessionMin = Math.floor(sessionTime / 60);
  const sessionSec = sessionTime % 60;

  const clearData = () => {
    localStorage.removeItem(STORAGE_KEY);
    refresh();
  };

  return (
    <div style={{ backgroundColor:C.bg, minHeight:'100vh', position:'relative', fontFamily:"'Courier New',monospace" }}>
      <CockpitCSS /><Scanlines /><GridBg color={C.blue} />
      <div style={{ position:'relative', zIndex:1 }}>

        {/* ── Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', borderBottom:`1px solid ${C.blue}15`, paddingBottom:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <p style={{ color:`${C.blue}40`, fontSize:'8px', letterSpacing:'4px' }}>USER ANALYTICS · FLIGHT DATA RECORDER</p>
            <StatusBadge label="TRACKING" color={C.blue} pulse />
          </div>
          <div style={{ display:'flex', gap:'16px', alignItems:'center' }}>
            <DataTag label="SESSION TIME" value={`${String(sessionMin).padStart(2,'0')}:${String(sessionSec).padStart(2,'0')}`} color={C.green} size="sm" />
            <button onClick={clearData} style={{
              padding:'5px 12px', backgroundColor:'transparent',
              border:`1px solid ${C.red}30`, color:`${C.red}50`,
              fontSize:'8px', letterSpacing:'2px', cursor:'pointer',
              fontFamily:"'Courier New',monospace", transition:'all 0.2s',
            }}
            onMouseEnter={e=>{e.target.style.backgroundColor=`${C.red}10`;e.target.style.color=C.red;}}
            onMouseLeave={e=>{e.target.style.backgroundColor='transparent';e.target.style.color=`${C.red}50`;}}
            >
              CLEAR DATA
            </button>
          </div>
        </div>

        {/* ── KPI row ── */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'14px' }}>
          {[
            { label:'TOTAL EVENTS',   value:totalEvents,   color:C.green  },
            { label:'TOTAL SESSIONS', value:totalSessions, color:C.blue   },
            { label:'TOP PAGE',       value:topPage,       color:C.orange },
            { label:'PEAK HOUR',      value:`${String(peakHour).padStart(2,'0')}:00`, color:C.red },
          ].map((s,i) => (
            <CockpitPanel key={i} accent={s.color} style={{ padding:'14px 16px' }}>
              <DataTag label={s.label} value={s.value} color={s.color} size={i===2?'sm':'lg'} />
            </CockpitPanel>
          ))}
        </div>

        {/* ── Page views + Pie ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginBottom:'14px' }}>

          {/* Bar chart — page views */}
          <CockpitPanel accent={C.green} label="PAGE VIEW DISTRIBUTION" style={{ padding:'16px' }}>
            {pageViewData.length > 0 ? (
              <>
                <div style={{ marginBottom:'12px' }}>
                  {pageViewData.map((p,i) => (
                    <div key={i} style={{ marginBottom:'10px' }}>
                      <CapacityBar
                        pct={Math.round((p.views / (pageViewData[0]?.views||1)) * 100)}
                        color={[C.green,C.blue,C.orange,C.red,'#a78bfa'][i%5]}
                        label={p.page}
                      />
                      <p style={{ color:`${C.green}30`, fontSize:'7px', letterSpacing:'1px', marginTop:'2px', textAlign:'right' }}>{p.views} VIEWS</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color:`${C.green}20`, fontSize:'9px', letterSpacing:'3px', padding:'20px 0', textAlign:'center' }}>
                NO PAGE VIEW DATA YET
              </p>
            )}
          </CockpitPanel>

          {/* Pie chart */}
          <CockpitPanel accent={C.blue} label="ENGAGEMENT BREAKDOWN" style={{ padding:'16px' }}>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" stroke="none">
                      {pieData.map((p,i) => <Cell key={i} fill={p.color} opacity={0.8} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor:'#000', border:`1px solid ${C.blue}30`, fontFamily:'Courier New', fontSize:'11px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', justifyContent:'center', marginTop:'8px' }}>
                  {pieData.map((p,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                      <div style={{ width:'8px', height:'8px', backgroundColor:p.color, boxShadow:`0 0 4px ${p.color}` }} />
                      <span style={{ color:`${p.color}80`, fontSize:'7px', letterSpacing:'1px' }}>{p.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ color:`${C.blue}20`, fontSize:'9px', letterSpacing:'3px', padding:'60px 0', textAlign:'center' }}>
                NAVIGATE PAGES TO COLLECT DATA
              </p>
            )}
          </CockpitPanel>
        </div>

        {/* ── Daily trend ── */}
        <CockpitPanel accent={C.orange} label="7-DAY ACTIVITY TREND" style={{ padding:'16px', marginBottom:'14px' }}>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={dailyData} barSize={20}>
                <CartesianGrid strokeDasharray="2 6" stroke={`${C.green}08`} vertical={false} />
                <XAxis dataKey="date" tick={{ fill:`${C.orange}40`, fontSize:8, fontFamily:'Courier New' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:`${C.orange}30`, fontSize:8, fontFamily:'Courier New' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CockpitTooltip />} />
                <Bar dataKey="events" name="EVENTS" fill={C.orange} opacity={0.7} radius={[2,2,0,0]} />
                <Bar dataKey="sessions" name="SESSIONS" fill={C.blue} opacity={0.7} radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ color:`${C.orange}20`, fontSize:'9px', letterSpacing:'3px', padding:'40px 0', textAlign:'center' }}>
              USE THE DASHBOARD TO COLLECT ACTIVITY DATA
            </p>
          )}
        </CockpitPanel>

        {/* ── Hourly heatmap ── */}
        <CockpitPanel accent={C.green} label="24H ACTIVITY HEATMAP" style={{ padding:'16px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(24,1fr)', gap:'3px' }}>
            {hourlyData.map((h,i) => {
              const max   = Math.max(...hourlyData.map(d=>d.activity), 1);
              const pct   = h.activity / max;
              const color = pct > 0.7 ? C.red : pct > 0.4 ? C.orange : pct > 0.1 ? C.green : `${C.green}15`;
              return (
                <div key={i} title={`${h.hour}: ${h.activity} events`} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'3px' }}>
                  <div style={{
                    width:'100%', height:`${Math.max(4, pct*60)}px`,
                    backgroundColor: color,
                    boxShadow: pct > 0.1 ? `0 0 4px ${color}60` : 'none',
                    transition:'all 0.3s',
                    minHeight:'4px',
                  }} />
                  <span style={{ color:`${C.green}25`, fontSize:'6px', writingMode:'vertical-rl', transform:'rotate(180deg)' }}>
                    {i%6===0 ? h.hour : ''}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display:'flex', gap:'16px', justifyContent:'flex-end', marginTop:'10px' }}>
            {[
              { label:'LOW',    color:C.green  },
              { label:'MEDIUM', color:C.orange },
              { label:'HIGH',   color:C.red    },
            ].map((l,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                <div style={{ width:'10px', height:'10px', backgroundColor:l.color, opacity:0.7 }} />
                <span style={{ color:`${l.color}50`, fontSize:'7px', letterSpacing:'2px' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </CockpitPanel>

      </div>
    </div>
  );
}