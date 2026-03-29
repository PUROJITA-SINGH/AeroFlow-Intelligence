import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/api/login`, { username, password });
      localStorage.setItem('token',    res.data.access_token);
      localStorage.setItem('role',     res.data.role);
      localStorage.setItem('username', username);
      navigate('/live');
    } catch (err) {
      setError('Invalid username or password');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: '#0f172a'
    }}>
      <div style={{
        backgroundColor: '#1e293b', padding: '40px',
        borderRadius: '16px', width: '400px',
        border: '1px solid #334155'
      }}>
        <h1 style={{ color: '#38bdf8', marginBottom: '8px', fontSize: '28px' }}>✈️ AeroFlow</h1>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>AI-Powered Airport Operations</p>

        {error && <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>}

        <input
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            width: '100%', padding: '12px', marginBottom: '16px',
            backgroundColor: '#0f172a', border: '1px solid #334155',
            borderRadius: '8px', color: 'white', fontSize: '14px'
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%', padding: '12px', marginBottom: '24px',
            backgroundColor: '#0f172a', border: '1px solid #334155',
            borderRadius: '8px', color: 'white', fontSize: '14px'
          }}
        />
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            backgroundColor: '#0ea5e9', color: 'white',
            border: 'none', borderRadius: '8px',
            fontSize: '16px', cursor: 'pointer', fontWeight: 'bold'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>
    </div>
  );
}