import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import { T, EXPENSE_CATEGORIES } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { fmt, getToday, nowTime } from '../utils';

export function ExpensesScreen() {
  const { expenses, setExpenses, logActivity } = useStorage();
  const { currentUser } = useAuth();
  
  const today = getToday();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category: "moshina", amount: "", description: "", date: today });
  
  // Date Filters
  const d30 = new Date(); d30.setDate(d30.getDate() - 30);
  const [fromDate, setFromDate] = useState(d30.toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(today);

  const filteredExp = expenses.filter(e => e.date >= fromDate && e.date <= toDate);
  const totalFiltered = filteredExp.reduce((s, e) => s + e.amount, 0);

  const catSummary = filteredExp.reduce((acc: any, e) => {
    if (!acc[e.category]) acc[e.category] = 0;
    acc[e.category] += e.amount;
    return acc;
  }, {});

  const handleSave = () => {
    if (!form.amount) {
      Alert.alert("Xatolik", "Summa kiritilishi shart");
      return;
    }
    const cat = EXPENSE_CATEGORIES.find(c => c.id === form.category);
    
    setExpenses(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1,
      category: form.category, categoryLabel: cat?.label,
      amount: Number(form.amount), description: form.description,
      date: form.date || today, time: nowTime(), user: currentUser?.name || "?"
    }, ...prev]);
    
    logActivity(currentUser?.name || "?", `Xarajat: ${cat?.label} — ${fmt(Number(form.amount))}`, form.date || today, nowTime());
    setForm({ category: "moshina", amount: "", description: "", date: today }); 
    setShowModal(false);
  };

  const renderExpense = ({item}: {item: any}) => {
    const cat = EXPENSE_CATEGORIES.find(c => c.id === item.category) || EXPENSE_CATEGORIES[6];
    return (
      <View style={styles.expRow}>
        <View style={{flex: 1}}>
          <View style={styles.catBadge}>
            <Text style={{fontSize: 14}}>{cat.icon}</Text>
            <Text style={[styles.catBadgeTxt, {color: cat.color}]}>{cat.label}</Text>
          </View>
          <Text style={styles.expDesc}>{item.description || "Izohsiz"}</Text>
          <Text style={styles.expDate}>{item.date} {item.time} • {item.user}</Text>
        </View>
        <Text style={styles.expAmount}>{fmt(item.amount)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Xarajatlar</Text>
        <Button 
          title="+ Qo'shish" 
          onPress={() => { setForm({...form, date: today}); setShowModal(true); }}
        />
      </View>

      <View style={styles.dateFilter}>
        <Input 
          label="Dan"
          value={fromDate}
          onChangeText={setFromDate}
          style={{flex: 1, marginRight: 8}}
        />
        <Input 
          label="Gacha"
          value={toDate}
          onChangeText={setToDate}
          style={{flex: 1}}
        />
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
        <View style={{paddingHorizontal: 16, marginBottom: 16}}>
          <Card style={styles.totalCard}>
            <Text style={styles.totalLabel}>Tanlangan davr jami</Text>
            <Text style={styles.totalVal}>{fmt(totalFiltered)}</Text>
          </Card>
        </View>

        {Object.keys(catSummary).length > 0 && (
          <View style={{paddingHorizontal: 16, marginBottom: 20}}>
            <Text style={styles.catTitle}>Kategoriyalar bo'yicha</Text>
            <View style={styles.catGrid}>
              {Object.keys(catSummary).sort((a,b) => catSummary[b] - catSummary[a]).map(catId => {
                const c = EXPENSE_CATEGORIES.find(x => x.id === catId);
                if(!c) return null;
                return (
                  <View key={catId} style={[styles.catSumItem, {backgroundColor: c.color + '15'}]}>
                    <Text style={{fontSize: 16}}>{c.icon}</Text>
                    <Text style={[styles.catSumLabel, {color: c.color}]}>{c.label}:</Text>
                    <Text style={styles.catSumVal}>{fmt(catSummary[catId])}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{paddingHorizontal: 16}}>
          <Card style={{padding: 0, overflow: 'hidden'}}>
            <FlatList
              data={filteredExp}
              keyExtractor={item => item.id.toString()}
              renderItem={renderExpense}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.emptyTxt}>Xarajatlar yo'q</Text>}
            />
          </Card>
        </View>
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Xarajat qo'shish</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Text style={styles.closeTxt}>✕</Text></TouchableOpacity>
            </View>

            {/* Simple Picker alternative for Categories using ScrollView chips */}
            <Text style={styles.label}>Kategoriya</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {EXPENSE_CATEGORIES.map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.catChip, form.category === c.id && styles.catChipActive, form.category === c.id && {borderColor: c.color}]}
                  onPress={() => setForm({...form, category: c.id})}
                >
                  <Text>{c.icon}</Text>
                  <Text style={[styles.catChipTxt, form.category === c.id && {color: c.color, fontWeight: '700'}]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input label="Summa" placeholder="100 000" value={form.amount} onChangeText={t => setForm({...form, amount: t})} keyboardType="numeric" />
            <Input label="Izoh" placeholder="Sababi..." value={form.description} onChangeText={t => setForm({...form, description: t})} />
            <Input label="Sana" value={form.date} onChangeText={t => setForm({...form, date: t})} />
            
            <Button title="Saqlash" onPress={handleSave} style={{marginTop: 10}} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: T.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: '900', color: T.text },
  dateFilter: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  totalCard: { alignItems: 'center', paddingVertical: 20 },
  totalLabel: { fontSize: 13, color: T.textM, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  totalVal: { fontSize: 32, fontWeight: '900', color: T.red },
  catTitle: { fontSize: 14, fontWeight: '800', color: T.textM, textTransform: 'uppercase', marginBottom: 12 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catSumItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 6 },
  catSumLabel: { fontWeight: '700', fontSize: 13 },
  catSumVal: { fontWeight: '900', fontSize: 14, color: '#000' },
  expRow: { flexDirection: 'row', padding: 16, borderBottomWidth: 1, borderBottomColor: T.borderLight, alignItems: 'center' },
  catBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 6 },
  catBadgeTxt: { fontSize: 12, fontWeight: '700' },
  expDesc: { fontSize: 15, color: T.text, fontWeight: '600', marginBottom: 4 },
  expDate: { fontSize: 12, color: T.textD },
  expAmount: { fontSize: 18, fontWeight: '900', color: T.red },
  emptyTxt: { textAlign: 'center', padding: 30, color: T.textD },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', width: '90%', maxWidth: 400, padding: 20, borderRadius: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeTxt: { fontSize: 20, color: T.textM, fontWeight: '700', padding: 4 },
  label: { fontSize: 13, fontWeight: '700', color: T.textM, marginBottom: 8, marginTop: 8 },
  catScroll: { marginBottom: 16, maxHeight: 50 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: T.border, marginRight: 10 },
  catChipActive: { backgroundColor: '#fff', borderWidth: 2 },
  catChipTxt: { fontSize: 14, color: T.text }
});
