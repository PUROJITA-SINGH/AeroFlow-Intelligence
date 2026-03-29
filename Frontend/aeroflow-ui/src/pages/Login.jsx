import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/* ── Animated Radar with HUD reticles ── */
function RadarCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx    = canvas.getContext('2d');
    let angle    = 0, raf;
    const blips  = Array.from({ length: 8 }, () => ({
      r: 30 + Math.random() * 100,
      a: Math.random() * Math.PI * 2,
      life: 0,
    }));

    function draw() {
      const W  = canvas.width  = canvas.offsetWidth;
      const H  = canvas.height = canvas.offsetHeight;
      const cx = W / 2, cy = H / 2;
      const R  = Math.min(W, H) * 0.44;

      ctx.clearRect(0, 0, W, H);

      // amber glow background
      const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      bgGrad.addColorStop(0,   'rgba(180,100,0,0.08)');
      bgGrad.addColorStop(0.7, 'rgba(120,60,0,0.04)');
      bgGrad.addColorStop(1,   'transparent');
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = bgGrad; ctx.fill();

      // rings
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (R / 4) * i, 0, Math.PI * 2);
        ctx.strokeStyle = i === 4 ? 'rgba(255,160,0,0.35)' : 'rgba(255,140,0,0.15)';
        ctx.lineWidth   = i === 4 ? 1.5 : 1;
        ctx.stroke();
      }

      // crosshairs
      ctx.strokeStyle = 'rgba(255,140,0,0.2)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();
      ctx.setLineDash([]);

      // ── HUD reticle corners ──
      const corners = [[-1,-1],[1,-1],[1,1],[-1,1]];
      const reticleR = R * 1.05;
      ctx.strokeStyle = 'rgba(255,180,0,0.6)';
      ctx.lineWidth   = 1.5;
      corners.forEach(([sx, sy]) => {
        const x = cx + sx * reticleR * 0.707;
        const y = cy + sy * reticleR * 0.707;
        const len = 14;
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + sx * len, y);
        ctx.moveTo(x, y); ctx.lineTo(x, y + sy * len);
        ctx.stroke();
      });

      // ── HUD diamond center reticle ──
      const dSize = 10;
      ctx.strokeStyle = 'rgba(255,200,0,0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx,        cy - dSize);
      ctx.lineTo(cx + dSize, cy);
      ctx.lineTo(cx,        cy + dSize);
      ctx.lineTo(cx - dSize, cy);
      ctx.closePath();
      ctx.stroke();

      // ── HUD tick marks on outer ring ──
      ctx.strokeStyle = 'rgba(255,160,0,0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 36; i++) {
        const a    = (i / 36) * Math.PI * 2;
        const len  = i % 9 === 0 ? 10 : i % 3 === 0 ? 6 : 3;
        const r1   = R - len;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R,  cy + Math.sin(a) * R);
        ctx.lineTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
        ctx.stroke();
      }

      // degree labels at cardinal points
      ctx.fillStyle = 'rgba(255,180,0,0.5)';
      ctx.font      = '9px Courier New';
      ctx.textAlign = 'center';
      [['N',0],['E',90],['S',180],['W',270]].forEach(([label, deg]) => {
        const a  = (deg - 90) * Math.PI / 180;
        const lR = R + 14;
        ctx.fillText(label, cx + Math.cos(a) * lR, cy + Math.sin(a) * lR + 3);
      });

      // sweep
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const grad = ctx.createLinearGradient(0, 0, R, 0);
      grad.addColorStop(0,   'rgba(255,160,0,0.5)');
      grad.addColorStop(0.4, 'rgba(255,120,0,0.15)');
      grad.addColorStop(1,   'rgba(255,100,0,0)');
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, R, -0.5, 0.5);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.restore();

      // sweep line
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(R, 0);
      ctx.strokeStyle = 'rgba(255,200,0,0.8)';
      ctx.lineWidth   = 1.5;
      ctx.stroke();
      ctx.restore();

      // blips
      blips.forEach(b => {
        const da = ((angle % (Math.PI * 2)) - b.a + Math.PI * 4) % (Math.PI * 2);
        if (da < 0.15) b.life = 1;
        if (b.life > 0) {
          const bx = cx + Math.cos(b.a) * b.r;
          const by = cy + Math.sin(b.a) * b.r;
          // blip cross
          ctx.strokeStyle = `rgba(255,220,0,${b.life})`;
          ctx.lineWidth   = 1;
          ctx.beginPath(); ctx.moveTo(bx-4,by); ctx.lineTo(bx+4,by); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(bx,by-4); ctx.lineTo(bx,by+4); ctx.stroke();
          // glow
          ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,200,0,${b.life * 0.9})`; ctx.fill();
          // ring decay
          ctx.beginPath(); ctx.arc(bx, by, 10 * (1 - b.life), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,180,0,${b.life * 0.4})`; ctx.lineWidth = 1; ctx.stroke();
          b.life = Math.max(0, b.life - 0.006);
        }
      });

      // center
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,200,0,0.9)'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,180,0,0.3)'; ctx.lineWidth = 1; ctx.stroke();

      angle += 0.010;
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} style={{ width: '100%', height: '100%' }} />;
}

/* ── Amber indicator light ── */
function IndicatorLight({ label, active, color = '#f59e0b' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
      <div style={{
        width: '12px', height: '12px', borderRadius: '50%',
        backgroundColor: active ? color : 'rgba(255,255,255,0.05)',
        boxShadow: active ? `0 0 10px ${color}, 0 0 20px ${color}60` : 'none',
        border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
        transition: 'all 0.3s',
      }} />
      <span style={{ color: 'rgba(255,180,0,0.4)', fontSize: '7px', letterSpacing: '1px' }}>{label}</span>
    </div>
  );
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [mounted,  setMounted]  = useState(false);
  const [tick,     setTick]     = useState(0);
  const navigate = useNavigate();

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  // flicker tick for cockpit feel
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleLogin = async () => {
    if (!username || !password) { setError('FIELD INPUT REQUIRED'); return; }
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${API}/api/login`, { username, password });
      localStorage.setItem('token',    res.data.access_token);
      localStorage.setItem('role',     res.data.role);
      localStorage.setItem('username', username);
      navigate('/live');
    } catch { setError('AUTH FAILURE — INVALID CREDENTIALS'); }
    setLoading(false);
  };

  const now = new Date();
  const timeStr = now.toTimeString().slice(0,8);
  const dateStr = now.toLocaleDateString('en-GB').replace(/\//g,'.');

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      backgroundColor: '#0a0700',
      fontFamily: "'Courier New', monospace",
      overflow: 'hidden', position: 'relative',
    }}>
      {/* ── scanline overlay ── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
      }} />

      {/* ── subtle amber grid ── */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(255,140,0,0.03) 1px,transparent 1px), linear-gradient(90deg,rgba(255,140,0,0.03) 1px,transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* ── top status bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '36px', zIndex: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid rgba(255,140,0,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
        opacity: mounted ? 1 : 0, transition: 'opacity 1s ease 0.3s',
      }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,160,0,0.6)', fontSize: '9px', letterSpacing: '3px' }}>AEROFLOW IDS v1.0</span>
          <span style={{ color: 'rgba(255,140,0,0.3)', fontSize: '9px' }}>|</span>
          <span style={{ color: 'rgba(255,160,0,0.4)', fontSize: '9px', letterSpacing: '2px' }}>TERMINAL AUTH UNIT</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,180,0,0.5)', fontSize: '9px', letterSpacing: '2px' }}>{dateStr}</span>
          <span style={{ color: 'rgba(255,200,0,0.7)', fontSize: '9px', letterSpacing: '3px', fontWeight: 'bold' }}>{timeStr}</span>
        </div>
      </div>

      {/* ── indicator lights row ── */}
      <div style={{
        position: 'absolute', top: '44px', left: 0, right: 0, zIndex: 20,
        display: 'flex', justifyContent: 'center', gap: '20px',
        padding: '8px 0',
        opacity: mounted ? 1 : 0, transition: 'opacity 1s ease 0.5s',
      }}>
        {[
          { label: 'PWR',   active: true,    color: '#22c55e' },
          { label: 'SYS',   active: true,    color: '#f59e0b' },
          { label: 'NET',   active: true,    color: '#22c55e' },
          { label: 'AUTH',  active: loading, color: '#f59e0b' },
          { label: 'ALERT', active: tick%3===0, color: '#ef4444' },
          { label: 'RDY',   active: !loading,color: '#22c55e' },
        ].map((l, i) => <IndicatorLight key={i} {...l} />)}
      </div>

      {/* ── left panel — radar ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 40px 40px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateX(-24px)',
        transition: 'all 0.9s ease',
      }}>
        {/* radar housing */}
        <div style={{
          position: 'relative',
          width: '320px', height: '320px',
        }}>
          {/* outer bezel */}
          <div style={{
            position: 'absolute', inset: '-12px',
            borderRadius: '50%',
            border: '2px solid rgba(255,140,0,0.25)',
            boxShadow: '0 0 30px rgba(255,100,0,0.08), inset 0 0 20px rgba(0,0,0,0.8)',
          }} />
          {/* inner bezel */}
          <div style={{
            position: 'absolute', inset: '-4px',
            borderRadius: '50%',
            border: '1px solid rgba(255,140,0,0.15)',
          }} />
          {/* screen */}
          <div style={{
            width: '100%', height: '100%',
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#030200',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.9)',
          }}>
            <RadarCanvas />
          </div>
          {/* screen glare */}
          <div style={{
            position: 'absolute', top: '8%', left: '20%',
            width: '30%', height: '20%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.04), transparent)',
            transform: 'rotate(-30deg)',
            pointerEvents: 'none',
          }} />

          {/* HUD corner brackets on radar */}
          {[
            { top:'-2px',  left:'-2px',  borderTop:'2px solid rgba(255,180,0,0.6)', borderLeft:'2px solid rgba(255,180,0,0.6)', width:'20px', height:'20px' },
            { top:'-2px',  right:'-2px', borderTop:'2px solid rgba(255,180,0,0.6)', borderRight:'2px solid rgba(255,180,0,0.6)', width:'20px', height:'20px' },
            { bottom:'-2px',left:'-2px', borderBottom:'2px solid rgba(255,180,0,0.6)', borderLeft:'2px solid rgba(255,180,0,0.6)', width:'20px', height:'20px' },
            { bottom:'-2px',right:'-2px',borderBottom:'2px solid rgba(255,180,0,0.6)', borderRight:'2px solid rgba(255,180,0,0.6)', width:'20px', height:'20px' },
          ].map((s,i) => <div key={i} style={{ position:'absolute', ...s }} />)}
        </div>

        {/* gauge row below radar */}
        <div style={{ display: 'flex', gap: '20px', marginTop: '28px' }}>
          {[
            { label: 'SECTORS', value: '04' },
            { label: 'SENSORS', value: '24' },
            { label: 'RANGE',   value: '5NM' },
          ].map((g, i) => (
            <div key={i} style={{
              backgroundColor: 'rgba(0,0,0,0.6)',
              border: '1px solid rgba(255,140,0,0.2)',
              borderRadius: '3px', padding: '10px 16px', textAlign: 'center',
              minWidth: '70px',
            }}>
              <p style={{ color: 'rgba(255,180,0,0.4)', fontSize: '7px', letterSpacing: '2px', marginBottom: '4px' }}>{g.label}</p>
              <p style={{ color: '#f59e0b', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>{g.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── divider ── */}
      <div style={{
        width: '1px', margin: '80px 0 20px',
        background: 'linear-gradient(to bottom, transparent, rgba(255,140,0,0.3) 30%, rgba(255,140,0,0.3) 70%, transparent)',
      }} />

      {/* ── right panel — login form ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 40px 40px',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateX(24px)',
        transition: 'all 0.9s ease 0.15s',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>

          {/* ── panel header ── */}
          <div style={{ marginBottom: '32px' }}>
            {/* HUD top bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ flex:1, height:'1px', background:'linear-gradient(to right,transparent,rgba(255,140,0,0.5))' }} />
              <span style={{ color:'rgba(255,180,0,0.5)', fontSize:'8px', letterSpacing:'4px' }}>IDENT VERIFICATION</span>
              <div style={{ flex:1, height:'1px', background:'linear-gradient(to left,transparent,rgba(255,140,0,0.5))' }} />
            </div>

            <p style={{ color:'rgba(255,160,0,0.5)', fontSize:'9px', letterSpacing:'5px', marginBottom:'10px' }}>
              ✈ AEROFLOW INTELLIGENCE
            </p>
            <h1 style={{ fontSize:'34px', fontWeight:'bold', color:'#f59e0b', letterSpacing:'2px', lineHeight:1, margin:0, textShadow:'0 0 20px rgba(245,158,11,0.4)' }}>
              COCKPIT<br />
              <span style={{ color:'rgba(255,200,100,0.6)', fontSize:'22px', letterSpacing:'4px' }}>ACCESS CTRL</span>
            </h1>
            <div style={{ display:'flex', gap:'4px', marginTop:'12px' }}>
              {Array.from({length:20}).map((_,i) => (
                <div key={i} style={{ flex:1, height:'2px', backgroundColor: i < 14 ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.06)', borderRadius:'1px' }} />
              ))}
            </div>
          </div>

          {/* ── error ── */}
          {error && (
            <div style={{
              padding:'10px 14px', marginBottom:'20px',
              border:'1px solid rgba(239,68,68,0.5)',
              backgroundColor:'rgba(239,68,68,0.08)',
              borderRadius:'3px',
              display:'flex', alignItems:'center', gap:'10px',
            }}>
              <div style={{ width:'8px', height:'8px', borderRadius:'50%', backgroundColor:'#ef4444', boxShadow:'0 0 8px #ef4444', flexShrink:0 }} />
              <span style={{ color:'#ef4444', fontSize:'10px', letterSpacing:'2px' }}>{error}</span>
            </div>
          )}

          {/* ── input fields ── */}
          {[
            { label:'OPERATOR CALLSIGN', val:username, set:setUsername, type:'text',     ph:'_____________' },
            { label:'SECURITY PASSCODE', val:password, set:setPassword, type:'password', ph:'_____________' },
          ].map(({ label, val, set, type, ph }, i) => (
            <div key={i} style={{ marginBottom:'20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                <label style={{ fontSize:'8px', letterSpacing:'3px', color:'rgba(255,160,0,0.5)' }}>{label}</label>
                <span style={{ fontSize:'8px', color: val ? 'rgba(34,197,94,0.6)' : 'rgba(255,100,0,0.4)', letterSpacing:'1px' }}>
                  {val ? '● ENTERED' : '○ EMPTY'}
                </span>
              </div>
              {/* input with cockpit frame */}
              <div style={{ position:'relative' }}>
                {/* corner ticks */}
                {[
                  { top:0, left:0,   borderTop:'1px solid rgba(255,160,0,0.5)', borderLeft:'1px solid rgba(255,160,0,0.5)',   width:'8px', height:'8px' },
                  { top:0, right:0,  borderTop:'1px solid rgba(255,160,0,0.5)', borderRight:'1px solid rgba(255,160,0,0.5)',  width:'8px', height:'8px' },
                  { bottom:0,left:0, borderBottom:'1px solid rgba(255,160,0,0.5)',borderLeft:'1px solid rgba(255,160,0,0.5)', width:'8px', height:'8px' },
                  { bottom:0,right:0,borderBottom:'1px solid rgba(255,160,0,0.5)',borderRight:'1px solid rgba(255,160,0,0.5)',width:'8px', height:'8px' },
                ].map((s,j) => <div key={j} style={{ position:'absolute', ...s }} />)}
                <input
                  type={type} placeholder={ph} value={val}
                  onChange={e => set(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{
                    width:'100%', padding:'11px 16px',
                    backgroundColor:'rgba(255,140,0,0.04)',
                    border:'1px solid rgba(255,140,0,0.2)',
                    color:'#f59e0b', fontSize:'14px',
                    fontFamily:"'Courier New',monospace",
                    outline:'none', boxSizing:'border-box',
                    letterSpacing:'2px',
                    transition:'all 0.2s',
                  }}
                  onFocus={e => { e.target.style.borderColor='rgba(255,180,0,0.6)'; e.target.style.backgroundColor='rgba(255,140,0,0.08)'; e.target.style.boxShadow='0 0 12px rgba(255,140,0,0.1)'; }}
                  onBlur={e  => { e.target.style.borderColor='rgba(255,140,0,0.2)'; e.target.style.backgroundColor='rgba(255,140,0,0.04)'; e.target.style.boxShadow='none'; }}
                />
              </div>
            </div>
          ))}

          {/* ── authenticate button ── */}
          <button
            onClick={handleLogin} disabled={loading}
            style={{
              width:'100%', padding:'13px',
              backgroundColor: loading ? 'rgba(255,140,0,0.08)' : 'rgba(255,140,0,0.12)',
              border:'1px solid rgba(255,160,0,0.5)',
              color: loading ? 'rgba(255,180,0,0.4)' : '#f59e0b',
              fontSize:'11px', fontFamily:"'Courier New',monospace",
              fontWeight:'bold', letterSpacing:'5px', textTransform:'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition:'all 0.2s', position:'relative', overflow:'hidden',
              boxShadow: loading ? 'none' : '0 0 16px rgba(255,140,0,0.08)',
            }}
            onMouseEnter={e => { if(!loading){ e.target.style.backgroundColor='rgba(255,140,0,0.22)'; e.target.style.boxShadow='0 0 24px rgba(255,140,0,0.2)'; e.target.style.color='#fbbf24'; }}}
            onMouseLeave={e => { e.target.style.backgroundColor='rgba(255,140,0,0.12)'; e.target.style.boxShadow='0 0 16px rgba(255,140,0,0.08)'; e.target.style.color='#f59e0b'; }}
          >
            {loading ? '[ VERIFYING... ]' : '[ INITIATE SEQUENCE ]'}
          </button>

          {/* ── bottom status strip ── */}
          <div style={{ marginTop:'24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <div style={{ width:'5px', height:'5px', borderRadius:'50%', backgroundColor:'#22c55e', boxShadow:'0 0 6px #22c55e', animation:'pulse 2s infinite' }} />
              <span style={{ color:'rgba(255,180,0,0.3)', fontSize:'8px', letterSpacing:'2px' }}>SYSTEMS NOMINAL</span>
            </div>
            <span style={{ color:'rgba(255,180,0,0.2)', fontSize:'8px', letterSpacing:'1px' }}>REV 1.0.0</span>
          </div>

          <p style={{ marginTop:'12px', color:'rgba(255,180,0,0.15)', fontSize:'8px', letterSpacing:'2px', textAlign:'center' }}>
            UNAUTHORISED ACCESS IS A CRIMINAL OFFENCE
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  );
}