import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import * as S from '../styles';
import { T } from '../constants';
import { Badge, Modal, FL, StatementModal } from '../components';
import { fmt, getToday, nowTime, sendTelegram } from '../utils';

export const DebtsPage = () => {
  const { customers, setCustomers, sales, setSales, logActivity, tgBotToken, tgChatId } = useStorage();
  const { currentUser } = useAuth();
  
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ customerId: "", amount: "" });
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [addDebtForm, setAddDebtForm] = useState({ customerId: "", amount: "", description: "" });
  const [showCustStatement, setShowCustStatement] = useState<any>(null);

  const debtors = customers.filter(c => c.balance < 0);
  const totalDebt = debtors.reduce((s, c) => s + Math.abs(c.balance), 0);

  const handlePay = () => {
    const custId = Number(payForm.customerId);
    const amt = Number(payForm.amount);
    if (!custId || amt <= 0) return;
    
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;

    const today = getToday();
    const time = nowTime();

    setCustomers(prev => prev.map(c => c.id === custId ? { ...c, balance: c.balance + amt } : c));
    setSales(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1, date: today, time,
      productId: 0, productName: "Qarz to'lovi", customerId: custId, customerName: cust.name,
      qty: 1, price: amt, unitPrice: amt, cost: 0, discount: 0, total: amt, profit: 0,
      paidAmount: amt, debtAmount: 0, payType: "naqd", user: "Tizim"
    }, ...prev]);
    
    logActivity("Tizim", `Qarz to'landi: ${cust.name} — ${fmt(amt)}`, today, time);
    sendTelegram(tgBotToken, tgChatId, `💸 <b>QARZ TO'LOVI</b>\n\nMijoz: <b>${cust.name}</b>\nTo'lov: <b>${fmt(amt)} so'm</b>\nQolgan qarz: ${fmt(Math.abs(cust.balance + amt))} so'm`);
    
    setPayForm({ customerId: "", amount: "" }); 
    setShowPayModal(false);
  };

  const handleAddDebt = () => {
    const custId = Number(addDebtForm.customerId);
    const amt = Number(addDebtForm.amount);
    if (!custId || amt <= 0) return;

    const cust = customers.find(c => c.id === custId);
    if (!cust) return;

    const today = getToday();
    const time = nowTime();
    const desc = addDebtForm.description || "Qo'lda kiritilgan qarz";

    setCustomers(prev => prev.map(c => c.id === custId ? { ...c, balance: c.balance - amt } : c));
    setSales(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1, date: today, time,
      productId: 0, productName: desc, customerId: custId, customerName: cust.name,
      qty: 1, price: amt, unitPrice: amt, cost: 0, discount: 0, total: amt, profit: 0,
      paidAmount: 0, debtAmount: amt, payType: "qarz", user: currentUser?.name || "Tizim"
    }, ...prev]);

    logActivity(currentUser?.name || "Tizim", `Qarz qo'shildi: ${cust.name} — ${fmt(amt)} (${desc})`, today, time);
    sendTelegram(tgBotToken, tgChatId, `🔴 <b>YANGI QARZ</b>\n\nMijoz: <b>${cust.name}</b>\nSumma: <b>${fmt(amt)} so'm</b>\nIzoh: ${desc}\nUmumiy qarz: ${fmt(Math.abs(cust.balance - amt))} so'm`);

    setAddDebtForm({ customerId: "", amount: "", description: "" });
    setShowAddDebtModal(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Qarzlar daftar</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...S.sBtnS, background: "#f59e0b", color: "#fff", border: "none", fontWeight: 700 }} onClick={() => { setAddDebtForm({ customerId: "", amount: "", description: "" }); setShowAddDebtModal(true); }}>+ Qarz qo'shish</button>
          <button style={S.sBtnG} onClick={() => { setPayForm({ customerId: "", amount: "" }); setShowPayModal(true); }}>Qarz qabul qilish</button>
        </div>
      </div>
      
      <div style={{ ...S.sCard, marginBottom: 20, background: T.redLight, borderLeft: `6px solid ${T.red}` }}>
        <div style={{ fontSize: 13, color: T.red, fontWeight: 700, textTransform: "uppercase" }}>Jami Olinadigan Qarzlar</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: T.red }}>{fmt(totalDebt)} so'm</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {debtors.map(c => (
          <div key={c.id} style={{ ...S.sCard, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${T.red}30` }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.text, marginBottom: 2 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: T.textD, marginBottom: 6 }}>{c.phone}</div>
              <Badge text={`Qarz: ${fmt(Math.abs(c.balance))}`} color={T.red} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button style={{ ...S.sBtn, fontSize: 11, padding: "8px 14px", background: T.green }} onClick={() => { setPayForm({ customerId: String(c.id), amount: String(Math.abs(c.balance)) }); setShowPayModal(true); }}>To'lash</button>
              <button style={{ ...S.sBtnS, fontSize: 11, padding: "6px 14px", background: "#f59e0b", color: "#fff", border: "none" }} onClick={() => { setAddDebtForm({ customerId: String(c.id), amount: "", description: "" }); setShowAddDebtModal(true); }}>+ Qarz</button>
              <button style={{ ...S.sBtnS, fontSize: 11, padding: "6px 14px" }} onClick={() => setShowCustStatement(c)}>Sverka</button>
            </div>
          </div>
        ))}
        {debtors.length === 0 && <div style={{ color: T.textD, padding: 20 }}>Qarzdorlar yo'q</div>}
      </div>

      {/* Pay Modal */}
      <Modal show={showPayModal} onClose={() => setShowPayModal(false)} title="Qarz to'lovi">
        <FL label="Mijoz">
          <select style={S.sSelect} value={payForm.customerId} onChange={e => setPayForm({ ...payForm, customerId: e.target.value })}>
            <option value="">Tanlang...</option>
            {debtors.map(c => <option key={c.id} value={c.id}>{c.name} (Qarz: {fmt(Math.abs(c.balance))})</option>)}
          </select>
        </FL>
        <FL label="To'lov summasi"><input type="number" style={S.sInput} value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} /></FL>
        <button style={{ ...S.sBtn, width: "100%", padding: 14, marginTop: 10, borderRadius: 14 }} onClick={handlePay}>Tasdiqlash</button>
      </Modal>

      {/* Add Debt Modal */}
      <Modal show={showAddDebtModal} onClose={() => setShowAddDebtModal(false)} title="Qarz qo'shish">
        <FL label="Mijoz">
          <select style={S.sSelect} value={addDebtForm.customerId} onChange={e => setAddDebtForm({ ...addDebtForm, customerId: e.target.value })}>
            <option value="">Tanlang...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.balance < 0 ? ` (Qarz: ${fmt(Math.abs(c.balance))})` : ""}</option>)}
          </select>
        </FL>
        <FL label="Qarz summasi"><input type="number" style={S.sInput} value={addDebtForm.amount} onChange={e => setAddDebtForm({ ...addDebtForm, amount: e.target.value })} placeholder="0" /></FL>
        <FL label="Izoh (ixtiyoriy)"><input type="text" style={S.sInput} value={addDebtForm.description} onChange={e => setAddDebtForm({ ...addDebtForm, description: e.target.value })} placeholder="Misol: Avvalgi qarz" /></FL>
        <button style={{ ...S.sBtn, width: "100%", padding: 14, marginTop: 10, borderRadius: 14, background: "#f59e0b" }} onClick={handleAddDebt}>Qarz qo'shish</button>
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


