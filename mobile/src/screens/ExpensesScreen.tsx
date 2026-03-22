import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, ScrollView, Platform, KeyboardAvoidingView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import { T, EXPENSE_CATEGORIES, VEHICLE_EXPENSE_CATS } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { fmt, getToday, nowTime } from '../utils';

export function ExpensesScreen() {
  const { expenses, setExpenses, logActivity } = useStorage();
  const { currentUser } = useAuth();

  const today = getToday();
  const [activeTab, setActiveTab] = useState<'dokon' | 'mashinalar'>('dokon');

  // ── DO'KON XARAJATLARI ──────────────────────────────────────────────────
  const [showExpModal, setShowExpModal] = useState(false);
  const [expForm, setExpForm] = useState({ category: 'moshina', amount: '', description: '', date: today });

  const d30 = new Date(); d30.setDate(d30.getDate() - 30);
  const [fromDate, setFromDate] = useState(d30.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(today);

  const filteredExp = expenses.filter(e => !e.vehiclePlate && e.date >= fromDate && e.date <= toDate);
  const totalFiltered = filteredExp.reduce((s, e) => s + e.amount, 0);

  const handleSaveExpense = () => {
    if (!expForm.amount) { Alert.alert('Xatolik', 'Summa kiritilishi shart'); return; }
    const cat = EXPENSE_CATEGORIES.find(c => c.id === expForm.category);
    setExpenses(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1,
      category: expForm.category, categoryLabel: cat?.label,
      amount: Number(expForm.amount), description: expForm.description,
      date: expForm.date || today, time: nowTime(), user: currentUser?.name || '?'
    }, ...prev]);
    logActivity(currentUser?.name || '?', `Xarajat: ${cat?.label} — ${fmt(Number(expForm.amount))}`, expForm.date || today, nowTime());
    setExpForm({ category: 'moshina', amount: '', description: '', date: today });
    setShowExpModal(false);
  };

  // ── MASHINALAR ──────────────────────────────────────────────────────────
  // Registered vehicles (stored as expense with category='v_register')
  const registeredVehicles = expenses.filter(e => e.category === 'v_register' && e.vehiclePlate);
  const allVehicleExpenses = expenses.filter(e => e.vehiclePlate && e.category !== 'v_register');

  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ plate: '', model: '' });

  const [showVExpModal, setShowVExpModal] = useState(false);
  const [vExpForm, setVExpForm] = useState({ plate: '', category: 'metan', amount: '', description: '', date: today });

  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  const [vFromDate, setVFromDate] = useState(d30.toISOString().split('T')[0]);
  const [vToDate, setVToDate] = useState(today);

  const handleRegisterVehicle = () => {
    if (!regForm.plate.trim()) return;
    const plate = regForm.plate.trim().toUpperCase();
    if (registeredVehicles.some(v => v.vehiclePlate === plate)) {
      Alert.alert('Xato', 'Bu raqamli moshina allaqachon ro\'yxatda bor!');
      return;
    }
    setExpenses(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1,
      category: 'v_register', categoryLabel: 'Moshina',
      amount: 0, description: regForm.model,
      date: today, time: nowTime(), user: currentUser?.name || '?',
      vehiclePlate: plate,
    }, ...prev]);
    setRegForm({ plate: '', model: '' });
    setShowRegModal(false);
  };

  const handleAddVehicleExpense = () => {
    if (!vExpForm.plate || !vExpForm.amount) {
      Alert.alert('Xato', 'Moshina va summani kiriting');
      return;
    }
    const cat = VEHICLE_EXPENSE_CATS.find(c => c.id === vExpForm.category);
    setExpenses(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1,
      category: vExpForm.category, categoryLabel: cat?.label,
      amount: Number(vExpForm.amount), description: vExpForm.description,
      date: vExpForm.date || today, time: nowTime(), user: currentUser?.name || '?',
      vehiclePlate: vExpForm.plate,
    }, ...prev]);
    logActivity(currentUser?.name || '?', `Moshina (${vExpForm.plate}) — ${cat?.label}: ${fmt(Number(vExpForm.amount))}`, vExpForm.date || today, nowTime());
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

  return (
    <SafeAreaView style={S.safeArea} edges={['top']}>
      {/* Header */}
      <View style={S.headerRow}>
        <Text style={S.title}>Xarajatlar</Text>
      </View>

      {/* Tabs */}
      <View style={S.tabRow}>
        <TouchableOpacity style={[S.tab, activeTab === 'dokon' && S.tabActive]} onPress={() => setActiveTab('dokon')}>
          <Text style={[S.tabTxt, activeTab === 'dokon' && S.tabTxtActive]}>🏪 Do'kon</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[S.tab, activeTab === 'mashinalar' && S.tabActive]} onPress={() => setActiveTab('mashinalar')}>
          <Text style={[S.tabTxt, activeTab === 'mashinalar' && S.tabTxtActive]}>🚛 Mashinalar</Text>
        </TouchableOpacity>
      </View>

      {/* ── DO'KON XARAJATLARI ── */}
      {activeTab === 'dokon' && (
        <>
          <View style={S.toolRow}>
            <View style={S.dateBox}>
              <Input label="Dan" value={fromDate} onChangeText={setFromDate} style={S.dateInput} />
              <Input label="Gacha" value={toDate} onChangeText={setToDate} style={S.dateInput} />
            </View>
            <Button title="+ Qo'shish" onPress={() => { setExpForm({ ...expForm, date: today }); setShowExpModal(true); }} />
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            <View style={S.pad}>
              <Card style={S.totalCard}>
                <Text style={S.totalLabel}>Jami xarajat</Text>
                <Text style={S.totalVal}>{fmt(totalFiltered)} so'm</Text>
              </Card>
            </View>
            <View style={S.pad}>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <FlatList
                  data={filteredExp}
                  keyExtractor={item => item.id.toString()}
                  scrollEnabled={false}
                  ListEmptyComponent={<Text style={S.emptyTxt}>Xarajatlar yo'q</Text>}
                  renderItem={({ item }) => {
                    const cat = EXPENSE_CATEGORIES.find(c => c.id === item.category) || EXPENSE_CATEGORIES[6];
                    return (
                      <View style={S.expRow}>
                        <View style={{ flex: 1 }}>
                          <View style={[S.catBadge, { backgroundColor: cat.color + '20' }]}>
                            <Text>{cat.icon}</Text>
                            <Text style={[S.catBadgeTxt, { color: cat.color }]}>{cat.label}</Text>
                          </View>
                          <Text style={S.expDesc}>{item.description || 'Izohsiz'}</Text>
                          <Text style={S.expDate}>{item.date} • {item.user}</Text>
                        </View>
                        <Text style={S.expAmount}>{fmt(item.amount)}</Text>
                      </View>
                    );
                  }}
                />
              </Card>
            </View>
          </ScrollView>
        </>
      )}

      {/* ── MASHINALAR ── */}
      {activeTab === 'mashinalar' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Vehicle list + date filter */}
          <View style={[S.pad, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }]}>
            <Text style={{ fontWeight: '800', fontSize: 16, color: T.text }}>Mashinalar ({registeredVehicles.length})</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity style={S.smBtn} onPress={() => { setRegForm({ plate: '', model: '' }); setShowRegModal(true); }}>
                <Text style={S.smBtnTxt}>+ Moshina</Text>
              </TouchableOpacity>
              {registeredVehicles.length > 0 && (
                <TouchableOpacity style={[S.smBtn, { backgroundColor: T.accent }]} onPress={() => { setVExpForm(f => ({ ...f, plate: selectedVehicle || '', date: today })); setShowVExpModal(true); }}>
                  <Text style={[S.smBtnTxt, { color: '#fff' }]}>+ Xarajat</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {registeredVehicles.length === 0 ? (
            <View style={[S.pad, { alignItems: 'center', paddingVertical: 40 }]}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>🚛</Text>
              <Text style={{ color: T.textD, marginBottom: 16 }}>Hali moshina qo'shilmagan</Text>
              <Button title="Birinchi mashinani qo'shing" onPress={() => setShowRegModal(true)} />
            </View>
          ) : (
            registeredVehicles.map(v => {
              const stats = getVehicleStats(v.vehiclePlate!);
              const isSelected = selectedVehicle === v.vehiclePlate;
              return (
                <View key={v.id} style={S.pad}>
                  <TouchableOpacity onPress={() => setSelectedVehicle(isSelected ? null : v.vehiclePlate!)}
                    style={[S.vehicleCard, { borderColor: isSelected ? T.accent : T.border, borderWidth: isSelected ? 2 : 1 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ fontSize: 17, fontWeight: '800', color: T.text }}>🚛 {v.vehiclePlate}</Text>
                      <Text style={{ fontSize: 12, color: T.textD }}>{v.description}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                      <Text style={{ color: T.red, fontWeight: '700' }}>📉 {fmt(stats.cost)}</Text>
                      <Text style={{ color: T.green, fontWeight: '700' }}>📈 {fmt(stats.income)}</Text>
                    </View>
                    <Text style={{ marginTop: 4, fontWeight: '800', color: stats.profit >= 0 ? T.green : T.red }}>
                      {stats.profit >= 0 ? '✅' : '⚠️'} Foyda: {fmt(Math.abs(stats.profit))} {stats.profit < 0 ? '(zarar)' : ''}
                    </Text>
                  </TouchableOpacity>

                  {/* Vehicle detail when selected */}
                  {isSelected && selStats && (
                    <View style={{ marginTop: 12 }}>
                      {/* Date filter */}
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        <Input label="Dan" value={vFromDate} onChangeText={setVFromDate} style={{ flex: 1 }} />
                        <Input label="Gacha" value={vToDate} onChangeText={setVToDate} style={{ flex: 1 }} />
                      </View>

                      {/* Stats */}
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        <View style={[S.statCard, { backgroundColor: '#FEE2E2', borderLeftColor: T.red }]}>
                          <Text style={{ fontSize: 10, color: T.red, fontWeight: '700' }}>XARAJAT</Text>
                          <Text style={{ fontSize: 17, fontWeight: '800', color: T.red }}>{fmt(selStats.cost)}</Text>
                        </View>
                        <View style={[S.statCard, { backgroundColor: '#D1FAE5', borderLeftColor: T.green }]}>
                          <Text style={{ fontSize: 10, color: T.green, fontWeight: '700' }}>DAROMAD</Text>
                          <Text style={{ fontSize: 17, fontWeight: '800', color: T.green }}>{fmt(selStats.income)}</Text>
                        </View>
                        <View style={[S.statCard, { backgroundColor: selStats.profit >= 0 ? '#D1FAE5' : '#FEE2E2', borderLeftColor: selStats.profit >= 0 ? T.green : T.red }]}>
                          <Text style={{ fontSize: 10, color: selStats.profit >= 0 ? T.green : T.red, fontWeight: '700' }}>FOYDA</Text>
                          <Text style={{ fontSize: 17, fontWeight: '800', color: selStats.profit >= 0 ? T.green : T.red }}>{selStats.profit >= 0 ? '+' : ''}{fmt(selStats.profit)}</Text>
                        </View>
                      </View>

                      {/* Entry list */}
                      <Card style={{ padding: 0, overflow: 'hidden' }}>
                        {selStats.entries.length === 0 ? (
                          <Text style={S.emptyTxt}>Tanlangan davrda yozuvlar yo'q</Text>
                        ) : (
                          selStats.entries.sort((a, b) => b.date.localeCompare(a.date)).map(e => {
                            const cat = VEHICLE_EXPENSE_CATS.find(c => c.id === e.category) || VEHICLE_EXPENSE_CATS[7];
                            const isIncome = e.category === 'v_daromad';
                            return (
                              <View key={e.id} style={S.expRow}>
                                <View style={{ flex: 1 }}>
                                  <View style={[S.catBadge, { backgroundColor: cat.color + '20' }]}>
                                    <Text>{cat.icon}</Text>
                                    <Text style={[S.catBadgeTxt, { color: cat.color }]}>{cat.label}</Text>
                                  </View>
                                  <Text style={S.expDesc}>{e.description || '—'}</Text>
                                  <Text style={S.expDate}>{e.date}</Text>
                                </View>
                                <Text style={[S.expAmount, { color: isIncome ? T.green : T.red }]}>
                                  {isIncome ? '+' : '-'}{fmt(e.amount)}
                                </Text>
                              </View>
                            );
                          })
                        )}
                      </Card>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── GENERAL EXPENSE MODAL ── */}
      <Modal visible={showExpModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={S.overlay}>
          <View style={S.modalBox}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Xarajat qo'shish</Text>
              <TouchableOpacity onPress={() => setShowExpModal(false)}><Text style={S.closeTxt}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={S.label}>Kategoriya</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {EXPENSE_CATEGORIES.map(c => (
                  <TouchableOpacity key={c.id} style={[S.chip, expForm.category === c.id && { borderColor: c.color, borderWidth: 2 }]} onPress={() => setExpForm({ ...expForm, category: c.id })}>
                    <Text>{c.icon}</Text>
                    <Text style={[S.chipTxt, expForm.category === c.id && { color: c.color, fontWeight: '700' }]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Input label="Summa" placeholder="100 000" value={expForm.amount} onChangeText={t => setExpForm({ ...expForm, amount: t })} keyboardType="numeric" />
              <Input label="Izoh" placeholder="Sababi..." value={expForm.description} onChangeText={t => setExpForm({ ...expForm, description: t })} />
              <Input label="Sana" value={expForm.date} onChangeText={t => setExpForm({ ...expForm, date: t })} />
              <Button title="Saqlash" onPress={handleSaveExpense} style={{ marginTop: 10 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── REGISTER VEHICLE MODAL ── */}
      <Modal visible={showRegModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={S.overlay}>
          <View style={S.modalBox}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Yangi moshina</Text>
              <TouchableOpacity onPress={() => setShowRegModal(false)}><Text style={S.closeTxt}>✕</Text></TouchableOpacity>
            </View>
            <Input label="Davlat raqami" placeholder="01 A 123 BB" value={regForm.plate} onChangeText={t => setRegForm({ ...regForm, plate: t.toUpperCase() })} autoCapitalize="characters" />
            <Input label="Rusumi (Model)" placeholder="Nexia, Cobalt, Kamaz..." value={regForm.model} onChangeText={t => setRegForm({ ...regForm, model: t })} />
            <Button title="Qo'shish" onPress={handleRegisterVehicle} style={{ marginTop: 10 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── VEHICLE EXPENSE MODAL ── */}
      <Modal visible={showVExpModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={S.overlay}>
          <View style={S.modalBox}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>Moshina xarajati</Text>
              <TouchableOpacity onPress={() => setShowVExpModal(false)}><Text style={S.closeTxt}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={S.label}>Mashinani tanlang</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {registeredVehicles.map(v => (
                  <TouchableOpacity key={v.vehiclePlate} style={[S.chip, vExpForm.plate === v.vehiclePlate && { borderColor: T.accent, borderWidth: 2 }]} onPress={() => setVExpForm({ ...vExpForm, plate: v.vehiclePlate! })}>
                    <Text>🚛</Text>
                    <Text style={[S.chipTxt, vExpForm.plate === v.vehiclePlate && { color: T.accent, fontWeight: '700' }]}>{v.vehiclePlate}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={S.label}>Tur</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {VEHICLE_EXPENSE_CATS.map(c => (
                  <TouchableOpacity key={c.id} style={[S.chip, vExpForm.category === c.id && { borderColor: c.color, borderWidth: 2 }]} onPress={() => setVExpForm({ ...vExpForm, category: c.id })}>
                    <Text>{c.icon}</Text>
                    <Text style={[S.chipTxt, vExpForm.category === c.id && { color: c.color, fontWeight: '700' }]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Input label="Summa" placeholder="50 000" value={vExpForm.amount} onChangeText={t => setVExpForm({ ...vExpForm, amount: t })} keyboardType="numeric" />
              <Input label="Izoh (ixtiyoriy)" placeholder="Metan to'ldirish..." value={vExpForm.description} onChangeText={t => setVExpForm({ ...vExpForm, description: t })} />
              <Input label="Sana" value={vExpForm.date} onChangeText={t => setVExpForm({ ...vExpForm, date: t })} />
              <Button title="Saqlash" onPress={handleAddVehicleExpense} style={{ marginTop: 10 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: T.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '900', color: T.text },
  tabRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12, marginTop: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center', backgroundColor: T.card, borderWidth: 1, borderColor: T.border },
  tabActive: { backgroundColor: T.accent, borderColor: T.accent },
  tabTxt: { fontWeight: '700', fontSize: 14, color: T.textM },
  tabTxtActive: { color: '#fff' },
  toolRow: { paddingHorizontal: 16, marginBottom: 8, gap: 8 },
  dateBox: { flexDirection: 'row', gap: 8 },
  dateInput: { flex: 1 },
  pad: { paddingHorizontal: 16, marginBottom: 12 },
  totalCard: { alignItems: 'center', paddingVertical: 16 },
  totalLabel: { fontSize: 12, color: T.textM, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  totalVal: { fontSize: 28, fontWeight: '900', color: T.red },
  expRow: { flexDirection: 'row', padding: 14, borderBottomWidth: 1, borderBottomColor: T.borderLight, alignItems: 'center' },
  catBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 4 },
  catBadgeTxt: { fontSize: 12, fontWeight: '700' },
  expDesc: { fontSize: 14, color: T.text, fontWeight: '600', marginBottom: 2 },
  expDate: { fontSize: 11, color: T.textD },
  expAmount: { fontSize: 16, fontWeight: '900', color: T.red },
  emptyTxt: { textAlign: 'center', padding: 24, color: T.textD },
  vehicleCard: { backgroundColor: T.card, borderRadius: 14, padding: 14, borderWidth: 1 },
  statCard: { flex: 1, borderRadius: 10, padding: 10, borderLeftWidth: 3 },
  smBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: T.border, backgroundColor: T.card },
  smBtnTxt: { fontWeight: '700', fontSize: 13, color: T.text },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', width: '92%', maxWidth: 420, padding: 20, borderRadius: 20, maxHeight: '88%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeTxt: { fontSize: 20, color: T.textM, padding: 4 },
  label: { fontSize: 13, fontWeight: '700', color: T.textM, marginBottom: 8, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: T.border, marginRight: 8, backgroundColor: T.card },
  chipTxt: { fontSize: 13, color: T.text },
});
