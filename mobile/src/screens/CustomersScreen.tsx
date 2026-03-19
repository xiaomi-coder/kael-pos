import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { T } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { fmt } from '../utils';

export function CustomersScreen() {
  const { customers, setCustomers, sales, logActivity } = useStorage();
  
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editCust, setEditCust] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", tgId: "" });
  const [showCustStatement, setShowCustStatement] = useState<any>(null);

  const filtered = search ? customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)) : customers;

  const custTotals = sales.reduce((acc: any, s) => {
    if (!acc[s.customerId]) acc[s.customerId] = 0;
    acc[s.customerId] += s.total;
    return acc;
  }, {});

  const topCustomers = customers
    .map(c => ({ ...c, totalSpent: custTotals[c.id] || 0 }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10)
    .filter(c => c.totalSpent > 0);

  const handleSave = () => {
    if (!form.name || !form.phone) {
      Alert.alert("Xatolik", "F.I.SH va Telefon raqam kiritilishi shart");
      return;
    }
    if (editCust) {
      setCustomers(prev => prev.map(c => c.id === editCust.id ? { ...c, ...form } : c));
      logActivity("Tizim", `Mijoz tahrirlandi: ${form.name}`, "", "");
      setEditCust(null);
    } else {
      setCustomers(prev => [...prev, { id: Math.max(0, ...prev.map(x => x.id)) + 1, ...form, balance: 0 }]);
      logActivity("Tizim", `Yangi mijoz: ${form.name}`, "", "");
    }
    setForm({ name: "", phone: "", address: "", tgId: "" }); 
    setShowModal(false);
  };

  const startEdit = (c: any) => { 
    setForm({ name: c.name, phone: c.phone, address: c.address, tgId: c.tgId || "" }); 
    setEditCust(c); 
    setShowModal(true); 
  };

  const handleDelete = (id: number) => { 
    Alert.alert("Tasdiqlash", "Rostdan o'chirasizmi?", [
      { text: "Yo'q", style: "cancel" },
      { text: "Ha", style: "destructive", onPress: () => {
        setCustomers(prev => prev.filter(c => c.id !== id)); 
        logActivity("Tizim", "Mijoz o'chirildi", "", ""); 
      }}
    ]);
  };

  const renderTopCustomer = ({item, index}: {item: any, index: number}) => {
    const bgColor = index === 0 ? T.accentLight : index === 1 ? T.blueLight : index === 2 ? T.greenLight : T.cardAlt;
    const borderColor = index === 0 ? T.accent : index === 1 ? T.blue : index === 2 ? T.green : T.border;
    const textColor = index === 0 ? T.accent : index === 1 ? T.blue : index === 2 ? T.green : T.textM;

    return (
      <View style={[styles.topCard, { backgroundColor: bgColor, borderColor }]}>
        <Text style={[styles.topRank, { color: textColor }]}>#{index + 1}</Text>
        <Text style={styles.topName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.topSub}>Jami xaridi:</Text>
        <Text style={styles.topTotal}>{fmt(item.totalSpent)}</Text>
      </View>
    );
  };

  const renderCustomer = ({item}: {item: any}) => (
    <Card style={styles.custCard}>
      <View style={styles.custHeader}>
        <View style={{flex: 1}}>
          <Text style={styles.custName}>{item.name}</Text>
          <Text style={styles.custPhone}>{item.phone} • {item.address || "Manzil kiritilmagan"}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.iconBtn, {backgroundColor: T.blueLight}]} onPress={() => startEdit(item)}>
            <Text style={{color: T.blue, fontWeight: '700'}}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, {backgroundColor: T.redLight}]} onPress={() => handleDelete(item.id)}>
            <Text style={{color: T.red, fontWeight: '700'}}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={[styles.balanceBox, item.balance < 0 ? styles.balanceNeg : styles.balancePos]}>
        <View>
          <Text style={styles.balanceLabel}>Joriy Hisob</Text>
          <Text style={[styles.balanceVal, {color: item.balance < 0 ? T.red : T.text}]}>
            {fmt(Math.abs(item.balance))} so'm
          </Text>
        </View>
        <TouchableOpacity style={styles.sverkaBtn} onPress={() => setShowCustStatement(item)}>
          <Text style={styles.sverkaTxt}>Sverka</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Mijozlar</Text>
        <Button 
          title="+ Yangi mijoz" 
          onPress={() => { setEditCust(null); setForm({ name: "", phone: "", address: "", tgId: "" }); setShowModal(true); }}
        />
      </View>

      <Input
        placeholder="Mijoz qidirish..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchInput}
      />

      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
        {topCustomers.length > 0 && !search && (
          <View style={styles.topSection}>
            <Text style={styles.topSectionTitle}>🏆 Eng faol mijozlar (TOP 10)</Text>
            <FlatList
              horizontal
              data={topCustomers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTopCustomer}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{gap: 12, paddingHorizontal: 16}}
            />
          </View>
        )}

        <View style={styles.listSection}>
          <FlatList
            data={filtered}
            keyExtractor={c => c.id.toString()}
            renderItem={renderCustomer}
            scrollEnabled={false}
            contentContainerStyle={{gap: 12}}
          />
        </View>
      </ScrollView>

      {/* Add / Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editCust ? "Mijozni tahrirlash" : "Yangi mijoz"}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}><Text style={styles.closeTxt}>✕</Text></TouchableOpacity>
            </View>
            <Input label="F.I.SH" value={form.name} onChangeText={t => setForm({...form, name: t})} />
            <Input label="Telefon" placeholder="+998..." value={form.phone} onChangeText={t => setForm({...form, phone: t})} keyboardType="phone-pad" />
            <Input label="Manzil" value={form.address} onChangeText={t => setForm({...form, address: t})} />
            <Input label="Telegram Chat ID" placeholder="Misol: 12345678" value={form.tgId} onChangeText={t => setForm({...form, tgId: t})} keyboardType="numeric" />
            <Button title={editCust ? "Saqlash" : "Qo'shish"} onPress={handleSave} style={{marginTop: 10}} />
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
  searchInput: { marginHorizontal: 16, marginBottom: 12 },
  topSection: { marginBottom: 20 },
  topSectionTitle: { fontSize: 16, fontWeight: '800', color: T.accentDark, paddingHorizontal: 16, marginBottom: 10 },
  topCard: { padding: 14, borderRadius: 16, borderWidth: 1, width: 180 },
  topRank: { fontSize: 20, fontWeight: '900', opacity: 0.8, marginBottom: 4 },
  topName: { fontSize: 15, fontWeight: '800', color: T.text },
  topSub: { fontSize: 12, color: T.textD, marginTop: 4 },
  topTotal: { fontSize: 16, fontWeight: '800', color: T.text, marginTop: 2 },
  listSection: { paddingHorizontal: 16 },
  custCard: { padding: 0, overflow: 'hidden' },
  custHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  custName: { fontSize: 18, fontWeight: '800', color: T.text, marginBottom: 4 },
  custPhone: { fontSize: 13, color: T.textD },
  actions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  balanceBox: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1 },
  balancePos: { backgroundColor: T.cardAlt, borderColor: T.borderLight },
  balanceNeg: { backgroundColor: T.redLight, borderColor: 'rgba(255,59,48,0.2)' },
  balanceLabel: { fontSize: 11, color: T.textM, fontWeight: '600', textTransform: 'uppercase' },
  balanceVal: { fontSize: 18, fontWeight: '800' },
  sverkaBtn: { backgroundColor: T.card, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: T.border },
  sverkaTxt: { fontSize: 12, fontWeight: '700', color: T.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', width: '90%', maxWidth: 400, padding: 20, borderRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeTxt: { fontSize: 20, color: T.textM, fontWeight: '700', padding: 4 },
  statementItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.borderLight }
});
