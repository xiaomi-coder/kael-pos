import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { T, TABS } from './constants';
import * as S from './styles';
import { getToday } from './utils';
import { 
  Dashboard, SalesPage, HistoryPage, WarehousePage, CustomersPage,
  DebtsPage, ExpensesPage, DealersPage, ReportsPage, SettingsPage
} from './pages';

export default function App() {
  const { currentUser, loginUser, loginPass, setLoginUser, setLoginPass, loginError, handleLogin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (!currentUser) {
    return (
      <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ ...S.sCard, width: "100%", maxWidth: 360 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: 0 }}>KAEL POS</h2>
            <p style={{ color: T.textD, fontSize: 13, marginTop: 4 }}>Tizimga kirish</p>
          </div>
          {loginError && <div style={{ background: T.redLight, color: T.red, padding: "10px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16 }}>{loginError}</div>}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: T.textM, marginBottom: 6, fontWeight: 600 }}>Login</label>
            <input style={S.sInput} value={loginUser} onChange={e => setLoginUser(e.target.value)} autoFocus />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, color: T.textM, marginBottom: 6, fontWeight: 600 }}>Parol</label>
            <input type="password" style={S.sInput} value={loginPass} onChange={e => setLoginPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <button style={{ ...S.sBtn, width: "100%", padding: 14 }} onClick={handleLogin}>Kirish</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Inter', sans-serif" }}>
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <div className="desktop-sidebar" style={{ width: 260, background: T.navBg, color: T.navText, display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, " + T.accent + ", " + T.blue + ")", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#fff", fontWeight: 900 }}>K</div>
          <div><div style={{ fontSize: 18, fontWeight: 800, color: "#fff", letterSpacing: "0.5px" }}>KAEL POS</div><div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{currentUser.name}</div></div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {TABS.filter(t => currentUser.role === 'admin' || (currentUser.permissions && currentUser.permissions.includes(t.id))).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: activeTab === t.id ? "rgba(255,255,255,0.1)" : "transparent", color: activeTab === t.id ? "#fff" : T.navText, border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: activeTab === t.id ? 700 : 500, transition: "0.2s" }}>
              <span style={{ fontSize: 18, width: 24, textAlign: "center", color: activeTab === t.id ? T.accentLight : "inherit" }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Main App Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflowY: "auto" }}>
        <div className="main-header" style={{ padding: "16px 32px", background: T.card, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 10 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{TABS.find(t => t.id === activeTab)?.label}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.textM, display: "none" }}>{getToday()}</span> {/* hide today on mobile if tight */}
            <button style={{ ...S.sBtnS, borderColor: T.red, color: T.red, padding: "8px 12px", fontSize: 12 }} onClick={logout}>Chiqish</button>
          </div>
        </div>
        
        <div className="main-content" style={{ padding: 32, flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {activeTab === "dashboard" && <Dashboard setTab={setActiveTab} />}
            {activeTab === "sales" && <SalesPage />}
            {activeTab === "history" && <HistoryPage />}
            {activeTab === "warehouse" && <WarehousePage />}
            {activeTab === "customers" && <CustomersPage />}
            {activeTab === "debts" && <DebtsPage />}
            {activeTab === "expenses" && <ExpensesPage />}
            {activeTab === "dealers" && <DealersPage />}
            {activeTab === "reports" && <ReportsPage />}
            {activeTab === "settings" && <SettingsPage />}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation (Hidden on Desktop) */}
      <div className="mobile-bottom-nav" style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: T.navBg, borderTop: "1px solid rgba(255,255,255,0.1)", zIndex: 50, display: "none", justifyContent: "space-around", padding: "8px 4px", paddingBottom: "calc(8px + env(safe-area-inset-bottom))" }}>
         {TABS.filter(t => currentUser.role === 'admin' || (currentUser.permissions && currentUser.permissions.includes(t.id))).slice(0, 5).map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "transparent", color: activeTab === t.id ? T.accentLight : T.navText, border: "none", padding: "6px 0", cursor: "pointer", transition: "0.2s" }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: activeTab === t.id ? 700 : 500 }}>{t.label.substring(0, 7) + (t.label.length > 7 ? "..." : "")}</span>
            </button>
         ))}
         {/* If they have more than 5 tabs, provide a generic More tab logic or just scroll. For now, max 5 fits well on nav. */}
      </div>

    </div>
  );
}
