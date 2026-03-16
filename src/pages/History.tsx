import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import * as S from '../styles';
import { T } from '../constants';
import { Badge, StatementModal } from '../components';
import { exportToCSV, fmt } from '../utils';

export const HistoryPage = () => {
  const { sales, customers } = useStorage();
  
  const [histSearch, setHistSearch] = useState("");
  const [histFilter, setHistFilter] = useState("all");
  const [histCustomer, setHistCustomer] = useState("");
  const [showCustStatement, setShowCustStatement] = useState<any>(null);
  const [statementMonths, setStatementMonths] = useState(3);

  let f = histFilter === "qarz" ? sales.filter(s => s.payType === "qarz") : histFilter === "naqd" ? sales.filter(s => s.payType === "naqd") : histFilter === "aralash" ? sales.filter(s => s.payType === "aralash") : sales;
  if (histCustomer) f = f.filter(s => s.customerId === Number(histCustomer));
  const displayed = histSearch ? f.filter(s => s.customerName.toLowerCase().includes(histSearch.toLowerCase()) || s.productName.toLowerCase().includes(histSearch.toLowerCase())) : f;
  const selCust = histCustomer ? customers.find(c => c.id === Number(histCustomer)) : null;

  const exportSales = (arr: any[], name: string) => {
    const h = ["Sana", "Vaqt", "Mijoz", "Mahsulot", "Soni", "Narx", "Summa", "Naqd", "Qarz", "Turi", "Sotuvchi"];
    exportToCSV(`${name}.csv`, [h, ...arr.map(s => [s.date, s.time, s.customerName, s.productName, s.qty, s.unitPrice, s.total, s.paidAmount, s.debtAmount, s.payType, s.user || ""])]);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Sotuv tarixi</h2>
        <button style={{ ...S.sBtnS, fontSize: 12 }} onClick={() => exportSales(displayed, "sotuvlar")}>Excel</button>
      </div>

      <div style={{ ...S.sCard, marginBottom: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <select style={{ ...S.sSelect, maxWidth: 250 }} value={histCustomer} onChange={e => setHistCustomer(e.target.value)}>
          <option value="">Barcha mijozlar</option>
          {customers.map(c => <option key={c.id} value={String(c.id)}>{c.name} ({c.phone})</option>)}
        </select>
        {selCust && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <div style={{ fontSize: 13 }}>
              <b>{selCust.name}</b> — <span style={{ color: T.textD }}>{selCust.phone}</span> — <span style={{ color: selCust.balance < 0 ? T.red : T.green, fontWeight: 700 }}>{fmt(selCust.balance)} so'm</span>
            </div>
            <button style={{ ...S.sBtnS, fontSize: 11, padding: "6px 12px" }} onClick={() => { setShowCustStatement(selCust); setStatementMonths(3); }}>Oylik hisobot</button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input style={{ ...S.sInput, maxWidth: 280 }} placeholder="Qidirish..." value={histSearch} onChange={e => setHistSearch(e.target.value)} />
        {[["all","Hammasi"],["naqd","Naqd"],["qarz","Nasiya"],["aralash","Aralash"]].map(([k,l]) => (
          <button key={k} onClick={() => setHistFilter(k)} style={{ ...S.sBtnS, background: histFilter === k ? T.accentLight : "transparent", color: histFilter === k ? T.accent : T.textM, borderColor: histFilter === k ? T.accent : T.border, fontWeight: histFilter === k ? 700 : 500 }}>{l}</button>
        ))}
      </div>
      <div style={{ ...S.sCard, padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.cardAlt }}>
                {["Sana","Vaqt","Mijoz","Tel","Mahsulot","Soni","Summa","Naqd","Nasiya","Turi","Kim"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 10px", color: T.textM, fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.slice(0, 100).map(s => {
                const cust = customers.find(c => c.id === s.customerId);
                return (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <td style={{ padding: "10px", color: T.textD }}>{s.date}</td>
                    <td style={{ padding: "10px", color: T.textD }}>{s.time}</td>
                    <td style={{ padding: "10px", color: T.text, fontWeight: 600 }}>{s.customerName}</td>
                    <td style={{ padding: "10px", color: T.textD, fontSize: 11 }}>{cust?.phone || ""}</td>
                    <td style={{ padding: "10px" }}>{s.productName}</td>
                    <td style={{ padding: "10px" }}>{s.qty}</td>
                    <td style={{ padding: "10px", color: T.accent, fontWeight: 700 }}>{fmt(s.total)}</td>
                    <td style={{ padding: "10px", color: T.green }}>{fmt(s.paidAmount)}</td>
                    <td style={{ padding: "10px", color: s.debtAmount > 0 ? T.red : T.textD }}>{s.debtAmount > 0 ? fmt(s.debtAmount) : "—"}</td>
                    <td style={{ padding: "10px" }}>
                      <Badge 
                        text={s.payType === "naqd" ? "Naqd" : s.payType === "qarz" ? "Nasiya" : "Aralash"} 
                        color={s.payType === "naqd" ? T.green : s.payType === "qarz" ? T.red : T.orange} 
                      />
                    </td>
                    <td style={{ padding: "10px", color: T.textD, fontSize: 11 }}>{s.user || ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <StatementModal 
        show={!!showCustStatement} 
        onClose={() => setShowCustStatement(null)} 
        customer={showCustStatement} 
        sales={sales} 
      />
    </div>
  );
};
