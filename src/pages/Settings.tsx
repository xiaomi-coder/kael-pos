import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import * as S from '../styles';
import { T, TABS } from '../constants';
import { fmt, exportToCSV } from '../utils';
import { IBtn, Modal, FL } from '../components';

export const SettingsPage = () => {
  const { tgBotToken, tgChatId, setTgBotToken, setTgChatId, products, customers, activityLog, resetStorage, users, setUsers } = useStorage();
  const { currentUser, logout } = useAuth();

  const [botTokenInput, setBotTokenInput] = useState(tgBotToken);
  const [chatIdInput, setChatIdInput] = useState(tgChatId);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [userForm, setUserForm] = useState<any>({ login: "", pass: "", name: "", role: "sotuvchi", permissions: [] });

  const saveTg = () => {
    setTgBotToken(botTokenInput);
    setTgChatId(chatIdInput);
    alert("Telegram sozlamalari saqlandi!");
  };

  const exportAllData = () => {
    exportToCSV("mahsulotlar(zaxira).csv", [["ID","Nomi","Birlik","Tannarx","Sotuv Narx","Qoldiq","Min Qoldiq"], ...products.map(p => [p.id, p.name, p.unit, p.cost, p.price, p.stock, p.minStock])]);
    exportToCSV("mijozlar(zaxira).csv", [["ID","Ism","Tel","Manzil","Balans","TelegramChatID"], ...customers.map(c => [c.id, c.name, c.phone, c.address, c.balance, c.tgId||""])]);
  };

  const handleReset = () => {
    const pass = prompt("DIQQAT! Barcha ma'lumotlar o'chadi. Tasdiqlash uchun parolingizni kiriting:");
    if (pass === currentUser?.pass) {
      if (confirm("Haqiqatan ham hamma narsani o'chirasizmi? BU QAYTARIB BO'LMAYDIGAN JARAYON!")) {
        resetStorage();
        alert("Barcha ma'lumotlar tozalandi!");
      }
    } else if (pass) { alert("Parol noto'g'ri!"); }
  };

  const togglePermission = (tabId: string) => {
    setUserForm((prev: any) => ({
      ...prev,
      permissions: prev.permissions.includes(tabId) 
        ? prev.permissions.filter((p: string) => p !== tabId) 
        : [...prev.permissions, tabId]
    }));
  };

  const handleSaveUser = () => {
    if (!userForm.login || !userForm.pass || !userForm.name) return;
    if (editUser && editUser.role === 'admin' && userForm.role !== 'admin') {
      alert("Asosiy admin rolini o'zgartirib bo'lmaydi."); return;
    }
    
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...userForm } : u));
    } else {
      setUsers(prev => [...prev, { id: Math.max(0, ...prev.map(x => x.id)) + 1, ...userForm }]);
    }
    setShowUserModal(false);
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h2 style={{ margin: "0 0 24px", fontSize: 28, fontWeight: 800 }}>Sozlamalar</h2>

      <div style={{ ...S.sCard, marginBottom: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 18, color: T.text }}>Xavfsizlik & Profil</h3>
        <div style={{ background: T.cardAlt, padding: 16, borderRadius: 12, border: `1px solid ${T.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>{currentUser?.name}</div>
            <div style={{ fontSize: 13, color: T.textD }}>Login: {currentUser?.login} • Rol: <span style={{ textTransform: "capitalize", fontWeight: 700, color: T.accent }}>{currentUser?.role}</span></div>
          </div>
          <button style={{ ...S.sBtnS, color: T.red, borderColor: T.red }} onClick={logout}>Tizimdan chiqish</button>
        </div>
      </div>

      {(currentUser?.role === 'admin') && (
        <>
          <div style={{ ...S.sCard, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, color: T.text }}>Foydalanuvchilar va Rollar</h3>
              <button style={S.sBtnS} onClick={() => { setEditUser(null); setUserForm({ login: "", pass: "", name: "", role: "sotuvchi", permissions: ['sales', 'history', 'customers'] }); setShowUserModal(true); }}>+ Yangi xodim</button>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: T.cardAlt }}>
                    <th style={{ textAlign: "left", padding: "12px", color: T.textM }}>F.I.SH</th>
                    <th style={{ textAlign: "left", padding: "12px", color: T.textM }}>Login / Parol</th>
                    <th style={{ textAlign: "left", padding: "12px", color: T.textM }}>Rol</th>
                    <th style={{ textAlign: "left", padding: "12px", color: T.textM }}>Ruxsatlar</th>
                    <th style={{ textAlign: "right", padding: "12px", color: T.textM }}>#</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                      <td style={{ padding: "12px", fontWeight: 700 }}>{u.name}</td>
                      <td style={{ padding: "12px", color: T.textD }}>{u.login} / {u.pass}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ background: u.role === 'admin' ? T.redLight : T.blueLight, color: u.role === 'admin' ? T.red : T.blue, padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: T.textD, fontSize: 11 }}>
                        {u.role === 'admin' ? "Barcha ruxsatlar" : (u.permissions || []).map((p: string) => TABS.find(t=>t.id===p)?.label).join(", ")}
                      </td>
                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <IBtn color={T.blue} onClick={() => { setEditUser(u); setUserForm(u); setShowUserModal(true); }}>✎</IBtn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ ...S.sCard, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}><span style={{ color: T.blue }}>✈</span> Telegram Bot (Xabarnoma)</h3>
            <p style={{ fontSize: 13, color: T.textD, marginBottom: 16 }}>Sotuvlar va qarz to'lovlari haqida Telegram'ga avtomatik xabar yuborish uchun bot tokeni va Asosiy guruh (yoki Admin) Chat ID sini kiriting.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div><label style={{ display: "block", fontSize: 12, color: T.textM, marginBottom: 6, fontWeight: 600 }}>Bot Token</label><input style={S.sInput} value={botTokenInput} onChange={e => setBotTokenInput(e.target.value)} placeholder="Misol: 123456:ABC...zyx57W" /></div>
              <div><label style={{ display: "block", fontSize: 12, color: T.textM, marginBottom: 6, fontWeight: 600 }}>Asosiy Chat ID</label><input style={S.sInput} value={chatIdInput} onChange={e => setChatIdInput(e.target.value)} placeholder="Misol: -1001234567890" /></div>
            </div>
            <button style={S.sBtn} onClick={saveTg}>Saqlash</button>
          </div>

          <div style={{ ...S.sCard, marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, color: T.text }}>Ma'lumotlar Boshqaruvi</h3>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <button style={{ ...S.sBtnS, display: "flex", alignItems: "center", gap: 8 }} onClick={exportAllData}>Zaxira nusxa olish (Excel)</button>
              <button style={{ ...S.sBtnS, color: T.red, borderColor: T.red, display: "flex", alignItems: "center", gap: 8 }} onClick={handleReset}>⚠ Barcha ma'lumotlarni o'chirish</button>
            </div>
            <p style={{ fontSize: 12, color: T.textD, marginTop: 12 }}>Zaxira nusxasi Excel formatida brauzerga yuklab olinadi.</p>
          </div>

          <div style={{ ...S.sCard, padding: 0, overflow: "hidden", marginBottom: 40 }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.borderLight}`, background: T.cardAlt }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Tizim Jurnali (Log) <span style={{ fontSize: 12, color: T.textD, fontWeight: 400 }}>So'nggi 500 ta amal</span></h3>
            </div>
            <div style={{ maxHeight: 300, overflowY: "auto", padding: 14 }}>
              {activityLog.length === 0 ? <p style={{ color: T.textD, textAlign: "center" }}>Jurnal bo'sh</p> : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activityLog.map(l => (
                    <div key={l.id} style={{ fontSize: 12, display: "flex", gap: 10, paddingBottom: 8, borderBottom: `1px dashed ${T.borderLight}` }}>
                      <span style={{ color: T.textD, whiteSpace: "nowrap" }}>{l.date} {l.time}</span>
                      <span style={{ fontWeight: 700, minWidth: 100 }}>{l.user}:</span>
                      <span>{l.action}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Modal show={showUserModal} onClose={() => setShowUserModal(false)} title={editUser ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}>
        <FL label="F.I.SH"><input style={S.sInput} value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} autoFocus /></FL>
        <FL label="Login (Kirish uchun)"><input style={S.sInput} value={userForm.login} onChange={e => setUserForm({ ...userForm, login: e.target.value })} /></FL>
        <FL label="Parol"><input style={S.sInput} value={userForm.pass} onChange={e => setUserForm({ ...userForm, pass: e.target.value })} /></FL>
        
        {editUser?.role !== 'admin' && ( // Don't let them demote the main admin or change admin perms
          <>
            <FL label="Rol">
              <select style={S.sSelect} value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                <option value="sotuvchi">Oddiy Hodim (Sotuvchi, Kassir)</option>
                <option value="admin">Admin (Barcha huquqlar)</option>
              </select>
            </FL>

            {userForm.role !== 'admin' && (
              <FL label="Ruxsat etilgan bo'limlar">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {TABS.map(t => (
                    <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", background: T.cardAlt, padding: "8px 12px", borderRadius: 8 }}>
                      <input 
                        type="checkbox" 
                        checked={(userForm.permissions || []).includes(t.id)} 
                        onChange={() => togglePermission(t.id)} 
                      />
                      <span>{t.icon} {t.label}</span>
                    </label>
                  ))}
                </div>
              </FL>
            )}
          </>
        )}
        
        <button style={{ ...S.sBtn, width: "100%", padding: 14, marginTop: 10, borderRadius: 14 }} onClick={handleSaveUser}>Saqlash</button>
      </Modal>

    </div>
  );
};
