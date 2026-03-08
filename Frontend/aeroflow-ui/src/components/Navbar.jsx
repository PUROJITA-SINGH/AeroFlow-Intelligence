import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const navStyle = {
  width: '220px', height: '100vh',
  backgroundColor: '#1e293b', position: 'fixed',
  top: 0, left: 0, padding: '20px',
  display: 'flex', flexDirection: 'column',
  borderRight: '1px solid #334155'
};

const links = [
  { to: '/live',         label: '📡 Live Overview'  },
  { to: '/predictions',  label: '🔮 Predictions'    },
  { to: '/alerts',       label: '🚨 Alerts'         },
  { to: '/historical',   label: '📊 Historical'     },
  { to: '/model-health', label: '🤖 Model Health'   },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div style={navStyle}>
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ color: '#38bdf8', fontSize: '18px', fontWeight: 'bold' }}>
          ✈️ AeroFlow
        </h2>
        <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
          {localStorage.getItem('username')} · {localStorage.getItem('role')}
        </p>
      </div>

      {links.map((link) => {
        const isActive = location.pathname === link.to;
        return (
          <Link
            key={link.to}
            to={link.to}
            style={{
              display: 'block', padding: '12px 16px',
              marginBottom: '8px', borderRadius: '8px',
              color:           isActive ? 'white'    : '#94a3b8',
              backgroundColor: isActive ? '#0ea5e9'  : 'transparent',
              textDecoration: 'none', fontSize: '14px',
              fontWeight:      isActive ? 'bold'     : 'normal',
              transition: 'all 0.2s'
            }}
          >
            {link.label}
          </Link>
        );
      })}

      <div style={{ marginTop: 'auto' }}>
        <div style={{
          padding: '10px', marginBottom: '12px',
          backgroundColor: '#0f172a', borderRadius: '8px',
          border: '1px solid #334155'
        }}>
          <p style={{ color: '#64748b', fontSize: '11px' }}>Logged in as</p>
          <p style={{ color: 'white',   fontSize: '13px', fontWeight: 'bold' }}>
            {localStorage.getItem('username')}
          </p>
          <p style={{ color: '#0ea5e9', fontSize: '11px' }}>
            {localStorage.getItem('role')}
          </p>
        </div>
        <button onClick={logout} style={{
          width: '100%', padding: '10px',
          backgroundColor: '#dc2626', color: 'white',
          border: 'none', borderRadius: '8px',
          cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
        }}>
          Logout
        </button>
      </div>
    </div>
  );
}