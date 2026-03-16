import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import * as S from '../styles';
import { T } from '../constants';
import { Badge, IBtn, Modal, FL } from '../components';
import { fmt, getToday, nowTime } from '../utils';

export const DealersPage = () => {
  const { dealers, setDealers, dealerTxns, setDealerTxns, logActivity, getTotalDealerDebt, products, setProducts } = useStorage();
  const { currentUser } = useAuth();
  
  const [showDealerModal, setShowDealerModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showKirimModal, setShowKirimModal] = useState(false);
  const [kirimDealerId, setKirimDealerId] = useState("");
  const [kirimCart, setKirimCart] = useState<any[]>([]);
  const [prodSearch, setProdSearch] = useState("");
  
  const [editDealer, setEditDealer] = useState<any>(null);
  
  const [dealerForm, setDealerForm] = useState({ name: "", phone: "", address: "" });
  const [txnForm, setTxnForm] = useState({ dealerId: "", type: "purchase", amount: "", description: "", products: "" });
  
  const [selectedDealer, setSelectedDealer] = useState("");
  const filteredTxns = selectedDealer ? dealerTxns.filter(t => t.dealerId === Number(selectedDealer)) : dealerTxns;
  const filteredProds = prodSearch ? products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase())) : products;

  const addToKirim = (prod: any) => {
    const exists = kirimCart.find(c => c.productId === prod.id);
    if (!exists) setKirimCart([...kirimCart, { productId: prod.id, name: prod.name, qty: 1, cost: prod.cost }]);
  };
  const updateKirimValue = (pid: number, field: string, val: number) => {
    setKirimCart(kirimCart.map(c => c.productId === pid ? { ...c, [field]: val } : c));
  };
  const removeFromKirim = (pid: number) => setKirimCart(kirimCart.filter(c => c.productId !== pid));

  const handleKirimSave = () => {
    const dId = Number(kirimDealerId);
    const dealer = dealers.find(d => d.id === dId);
    if (!dealer || kirimCart.length === 0) return;

    let totalSum = 0;
    const itemsText = kirimCart.map(c => {
      totalSum += (c.qty * c.cost);
      return `${c.name} x${c.qty}`;
    }).join(", ");

    // Update Products Stock and Cost
    setProducts(prev => prev.map(p => {
      const inc = kirimCart.find(c => c.productId === p.id);
      return inc ? { ...p, stock: p.stock + inc.qty, cost: inc.cost } : p;
    }));

    // Update Dealer Balance (increase debt)
    setDealers(prev => prev.map(d => d.id === dId ? { ...d, balance: d.balance - totalSum } : d));

    // Log Txn
    setDealerTxns(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1,
      dealerId: dId, type: 'purchase', amount: totalSum,
      description: "Omborga kirim: " + itemsText, products: itemsText,
      date: getToday(), time: nowTime(), user: currentUser?.name || "?"
    }, ...prev]);

    logActivity(currentUser?.name || "?", `Kirim: ${dealer.name} dan ${fmt(totalSum)} lik tovar`, getToday(), nowTime());
    setKirimCart([]); setKirimDealerId(""); setProdSearch("");
    setShowKirimModal(false);
  };

  const handleDealerSave = () => {
    if (!dealerForm.name) return;
    if (editDealer) {
      setDealers(prev => prev.map(d => d.id === editDealer.id ? { ...d, ...dealerForm } : d));
      logActivity(currentUser?.name || "?", `Diller tahrirlandi: ${dealerForm.name}`, getToday(), nowTime());
      setEditDealer(null);
    } else {
      setDealers(prev => [...prev, { id: Math.max(0, ...prev.map(x => x.id)) + 1, ...dealerForm, balance: 0 }]);
      logActivity(currentUser?.name || "?", `Yangi diller: ${dealerForm.name}`, getToday(), nowTime());
    }
    setDealerForm({ name: "", phone: "", address: "" }); 
    setShowDealerModal(false);
  };

  const handleTxnSave = () => {
    const dId = Number(txnForm.dealerId);
    const amt = Number(txnForm.amount);
    if (!dId || amt <= 0) return;
    
    const dealer = dealers.find(d => d.id === dId);
    if (!dealer) return;

    setDealers(prev => prev.map(d => d.id === dId ? { ...d, balance: d.balance + (txnForm.type === "purchase" ? -amt : amt) } : d));
    setDealerTxns(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1,
      dealerId: dId, type: txnForm.type as 'purchase' | 'payment', amount: amt,
      description: txnForm.description, products: txnForm.products,
      date: getToday(), time: nowTime(), user: currentUser?.name || "?"
    }, ...prev]);
    
    logActivity(currentUser?.name || "?", `Diller amaliyoti: ${dealer.name} — ${txnForm.type === "purchase" ? "Yuk olindi" : "Pul berildi"} ${fmt(amt)}`, getToday(), nowTime());
    setTxnForm({ dealerId: "", type: "purchase", amount: "", description: "", products: "" }); 
    setShowTxnModal(false);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Dillerlar bilan ishlash</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={S.sBtnS} onClick={() => { setEditDealer(null); setDealerForm({ name: "", phone: "", address: "" }); setShowDealerModal(true); }}>+ Diller qo'shish</button>
          <button style={S.sBtn} onClick={() => setShowTxnModal(true)}>+ Yangi amaliyot</button>
        </div>
      </div>

      <div style={{ ...S.sCard, marginBottom: 20, display: "flex", gap: 30, background: T.redLight, borderLeft: `6px solid ${T.red}` }}>
        <div>
          <div style={{ fontSize: 13, color: T.red, fontWeight: 700, textTransform: "uppercase" }}>Dillerlardan qarzimiz</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: T.red }}>{fmt(Math.abs(getTotalDealerDebt()))} so'm</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginBottom: 24 }}>
        {dealers.map(d => (
          <div key={d.id} style={{ ...S.sCard, border: `1px solid ${d.balance < 0 ? T.red+"30" : T.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{d.name}</div>
                <div style={{ fontSize: 12, color: T.textD }}>{d.phone}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <IBtn color={T.green} onClick={() => { setKirimDealerId(String(d.id)); setShowKirimModal(true); }}>📥</IBtn>
                <IBtn color={T.blue} onClick={() => { setDealerForm({ name: d.name, phone: d.phone, address: d.address }); setEditDealer(d); setShowDealerModal(true); }}>✎</IBtn>
                <IBtn color={T.red} onClick={() => {
                  if (confirm("O'chirasizmi?")) {
                    setDealers(prev => prev.filter(x => x.id !== d.id));
                    logActivity(currentUser?.name || "?", "Diller o'chirildi", getToday(), nowTime());
                  }
                }}>✕</IBtn>
              </div>
            </div>
            <div style={{ background: d.balance < 0 ? T.redLight : T.cardAlt, padding: "10px 14px", borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: T.textM, fontWeight: 600 }}>Joriy Hisob</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: d.balance < 0 ? T.red : T.text }}>{fmt(Math.abs(d.balance))} so'm {d.balance < 0 ? "(Qarzimiz)" : ""}</div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ margin: "0 0 16px", fontSize: 20, fontWeight: 800 }}>Amaliyotlar tarixi</h3>
      <select style={{ ...S.sSelect, maxWidth: 300, marginBottom: 16 }} value={selectedDealer} onChange={e => setSelectedDealer(e.target.value)}>
        <option value="">Barcha dillerlar</option>
        {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
      </select>

      <div style={{ ...S.sCard, padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: T.cardAlt }}>
              {["Sana","Diller","Turi","Summa","Mahsulotlar/Izoh","Kim"].map(h => <th key={h} style={{ textAlign: "left", padding: "12px 14px", color: T.textM, fontWeight: 700, fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filteredTxns.map(t => {
              const d = dealers.find(x => x.id === t.dealerId);
              return (
                <tr key={t.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                  <td style={{ padding: "12px 14px", color: T.textD }}>{t.date} {t.time}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 700 }}>{d?.name}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <Badge text={t.type === "purchase" ? "Yuk olindi" : "Pul berildi"} color={t.type === "purchase" ? T.red : T.green} />
                  </td>
                  <td style={{ padding: "12px 14px", fontWeight: 800, color: t.type === "purchase" ? T.red : T.green }}>{fmt(t.amount)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    {t.type === "purchase" ? <span style={{ color: T.blue }}>{t.products}</span> : <span style={{ color: T.textM }}>{t.description}</span>}
                  </td>
                  <td style={{ padding: "12px 14px", color: T.textD, fontSize: 11 }}>{t.user}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal show={showDealerModal} onClose={() => { setShowDealerModal(false); setEditDealer(null); }} title={editDealer ? "Tahrirlash" : "Yangi diller"}>
        <FL label="Kompaniya / FISM"><input style={S.sInput} value={dealerForm.name} onChange={e => setDealerForm({ ...dealerForm, name: e.target.value })} autoFocus /></FL>
        <FL label="Telefon"><input style={S.sInput} value={dealerForm.phone} onChange={e => setDealerForm({ ...dealerForm, phone: e.target.value })} /></FL>
        <FL label="Manzil"><input style={S.sInput} value={dealerForm.address} onChange={e => setDealerForm({ ...dealerForm, address: e.target.value })} /></FL>
        <button style={{ ...S.sBtn, width: "100%", padding: 14, marginTop: 10, borderRadius: 14 }} onClick={handleDealerSave}>Saqlash</button>
      </Modal>

      <Modal show={showTxnModal} onClose={() => setShowTxnModal(false)} title="Diller amaliyoti">
        <FL label="Diller">
          <select style={S.sSelect} value={txnForm.dealerId} onChange={e => setTxnForm({ ...txnForm, dealerId: e.target.value })}>
            <option value="">Tanlang...</option>
            {dealers.map(d => <option key={d.id} value={d.id}>{d.name} (Qarz: {fmt(Math.abs(d.balance))})</option>)}
          </select>
        </FL>
        <FL label="Amaliyot turi">
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...S.sBtnS, flex: 1, padding: "10px", background: txnForm.type === "purchase" ? T.redLight : "transparent", color: txnForm.type === "purchase" ? T.red : T.textM, borderColor: txnForm.type === "purchase" ? T.red : T.border }} onClick={() => setTxnForm({ ...txnForm, type: "purchase" })}>Yuk olindi (Qarz)</button>
            <button style={{ ...S.sBtnS, flex: 1, padding: "10px", background: txnForm.type === "payment" ? T.greenLight : "transparent", color: txnForm.type === "payment" ? T.green : T.textM, borderColor: txnForm.type === "payment" ? T.green : T.border }} onClick={() => setTxnForm({ ...txnForm, type: "payment" })}>Pul berildi (To'lov)</button>
          </div>
        </FL>
        <FL label="Summa / Qiymat"><input type="number" style={S.sInput} value={txnForm.amount} onChange={e => setTxnForm({ ...txnForm, amount: e.target.value })} /></FL>
        {txnForm.type === "purchase" ? (
          <FL label="Olingan mahsulotlar"><input style={S.sInput} placeholder="Masalan: 5t sement, 2t armatura..." value={txnForm.products} onChange={e => setTxnForm({ ...txnForm, products: e.target.value })} /></FL>
        ) : (
          <FL label="Izoh"><input style={S.sInput} placeholder="Naqd, Plastik, dollar..." value={txnForm.description} onChange={e => setTxnForm({ ...txnForm, description: e.target.value })} /></FL>
        )}
        <button style={{ ...S.sBtn, width: "100%", padding: 14, marginTop: 10, borderRadius: 14 }} onClick={handleTxnSave}>Saqlash</button>
      </Modal>

      <Modal show={showKirimModal} onClose={() => setShowKirimModal(false)} title="Omborga Kirim Qilish">
        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: T.textM, fontWeight: 600, marginBottom: 6 }}>Diller</div>
            <select style={S.sSelect} value={kirimDealerId} disabled>
              <option value="">Tanlang...</option>
              {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ background: T.cardAlt, padding: "10px 14px", borderRadius: 10, border: `1px solid ${T.borderLight}`, marginBottom: 14 }}>
          <input style={{ ...S.sInput, marginBottom: 10 }} placeholder="Mahsulot qidirish..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} />
          <div style={{ maxHeight: 120, overflowY: "auto", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {filteredProds.map(p => (
              <button key={p.id} onClick={() => addToKirim(p)} style={{ background: T.card, border: `1px solid ${T.border}`, padding: "6px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer", color: T.text, transition: "0.2s" }}>
                {p.name} <span style={{ color: T.textM }}>({p.stock})</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxHeight: 250, overflowY: "auto", marginBottom: 14 }}>
          {kirimCart.length === 0 ? <div style={{ textAlign: "center", color: T.textD, fontSize: 13, padding: "20px 0" }}>Mahsulot tanlanmagan</div> : (
            kirimCart.map(c => (
              <div key={c.productId} style={{ background: T.cardAlt, padding: 12, borderRadius: 10, marginBottom: 8, border: `1px solid ${T.borderLight}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, fontWeight: 700 }}>
                  {c.name}
                  <button onClick={() => removeFromKirim(c.productId)} style={{ color: T.red, background: "transparent", border: "none", cursor: "pointer", fontWeight: 800 }}>✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, color: T.textM }}>Kirim Soni</div>
                    <input type="number" style={{ ...S.sInput, padding: "6px" }} value={c.qty} onChange={e => updateKirimValue(c.productId, 'qty', Number(e.target.value))} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.textM }}>Tannarx (Kirim)</div>
                    <input type="number" style={{ ...S.sInput, padding: "6px" }} value={c.cost} onChange={e => updateKirimValue(c.productId, 'cost', Number(e.target.value))} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: T.textM }}>Jami Summa</div>
                    <div style={{ padding: "8px 0", fontWeight: 800, color: T.accent, fontSize: 13 }}>{fmt(c.qty * c.cost)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, padding: "10px 0", borderTop: `2px solid ${T.borderLight}` }}>
          <span>Jami Kirim Summasi:</span>
          <span style={{ color: T.accent }}>{fmt(kirimCart.reduce((s, c) => s + (c.qty * c.cost), 0))} so'm</span>
        </div>

        <button style={{ ...S.sBtn, width: "100%", padding: 14, marginTop: 10, borderRadius: 14, opacity: kirimCart.length ? 1 : 0.5 }} onClick={handleKirimSave} disabled={!kirimCart.length}>Tasdiqlash va Kirim Qilish</button>
      </Modal>
    </div>
  );
};
