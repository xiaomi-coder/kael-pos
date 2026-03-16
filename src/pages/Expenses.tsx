import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import * as S from '../styles';
import { T, EXPENSE_CATEGORIES } from '../constants';
import { Modal, FL } from '../components';
import { fmt, getToday, nowTime } from '../utils';

export const ExpensesPage = () => {
  const { expenses, setExpenses, logActivity } = useStorage();
  const { currentUser } = useAuth();
  
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState({ category: "moshina", amount: "", description: "", date: "" });
  
  const today = getToday();
  const expToday = expenses.filter(e => e.date === today);

  const handleAddExpense = () => {
    if (!expForm.amount) return;
    const cat = EXPENSE_CATEGORIES.find(c => c.id === expForm.category);
    
    setExpenses(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1,
      category: expForm.category, categoryLabel: cat?.label,
      amount: Number(expForm.amount), description: expForm.description,
      date: expForm.date || today, time: nowTime(), user: currentUser?.name || "?"
    }, ...prev]);
    
    logActivity(currentUser?.name || "?", `Xarajat: ${cat?.label} — ${fmt(expForm.amount)}`, expForm.date || today, nowTime());
    setExpForm({ category: "moshina", amount: "", description: "", date: "" }); 
    setShowExpModal(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Xarajatlar</h2>
        <button style={S.sBtn} onClick={() => setShowExpModal(true)}>+ Xarajat qo'shish</button>
      </div>

      <div style={{ ...S.sCard, display: "flex", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: T.textM, fontWeight: 700, textTransform: "uppercase" }}>Jami (Bugun)</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.text }}>{fmt(expToday.reduce((s, e) => s + e.amount, 0))}</div>
        </div>
      </div>

      <div style={{ ...S.sCard, padding: 0, overflow: "hidden" }}>
        <div className="table-responsive-wrapper">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
            <tr style={{ background: T.cardAlt }}>
              {["Sana","Kategoriya","Izoh","Summa","Kim"].map(h => <th key={h} style={{ textAlign: "left", padding: "12px 14px", color: T.textM, fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {expenses.slice(0, 100).map(e => {
              const cat = EXPENSE_CATEGORIES.find(c => c.id === e.category) || EXPENSE_CATEGORIES[6];
              return (
                <tr key={e.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                  <td style={{ padding: "12px 14px", color: T.textD }}>{e.date} {e.time}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${cat.color}15`, color: cat.color, padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {cat.icon} {cat.label}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>{e.description || "—"}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: T.red }}>{fmt(e.amount)}</td>
                  <td style={{ padding: "12px 14px", color: T.textD, fontSize: 11 }}>{e.user}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <Modal show={showExpModal} onClose={() => setShowExpModal(false)} title="Xarajat qo'shish">
        <FL label="Kategoriya">
          <select style={S.sSelect} value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
            {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </FL>
        <FL label="Summa"><input type="number" style={S.sInput} value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} autoFocus /></FL>
        <FL label="Izoh"><input style={S.sInput} value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} /></FL>
        <FL label="Sana"><input type="date" style={S.sInput} value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} /></FL>
        <button style={{ ...S.sBtn, width: "100%", padding: 14, marginTop: 10, borderRadius: 14 }} onClick={handleAddExpense}>Saqlash</button>
      </Modal>
    </div>
  );
};
