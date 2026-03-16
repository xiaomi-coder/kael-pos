import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import * as S from '../styles';
import { StatCard } from '../components';
import { T } from '../constants';
import { exportToCSV, fmt, filterSales, getDateRange, sumF, pctCh, getToday, sendTelegram } from '../utils';

interface DashboardProps {
  setTab: (t: string) => void;
}

export const Dashboard = ({ setTab }: DashboardProps) => {
  const { products, sales, customers, expenses, getTotalDebt } = useStorage();
  const { currentUser } = useAuth();
  const today = getToday();

  // Local calculations
  const tDebt = getTotalDebt();
  const thisWeek = filterSales(sales, getDateRange(7), today);
  const lastWeek = filterSales(sales, getDateRange(14), getDateRange(7));
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const thisMonthExpenses = expenses.filter(e => e.date >= getDateRange(30));
  const totalExpThisMonth = thisMonthExpenses.reduce((s, e) => s + e.amount, 0);

  const twR = sumF(thisWeek, "total"), lwR = sumF(lastWeek, "total");
  const twP = sumF(thisWeek, "profit"), lwP = sumF(lastWeek, "profit");
  const todaySales = sales.filter(s => s.date === today);

  const exportSales = (arr: any[], name: string) => {
    const h = ["Sana", "Vaqt", "Mijoz", "Mahsulot", "Soni", "Narx", "Summa", "Naqd", "Qarz", "Turi", "Sotuvchi"];
    exportToCSV(`${name}.csv`, [h, ...arr.map(s => [s.date, s.time, s.customerName, s.productName, s.qty, s.unitPrice, s.total, s.paidAmount, s.debtAmount, s.payType, s.user || ""])]);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Boshqaruv paneli</h2>
          <p style={{ margin: "4px 0 0", color: T.textD, fontSize: 13 }}>{today} — {currentUser?.name} ({currentUser?.role})</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {currentUser?.role === 'admin' && (
            <button style={{ ...S.sBtn, background: T.purple, borderColor: T.purple, color: "#fff", display: "flex", alignItems: "center", gap: 6 }} onClick={() => {
              const { tgBotToken, tgChatId } = useStorage.getState();
              if(!tgBotToken || !tgChatId) { alert("Sozlamalardan Telegram Bot Tokerni va Chat ID ni kiriting!"); return; }
              const ts = sumF(todaySales, "total");
              const tp = sumF(todaySales, "profit");
              const tPaid = sumF(todaySales, "paidAmount");
              const tDebtToday = sumF(todaySales, "debtAmount");
              const tExp = sumF(expenses.filter(e => e.date === today), "amount");
              const txt = `📅 <b>KUNLIK HISOBOT: ${today}</b>\\n\\n💰 <b>Jami savdo:</b> ${fmt(ts)} so'm\\n     Nasiya: ${fmt(tDebtToday)} so'm\\n     Naqd tushum: ${fmt(tPaid)} so'm\\n\\n💸 <b>Xarajatlar:</b> ${fmt(tExp)} so'm\\n\\n📊 <b>Sof Foyda:</b> ${fmt(tp - tExp)} so'm\\n\\n📦 <i>Kun yakunlandi!</i>`;
              sendTelegram(tgBotToken, tgChatId, txt);
              alert("Hisobot Telegram ga muvaffaqiyatli yuborildi!");
            }}>
              <span style={{ fontSize: 18 }}>✈</span> Kunni yopish
            </button>
          )}
          <button style={S.sBtn} onClick={() => setTab("sales")}>+ Yangi sotuv</button>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div style={{ ...S.sCard, marginBottom: 16, borderLeft: `4px solid ${T.red}`, background: T.redLight }}>
          <h4 style={{ margin: "0 0 10px", color: T.red, fontSize: 14 }}>⚠ Kam qolgan tovarlar ({lowStockProducts.length})</h4>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {lowStockProducts.map(p => (
              <div key={p.id} style={{ background: T.card, borderRadius: 10, padding: "10px 14px", border: `1px solid ${T.red}20`, minWidth: 160 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                <span style={{ fontSize: 18, fontWeight: 800, color: p.stock === 0 ? T.red : T.orange }}>{p.stock}</span>
                <span style={{ fontSize: 11, color: T.textD }}> / {p.minStock}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14, marginBottom: 20 }}>
        <StatCard title="Haftalik tushum" value={fmt(twR)} change={pctCh(twR, lwR)} color={T.accent} icon="◎" />
        <StatCard title="Haftalik foyda" value={fmt(twP)} change={pctCh(twP, lwP)} color={T.green} icon="△" />
        <StatCard title="Sotuvlar" value={thisWeek.length + " ta"} color={T.blue} icon="⊕" />
        <StatCard title="Jami qarz" value={fmt(Math.abs(tDebt))} color={T.red} icon="◈" />
        <StatCard title="Oylik xarajat" value={fmt(totalExpThisMonth)} color={T.purple} icon="▣" />
      </div>

      <div style={S.sCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Bugungi sotuvlar ({todaySales.length})</h4>
          {todaySales.length > 0 && <button style={{ ...S.sBtnS, fontSize: 11, padding: "6px 12px" }} onClick={() => exportSales(todaySales, "bugungi")}>Excel</button>}
        </div>
        
        {todaySales.length === 0 ? (
          <p style={{ color: T.textD, textAlign: "center", padding: 16 }}>Bugun sotuv yo'q</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {["Vaqt","Mijoz","Mahsulot","Soni","Summa","Holat","Kim"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 10px", color: T.textM, fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {todaySales.map(s => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                    <td style={{ padding: "10px", color: T.textD }}>{s.time}</td>
                    <td style={{ padding: "10px", color: T.text, fontWeight: 600 }}>{s.customerName}</td>
                    <td style={{ padding: "10px" }}>{s.productName}</td>
                    <td style={{ padding: "10px" }}>{s.qty}</td>
                    <td style={{ padding: "10px", color: T.accent, fontWeight: 700 }}>{fmt(s.total)}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{ background: `${s.payType === "naqd" ? T.green : s.payType === "qarz" ? T.red : T.orange}18`, color: s.payType === "naqd" ? T.green : s.payType === "qarz" ? T.red : T.orange, padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {s.payType === "naqd" ? "Naqd" : s.payType === "qarz" ? "Nasiya" : "Aralash"}
                      </span>
                    </td>
                    <td style={{ padding: "10px", color: T.textD, fontSize: 11 }}>{s.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
