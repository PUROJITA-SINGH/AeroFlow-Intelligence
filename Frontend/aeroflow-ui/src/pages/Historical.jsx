import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { C, Scanlines, GridBg, CockpitPanel, DataTag, StatusBadge, CapacityBar, CockpitCSS } from '../cockpit';

const API   = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const ZONES = ['Security Checkpoint','Gate B','Baggage Claim','Check-in'];
const CODES  = { 'Security Checkpoint':'SEC-01','Gate B':'GTE-02','Baggage Claim':'BAG-03','Check-in':'CHK-04' };
const HOURS  = [6,12,24,48,72];

const CockpitTooltip = ({ active, payload, label }) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{ backgroundColor:'#000', border:`1px solid ${C.orange}30`, padding:'10px 14px', fontFamily:"'Courier New',monospace" }}>
      <p style={{ color:`${C.orange}50`, fontSize:'8px', letterSpacing:'2px', marginBottom:'6px' }}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{ color:p.color, fontSize:'12px', marginBottom:'2px' }}>
          {p.name}: <span style={{ color:'white', fontWeight:'bold' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function Historical() {
  const [zone,    setZone]    = useState(ZONES[0]);
  const [hours,   setHours]   = useState(24);
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async (z,h) => {
    setLoading(true);
    try { const res=await axios.get(`${API}/api/history`,{params:{zone:z,hours:h}}); setData(res.data); }
    catch(e){ console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchHistory(zone,hours); }, [zone,hours]);

  const fmt = ts => { const d=new Date(ts); return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:00`; };
  const chartData = data.map(d=>({ time:fmt(d.timestamp), passengers:d.passenger_count, queue:d.queue_length }));

  const counts  = data.map(d=>d.passenger_count);
  const avg     = counts.length ? Math.round(counts.reduce((a,b)=>a+b,0)/counts.length) : 0;
  const peak    = counts.length ? Math.max(...counts) : 0;
  const min     = counts.length ? Math.min(...counts) : 0;
  const stddev  = counts.length ? Math.round(Math.sqrt(counts.reduce((s,v)=>s+Math.pow(v-avg,2),0)/counts.length)) : 0;

  return (
    <div style={{ backgroundColor:C.bg, minHeight:'100vh', position:'relative', fontFamily:"'Courier New',monospace" }}>
      <CockpitCSS /><Scanlines /><GridBg color={C.orange} />
      <div style={{ position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', borderBottom:`1px solid ${C.orange}15`, paddingBottom:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <p style={{ color:`${C.orange}40`, fontSize:'8px', letterSpacing:'4px' }}>TEMPORAL ANALYTICS · FLIGHT DATA RECORDER</p>
            <StatusBadge label="ARCHIVED" color={C.orange} />
          </div>
          <DataTag label="RECORDS" value={data.length} color={C.orange} size="sm" />
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:'16px', marginBottom:'14px', flexWrap:'wrap' }}>
          <div>
            <p style={{ color:`${C.orange}30`, fontSize:'7px', letterSpacing:'3px', marginBottom:'6px' }}>ZONE SELECT</p>
            <div style={{ display:'flex', gap:'4px', flexWrap:'wrap' }}>
              {ZONES.map(z=>(
                <button key={z} onClick={()=>setZone(z)} style={{
                  padding:'6px 12px',
                  backgroundColor: zone===z?`${C.orange}12`:'transparent',
                  border: zone===z?`1px solid ${C.orange}50`:`1px solid ${C.orange}15`,
                  color: zone===z?C.orange:`${C.orange}30`,
                  fontSize:'8px', letterSpacing:'1px', cursor:'pointer',
                  fontFamily:"'Courier New',monospace", transition:'all 0.15s',
                }}>
                  {CODES[z]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ color:`${C.orange}30`, fontSize:'7px', letterSpacing:'3px', marginBottom:'6px' }}>TIME WINDOW</p>
            <div style={{ display:'flex', gap:'4px' }}>
              {HOURS.map(h=>(
                <button key={h} onClick={()=>setHours(h)} style={{
                  padding:'6px 12px',
                  backgroundColor: hours===h?`${C.blue}12`:'transparent',
                  border: hours===h?`1px solid ${C.blue}50`:`1px solid ${C.blue}15`,
                  color: hours===h?C.blue:`${C.blue}30`,
                  fontSize:'8px', letterSpacing:'1px', cursor:'pointer',
                  fontFamily:"'Courier New',monospace", transition:'all 0.15s',
                }}>
                  {h}H
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <p style={{ color:`${C.orange}40`,letterSpacing:'4px',fontSize:'10px',padding:'40px 0' }}>RETRIEVING FLIGHT RECORDS...</p>
        ) : (
          <>
            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'14px' }}>
              {[
                { label:'AVERAGE PAX',  value:avg,        color:C.blue   },
                { label:'PEAK PAX',     value:peak,       color:C.red    },
                { label:'MINIMUM PAX',  value:min,        color:C.green  },
                { label:'STD DEVIATION',value:stddev,     color:C.orange },
              ].map((s,i)=>(
                <CockpitPanel key={i} accent={s.color} style={{ padding:'14px 16px' }}>
                  <DataTag label={s.label} value={s.value} color={s.color} size="lg" />
                </CockpitPanel>
              ))}
            </div>

            {/* Load analysis */}
            <CockpitPanel accent={C.orange} label="ZONE LOAD ANALYSIS" style={{ padding:'14px 16px', marginBottom:'14px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
                <CapacityBar pct={Math.min(100,(avg/150)*100)}  color={C.blue}   label="AVG LOAD" />
                <CapacityBar pct={Math.min(100,(peak/150)*100)} color={C.red}    label="PEAK LOAD" />
                <CapacityBar pct={Math.min(100,(min/150)*100)}  color={C.green}  label="MIN LOAD" />
              </div>
            </CockpitPanel>

            {/* Line chart */}
            <CockpitPanel accent={C.blue} label={`${CODES[zone]} · PAX TREND · LAST ${hours}H`} style={{ padding:'16px', marginBottom:'14px' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="2 6" stroke={`${C.green}08`} vertical={false} />
                    <XAxis dataKey="time" tick={{ fill:`${C.green}25`, fontSize:8, fontFamily:'Courier New' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill:`${C.green}20`, fontSize:8, fontFamily:'Courier New' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CockpitTooltip />} />
                    <ReferenceLine y={100} stroke={`${C.red}40`} strokeDasharray="4 4" />
                    <ReferenceLine y={50}  stroke={`${C.orange}30`} strokeDasharray="4 4" />
                    <ReferenceLine y={avg} stroke={`${C.blue}30`} strokeDasharray="2 4" label={{ value:'AVG', fill:`${C.blue}40`, fontSize:8, fontFamily:'Courier New' }} />
                    <Line type="monotone" dataKey="passengers" stroke={C.blue} strokeWidth={1.5} dot={false} name="PASSENGERS" />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p style={{ color:`${C.orange}30`, textAlign:'center', padding:'40px 0', fontSize:'10px', letterSpacing:'3px' }}>NO RECORDS FOR THIS PERIOD</p>}
            </CockpitPanel>

            {/* Queue bar chart */}
            <CockpitPanel accent={C.orange} label={`${CODES[zone]} · QUEUE LENGTH · LAST ${hours}H`} style={{ padding:'16px' }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={chartData} barSize={4}>
                    <CartesianGrid strokeDasharray="2 6" stroke={`${C.orange}08`} vertical={false} />
                    <XAxis dataKey="time" tick={{ fill:`${C.orange}25`, fontSize:8, fontFamily:'Courier New' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill:`${C.orange}20`, fontSize:8, fontFamily:'Courier New' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CockpitTooltip />} />
                    <Bar dataKey="queue" name="QUEUE (MIN)" radius={[2,2,0,0]}>
                      {chartData.map((_,i)=><Cell key={i} fill={C.orange} opacity={0.7} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </CockpitPanel>
          </>
        )}
      </div>
    </div>
  );
}