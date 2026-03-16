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
  
  const today = getToday();
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState({ category: "moshina", amount: "", description: "", date: today });
  
  // Date Filters (default 1 month)
  const d30 = new Date(); d30.setDate(d30.getDate() - 30);
  const [fromDate, setFromDate] = useState(d30.toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(today);

  const filteredExp = expenses.filter(e => e.date >= fromDate && e.date <= toDate);
  const totalFiltered = filteredExp.reduce((s, e) => s + e.amount, 0);

  // Group by category
  const catSummary = filteredExp.reduce((acc: any, e) => {
    if (!acc[e.category]) acc[e.category] = 0;
    acc[e.category] += e.amount;
    return acc;
  }, {});

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
    setExpForm({ category: "moshina", amount: "", description: "", date: today }); 
    setShowExpModal(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Xarajatlar</h2>
        
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", background: T.card, padding: "4px 8px", borderRadius: 12, border: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 18 }}>📅</span>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ ...S.sInput, border: "none", background: "transparent", padding: "4px 2px", width: 110, fontSize: 13 }} />
            <span style={{ color: T.textD }}>—</span>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ ...S.sInput, border: "none", background: "transparent", padding: "4px 2px", width: 110, fontSize: 13 }} />
          </div>
          <button style={S.sBtn} onClick={() => { setExpForm({...expForm, date: today}); setShowExpModal(true); }}>+ Xarajat qo'shish</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 20 }}>
        <div style={{ ...S.sCard, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 12, color: T.textM, fontWeight: 700, textTransform: "uppercase" }}>Tanlangan davrdagi Jami Xarajat</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: T.red, marginTop: 4 }}>{fmt(totalFiltered)}</div>
        </div>

        {Object.keys(catSummary).length > 0 && (
          <div style={{ ...S.sCard }}>
            <div style={{ fontSize: 12, color: T.textM, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>Kategoriyalar bo'yicha</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {Object.keys(catSummary).sort((a,b) => catSummary[b] - catSummary[a]).map(catId => {
                const c = EXPENSE_CATEGORIES.find(x => x.id === catId);
                if(!c) return null;
                return (
                  <div key={catId} style={{ display: "flex", alignItems: "center", gap: 6, background: `${c.color}15`, padding: "6px 10px", borderRadius: 8, fontSize: 12 }}>
                    <span>{c.icon}</span><span style={{ fontWeight: 600, color: c.color }}>{c.label}:</span> <span style={{ fontWeight: 800 }}>{fmt(catSummary[catId])}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
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
            {filteredExp.map(e => {
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
            {filteredExp.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: T.textD }}>Ushbu davrda xarajatlar yo'q</td></tr>}
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
