import { useState } from 'react';
import { T } from '../constants';
import * as S from '../styles';
import { fmt, getToday, sumF, sendTelegram } from '../utils';
import { useStorage } from '../hooks/useStorage';

interface StatementModalProps {
  show: boolean;
  onClose: () => void;
  customer: any;
  sales: any[];
}

export const StatementModal = ({ show, onClose, customer, sales }: StatementModalProps) => {
  const [statementMode, setStatementMode] = useState<'months' | 'custom'>('months');
  const [statementMonths, setStatementMonths] = useState(3);
  const [fromDateStr, setFromDateStr] = useState(getToday());
  const [toDateStr, setToDateStr] = useState(getToday());

  const { tgBotToken } = useStorage();
  
  if (!show || !customer) return null;

  const today = getToday();
  let fromDate = today;
  let toDate = today;

  if (statementMode === 'months') {
    const d = new Date(); d.setMonth(d.getMonth() - statementMonths);
    fromDate = d.toISOString().split("T")[0];
  } else {
    fromDate = fromDateStr;
    toDate = toDateStr;
  }

  const statementSales = sales.filter(s => s.customerId === customer.id && s.date >= fromDate && s.date <= toDate).sort((a,b) => (a.date+a.time > b.date+b.time ? 1 : -1));
  const tTotal = sumF(statementSales, "total"), tPaid = sumF(statementSales, "paidAmount"), tDebt = sumF(statementSales, "debtAmount");

  const sendStatement = () => {
    if (!tgBotToken) { alert("Telegram Bot Token sozlanmagan!"); return; }
    if (!customer.tgId) { alert("Ushbu mijozga Telegram biriktirilmagan! (Mijozlar panelidan kiriting)"); return; }

    let tableStr = "";
    statementSales.forEach(s => {
      let t = "";
      if (s.payType === "naqd") t = `Naqd: ${fmt(s.paidAmount)}`;
      else if (s.payType === "qarz") t = `Qarz: ${fmt(s.total)}`;
      else t = `Naqd: ${fmt(s.paidAmount)}, Qarz: ${fmt(s.debtAmount)}`;
      tableStr += `▪️ ${s.date.slice(5)} ${s.time} | <b>${s.productName}</b>\n   ${s.qty} ta | ${fmt(s.total)} so'm | <i>${t}</i>\n`;
    });

    const msg = `🧾 <b>MIJOZ HISOB-KITOBI (SVERKA)</b>
👤 Mijoz: <b>${customer.name}</b>
📅 Davr: ${statementMode === 'months' ? `Oxirgi ${statementMonths} oy` : `${fromDate} dan ${toDate} gacha`}

💰 <b>MOLIYAVIY XULOSA:</b>
━━━━━━━━━━━━━━━━━━
🔹 Jami Xarid: ${fmt(tTotal)} so'm
✅ To'langan: ${fmt(tPaid)} so'm
📉 Nasiya (Qarzga): ${fmt(tDebt)} so'm

${customer.balance < 0 ? `❗ <b>Joriy Qarzingiz: ${fmt(Math.abs(customer.balance))} so'm</b>` : `✨ <b>Joriy Balansingiz: ${fmt(customer.balance)} so'm</b>`}

📝 <b>BATAFSIL TARIX:</b>
━━━━━━━━━━━━━━━━━━
${tableStr || "Bu davrda hech qanday ma'lumot topilmadi."}`;

    sendTelegram(tgBotToken, customer.tgId, msg);
    alert("Hisobot mijoz do'koningiz botiga jo'natildi!");
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(28,25,23,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div style={{ background: T.card, borderRadius: 24, padding: 32, width: "95%", maxWidth: 800, boxShadow: T.shadowXl, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Mijoz hisob-kitobi (Sverka)</h3>
          <button onClick={onClose} style={{ background: T.cardAlt, border: "none", color: T.textM, fontSize: 18, cursor: "pointer", width: 36, height: 36, borderRadius: 10 }}>✕</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{customer.name}</div>
            <div style={{ color: T.textD, fontSize: 13 }}>{customer.phone}</div>
            <div style={{ marginTop: 8, fontSize: 14 }}>Joriy balans: <span style={{ fontWeight: 800, color: customer.balance < 0 ? T.red : T.green }}>{fmt(Math.abs(customer.balance))} so'm {customer.balance < 0 ? "(Qarz)" : "(Haqdor)"}</span></div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", background: T.cardAlt, padding: 6, borderRadius: 12 }}>
              <button onClick={() => setStatementMode('months')} style={{ ...S.sBtnS, padding: "6px 12px", background: statementMode === 'months' ? T.card : "transparent", color: statementMode === 'months' ? T.text : T.textM, border: "none", boxShadow: statementMode === 'months' ? T.shadow : "none" }}>Oylar</button>
              <button onClick={() => setStatementMode('custom')} style={{ ...S.sBtnS, padding: "6px 12px", background: statementMode === 'custom' ? T.card : "transparent", color: statementMode === 'custom' ? T.text : T.textM, border: "none", boxShadow: statementMode === 'custom' ? T.shadow : "none" }}>Davr</button>
            </div>

            {statementMode === 'months' ? (
              <div style={{ display: "flex", gap: 6 }}>
                {[1,3,6,12].map(m => (
                  <button key={m} onClick={() => setStatementMonths(m)} style={{ ...S.sBtnS, padding: "6px 12px", background: statementMonths === m ? T.accentLight : "transparent", color: statementMonths === m ? T.accent : T.textM, borderColor: statementMonths === m ? T.accent : T.border }}>{m} oy</button>
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="date" value={fromDateStr} onChange={e => setFromDateStr(e.target.value)} style={{ ...S.sInput, padding: "6px 10px", height: 34, fontSize: 13 }} />
                <span style={{ color: T.textD }}>-</span>
                <input type="date" value={toDateStr} onChange={e => setToDateStr(e.target.value)} style={{ ...S.sInput, padding: "6px 10px", height: 34, fontSize: 13 }} />
              </div>
            )}

            <button onClick={sendStatement} style={{ ...S.sBtnS, display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: T.blue, color: "#fff", borderColor: T.blue, marginTop: 4 }}>
              <span style={{ fontSize: 16 }}>✈</span> Telegramga
            </button>
          </div>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div style={{ background: T.blueLight, padding: 14, borderRadius: 12 }}><div style={{ fontSize: 11, color: T.blue, fontWeight: 700, textTransform: "uppercase" }}>Jami xarid</div><div style={{ fontSize: 18, fontWeight: 800, color: T.blue }}>{fmt(tTotal)}</div></div>
          <div style={{ background: T.greenLight, padding: 14, borderRadius: 12 }}><div style={{ fontSize: 11, color: T.green, fontWeight: 700, textTransform: "uppercase" }}>To'landi</div><div style={{ fontSize: 18, fontWeight: 800, color: T.green }}>{fmt(tPaid)}</div></div>
          <div style={{ background: T.redLight, padding: 14, borderRadius: 12 }}><div style={{ fontSize: 11, color: T.red, fontWeight: 700, textTransform: "uppercase" }}>Nasiya</div><div style={{ fontSize: 18, fontWeight: 800, color: T.red }}>{fmt(tDebt)}</div></div>
        </div>

        <div style={{ overflowX: "auto", border: `1px solid ${T.border}`, borderRadius: 12 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.cardAlt }}><th style={{ textAlign:"left", padding:"10px", color:T.textM }}>Sana/Vaqt</th><th style={{ textAlign:"left", padding:"10px", color:T.textM }}>Mahsulot</th><th style={{ textAlign:"left", padding:"10px", color:T.textM }}>Soni</th><th style={{ textAlign:"left", padding:"10px", color:T.textM }}>Summa</th><th style={{ textAlign:"left", padding:"10px", color:T.textM }}>T'olov tipi</th></tr>
            </thead>
            <tbody>
              {statementSales.map(s => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                  <td style={{ padding:"10px", color:T.textD }}>{s.date.slice(5)} {s.time}</td>
                  <td style={{ padding:"10px", fontWeight:600 }}>{s.productName}</td>
                  <td style={{ padding:"10px" }}>{s.qty}</td>
                  <td style={{ padding:"10px", fontWeight:700 }}>{fmt(s.total)}</td>
                  <td style={{ padding:"10px" }}>{s.payType === "naqd" ? "Naqd: "+fmt(s.paidAmount) : s.payType==="qarz" ? "Qarz: "+fmt(s.total) : `Naqd: ${fmt(s.paidAmount)}, Qarz: ${fmt(s.debtAmount)}`}</td>
                </tr>
              ))}
              {statementSales.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: T.textD }}>Bu davrda ma'lumot yo'q</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
