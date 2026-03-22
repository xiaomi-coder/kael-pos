import { useState } from 'react';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import * as S from '../styles';
import { T, EXPENSE_CATEGORIES, VEHICLE_EXPENSE_CATS } from '../constants';
import { Modal, FL } from '../components';
import { fmt, getToday, nowTime } from '../utils';

// Vehicles stored as expenses with category='v_register', plate in vehiclePlate, model in description
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

  // ── VEHICLES ──────────────────────────────────────────────────────────────
  // Registered vehicles stored as special expense entries (category = 'v_register')
  const registeredVehicles = expenses.filter(e => e.category === 'v_register' && e.vehiclePlate);

  // Vehicle expenses (all expenses with vehiclePlate that are NOT registration entries)
  const allVehicleExpenses = expenses.filter(e => e.vehiclePlate && e.category !== 'v_register');

  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ plate: '', model: '' });

  const [showVExpModal, setShowVExpModal] = useState(false);
  const [vExpForm, setVExpForm] = useState({ plate: '', category: 'metan', amount: '', description: '', date: today });

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  // Date filter for vehicle expenses
  const [vFromDate, setVFromDate] = useState(d30.toISOString().split('T')[0]);
  const [vToDate, setVToDate] = useState(today);

  const handleRegisterVehicle = () => {
    if (!regForm.plate.trim()) return;
    const plate = regForm.plate.trim().toUpperCase();
    // Avoid duplicates
    if (registeredVehicles.some(v => v.vehiclePlate === plate)) {
      alert('Bu raqamli moshina allaqachon ro\'yxatda bor!');
      return;
    }
    setExpenses(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1,
      category: 'v_register', categoryLabel: 'Moshina',
      amount: 0, description: regForm.model,
      date: today, time: nowTime(), user: currentUser?.name || '?',
      vehiclePlate: plate,
    }, ...prev]);
    logActivity(currentUser?.name || '?', `Yangi moshina qo'shildi: ${plate} (${regForm.model})`, today, nowTime());
    setRegForm({ plate: '', model: '' });
    setShowRegModal(false);
  };

  const handleAddVehicleExpense = () => {
    if (!vExpForm.plate || !vExpForm.amount) return;
    const cat = VEHICLE_EXPENSE_CATS.find(c => c.id === vExpForm.category);
    setExpenses(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1,
      category: vExpForm.category, categoryLabel: cat?.label,
      amount: Number(vExpForm.amount), description: vExpForm.description,
      date: vExpForm.date || today, time: nowTime(), user: currentUser?.name || '?',
      vehiclePlate: vExpForm.plate,
    }, ...prev]);
    logActivity(currentUser?.name || '?', `Moshina (${vExpForm.plate}) — ${cat?.label}: ${fmt(vExpForm.amount)}`, vExpForm.date || today, nowTime());
    setVExpForm(f => ({ ...f, amount: '', description: '', date: today }));
    setShowVExpModal(false);
  };

  const getVehicleStats = (plate: string) => {
    const exps = allVehicleExpenses.filter(e => e.vehiclePlate === plate && e.date >= vFromDate && e.date <= vToDate);
    const income = exps.filter(e => e.category === 'v_daromad').reduce((s, e) => s + e.amount, 0);
    const cost = exps.filter(e => e.category !== 'v_daromad').reduce((s, e) => s + e.amount, 0);
    return { income, cost, profit: income - cost, entries: exps };
  };

  const selStats = selectedVehicle ? getVehicleStats(selectedVehicle) : null;
  const selVehicle = registeredVehicles.find(v => v.vehiclePlate === selectedVehicle);

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
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={tabStyle(activeTab === 'xarajatlar')} onClick={() => setActiveTab('xarajatlar')}>📋 Xarajatlar</button>
          <button style={tabStyle(activeTab === 'mashinalar')} onClick={() => setActiveTab('mashinalar')}>🚛 Mashinalar</button>
        </div>
      </div>

      {/* ── GENERAL EXPENSES TAB ── */}
      {activeTab === 'xarajatlar' && (
        <>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20, justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', background: T.card, padding: '4px 8px', borderRadius: 12, border: `1px solid ${T.border}` }}>
              <span>📅</span>
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
        <div style={{ display: 'grid', gridTemplateColumns: selectedVehicle ? '280px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>

          {/* Left: vehicle registry */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Mashinalar ({registeredVehicles.length})</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...S.sBtnS, fontSize: 12 }} onClick={() => { setRegForm({ plate: '', model: '' }); setShowRegModal(true); }}>+ Moshina</button>
                {registeredVehicles.length > 0 && (
                  <button style={{ ...S.sBtn, fontSize: 12, padding: '6px 14px' }} onClick={() => { setVExpForm(f => ({ ...f, plate: selectedVehicle || '', date: today })); setShowVExpModal(true); }}>+ Xarajat</button>
                )}
              </div>
            </div>

            {registeredVehicles.length === 0 ? (
              <div style={{ ...S.sCard, textAlign: 'center', padding: 30, color: T.textD }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🚛</div>
                <div style={{ marginBottom: 14 }}>Hali moshina qo'shilmagan</div>
                <button style={S.sBtn} onClick={() => setShowRegModal(true)}>Birinchi mashinani qo'shing</button>
              </div>
            ) : (
              registeredVehicles.map(v => {
                const stats = getVehicleStats(v.vehiclePlate!);
                const isSelected = selectedVehicle === v.vehiclePlate;
                return (
                  <div key={v.id} onClick={() => setSelectedVehicle(isSelected ? null : v.vehiclePlate!)}
                    style={{ ...S.sCard, marginBottom: 10, cursor: 'pointer', border: `2px solid ${isSelected ? T.accent : T.border}`, background: isSelected ? T.accentLight : T.card }}>
                    <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 2 }}>🚛 {v.vehiclePlate}</div>
                    {v.description && <div style={{ fontSize: 12, color: T.textD, marginBottom: 6 }}>{v.description}</div>}
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <span style={{ color: T.red }}>📉 {fmt(stats.cost)}</span>
                      <span style={{ color: T.green }}>📈 {fmt(stats.income)}</span>
                    </div>
                    <div style={{ marginTop: 4, fontWeight: 700, fontSize: 13, color: stats.profit >= 0 ? T.green : T.red }}>
                      {stats.profit >= 0 ? '✅' : '⚠️'} {fmt(Math.abs(stats.profit))} {stats.profit < 0 ? '(zarar)' : 'foyda'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: vehicle detail */}
          {selectedVehicle && selStats && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>🚛 {selectedVehicle}</h3>
                  {selVehicle?.description && <div style={{ fontSize: 13, color: T.textD }}>{selVehicle.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {/* Date filter */}
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: T.card, padding: '4px 8px', borderRadius: 10, border: `1px solid ${T.border}`, fontSize: 12 }}>
                    <span>📅</span>
                    <input type="date" value={vFromDate} onChange={e => setVFromDate(e.target.value)} style={{ ...S.sInput, border: 'none', background: 'transparent', padding: '2px', width: 100, fontSize: 12 }} />
                    <span style={{ color: T.textD }}>—</span>
                    <input type="date" value={vToDate} onChange={e => setVToDate(e.target.value)} style={{ ...S.sInput, border: 'none', background: 'transparent', padding: '2px', width: 100, fontSize: 12 }} />
                  </div>
                  <button style={{ ...S.sBtn, fontSize: 13 }} onClick={() => { setVExpForm(f => ({ ...f, plate: selectedVehicle, date: today })); setShowVExpModal(true); }}>+ Xarajat / Daromad</button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
                <div style={{ ...S.sCard, background: '#FEE2E2', borderLeft: `4px solid ${T.red}` }}>
                  <div style={{ fontSize: 11, color: T.red, fontWeight: 700 }}>JAMI XARAJAT</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.red, marginTop: 4 }}>{fmt(selStats.cost)}</div>
                </div>
                <div style={{ ...S.sCard, background: '#D1FAE5', borderLeft: `4px solid ${T.green}` }}>
                  <div style={{ fontSize: 11, color: T.green, fontWeight: 700 }}>DAROMAD</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.green, marginTop: 4 }}>{fmt(selStats.income)}</div>
                </div>
                <div style={{ ...S.sCard, background: selStats.profit >= 0 ? '#D1FAE5' : '#FEE2E2', borderLeft: `4px solid ${selStats.profit >= 0 ? T.green : T.red}` }}>
                  <div style={{ fontSize: 11, color: selStats.profit >= 0 ? T.green : T.red, fontWeight: 700 }}>SOFF FOYDA</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: selStats.profit >= 0 ? T.green : T.red, marginTop: 4 }}>{selStats.profit >= 0 ? '+' : ''}{fmt(selStats.profit)}</div>
                </div>
              </div>

              {/* Entries */}
              <div style={{ ...S.sCard, padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.cardAlt }}>
                      {['Sana', 'Tur', 'Izoh', 'Summa'].map(h => <th key={h} style={{ textAlign: 'left', padding: '10px 14px', color: T.textM, fontWeight: 700, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {selStats.entries.sort((a, b) => b.date.localeCompare(a.date)).map(e => {
                      const cat = VEHICLE_EXPENSE_CATS.find(c => c.id === e.category) || VEHICLE_EXPENSE_CATS[7];
                      const isIncome = e.category === 'v_daromad';
                      return (
                        <tr key={e.id} style={{ borderBottom: `1px solid ${T.borderLight}` }}>
                          <td style={{ padding: '10px 14px', color: T.textD }}>{e.date}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${cat.color}15`, color: cat.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                              {cat.icon} {cat.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: T.textM }}>{e.description || '—'}</td>
                          <td style={{ padding: '10px 14px', fontWeight: 700, color: isIncome ? T.green : T.red }}>{isIncome ? '+' : '-'}{fmt(e.amount)}</td>
                        </tr>
                      );
                    })}
                    {selStats.entries.length === 0 && <tr><td colSpan={4} style={{ padding: 20, textAlign: 'center', color: T.textD }}>Tanlangan davrda yozuvlar yo'q</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Placeholder when no vehicle selected */}
          {!selectedVehicle && registeredVehicles.length > 0 && (
            <div style={{ ...S.sCard, textAlign: 'center', padding: 40, color: T.textD }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👈</div>
              <div>Mashinani tanlang (batafsil ko'rish uchun)</div>
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

      {/* Register Vehicle Modal */}
      <Modal show={showRegModal} onClose={() => setShowRegModal(false)} title="Yangi moshina qo'shish">
        <FL label="Moshina raqami (davlat raqami)">
          <input style={S.sInput} value={regForm.plate} onChange={e => setRegForm({ ...regForm, plate: e.target.value.toUpperCase() })} placeholder="01 A 123 BB" autoFocus />
        </FL>
        <FL label="Moshina rusumi (model)">
          <input style={S.sInput} value={regForm.model} onChange={e => setRegForm({ ...regForm, model: e.target.value })} placeholder="Nexia, Cobalt, Damas..." />
        </FL>
        <button style={{ ...S.sBtn, width: '100%', padding: 14, marginTop: 10, borderRadius: 14 }} onClick={handleRegisterVehicle}>Qo'shish</button>
      </Modal>

      {/* Vehicle Expense/Income Modal */}
      <Modal show={showVExpModal} onClose={() => setShowVExpModal(false)} title="Moshina xarajati / daromadi">
        <FL label="Mashinani tanlang">
          <select style={S.sSelect} value={vExpForm.plate} onChange={e => setVExpForm({ ...vExpForm, plate: e.target.value })}>
            <option value="">— Tanlang —</option>
            {registeredVehicles.map(v => <option key={v.vehiclePlate} value={v.vehiclePlate!}>{v.vehiclePlate} {v.description ? `— ${v.description}` : ''}</option>)}
          </select>
        </FL>
        <FL label="Tur">
          <select style={S.sSelect} value={vExpForm.category} onChange={e => setVExpForm({ ...vExpForm, category: e.target.value })}>
            {VEHICLE_EXPENSE_CATS.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
          </select>
        </FL>
        <FL label="Summa"><input type="number" style={S.sInput} value={vExpForm.amount} onChange={e => setVExpForm({ ...vExpForm, amount: e.target.value })} placeholder="0" /></FL>
        <FL label="Izoh (ixtiyoriy)"><input style={S.sInput} value={vExpForm.description} onChange={e => setVExpForm({ ...vExpForm, description: e.target.value })} placeholder="Metan to'ldirish, ta'mirlash..." /></FL>
        <FL label="Sana"><input type="date" style={S.sInput} value={vExpForm.date} onChange={e => setVExpForm({ ...vExpForm, date: e.target.value })} /></FL>
        <button style={{ ...S.sBtn, width: '100%', padding: 14, marginTop: 10, borderRadius: 14 }} onClick={handleAddVehicleExpense}>Saqlash</button>
      </Modal>
    </div>
  );
};
