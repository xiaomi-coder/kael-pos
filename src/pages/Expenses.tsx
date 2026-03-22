import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import * as S from '../styles';
import { T, EXPENSE_CATEGORIES, VEHICLE_EXPENSE_CATS } from '../constants';
import { Modal, FL } from '../components';
import { fmt, getToday, nowTime } from '../utils';

export const ExpensesPage = () => {
  const { expenses, setExpenses, logActivity } = useStorage();
  const { currentUser } = useAuth();

  const today = getToday();
  const [activeTab, setActiveTab] = useState<'xarajatlar' | 'mashinalar'>('xarajatlar');

  // ── GENERAL EXPENSES ──────────────────────────────────────────────────────
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState({ category: 'moshina', amount: '', description: '', date: today });

  const d30 = new Date(); d30.setDate(d30.getDate() - 30);
  const [fromDate, setFromDate] = useState(d30.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today);

  const filteredExp = expenses.filter(e => !e.vehiclePlate && e.date >= fromDate && e.date <= toDate);
  const totalFiltered = filteredExp.reduce((s, e) => s + e.amount, 0);

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
      date: expForm.date || today, time: nowTime(), user: currentUser?.name || '?'
    }, ...prev]);
    logActivity(currentUser?.name || '?', `Xarajat: ${cat?.label} — ${fmt(expForm.amount)}`, expForm.date || today, nowTime());
    setExpForm({ category: 'moshina', amount: '', description: '', date: today });
    setShowExpModal(false);
  };

  // ── VEHICLE SECTION ────────────────────────────────────────────────────────
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [vForm, setVForm] = useState({ plate: '', category: 'metan', amount: '', description: '', date: today });

  const vehicleExpenses = expenses.filter(e => !!e.vehiclePlate);
  const vehicles = [...new Set(vehicleExpenses.map(e => e.vehiclePlate as string))];

  const getVehicleStats = (plate: string) => {
    const exps = vehicleExpenses.filter(e => e.vehiclePlate === plate);
    const income = exps.filter(e => e.category === 'v_daromad').reduce((s, e) => s + e.amount, 0);
    const cost = exps.filter(e => e.category !== 'v_daromad').reduce((s, e) => s + e.amount, 0);
    return { income, cost, profit: income - cost, entries: exps };
  };

  const handleAddVehicleExpense = () => {
    if (!vForm.plate.trim() || !vForm.amount) return;
    const cat = VEHICLE_EXPENSE_CATS.find(c => c.id === vForm.category);
    const plate = vForm.plate.trim().toUpperCase();
    setExpenses(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1,
      category: vForm.category, categoryLabel: cat?.label,
      amount: Number(vForm.amount), description: vForm.description,
      date: vForm.date || today, time: nowTime(), user: currentUser?.name || '?',
      vehiclePlate: plate,
    }, ...prev]);
    logActivity(currentUser?.name || '?', `Moshina (${plate}) — ${cat?.label}: ${fmt(vForm.amount)}`, vForm.date || today, nowTime());
    setVForm(f => ({ ...f, amount: '', description: '', date: today }));
    setSelectedVehicle(plate);
    setShowVehicleModal(false);
  };

  const selStats = selectedVehicle ? getVehicleStats(selectedVehicle) : null;

  const tabStyle = (active: boolean) => ({
    padding: '8px 22px', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer',
    background: active ? T.accent : T.card,
    color: active ? '#fff' : T.textM,
    border: `1px solid ${active ? T.accent : T.border}`,
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Xarajatlar</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button style={tabStyle(activeTab === 'xarajatlar')} onClick={() => setActiveTab('xarajatlar')}>📋 Xarajatlar</button>
          <button style={tabStyle(activeTab === 'mashinalar')} onClick={() => setActiveTab('mashinalar')}>🚛 Mashinalar</button>
        </div>
      </div>

      {/* ── GENERAL EXPENSES TAB ── */}
      {activeTab === 'xarajatlar' && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20, justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: T.card, padding: '4px 8px', borderRadius: 12, border: `1px solid ${T.border}` }}>
              <span style={{ fontSize: 18 }}>📅</span>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} style={{ ...S.sInput, border: 'none', background: 'transparent', padding: '4px 2px', width: 110, fontSize: 13 }} />
              <span style={{ color: T.textD }}>—</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} style={{ ...S.sInput, border: 'none', background: 'transparent', padding: '4px 2px', width: 110, fontSize: 13 }} />
            </div>
            <button style={S.sBtn} onClick={() => { setExpForm({ ...expForm, date: today }); setShowExpModal(true); }}>+ Xarajat qo'shish</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div style={{ ...S.sCard }}>
              <div style={{ fontSize: 12, color: T.textM, fontWeight: 700, textTransform: 'uppercase' }}>Jami Xarajat</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: T.red, marginTop: 4 }}>{fmt(totalFiltered)}</div>
            </div>
            {Object.keys(catSummary).length > 0 && (
              <div style={{ ...S.sCard }}>
                <div style={{ fontSize: 12, color: T.textM, fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Kategoriyalar</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.keys(catSummary).sort((a, b) => catSummary[b] - catSummary[a]).map(catId => {
                    const c = EXPENSE_CATEGORIES.find(x => x.id === catId);
                    if (!c) return null;
                    return (
                      <div key={catId} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${c.color}15`, padding: '6px 10px', borderRadius: 8, fontSize: 12 }}>
                        <span>{c.icon}</span><span style={{ fontWeight: 600, color: c.color }}>{c.label}:</span> <span style={{ fontWeight: 800 }}>{fmt(catSummary[catId])}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ ...S.sCard, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.cardAlt }}>
                  {['Sana', 'Kategoriya', 'Izoh', 'Summa', 'Kim'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: T.textM, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredExp.map(e => {
                  const cat = EXPENSE_CATEGORIES.find(c => c.id === e.category) || EXPENSE_CATEGORIES[6];
                  return (
                    <tr key={e.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                      <td style={{ padding: '12px 14px', color: T.textD }}>{e.date} {e.time}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: `${cat.color}15`, color: cat.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                          {cat.icon} {cat.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>{e.description || '—'}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: T.red }}>{fmt(e.amount)}</td>
                      <td style={{ padding: '12px 14px', color: T.textD, fontSize: 11 }}>{e.user}</td>
                    </tr>
                  );
                })}
                {filteredExp.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: T.textD }}>Ushbu davrda xarajatlar yo'q</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── VEHICLES TAB ── */}
      {activeTab === 'mashinalar' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedVehicle ? '260px 1fr' : '1fr', gap: 20 }}>
          {/* Vehicles list sidebar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Mashinalar</div>
              <button style={{ ...S.sBtnS, fontSize: 12, padding: '6px 12px' }} onClick={() => { setVForm({ plate: '', category: 'metan', amount: '', description: '', date: today }); setShowVehicleModal(true); }}>+ Qo'shish</button>
            </div>
            {vehicles.length === 0 && (
              <div style={{ ...S.sCard, textAlign: 'center', color: T.textD, padding: 30 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🚛</div>
                <div>Hali moshina qo'shilmagan</div>
                <button style={{ ...S.sBtn, marginTop: 14 }} onClick={() => { setVForm({ plate: '', category: 'metan', amount: '', description: '', date: today }); setShowVehicleModal(true); }}>Birinchi mashinani qo'shing</button>
              </div>
            )}
            {vehicles.map(plate => {
              const st = getVehicleStats(plate);
              const isSelected = selectedVehicle === plate;
              return (
                <div key={plate} onClick={() => setSelectedVehicle(isSelected ? null : plate)}
                  style={{ ...S.sCard, marginBottom: 10, cursor: 'pointer', border: `2px solid ${isSelected ? T.accent : T.border}`, background: isSelected ? T.accentLight : T.card }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: T.text, marginBottom: 6 }}>🚛 {plate}</div>
                  <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                    <span style={{ color: T.red }}>Xarajat: {fmt(st.cost)}</span>
                    <span style={{ color: T.green }}>Daromad: {fmt(st.income)}</span>
                  </div>
                  <div style={{ marginTop: 4, fontWeight: 700, fontSize: 13, color: st.profit >= 0 ? T.green : T.red }}>
                    {st.profit >= 0 ? '✅' : '⚠️'} Foyda: {fmt(Math.abs(st.profit))} {st.profit < 0 ? '(zarar)' : ''}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vehicle detail */}
          {selectedVehicle && selStats && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>🚛 {selectedVehicle}</h3>
                <button style={{ ...S.sBtn, fontSize: 13 }} onClick={() => { setVForm({ plate: selectedVehicle, category: 'metan', amount: '', description: '', date: today }); setShowVehicleModal(true); }}>+ Xarajat / Daromad</button>
              </div>

              {/* Stats cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                <div style={{ ...S.sCard, background: '#FEE2E2', borderLeft: `4px solid ${T.red}` }}>
                  <div style={{ fontSize: 11, color: T.red, fontWeight: 700 }}>JAMI XARAJAT</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.red, marginTop: 4 }}>{fmt(selStats.cost)}</div>
                </div>
                <div style={{ ...S.sCard, background: '#D1FAE5', borderLeft: `4px solid ${T.green}` }}>
                  <div style={{ fontSize: 11, color: T.green, fontWeight: 700 }}>DAROMAD (TASHISH)</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.green, marginTop: 4 }}>{fmt(selStats.income)}</div>
                </div>
                <div style={{ ...S.sCard, background: selStats.profit >= 0 ? '#D1FAE5' : '#FEE2E2', borderLeft: `4px solid ${selStats.profit >= 0 ? T.green : T.red}` }}>
                  <div style={{ fontSize: 11, color: selStats.profit >= 0 ? T.green : T.red, fontWeight: 700 }}>SOFF FOYDA</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: selStats.profit >= 0 ? T.green : T.red, marginTop: 4 }}>{selStats.profit >= 0 ? '+' : ''}{fmt(selStats.profit)}</div>
                </div>
              </div>

              {/* Entries table */}
              <div style={{ ...S.sCard, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.cardAlt }}>
                      {['Sana', 'Tur', 'Izoh', 'Summa'].map(h => <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: T.textM, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {selStats.entries.sort((a, b) => b.date.localeCompare(a.date)).map(e => {
                      const cat = VEHICLE_EXPENSE_CATS.find(c => c.id === e.category) || VEHICLE_EXPENSE_CATS[7];
                      const isIncome = e.category === 'v_daromad';
                      return (
                        <tr key={e.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                          <td style={{ padding: '12px 14px', color: T.textD }}>{e.date}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${cat.color}15`, color: cat.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                              {cat.icon} {cat.label}
                            </span>
                          </td>
                          <td style={{ padding: '12px 14px', color: T.textM }}>{e.description || '—'}</td>
                          <td style={{ padding: '12px 14px', fontWeight: 700, color: isIncome ? T.green : T.red }}>
                            {isIncome ? '+' : '-'}{fmt(e.amount)}
                          </td>
                        </tr>
                      );
                    })}
                    {selStats.entries.length === 0 && <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: T.textD }}>Hali yozuvlar yo'q</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* General Expense Modal */}
      <Modal show={showExpModal} onClose={() => setShowExpModal(false)} title="Xarajat qo'shish">
        <FL label="Kategoriya">
          <select style={S.sSelect} value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}>
            {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </FL>
        <FL label="Summa"><input type="number" style={S.sInput} value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })} autoFocus /></FL>
        <FL label="Izoh"><input style={S.sInput} value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} /></FL>
        <FL label="Sana"><input type="date" style={S.sInput} value={expForm.date} onChange={e => setExpForm({ ...expForm, date: e.target.value })} /></FL>
        <button style={{ ...S.sBtn, width: '100%', padding: 14, marginTop: 10, borderRadius: 14 }} onClick={handleAddExpense}>Saqlash</button>
      </Modal>

      {/* Vehicle Expense/Income Modal */}
      <Modal show={showVehicleModal} onClose={() => setShowVehicleModal(false)} title="Moshina xarajati / daromadi">
        <FL label="Moshina raqami">
          <input style={S.sInput} value={vForm.plate} onChange={e => setVForm({ ...vForm, plate: e.target.value.toUpperCase() })} placeholder="Misol: 01 A 123 BB" autoFocus />
        </FL>
        <FL label="Tur">
          <select style={S.sSelect} value={vForm.category} onChange={e => setVForm({ ...vForm, category: e.target.value })}>
            {VEHICLE_EXPENSE_CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </FL>
        <FL label="Summa"><input type="number" style={S.sInput} value={vForm.amount} onChange={e => setVForm({ ...vForm, amount: e.target.value })} /></FL>
        <FL label="Izoh (ixtiyoriy)"><input style={S.sInput} value={vForm.description} onChange={e => setVForm({ ...vForm, description: e.target.value })} placeholder="Metan to'ldirish, g'ildirak almashtirish..." /></FL>
        <FL label="Sana"><input type="date" style={S.sInput} value={vForm.date} onChange={e => setVForm({ ...vForm, date: e.target.value })} /></FL>
        <button style={{ ...S.sBtn, width: '100%', padding: 14, marginTop: 10, borderRadius: 14 }} onClick={handleAddVehicleExpense}>Saqlash</button>
      </Modal>
    </div>
  );
};
