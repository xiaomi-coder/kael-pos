import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import * as S from '../styles';
import { T } from '../constants';
import { IBtn, Modal, FL, StatementModal } from '../components';
import { fmt } from '../utils';

export const CustomersPage = () => {
  const { customers, setCustomers, sales, logActivity } = useStorage();
  
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCust, setEditCust] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", tgId: "", balance: "" });
  const [showCustStatement, setShowCustStatement] = useState<any>(null);

  const filtered = search ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)) : customers;

  // Calculate Top Customers
  const custTotals = sales.reduce((acc: any, s) => {
    if (!acc[s.customerId]) acc[s.customerId] = 0;
    acc[s.customerId] += s.total;
    return acc;
  }, {});

  const topCustomers = customers
    .map(c => ({ ...c, totalSpent: custTotals[c.id] || 0 }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)
    .filter(c => c.totalSpent > 0);

  const handleSave = () => {
    if (!form.name || !form.phone) return;
    const debt = Number(form.balance) || 0;
    if (editCust) {
      setCustomers(prev => prev.map(c => c.id === editCust.id ? { ...c, name: form.name, phone: form.phone, address: form.address, tgId: form.tgId, balance: -debt } : c));
      logActivity("Tizim", `Mijoz tahrirlandi: ${form.name}`, "", "");
      setEditCust(null);
    } else {
      setCustomers(prev => [...prev, { id: Math.max(0, ...prev.map(x => x.id)) + 1, name: form.name, phone: form.phone, address: form.address, tgId: form.tgId, balance: -debt }]);
      logActivity("Tizim", `Yangi mijoz: ${form.name}`, "", "");
    }
    setForm({ name: "", phone: "", address: "", tgId: "", balance: "" }); 
    setShowModal(false);
  };

  const startEdit = (c: any) => { setForm({ name: c.name, phone: c.phone, address: c.address, tgId: c.tgId || "", balance: c.balance < 0 ? String(Math.abs(c.balance)) : "" }); setEditCust(c); setShowModal(true); };
  const handleDelete = (id: number) => { 
    if (confirm("Rostdan o'chirasizmi?")) { 
      setCustomers(prev => prev.filter(c => c.id !== id)); 
      logActivity("Tizim", "Mijoz o'chirildi", "", ""); 
    } 
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Mijozlar</h2>
        <button style={S.sBtn} onClick={() => { setEditCust(null); setForm({ name: "", phone: "", address: "", tgId: "", balance: "" }); setShowModal(true); }}>+ Yangi mijoz</button>
      </div>

      {/* Top 10 Customers Section */}
      {topCustomers.length > 0 && !search && (
        <div style={{ ...S.sCard, marginBottom: 24, padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: T.accentDark, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🏆</span> Eng faol mijozlar (TOP 10)
          </h3>
          <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8, msOverflowStyle: "none", scrollbarWidth: "none" }}>
            {topCustomers.map((c, i) => (
              <div key={c.id} style={{ minWidth: 200, padding: 14, background: i === 0 ? T.accentLight : i === 1 ? T.blueLight : i === 2 ? T.greenLight : T.cardAlt, border: `1px solid ${i === 0 ? T.accent : i === 1 ? T.blue : i === 2 ? T.green : T.border}`, borderRadius: 16 }}>
                <div style={{ fontSize: 24, fontWeight: 900, color: i === 0 ? T.accent : i === 1 ? T.blue : i === 2 ? T.green : T.textM, opacity: 0.8, marginBottom: 6 }}>#{i+1}</div>
                <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: T.textD, marginTop: 4 }}>Jami xaridi:</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginTop: 2 }}>{fmt(c.totalSpent)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <input style={{ ...S.sInput, maxWidth: 350, flex: 1 }} placeholder="Mijoz qidirish..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {filtered.map(c => (
          <div key={c.id} style={{ ...S.sCard, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: T.textD }}>{c.phone} • {c.address || "Manzil kiritilmagan"}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <IBtn color={T.blue} onClick={() => startEdit(c)}>✎</IBtn>
                <IBtn color={T.red} onClick={() => handleDelete(c.id)}>✕</IBtn>
              </div>
            </div>
            <div style={{ background: c.balance < 0 ? T.redLight : T.cardAlt, padding: "12px 14px", borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${c.balance < 0 ? T.red+"30" : T.borderLight}` }}>
              <div>
                <div style={{ fontSize: 11, color: T.textM, fontWeight: 600, textTransform: "uppercase" }}>Joriy Hisob</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: c.balance < 0 ? T.red : T.text }}>{fmt(Math.abs(c.balance))} so'm</div>
              </div>
              <button style={{ ...S.sBtnS, background: T.card, fontSize: 11, padding: "6px 14px", alignSelf: "center", borderColor: T.border }} onClick={() => setShowCustStatement(c)}>
                Sverka
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal show={showModal} onClose={() => { setShowModal(false); setEditCust(null); }} title={editCust ? "Mijozni tahrirlash" : "Yangi mijoz"}>
        <FL label="F.I.SH"><input style={S.sInput} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus /></FL>
        <FL label="Telefon"><input style={S.sInput} placeholder="+998..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></FL>
        <FL label="Manzil"><input style={S.sInput} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></FL>
        <FL label="Joriy qarzi (so'm)"><input type="number" style={S.sInput} placeholder="Oldindan qarzi bo'lsa kiriting" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} /></FL>
        <FL label="Telegram Chat ID"><input style={S.sInput} placeholder="Misol: 123456789" value={form.tgId} onChange={e => setForm({ ...form, tgId: e.target.value })} /></FL>
        <button style={{ ...S.sBtn, width: "100%", padding: 14, marginTop: 10, borderRadius: 14 }} onClick={handleSave}>{editCust ? "Saqlash" : "Qo'shish"}</button>
      </Modal>

      <StatementModal 
        show={!!showCustStatement} 
        onClose={() => setShowCustStatement(null)} 
        customer={showCustStatement} 
        sales={sales} 
      />
    </div>
  );
};
