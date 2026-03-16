import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import * as S from '../styles';
import { T } from '../constants';
import { fmt, getToday, filterSales, sumF } from '../utils';
import { StatCard } from '../components';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';

export const ReportsPage = () => {
  const { sales, expenses, customers, getTotalDebt, getTotalDealerDebt } = useStorage();
  
  const [reportRange, setReportRange] = useState("14d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  
  const today = getToday();
  const d = new Date();
  
  let fDate = today, tDate = today;
  if (reportRange === "7d") { d.setDate(d.getDate() - 7); fDate = d.toISOString().split("T")[0]; }
  else if (reportRange === "14d") { d.setDate(d.getDate() - 14); fDate = d.toISOString().split("T")[0]; }
  else if (reportRange === "30d") { d.setDate(d.getDate() - 30); fDate = d.toISOString().split("T")[0]; }
  else if (reportRange === "1y") { d.setFullYear(d.getFullYear() - 1); fDate = d.toISOString().split("T")[0]; }
  else if (reportRange === "custom") { fDate = customFrom || today; tDate = customTo || today; }

  const rs = filterSales(sales, fDate, tDate);
  const re = expenses.filter(e => e.date >= fDate && e.date <= tDate);
  
  const rRev = sumF(rs, "total");
  const rProf = sumF(rs, "profit");
  const rExp = sumF(re, "amount");
  const rNet = rProf - rExp;
  
  // Prepare chart data (Group sales by date)
  const chartDataRaw = rs.reduce((acc: any, s: any) => {
    if (!acc[s.date]) acc[s.date] = { date: s.date.slice(-5), revenue: 0, profit: 0, expense: 0 };
    acc[s.date].revenue += s.total;
    acc[s.date].profit += s.profit;
    return acc;
  }, {});
  re.forEach(e => {
    if (!chartDataRaw[e.date]) chartDataRaw[e.date] = { date: e.date.slice(-5), revenue: 0, profit: 0, expense: 0 };
    chartDataRaw[e.date].expense += e.amount;
  });
  const chartData = Object.values(chartDataRaw).sort((a: any, b: any) => a.date.localeCompare(b.date));
  
  const topProds = Object.values(rs.reduce((acc: any, s: any) => {
    if (!acc[s.productId]) acc[s.productId] = { id: s.productId, name: s.productName, qty: 0, revenue: 0, profit: 0 };
    acc[s.productId].qty += s.qty; acc[s.productId].revenue += s.total; acc[s.productId].profit += s.profit;
    return acc;
  }, {})).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 10);

  const bestCusts = Object.values(rs.reduce((acc: any, s: any) => {
    if (s.customerId === 0) return acc;
    if (!acc[s.customerId]) acc[s.customerId] = { id: s.customerId, name: s.customerName, qty: 0, revenue: 0, debt: customers.find(c => c.id === s.customerId)?.balance || 0 };
    acc[s.customerId].qty += s.qty; acc[s.customerId].revenue += s.total;
    return acc;
  }, {})).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Kengaytirilgan hisobot</h2>
      </div>

      <div style={{ ...S.sCard, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        {[{id:"7d",l:"7 kun"},{id:"14d",l:"14 kun"},{id:"30d",l:"1 oy"},{id:"1y",l:"1 yil"},{id:"custom",l:"Boshqa sana"}].map(r => (
          <button key={r.id} onClick={() => setReportRange(r.id)} style={{ ...S.sBtnS, background: reportRange === r.id ? T.accentLight : "transparent", color: reportRange === r.id ? T.accent : T.textM, borderColor: reportRange === r.id ? T.accent : T.border, fontWeight: reportRange === r.id ? 700 : 500 }}>{r.l}</button>
        ))}
        {reportRange === "custom" && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 10 }}>
            <input type="date" style={{ ...S.sInput, width: "auto" }} value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            <span>-</span>
            <input type="date" style={{ ...S.sInput, width: "auto" }} value={customTo} onChange={e => setCustomTo(e.target.value)} />
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
        <StatCard title="Tushum (Aylanma)" value={fmt(rRev)} color={T.blue} icon="◎" />
        <StatCard title="Sof Foyda" value={fmt(rNet)} color={rNet >= 0 ? T.green : T.red} icon="△" />
        <StatCard title="Xarajatlar" value={fmt(rExp)} color={T.red} icon="▣" />
        <StatCard title="Mijozlar qarzi" value={fmt(Math.abs(getTotalDebt()))} color={T.accent} icon="◈" />
        <StatCard title="Dillerdan qarzimiz" value={fmt(Math.abs(getTotalDealerDebt()))} color={T.orange} icon="◇" />
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 24 }}>
        {/* Sales Trend Chart */}
        <div style={{ flex: 1, minWidth: 320, ...S.sCard }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>Daromad va Xarajat Trendi</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.blue} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={T.blue} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.red} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={T.red} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke={T.textD} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={T.textD} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: T.cardAlt, borderColor: T.borderLight, borderRadius: 8, color: T.text }} itemStyle={{ fontWeight: 700 }} formatter={(v: number) => fmt(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                <Area type="monotone" dataKey="revenue" name="Tushum" stroke={T.blue} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expense" name="Xarajat" stroke={T.red} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div style={{ flex: 1, minWidth: 320, ...S.sCard }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>Top Mahsulotlar (Sotuv Haajmi)</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProds.slice(0, 5)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke={T.textD} fontSize={11} tickLine={false} axisLine={false} width={100} />
                <YAxis stroke={T.textD} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" stroke={T.borderLight} vertical={false} />
                <Tooltip cursor={{ fill: T.cardAlt }} contentStyle={{ backgroundColor: T.cardAlt, borderColor: T.borderLight, borderRadius: 8, color: T.text }} itemStyle={{ fontWeight: 700 }} formatter={(v: number) => fmt(v)} />
                <Bar dataKey="revenue" name="Tushum" fill={T.accent} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={S.sCard}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>Top 10 Xaridorgir tovarlar</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: "left", padding: "8px 0", color: T.textM }}>Mahsulot</th><th style={{ textAlign: "right", padding: "8px 0", color: T.textM }}>Soni</th><th style={{ textAlign: "right", padding: "8px 0", color: T.textM }}>Summa</th><th style={{ textAlign: "right", padding: "8px 0", color: T.textM }}>Foyda</th>
                  </tr>
                </thead>
                <tbody>
                  {topProds.map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                      <td style={{ padding: "10px 0", fontWeight: 700 }}>{p.name}</td>
                      <td style={{ padding: "10px 0", textAlign: "right" }}>{p.qty}</td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: T.blue, fontWeight: 700 }}>{fmt(p.revenue)}</td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: T.green, fontWeight: 700 }}>{fmt(p.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: 320 }}>
          <div style={S.sCard}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16 }}>Top 5 Eng faol doimiy mijozlar</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                    <th style={{ textAlign: "left", padding: "8px 0", color: T.textM }}>Mijoz</th><th style={{ textAlign: "right", padding: "8px 0", color: T.textM }}>Xarid (Soni)</th><th style={{ textAlign: "right", padding: "8px 0", color: T.textM }}>Xarid (Sum)</th><th style={{ textAlign: "right", padding: "8px 0", color: T.textM }}>Joriy Balans</th>
                  </tr>
                </thead>
                <tbody>
                  {bestCusts.map((c: any) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                      <td style={{ padding: "10px 0", fontWeight: 700 }}>{c.name}</td>
                      <td style={{ padding: "10px 0", textAlign: "right" }}>{c.qty} marta</td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: T.accent, fontWeight: 700 }}>{fmt(c.revenue)}</td>
                      <td style={{ padding: "10px 0", textAlign: "right", color: c.debt < 0 ? T.red : T.textM }}>{fmt(Math.abs(c.debt))} {c.debt < 0 ? "(Q)" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
