import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SysAuth() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in as super creator
  useEffect(() => {
    if (sessionStorage.getItem('is_super_creator') === 'true') {
      navigate('/sys-dashboard-internal');
    }
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login === 'creator' && password === 'xiaomicoder') {
      sessionStorage.setItem('is_super_creator', 'true');
      navigate('/sys-dashboard-internal');
    } else {
      setError(true);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', color: '#fff', fontFamily: 'monospace', m: 0 }}>
      <form onSubmit={handleLogin} style={{ background: '#1e293b', padding: 40, borderRadius: 8, width: 350, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: 30, color: '#38bdf8' }}>SYS_AUTH_PORTAL</h2>
        {error && <div style={{ color: '#ef4444', marginBottom: 15, fontSize: 13, textAlign: 'center' }}>ACCESS DENIED</div>}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#94a3b8' }}>IDENTIFIER</label>
          <input 
            type="text" 
            value={login} 
            onChange={(e) => setLogin(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', outline: 'none', borderRadius: 4, boxSizing: 'border-box' }}
            autoFocus
          />
        </div>
        <div style={{ marginBottom: 30 }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 12, color: '#94a3b8' }}>CREDENTIAL</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid #334155', color: '#fff', outline: 'none', borderRadius: 4, boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: 12, background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer', letterSpacing: 1 }}>
          INITIALIZE
        </button>
      </form>
    </div>
  );
}
