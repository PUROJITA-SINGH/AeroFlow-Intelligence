// ── AeroFlow Cockpit Design System ────────────────────────
// Shared tokens, colors, and reusable micro-components
// Import from any page: import { C, CockpitPanel, DataTag, ... } from '../cockpit'

import React, { useEffect, useRef } from 'react';

// ── Color palette ─────────────────────────────────────────
export const C = {
  black:    '#000000',
  bg:       '#030500',
  bgPanel:  '#060a04',
  bgInner:  '#0a0f08',
  green:    '#00ff41',
  greenDim: '#00c832',
  greenFaint:'rgba(0,255,65,0.15)',
  blue:     '#00cfff',
  blueDim:  '#0099cc',
  blueFaint:'rgba(0,207,255,0.12)',
  orange:   '#ff8c00',
  orangeDim:'#cc6600',
  orangeFaint:'rgba(255,140,0,0.12)',
  red:      '#ff2020',
  redDim:   '#cc1a1a',
  redFaint: 'rgba(255,32,32,0.12)',
  white:    'rgba(255,255,255,0.85)',
  dim:      'rgba(255,255,255,0.3)',
  faint:    'rgba(255,255,255,0.1)',
  border:   'rgba(0,255,65,0.15)',
  borderB:  'rgba(0,207,255,0.15)',
  borderO:  'rgba(255,140,0,0.2)',
};

// ── Scanline overlay ──────────────────────────────────────
export function Scanlines() {
  return (
    <div style={{
      position:'fixed', inset:0, pointerEvents:'none', zIndex:9999,
      backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px)',
    }} />
  );
}

// ── Grid background ───────────────────────────────────────
export function GridBg({ color = C.green }) {
  return (
    <div style={{
      position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
      backgroundImage:`linear-gradient(${color}08 1px,transparent 1px),linear-gradient(90deg,${color}08 1px,transparent 1px)`,
      backgroundSize:'28px 28px',
    }} />
  );
}

// ── Cockpit Panel ─────────────────────────────────────────
export function CockpitPanel({ children, style = {}, accent = C.green, label, topRight }) {
  return (
    <div style={{
      backgroundColor: C.bgPanel,
      border: `1px solid ${accent}30`,
      borderTop: `2px solid ${accent}`,
      position: 'relative',
      ...style,
    }}>
      {/* corner brackets */}
      {[
        { top:0,    left:0,  borderTop:`1px solid ${accent}80`, borderLeft:`1px solid ${accent}80`  },
        { top:0,    right:0, borderTop:`1px solid ${accent}80`, borderRight:`1px solid ${accent}80` },
        { bottom:0, left:0,  borderBottom:`1px solid ${accent}80`, borderLeft:`1px solid ${accent}80`  },
        { bottom:0, right:0, borderBottom:`1px solid ${accent}80`, borderRight:`1px solid ${accent}80` },
      ].map((s,i) => (
        <div key={i} style={{ position:'absolute', width:'8px', height:'8px', ...s }} />
      ))}

      {label && (
        <div style={{
          position:'absolute', top:'-1px', left:'16px',
          backgroundColor: C.bgPanel,
          padding:'0 8px',
          color:`${accent}90`, fontSize:'8px', letterSpacing:'3px',
          transform:'translateY(-50%)',
        }}>
          {label}
        </div>
      )}
      {topRight && (
        <div style={{
          position:'absolute', top:'8px', right:'12px',
          color:`${accent}60`, fontSize:'8px', letterSpacing:'2px',
        }}>
          {topRight}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Data Tag (label + value pair) ─────────────────────────
export function DataTag({ label, value, color = C.green, size = 'md' }) {
  const sizes = { sm:{ val:'12px', lbl:'7px' }, md:{ val:'20px', lbl:'8px' }, lg:{ val:'28px', lbl:'9px' }, xl:{ val:'40px', lbl:'9px' } };
  const s = sizes[size] || sizes.md;
  return (
    <div>
      <div style={{ color:`${color}60`, fontSize:s.lbl, letterSpacing:'3px', marginBottom:'3px', fontFamily:"'Courier New',monospace" }}>{label}</div>
      <div style={{ color, fontSize:s.val, fontWeight:'bold', fontFamily:"'Courier New',monospace", textShadow:`0 0 10px ${color}60` }}>{value}</div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────
export function StatusBadge({ label, color = C.green, pulse = false }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'6px',
      padding:'3px 10px',
      backgroundColor:`${color}12`,
      border:`1px solid ${color}40`,
      fontSize:'8px', letterSpacing:'3px', color,
      fontFamily:"'Courier New',monospace",
    }}>
      <span style={{
        width:'5px', height:'5px', borderRadius:'50%',
        backgroundColor:color, boxShadow:`0 0 6px ${color}`,
        ...(pulse ? { animation:'cockpitPulse 1.5s infinite' } : {}),
      }} />
      {label}
    </span>
  );
}

// ── Capacity Bar ──────────────────────────────────────────
export function CapacityBar({ pct, color = C.green, label = 'LOAD' }) {
  const segments = 20;
  const filled   = Math.round((pct / 100) * segments);
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'4px' }}>
        <span style={{ color:`${color}60`, fontSize:'7px', letterSpacing:'2px', fontFamily:"'Courier New',monospace" }}>{label}</span>
        <span style={{ color, fontSize:'7px', letterSpacing:'1px', fontFamily:"'Courier New',monospace" }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ display:'flex', gap:'2px' }}>
        {Array.from({length:segments}).map((_,i) => (
          <div key={i} style={{
            flex:1, height:'6px',
            backgroundColor: i < filled ? color : `${color}15`,
            boxShadow: i < filled ? `0 0 4px ${color}80` : 'none',
            transition:'all 0.3s',
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Mini Radar (reusable, smaller) ───────────────────────
export function MiniRadar({ size = 80, color = C.green }) {
  const ref   = useRef(null);
  const animRef = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx    = canvas.getContext('2d');
    let angle    = 0;
    const blips  = Array.from({length:4}, () => ({ r:10+Math.random()*28, a:Math.random()*Math.PI*2, life:0 }));
    function draw() {
      canvas.width = canvas.height = size * window.devicePixelRatio;
      canvas.style.width  = size + 'px';
      canvas.style.height = size + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      const cx = size/2, cy = size/2, R = size*0.42;
      ctx.clearRect(0,0,size,size);
      for(let i=1;i<=3;i++){
        ctx.beginPath(); ctx.arc(cx,cy,(R/3)*i,0,Math.PI*2);
        ctx.strokeStyle=`${color}18`; ctx.lineWidth=1; ctx.stroke();
      }
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(angle);
      const g=ctx.createLinearGradient(0,0,R,0);
      g.addColorStop(0,`${color}80`); g.addColorStop(1,`${color}00`);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.arc(0,0,R,-0.4,0.4); ctx.closePath();
      ctx.fillStyle=g; ctx.fill(); ctx.restore();
      blips.forEach(b=>{
        const da=((angle%(Math.PI*2))-b.a+Math.PI*4)%(Math.PI*2);
        if(da<0.2) b.life=1;
        if(b.life>0){
          const bx=cx+Math.cos(b.a)*b.r, by=cy+Math.sin(b.a)*b.r;
          ctx.beginPath(); ctx.arc(bx,by,2,0,Math.PI*2);
          ctx.fillStyle=`${color}${Math.round(b.life*255).toString(16).padStart(2,'0')}`; ctx.fill();
          b.life=Math.max(0,b.life-0.012);
        }
      });
      ctx.beginPath(); ctx.arc(cx,cy,2,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
      angle+=0.014;
      animRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [size, color]);
  return <canvas ref={ref} style={{ width:size, height:size }} />;
}

// ── Global cockpit CSS ────────────────────────────────────
export const CockpitCSS = () => (
  <style>{`
    @keyframes cockpitPulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
    @keyframes cockpitBlink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
    @keyframes cockpitScan  { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
    * { box-sizing:border-box; }
    ::-webkit-scrollbar { width:4px; }
    ::-webkit-scrollbar-track { background:#000; }
    ::-webkit-scrollbar-thumb { background:rgba(0,255,65,0.3); }
    input::placeholder { color:rgba(0,255,65,0.2); }
    select option { background:#060a04; color:#00ff41; }
  `}</style>
);