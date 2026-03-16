import { useState } from 'react';
import { T } from '../constants';
import * as S from '../styles';
import { fmt, getToday, filterSales, sumF } from '../utils';

interface StatementModalProps {
  show: boolean;
  onClose: () => void;
  customer: any;
  sales: any[];
}

export const StatementModal = ({ show, onClose, customer, sales }: StatementModalProps) => {
  const [statementMonths, setStatementMonths] = useState(3);
  if (!show || !customer) return null;

  const today = getToday();
  const d = new Date(); d.setMonth(d.getMonth() - statementMonths);
  const fromDate = d.toISOString().split("T")[0];
  const statementSales = sales.filter(s => s.customerId === customer.id && s.date >= fromDate && s.date <= today).sort((a,b) => (a.date+a.time > b.date+b.time ? 1 : -1));
  const tTotal = sumF(statementSales, "total"), tPaid = sumF(statementSales, "paidAmount"), tDebt = sumF(statementSales, "debtAmount");

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(28,25,23,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(8px)" }} onClick={onClose}>
      <div style={{ background: T.card, borderRadius: 24, padding: 32, width: "95%", maxWidth: 800, boxShadow: T.shadowXl, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Mijoz hisob-kitobi (Sverka)</h3>
          <button onClick={onClose} style={{ background: T.cardAlt, border: "none", color: T.textM, fontSize: 18, cursor: "pointer", width: 36, height: 36, borderRadius: 10 }}>✕</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{customer.name}</div>
            <div style={{ color: T.textD, fontSize: 13 }}>{customer.phone}</div>
            <div style={{ marginTop: 8, fontSize: 14 }}>Joriy balans: <span style={{ fontWeight: 800, color: customer.balance < 0 ? T.red : T.green }}>{fmt(Math.abs(customer.balance))} so'm {customer.balance < 0 ? "(Qarz)" : "(Haqdor)"}</span></div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,3,6,12].map(m => (
              <button key={m} onClick={() => setStatementMonths(m)} style={{ ...S.sBtnS, padding: "6px 12px", background: statementMonths === m ? T.accentLight : "transparent", color: statementMonths === m ? T.accent : T.textM, borderColor: statementMonths === m ? T.accent : T.border }}>{m} oy</button>
            ))}
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
