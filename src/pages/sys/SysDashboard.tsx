import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function SysDashboard() {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [dbSize, setDbSize] = useState<number>(0);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('is_super_creator') === 'true') {
      setIsAuthorized(true);
      fetchDbSize();
    } else {
      setIsAuthorized(false);
    }
  }, []);

  const fetchDbSize = async () => {
    try {
      const { data, error } = await supabase.rpc('get_database_size');
      if (data !== null && !error) {
        setDbSize(Number(data));
      } else {
        console.error('RPC Error:', error);
      }
    } catch (err) {
      console.error('Failed to fetch DB size', err);
    }
  };

  const handleBackup = async () => {
    setIsExporting(true);
    try {
      const tables = ['users', 'products', 'customers', 'sales', 'expenses', 'dealers', 'dealer_txns', 'activity_log', 'settings'];
      const promises = tables.map(t => supabase.from(t).select('*'));
      
      const results = await Promise.all(promises);
      
      const backupData: any = {};
      tables.forEach((t, i) => {
        if (results[i].error) {
          console.error(`Error fetching table ${t}:`, results[i].error);
        }
        backupData[t] = results[i].data || [];
      });

      backupData['_metadata'] = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        tablesCount: tables.length
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const fileName = `pos_full_backup_${dd}_${mm}_${yyyy}.json`;

      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Backup failed", err);
      alert('Backup jarayonida xatolik yuz berdi. Konsolni tekshiring.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isAuthorized === null) return null;

  if (isAuthorized === false) {
    // 404 Route Guard implementation
    return (
      <div style={{ textAlign: 'center', padding: '150px 20px', fontFamily: 'sans-serif', backgroundColor: '#fff', color: '#333', minHeight: '100vh', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: 72, fontWeight: 'bold', margin: '0 0 20px 0' }}>404</h1>
        <p style={{ fontSize: 24, margin: '0 0 10px 0' }}>Not Found</p>
        <p style={{ color: '#666' }}>The requested resource could not be found on this server.</p>
      </div>
    );
  }

  const MAX_SIZE = 500;
  const percentage = Math.min((dbSize / MAX_SIZE) * 100, 100);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: 40, fontFamily: 'monospace', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: 20, marginBottom: 30 }}>
          <h1 style={{ color: '#38bdf8', margin: 0, fontSize: 24 }}>SYS_INTERNAL_DASHBOARD</h1>
          <button 
            onClick={() => {
              sessionStorage.removeItem('is_super_creator');
              window.location.href = '/';
            }}
            style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
          >
            TERMINATE_SESSION
          </button>
        </div>

        <div style={{ background: '#1e293b', padding: 30, borderRadius: 8, marginBottom: 30, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: 16 }}>DATABASE_STORAGE_MONITOR</h3>
          
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
            <span>Ishlatilgan: {dbSize} MB / {MAX_SIZE} MB</span>
            <span style={{ color: percentage > 90 ? '#ef4444' : percentage > 70 ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>
              {percentage.toFixed(2)}%
            </span>
          </div>
          
          <div style={{ width: '100%', height: 16, backgroundColor: '#0f172a', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ 
              width: `${percentage}%`, 
              height: '100%', 
              backgroundColor: percentage > 90 ? '#ef4444' : percentage > 70 ? '#f59e0b' : '#10b981',
              transition: 'width 1s ease-in-out'
            }} />
          </div>
        </div>

        <div style={{ background: '#1e293b', padding: 30, borderRadius: 8, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#94a3b8', fontSize: 16 }}>BACKUP_SYSTEM</h3>
          <p style={{ fontSize: 14, color: '#cbd5e1', marginBottom: 24, lineHeight: 1.6 }}>
            Triggering manual backup will fetch all existing records from primary tables (users, products, customers, sales, expenses, dealers, dealer_txns, activity_log, settings) via Promise.all and compile them into a singular JSON artifact.
          </p>
          
          <button 
            onClick={handleBackup}
            disabled={isExporting}
            style={{ 
              background: '#0ea5e9', 
              color: '#fff', 
              border: 'none', 
              padding: '14px 28px', 
              borderRadius: 6, 
              fontSize: 16,
              fontWeight: 'bold', 
              cursor: isExporting ? 'not-allowed' : 'pointer',
              opacity: isExporting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              width: '100%'
            }}
          >
            {isExporting ? 'FETCHING_DATA_FROM_SUPABASE...' : 'EXECUTE MANUAL BACKUP'}
          </button>
        </div>
      </div>
    </div>
  );
}
