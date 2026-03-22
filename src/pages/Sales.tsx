import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import * as S from '../styles';
import { T } from '../constants';
import { fmt, getToday, nowTime, sendTelegram } from '../utils';
import { sendDevSMS, buildSmsText } from '../utils/devsms';

export const SalesPage = () => {
  const { products, customers, sales, setSales, setProducts, setCustomers, logActivity, tgBotToken, tgChatId, smsApiToken, smsSignature } = useStorage();
  const { currentUser } = useAuth();
  
  const [cart, setCart] = useState<any[]>([]);
  const [saleCustomerId, setSaleCustomerId] = useState("");
  const [isOneTime, setIsOneTime] = useState(false);
  const [oneTimeName, setOneTimeName] = useState("");
  const [paymentType, setPaymentType] = useState("naqd");
  const [cashAmount, setCashAmount] = useState("");
  const [prodSearch, setProdSearch] = useState("");
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const esc = (s: string) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const filteredProds = prodSearch ? products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase())) : products;

  const addToCart = (prod: any) => {
    const exists = cart.find(c => c.productId === prod.id);
    if (exists) setCart(cart.map(c => c.productId === prod.id ? { ...c, qty: c.qty + 1, total: (c.qty + 1) * c.unitPrice } : c));
    else setCart([...cart, { productId: prod.id, productName: prod.name, qty: 1, price: prod.price, unitPrice: prod.price, cost: prod.cost, discount: 0, total: prod.price, unit: prod.unit, packSize: prod.packSize }]);
  };
  const updateCartQty = (pid: number, qty: number) => { if (qty < 1) return removeFromCart(pid); setCart(cart.map(c => c.productId === pid ? { ...c, qty, total: qty * c.unitPrice } : c)); };
  const updateCartDiscount = (pid: number, disc: string) => {
    const d = Math.max(0, Math.min(100, Number(disc) || 0));
    setCart(cart.map(c => { if (c.productId !== pid) return c; const up = Math.round(c.price * (1 - d / 100)); return { ...c, discount: d, unitPrice: up, total: c.qty * up }; }));
  };
  const updateCartPrice = (pid: number, np: string) => {
    const p = Number(np) || 0;
    setCart(cart.map(c => { if (c.productId !== pid) return c; const d = c.price > 0 ? Math.round((1 - p / c.price) * 100) : 0; return { ...c, unitPrice: p, discount: Math.max(0, d), total: c.qty * p }; }));
  };
  const removeFromCart = (pid: number) => setCart(cart.filter(c => c.productId !== pid));
  
  const cartTotal = cart.reduce((s, c) => s + c.total, 0);
  const cartProfit = cart.reduce((s, c) => s + (c.unitPrice - c.cost) * c.qty, 0);
  const cartOriginal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartDiscountTotal = cartOriginal - cartTotal;

  const handleCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    const custName = isOneTime ? (oneTimeName || "Birmartalik") : (customers.find(c => c.id === Number(saleCustomerId))?.name || "");
    const custPhone = isOneTime ? "" : (customers.find(c => c.id === Number(saleCustomerId))?.phone || "");
    const custId = isOneTime ? 0 : Number(saleCustomerId);
    if (!isOneTime && !saleCustomerId) { alert("Mijozni tanlang!"); return; }
    if (isOneTime && paymentType !== "naqd") { alert("Birmartalik mijozga faqat naqd!"); return; }
    for (const item of cart) {
      const p = products.find(pr => pr.id === item.productId);
      if (p && p.stock < item.qty) { alert(`${p.name} yetarli emas! Qoldiq: ${p.stock}`); return; }
    }
    let paidAmt = cartTotal, debtAmt = 0, pType = "naqd";
    if (paymentType === "qarz") { paidAmt = 0; debtAmt = cartTotal; pType = "qarz"; }
    else if (paymentType === "aralash") {
      const cash = Number(cashAmount) || 0;
      if (cash <= 0) { alert("Naqd summa kiriting!"); return; }
      if (cash >= cartTotal) { paidAmt = cartTotal; debtAmt = 0; pType = "naqd"; }
      else { paidAmt = cash; debtAmt = cartTotal - cash; pType = "aralash"; }
    }
    
    const today = getToday();
    const time = nowTime();
    
    const newSales = cart.map((item, i) => {
      const maxId = sales.length > 0 ? Math.max(...sales.map(s => s.id)) : 0;
      const ratio = item.total / cartTotal;
      return {
        id: (sales.length > 0 ? Math.max(...sales.map(s => s.id)) : 0) + i + 1, date: today, time,
        productId: item.productId, productName: item.productName,
        customerId: custId, customerName: custName,
        qty: item.qty, price: item.price, unitPrice: item.unitPrice, cost: item.cost,
        discount: item.discount, total: item.total,
        profit: (item.unitPrice - item.cost) * item.qty,
        paidAmount: Math.round(paidAmt * ratio), debtAmount: Math.round(debtAmt * ratio), payType: pType as 'naqd' | 'qarz' | 'aralash',
        user: currentUser?.name || "?",
      };
    });
    
    setSales([...newSales, ...sales]);
    setProducts(products.map(p => { const ci = cart.find(c => c.productId === p.id); return ci ? { ...p, stock: p.stock - ci.qty } : p; }));
    if (debtAmt > 0 && !isOneTime && custId) {
      setCustomers(customers.map(c => c.id === custId ? { ...c, balance: c.balance - debtAmt } : c));
    }
    logActivity(currentUser?.name || "?", `Sotuv: ${custName} — ${fmt(cartTotal)} so'm (${pType})`, today, time);

    const itemsList = cart.map(it => `  ${it.productName} x${it.qty} = ${fmt(it.total)}`).join("\\n");
    const tgMsg = `🛒 <b>YANGI SOTUV</b>\\n\\n👤 Mijoz: <b>${custName}</b>${custPhone ? "\\n📱 " + custPhone : ""}\\n📅 ${today} ${time}\\n👷 Sotuvchi: ${currentUser?.name}\\n\\n📦 Tovarlar:\\n${itemsList}\\n\\n💰 <b>JAMI: ${fmt(cartTotal)} so'm</b>\\n💵 Naqd: ${fmt(paidAmt)} so'm${debtAmt > 0 ? `\\n📋 Nasiya: ${fmt(debtAmt)} so'm` : ""}\\n📊 Foyda: ${fmt(cartProfit)} so'm`;
    
    // Send to Admin/Group generic channel
    if (tgBotToken && tgChatId) sendTelegram(tgBotToken, tgChatId, tgMsg);

    // Send Electronic Receipt directly to Customer if they have a Telegram ID
    const customerObj = customers.find(c => c.id === custId);
    if (customerObj && customerObj.tgId && tgBotToken) {
       
       // Calculate 30-day history for the customer
       const thirtyDaysAgo = new Date();
       thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
       const d30 = thirtyDaysAgo.toISOString().split("T")[0];
       
       const custRecentSales = sales.filter(s => s.customerId === custId && s.date >= d30);
       const bought30 = custRecentSales.reduce((s, c) => s + c.total, 0) + cartTotal;
       const paid30 = custRecentSales.reduce((s, c) => s + c.paidAmount, 0) + paidAmt;

       const directMsg = `Hurmatli <b>${custName}</b>, xaridingiz uchun rahmat! 🎉

📅 <b>Sana:</b> ${today} ${time}

📦 <b>Siz xarid qilgan tovarlar:</b>
${itemsList}

💰 <b>MOLIYAVIY HISOB (BUGUN)</b>
━━━━━━━━━━━━━━━━━━
<b>Jami summa: ${fmt(cartTotal)} so'm</b>
💵 To'langan: ${fmt(paidAmt)} so'm
${debtAmt > 0 ? `📋 Nasiya (Qarzga): ${fmt(debtAmt)} so'm` : ""}

📈 <b>OYLIK STATISTIKANGIZ (Oxirgi 30 kun)</b>
━━━━━━━━━━━━━━━━━━
🛍 Umumiy xaridlar: ${fmt(bought30)} so'm
✅ Qilingan to'lovlar: ${fmt(paid30)} so'm
${customerObj.balance - debtAmt < 0 ? `❗ <b>Sizning umumiy qarzingiz: ${fmt(Math.abs(customerObj.balance - debtAmt))} so'm</b>\n` : `✨ <b>Umumiy balansingiz: ${fmt(customerObj.balance - debtAmt)} so'm</b>\n`}
<i>KAEL POS — Boshqaruv Tizimi orqali yuborildi. Kunning xayrli o'tishini tilaymiz!</i>`;
       
       sendTelegram(tgBotToken, customerObj.tgId, directMsg);
    }

    // Send SMS to customer's phone if smsApiToken + phone available
    if (smsApiToken && custPhone && !isOneTime) {
      const smsText = buildSmsText(custName, cart, cartTotal, paidAmt, debtAmt, smsSignature);
      sendDevSMS(smsApiToken, custPhone, smsText);
    }

    setShowReceipt({
      date: today, time, customer: custName, phone: custPhone,
      items: [...cart], total: cartTotal, paid: paidAmt, debt: debtAmt, payType: pType,
      discount: cartDiscountTotal, receiptNo: `KL-${Date.now().toString(36).toUpperCase()}`
    });
    setCart([]); setSaleCustomerId(""); setIsOneTime(false); setOneTimeName("");
    setPaymentType("naqd"); setCashAmount(""); setProdSearch("");
    setIsSubmitting(false);
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 24px", fontSize: 28, fontWeight: 800 }}>Sotuv (Kassa)</h2>
      <div className="mobile-stack" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        
        {/* Left Side: Products */}
        <div className="mobile-full" style={{ flex: 1, minWidth: 340 }}>
          <div style={{ ...S.sCard, marginBottom: 14, padding: "12px 20px" }}>
            <input 
              style={{ ...S.sInput, background: "transparent", border: "none", padding: "8px 0", fontSize: 16 }} 
              placeholder="Mahsulot qidirish..." 
              value={prodSearch} onChange={e => setProdSearch(e.target.value)} autoFocus 
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10 }}>
            {filteredProds.map(p => (
              <div key={p.id} onClick={() => p.stock > 0 && addToCart(p)} 
                style={{ ...S.sCard, padding: "14px 16px", cursor: p.stock > 0 ? "pointer" : "not-allowed", opacity: p.stock > 0 ? 1 : 0.35, borderColor: cart.find(c => c.productId === p.id) ? T.accent : T.border, background: cart.find(c => c.productId === p.id) ? T.accentLight : T.card }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{p.name}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: T.accent }}>{fmt(p.price)}</div>
                <div style={{ fontSize: 11, color: p.stock <= p.minStock ? T.red : T.textD, marginTop: 4 }}>Qoldiq: {p.stock} {p.unit}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Right Side: Cart */}
        <div className="mobile-full" style={{ width: 430, flexShrink: 0 }}>
          <div style={{ ...S.sCard, position: "sticky", top: 80 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 800 }}>Savat ({cart.length})</h3>
            
            <div style={{ background: T.cardAlt, borderRadius: 14, padding: 14, marginBottom: 14, border: `1px solid ${T.borderLight}` }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={() => { setIsOneTime(false); setOneTimeName(""); }} style={{ ...S.sBtnS, flex: 1, padding: "9px", background: !isOneTime ? T.accentLight : "transparent", color: !isOneTime ? T.accent : T.textM, borderColor: !isOneTime ? T.accent : T.border, fontWeight: !isOneTime ? 700 : 500 }}>Doimiy</button>
                <button onClick={() => { setIsOneTime(true); setSaleCustomerId(""); setPaymentType("naqd"); }} style={{ ...S.sBtnS, flex: 1, padding: "9px", background: isOneTime ? T.accentLight : "transparent", color: isOneTime ? T.accent : T.textM, borderColor: isOneTime ? T.accent : T.border, fontWeight: isOneTime ? 700 : 500 }}>Birmartalik</button>
              </div>
              {isOneTime ? 
                <input style={S.sInput} placeholder="Ism (ixtiyoriy)" value={oneTimeName} onChange={e => setOneTimeName(e.target.value)} /> :
                <select style={S.sSelect} value={saleCustomerId} onChange={e => setSaleCustomerId(e.target.value)}>
                  <option value="">Mijozni tanlang...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone}) {c.balance < 0 ? `qarz: ${fmt(Math.abs(c.balance))}` : ""}</option>)}
                </select>
              }
            </div>

            {cart.length === 0 ? <div style={{ textAlign: "center", padding: "30px 0", color: T.textD }}>Mahsulot tanlang</div> : (
              <div style={{ maxHeight: 260, overflowY: "auto", marginBottom: 14 }}>
                {cart.map(item => (
                  <div key={item.productId} style={{ background: T.cardAlt, borderRadius: 12, padding: 12, marginBottom: 8, border: `1px solid ${T.borderLight}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <b style={{ fontSize: 13 }}>{item.productName}</b>
                      <button onClick={() => removeFromCart(item.productId)} style={{ background: T.redLight, border: "none", color: T.red, cursor: "pointer", padding: "2px 7px", borderRadius: 6, fontWeight: 700, fontSize: 12 }}>✕</button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, fontSize: 11 }}>
                      <div>
                        <div style={{ color: T.textD, fontSize: 10, fontWeight: 600, marginBottom: 3 }}>SONI</div>
                        <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                          <button onClick={() => updateCartQty(item.productId, item.qty - 1)} style={{ width: 26, height: 26, borderRadius: 7, background: T.card, border: `1px solid ${T.border}`, cursor: "pointer", fontSize: 14 }}>−</button>
                          <input type="number" value={item.qty} onFocus={e => e.target.select()} onChange={e => updateCartQty(item.productId, Number(e.target.value))} style={{ ...S.sInput, width: 70, textAlign: "center", padding: "4px 2px", fontSize: 13, fontWeight: 700 }} />
                          <button onClick={() => updateCartQty(item.productId, item.qty + 1)} style={{ width: 26, height: 26, borderRadius: 7, background: T.card, border: `1px solid ${T.border}`, cursor: "pointer", fontSize: 14 }}>+</button>
                        </div>

                      </div>
                      <div>
                        <div style={{ color: T.textD, fontSize: 10, fontWeight: 600, marginBottom: 3 }}>NARX</div>
                        <input type="number" value={item.unitPrice} onChange={e => updateCartPrice(item.productId, e.target.value)} style={{ ...S.sInput, padding: "4px 6px", fontSize: 12, fontWeight: 600 }} />
                      </div>
                      <div>
                        <div style={{ color: T.textD, fontSize: 10, fontWeight: 600, marginBottom: 3 }}>CHEGIRMA%</div>
                        <input type="number" value={item.discount} onChange={e => updateCartDiscount(item.productId, e.target.value)} style={{ ...S.sInput, padding: "4px 6px", fontSize: 12 }} min={0} max={100} />
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                      <span style={{ fontSize: 11, color: T.textM }}>Jami:</span><span style={{ fontSize: 15, fontWeight: 800, color: T.accent }}>{fmt(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && !isOneTime && (
              <div style={{ background: T.cardAlt, borderRadius: 12, padding: 14, marginBottom: 14, border: `1px solid ${T.borderLight}` }}>
                <div style={{ fontSize: 10, color: T.textM, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>To'lov turi</div>
                <div style={{ display: "flex", gap: 6, marginBottom: paymentType === "aralash" ? 10 : 0 }}>
                  {[{id:"naqd",l:"Naqd",c:T.green,b:T.greenLight},{id:"qarz",l:"Nasiya",c:T.red,b:T.redLight},{id:"aralash",l:"Aralash",c:T.orange,b:T.orangeLight}].map(pt => (
                    <button key={pt.id} onClick={() => {setPaymentType(pt.id);setCashAmount("");}} style={{...S.sBtnS,flex:1,fontSize:12,padding:"9px 6px",background:paymentType===pt.id?pt.b:"transparent",color:paymentType===pt.id?pt.c:T.textM,borderColor:paymentType===pt.id?pt.c:T.border,fontWeight:paymentType===pt.id?700:500}}>{pt.l}</button>
                  ))}
                </div>
                {paymentType === "aralash" && (
                  <div>
                    <input type="number" style={S.sInput} value={cashAmount} onChange={e => setCashAmount(e.target.value)} placeholder="Naqd summa..." />
                    {Number(cashAmount) > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 13 }}><span style={{ color: T.green, fontWeight: 700 }}>Naqd: {fmt(Math.min(Number(cashAmount), cartTotal))}</span><span style={{ color: T.red, fontWeight: 700 }}>Nasiya: {fmt(Math.max(0, cartTotal - Number(cashAmount)))}</span></div>}
                  </div>
                )}
              </div>
            )}
            
            {cart.length > 0 && (
              <div style={{ background: T.cardAlt, borderRadius: 12, padding: 14, marginBottom: 14, border: `1px solid ${T.borderLight}` }}>
                {cartDiscountTotal > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span style={{ color: T.textD }}>Chegirma:</span><span style={{ color: T.red, fontWeight: 700 }}>-{fmt(cartDiscountTotal)}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}><span style={{ color: T.textD }}>Foyda:</span><span style={{ color: T.green, fontWeight: 700 }}>{fmt(cartProfit)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, paddingTop: 8, borderTop: `2px solid ${T.border}` }}><span>JAMI:</span><span style={{ color: T.accent }}>{fmt(cartTotal)} so'm</span></div>
              </div>
            )}
            
            <button style={{ ...S.sBtn, width: "100%", padding: 15, fontSize: 16, opacity: (cart.length && !isSubmitting) ? 1 : 0.4, borderRadius: 14 }} onClick={handleCheckout} disabled={!cart.length || isSubmitting}>{isSubmitting ? "Saqlanmoqda..." : "Sotuvni tasdiqlash"}</button>
          </div>
        </div>
      </div>

      {showReceipt && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(28,25,23,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(8px)" }} onClick={() => setShowReceipt(null)}>
          <div style={{ background: T.card, borderRadius: 24, padding: 32, width: "92%", maxWidth: 400, boxShadow: T.shadowXl, maxHeight: "90vh", overflowY: "auto", fontFamily: "monospace" }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: "center", marginBottom: 12 }}><div style={{ fontSize: 24, fontWeight: 900 }}>KAEL POS</div><div style={{ fontSize: 11, color: T.textD }}>Chek #{showReceipt.receiptNo}</div></div>
            <div style={{ borderTop: `2px dashed ${T.border}`, margin: "10px 0" }} />
            <div style={{ fontSize: 13, marginBottom: 4 }}><b>Mijoz:</b> {showReceipt.customer} {showReceipt.phone && <span style={{ color: T.textD }}>({showReceipt.phone})</span>}</div>
            <div style={{ fontSize: 13, marginBottom: 8, color: T.textD }}>{showReceipt.date} {showReceipt.time}</div>
            <div style={{ borderTop: `1px dashed ${T.border}`, margin: "8px 0" }} />
            {showReceipt.items.map((it: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, borderBottom: `1px solid ${T.borderLight}` }}>
                <span><b>{it.productName}</b> x{it.qty}</span><span style={{ fontWeight: 700 }}>{fmt(it.total)}</span>
              </div>
            ))}
            <div style={{ borderTop: `2px dashed ${T.border}`, margin: "10px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 800, marginBottom: 8 }}><span>JAMI:</span><span style={{ color: T.accent }}>{fmt(showReceipt.total)}</span></div>
            <div style={{ fontSize: 13 }}>Naqd: <b style={{ color: T.green }}>{fmt(showReceipt.paid)}</b></div>
            {showReceipt.debt > 0 && <div style={{ fontSize: 13 }}>Nasiya: <b style={{ color: T.red }}>{fmt(showReceipt.debt)}</b></div>}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <button style={{ ...S.sBtn, flex: 1, padding: 14 }} onClick={() => {
                const w = window.open("", "_blank", "width=350,height=600");
                if (w) {
                  w.document.write(`<html><head><title>Chek</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:monospace;font-size:12px;padding:16px;max-width:320px;margin:0 auto}.center{text-align:center}.line{border-top:1px dashed #000;margin:8px 0}.row{display:flex;justify-content:space-between;padding:2px 0}.bold{font-weight:bold}.big{font-size:16px}@media print{button{display:none}}</style></head><body>
                    <div class="center bold big">KAEL POS</div><div class="center" style="font-size:10px;margin-top:4px">Qurilish materiallari</div><div class="line"></div>
                    <div class="row"><span>Chek:</span><span class="bold">${esc(showReceipt.receiptNo)}</span></div>
                    <div class="row"><span>Sana:</span><span>${esc(showReceipt.date)} ${esc(showReceipt.time)}</span></div>
                    <div class="row"><span>Mijoz:</span><span>${esc(showReceipt.customer)}</span></div>
                    ${showReceipt.phone ? `<div class="row"><span>Tel:</span><span>${esc(showReceipt.phone)}</span></div>` : ""}
                    <div class="line"></div>
                    ${showReceipt.items.map((it:any) => `<div style="padding:3px 0"><div class="bold">${esc(it.productName)}</div><div class="row"><span>${it.qty} x ${fmt(it.unitPrice)}</span><span class="bold">${fmt(it.total)}</span></div></div>`).join("")}
                    <div class="line"></div>
                    ${showReceipt.discount > 0 ? `<div class="row"><span>Chegirma:</span><span>-${fmt(showReceipt.discount)}</span></div>` : ""}
                    <div class="row bold big"><span>JAMI:</span><span>${fmt(showReceipt.total)} so'm</span></div><div class="line"></div>
                    <div class="row"><span>Naqd:</span><span>${fmt(showReceipt.paid)}</span></div>
                    ${showReceipt.debt > 0 ? `<div class="row" style="color:red"><span>Nasiya:</span><span>${fmt(showReceipt.debt)}</span></div>` : ""}
                    <div class="line"></div><div class="center" style="margin-top:8px;font-size:10px">Rahmat!</div>
                    <br/><button onclick="window.print()" style="width:100%;padding:10px;cursor:pointer;border:2px solid #000;background:#fff;font-weight:bold">CHOP ETISH</button></body></html>`);
                  w.document.close();
                }
              }}>Chop etish</button>
              <button style={{ ...S.sBtnS, flex: 1, padding: 14 }} onClick={() => setShowReceipt(null)}>Yopish</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
