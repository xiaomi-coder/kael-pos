import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import { T } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { fmt, getToday, nowTime, sendTelegram } from '../utils';

export function DebtsScreen() {
  const { customers, setCustomers, sales, setSales, logActivity, tgBotToken, tgChatId } = useStorage();
  
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ customerId: "", amount: "" });
  const [showCustStatement, setShowCustStatement] = useState<any>(null);

  const debtors = customers.filter(c => c.balance < 0);
  const totalDebt = debtors.reduce((s, c) => s + Math.abs(c.balance), 0);

  const handlePay = () => {
    const custId = Number(payForm.customerId);
    const amt = Number(payForm.amount);
    
    if (!custId || amt <= 0) {
      Alert.alert("Xatolik", "Mijoz va to'lov summasi to'g'ri kiritilishi shart");
      return;
    }
    
    const cust = customers.find(c => c.id === custId);
    if (!cust) return;

    const today = getToday();
    const time = nowTime();

    setCustomers(prev => prev.map(c => c.id === custId ? { ...c, balance: c.balance + amt } : c));
    setSales(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1, date: today, time,
      productId: 0, productName: "Qarz to'lovi", customerId: custId, customerName: cust.name,
      qty: 1, price: amt, unitPrice: amt, cost: 0, discount: 0, total: amt, profit: 0,
      paidAmount: amt, debtAmount: 0, payType: "naqd", user: "Tizim" // No currentUser needed since user="Tizim" in web
    }, ...prev]);
    
    logActivity("Tizim", `Qarz to'landi: ${cust.name} — ${fmt(amt)}`, today, time);
    sendTelegram(tgBotToken, tgChatId, `💸 <b>QARZ TO'LOVI</b>\n\nMijoz: <b>${cust.name}</b>\nTo'lov: <b>${fmt(amt)} so'm</b>\nQolgan qarz: ${fmt(Math.abs(cust.balance + amt))} so'm`);
    
    setPayForm({ customerId: "", amount: "" }); 
    setShowPayModal(false);
  };

  const renderDebtor = ({item}: {item: any}) => (
    <Card style={styles.debtCard}>
      <View style={styles.debtHeader}>
        <View style={{flex: 1}}>
          <Text style={styles.debtName}>{item.name}</Text>
          <Text style={styles.debtPhone}>{item.phone}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>Qarz: {fmt(Math.abs(item.balance))}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btnAction, {backgroundColor: T.green}]} onPress={() => { setPayForm({ customerId: String(item.id), amount: String(Math.abs(item.balance)) }); setShowPayModal(true); }}>
            <Text style={styles.btnActionTxt}>To'lash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btnAction, {backgroundColor: T.card, borderWidth: 1, borderColor: T.border}]} onPress={() => setShowCustStatement(item)}>
            <Text style={[styles.btnActionTxt, {color: T.textM}]}>Sverka</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Qarzlar daftar</Text>
        <Button 
          title="Qarz qabul qilish" 
          onPress={() => { setPayForm({ customerId: "", amount: "" }); setShowPayModal(true); }}
        />
      </View>
      
      <View style={{paddingHorizontal: 16, marginBottom: 16}}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Jami Olinadigan Qarzlar</Text>
          <Text style={styles.totalVal}>{fmt(totalDebt)} so'm</Text>
        </View>
      </View>

      <FlatList
        data={debtors}
        keyExtractor={c => c.id.toString()}
        renderItem={renderDebtor}
        contentContainerStyle={{paddingHorizontal: 16, gap: 12, paddingBottom: 40}}
        ListEmptyComponent={<Text style={styles.emptyTxt}>Qarzdorlar yo'q 🥳</Text>}
      />

      {/* Pay Debt Modal */}
      <Modal visible={showPayModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Qarz to'lovi</Text>
              <TouchableOpacity onPress={() => setShowPayModal(false)}><Text style={styles.closeTxt}>✕</Text></TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Mijoz</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollChips}>
              {debtors.map(c => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.chip, payForm.customerId === String(c.id) && styles.chipActive]}
                  onPress={() => setPayForm({...payForm, customerId: String(c.id), amount: String(Math.abs(c.balance))})}
                >
                  <Text style={[styles.chipTxt, payForm.customerId === String(c.id) && styles.chipTxtActive]}>
                    {c.name} ({fmt(Math.abs(c.balance))})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Input label="To'lov summasi" placeholder="0" value={payForm.amount} onChangeText={t => setPayForm({...payForm, amount: t})} keyboardType="numeric" />
            <Button title="Tasdiqlash" onPress={handlePay} style={{marginTop: 10}} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Statement (Sverka) Modal */}
      <Modal visible={!!showCustStatement} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, {maxHeight: '80%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sverka: {showCustStatement?.name}</Text>
              <TouchableOpacity onPress={() => setShowCustStatement(null)}><Text style={styles.closeTxt}>✕</Text></TouchableOpacity>
            </View>
            
            <ScrollView>
              {sales.filter((s:any) => s.customerId === showCustStatement?.id).length === 0 ? (
                <Text style={{textAlign: 'center', color: T.textD, marginTop: 20}}>Hech qanday savdo tarixi yo'q</Text>
              ) : (
                sales.filter((s:any) => s.customerId === showCustStatement?.id).map((s:any, i:number) => (
                  <View key={i} style={styles.statementItem}>
                    <Text style={{fontWeight: '700'}}>{s.date} {s.time}</Text>
                    <Text>{s.productName} - {s.qty} x {fmt(s.unitPrice)}</Text>
                    <Text>To'landi: {fmt(s.paidAmount)} | Qarz: {fmt(s.debtAmount)} ({s.payType})</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: T.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  title: { fontSize: 24, fontWeight: '900', color: T.text },
  totalBox: { backgroundColor: T.redLight, borderLeftWidth: 6, borderLeftColor: T.red, padding: 16, borderRadius: 12 },
  totalLabel: { fontSize: 13, color: T.red, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  totalVal: { fontSize: 32, fontWeight: '800', color: T.red },
  emptyTxt: { textAlign: 'center', padding: 40, color: T.textD, fontSize: 16 },
  debtCard: { borderLeftWidth: 4, borderLeftColor: T.red, padding: 14 },
  debtHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  debtName: { fontSize: 18, fontWeight: '800', color: T.text, marginBottom: 2 },
  debtPhone: { fontSize: 13, color: T.textD, marginBottom: 8 },
  badge: { backgroundColor: T.red, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  actions: { gap: 8 },
  btnAction: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  btnActionTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', width: '90%', maxWidth: 400, padding: 20, borderRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeTxt: { fontSize: 20, color: T.textM, fontWeight: '700', padding: 4 },
  label: { fontSize: 13, fontWeight: '700', color: T.textM, marginBottom: 8 },
  scrollChips: { marginBottom: 16, maxHeight: 50 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: T.borderLight, marginRight: 8, backgroundColor: T.cardAlt },
  chipActive: { borderColor: T.red, backgroundColor: T.redLight },
  chipTxt: { fontSize: 14, color: T.textM, fontWeight: '600' },
  chipTxtActive: { color: T.red, fontWeight: '800' },
  statementItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.borderLight }
});
