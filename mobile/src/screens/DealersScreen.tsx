import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import { T } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { fmt, getToday, nowTime } from '../utils';

export function DealersScreen() {
  const { dealers, setDealers, dealerTxns, setDealerTxns, logActivity, getTotalDealerDebt, products, setProducts } = useStorage();
  const { currentUser } = useAuth();
  
  const [showDealerModal, setShowDealerModal] = useState(false);
  const [showTxnModal, setShowTxnModal] = useState(false);
  const [showKirimModal, setShowKirimModal] = useState(false);

  const [editDealer, setEditDealer] = useState<any>(null);
  const [dealerForm, setDealerForm] = useState({ name: "", phone: "", address: "" });
  const [txnForm, setTxnForm] = useState({ dealerId: "", type: "purchase", amount: "", description: "", products: "" });
  
  const [kirimDealerId, setKirimDealerId] = useState("");
  const [kirimCart, setKirimCart] = useState<any[]>([]);
  const [prodSearch, setProdSearch] = useState("");

  const filteredProds = prodSearch ? products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase())) : products;

  const handleDealerSave = () => {
    if (!dealerForm.name) {
      Alert.alert("Xatolik", "Diler ismini kiriting");
      return;
    }
    if (editDealer) {
      setDealers(prev => prev.map(d => d.id === editDealer.id ? { ...d, ...dealerForm } : d));
      logActivity(currentUser?.name || "?", `Diller tahrirlandi: ${dealerForm.name}`, getToday(), nowTime());
      setEditDealer(null);
    } else {
      setDealers(prev => [...prev, { id: Math.max(0, ...prev.map(x => x.id)) + 1, ...dealerForm, balance: 0 }]);
      logActivity(currentUser?.name || "?", `Yangi diller: ${dealerForm.name}`, getToday(), nowTime());
    }
    setDealerForm({ name: "", phone: "", address: "" }); 
    setShowDealerModal(false);
  };

  const handleTxnSave = () => {
    const dId = Number(txnForm.dealerId);
    const amt = Number(txnForm.amount);
    if (!dId || amt <= 0) {
      Alert.alert("Xatolik", "Diller va summani to'g'ri kiriting");
      return;
    }
    
    const dealer = dealers.find(d => d.id === dId);
    if (!dealer) return;

    setDealers(prev => prev.map(d => d.id === dId ? { ...d, balance: d.balance + (txnForm.type === "purchase" ? -amt : amt) } : d));
    setDealerTxns(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1,
      dealerId: dId, type: txnForm.type as 'purchase' | 'payment', amount: amt,
      description: txnForm.description, products: txnForm.products,
      date: getToday(), time: nowTime(), user: currentUser?.name || "?"
    }, ...prev]);
    
    logActivity(currentUser?.name || "?", `Diller amaliyoti: ${dealer.name} — ${txnForm.type === "purchase" ? "Yuk olindi" : "Pul berildi"} ${fmt(amt)}`, getToday(), nowTime());
    setTxnForm({ dealerId: "", type: "purchase", amount: "", description: "", products: "" }); 
    setShowTxnModal(false);
  };

  const addToKirim = (prod: any) => {
    const exists = kirimCart.find(c => c.productId === prod.id);
    if (!exists) setKirimCart([...kirimCart, { productId: prod.id, name: prod.name, qty: 1, cost: prod.cost }]);
  };
  
  const updateKirimValue = (pid: number, field: string, val: number) => {
    setKirimCart(kirimCart.map(c => c.productId === pid ? { ...c, [field]: val } : c));
  };
  
  const removeFromKirim = (pid: number) => setKirimCart(kirimCart.filter(c => c.productId !== pid));
  
  const handleKirimSave = () => {
    const dId = Number(kirimDealerId);
    const dealer = dealers.find(d => d.id === dId);
    if (!dealer || kirimCart.length === 0) return;

    let totalSum = 0;
    const itemsText = kirimCart.map(c => {
      totalSum += (c.qty * c.cost);
      return `${c.name} x${c.qty}`;
    }).join(", ");

    setProducts(prev => prev.map(p => {
      const inc = kirimCart.find(c => c.productId === p.id);
      return inc ? { ...p, stock: p.stock + inc.qty, cost: inc.cost } : p;
    }));

    setDealers(prev => prev.map(d => d.id === dId ? { ...d, balance: d.balance - totalSum } : d));

    setDealerTxns(prev => [{
      id: Math.max(0, ...prev.map(x => x.id)) + 1,
      dealerId: dId, type: 'purchase', amount: totalSum,
      description: "Omborga kirim: " + itemsText, products: itemsText,
      date: getToday(), time: nowTime(), user: currentUser?.name || "?"
    }, ...prev]);

    logActivity(currentUser?.name || "?", `Kirim: ${dealer.name} dan ${fmt(totalSum)} lik tovar`, getToday(), nowTime());
    setKirimCart([]); setKirimDealerId(""); setProdSearch("");
    setShowKirimModal(false);
  };

  const renderDealer = ({item}: {item: any}) => (
    <Card style={[styles.card, {borderColor: item.balance < 0 ? 'rgba(220,38,38,0.3)' : T.border, borderWidth: 1}]}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
        <View style={{flex: 1}}>
          <Text style={styles.dealerName}>{item.name}</Text>
          <Text style={styles.dealerPhone}>{item.phone}</Text>
        </View>
        <View style={{flexDirection: 'row', gap: 6}}>
          <TouchableOpacity style={[styles.iconBtn, {backgroundColor: T.greenLight}]} onPress={() => { setKirimDealerId(String(item.id)); setShowKirimModal(true); }}>
            <Text style={{color: T.green, fontWeight: '700'}}>📥</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, {backgroundColor: T.blueLight}]} onPress={() => { setDealerForm({ name: item.name, phone: item.phone, address: item.address }); setEditDealer(item); setShowDealerModal(true); }}>
            <Text style={{color: T.blue, fontWeight: '700'}}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, {backgroundColor: T.redLight}]} onPress={() => {
            Alert.alert("Tasdiqlash", "Dillerni o'chirasizmi?", [
              {text: "Yo'q", style: "cancel"},
              {text: "Ha", onPress: () => setDealers(prev => prev.filter(x => x.id !== item.id))}
            ]);
          }}>
            <Text style={{color: T.red, fontWeight: '700'}}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.balanceBox, {backgroundColor: item.balance < 0 ? T.redLight : T.cardAlt}]}>
        <Text style={styles.balanceLabel}>Joriy Hisob</Text>
        <Text style={[styles.balanceVal, {color: item.balance < 0 ? T.red : T.text}]}>
          {fmt(Math.abs(item.balance))} so'm {item.balance < 0 ? "(Qarzimiz)" : ""}
        </Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Dillerlar</Text>
        <View style={{flexDirection: 'row', gap: 8}}>
          <Button title="+ Diller" onPress={() => { setEditDealer(null); setDealerForm({ name: "", phone: "", address: "" }); setShowDealerModal(true); }} style={{paddingHorizontal: 12}} />
          <Button title="+ Amaliyot" onPress={() => setShowTxnModal(true)} style={{paddingHorizontal: 12}} />
        </View>
      </View>

      <View style={{paddingHorizontal: 16, marginBottom: 16}}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Dillerlardan qarzimiz</Text>
          <Text style={styles.totalVal}>{fmt(Math.abs(getTotalDealerDebt()))} so'm</Text>
        </View>
      </View>

      <FlatList
        data={dealers}
        keyExtractor={d => d.id.toString()}
        renderItem={renderDealer}
        contentContainerStyle={{paddingHorizontal: 16, gap: 12, paddingBottom: 40}}
      />

      {/* Amaliyot Txn Modal */}
      <Modal visible={showTxnModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Diller amaliyoti</Text>
              <TouchableOpacity onPress={() => setShowTxnModal(false)}><Text style={styles.closeTxt}>✕</Text></TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Diller</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollChips}>
              {dealers.map(d => (
                <TouchableOpacity 
                  key={d.id} 
                  style={[styles.chip, txnForm.dealerId === String(d.id) && styles.chipActive]}
                  onPress={() => setTxnForm({...txnForm, dealerId: String(d.id)})}
                >
                  <Text style={[styles.chipTxt, txnForm.dealerId === String(d.id) && styles.chipTxtActive]}>
                    {d.name} (Qarz: {fmt(Math.abs(d.balance))})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Amaliyot turi</Text>
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 16}}>
              <TouchableOpacity 
                style={[styles.typeBtn, txnForm.type === 'purchase' ? {backgroundColor: T.redLight, borderColor: T.red} : {}]} 
                onPress={() => setTxnForm({...txnForm, type: 'purchase'})}
              >
                <Text style={[{fontWeight: '700'}, txnForm.type === 'purchase' ? {color: T.red} : {color: T.textM}]}>Yuk olindi (Qarz)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.typeBtn, txnForm.type === 'payment' ? {backgroundColor: T.greenLight, borderColor: T.green} : {}]} 
                onPress={() => setTxnForm({...txnForm, type: 'payment'})}
              >
                <Text style={[{fontWeight: '700'}, txnForm.type === 'payment' ? {color: T.green} : {color: T.textM}]}>Pul berildi (To'lov)</Text>
              </TouchableOpacity>
            </View>

            <Input label="Summa / Qiymat" placeholder="0" value={txnForm.amount} onChangeText={t => setTxnForm({...txnForm, amount: t})} keyboardType="numeric" />
            
            {txnForm.type === "purchase" ? (
              <Input label="Olingan mahsulotlar" placeholder="Masalan: 5t sement..." value={txnForm.products} onChangeText={t => setTxnForm({...txnForm, products: t})} />
            ) : (
              <Input label="Izoh" placeholder="Naqd, Plastik..." value={txnForm.description} onChangeText={t => setTxnForm({...txnForm, description: t})} />
            )}

            <Button title="Saqlash" onPress={handleTxnSave} style={{marginTop: 10}} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Diller Qoshish Modal */}
      <Modal visible={showDealerModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editDealer ? "Tahrirlash" : "Yangi diller"}</Text>
              <TouchableOpacity onPress={() => setShowDealerModal(false)}><Text style={styles.closeTxt}>✕</Text></TouchableOpacity>
            </View>
            <Input label="Kompaniya / ism" value={dealerForm.name} onChangeText={t => setDealerForm({...dealerForm, name: t})} />
            <Input label="Telefon" value={dealerForm.phone} onChangeText={t => setDealerForm({...dealerForm, phone: t})} keyboardType="phone-pad" />
            <Input label="Manzil" value={dealerForm.address} onChangeText={t => setDealerForm({...dealerForm, address: t})} />
            <Button title="Saqlash" onPress={handleDealerSave} style={{marginTop: 10}} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Kirim Modal */}
      <Modal visible={showKirimModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalBox, {maxHeight: '90%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Omborga Kirim Qilish</Text>
              <TouchableOpacity onPress={() => setShowKirimModal(false)}><Text style={styles.closeTxt}>✕</Text></TouchableOpacity>
            </View>

            <Input 
              placeholder="Mahsulot qidirish..." 
              value={prodSearch} 
              onChangeText={setProdSearch} 
            />

            <View style={{maxHeight: 120, flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16}}>
              {filteredProds.map(p => (
                <TouchableOpacity key={p.id} style={styles.prodBadge} onPress={() => addToKirim(p)}>
                  <Text style={{fontSize: 12}}>{p.name} <Text style={{color: T.textM}}>({p.stock})</Text></Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView style={{maxHeight: 200, marginBottom: 16}}>
              {kirimCart.length === 0 ? <Text style={{textAlign: 'center', color: T.textD, padding: 20}}>Mahsulot tanlanmagan</Text> : 
                kirimCart.map(c => (
                  <View key={c.productId} style={styles.cartItem}>
                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
                      <Text style={{fontWeight: '700', fontSize: 13}}>{c.name}</Text>
                      <TouchableOpacity onPress={() => removeFromKirim(c.productId)}>
                        <Text style={{color: T.red, fontWeight: '800'}}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{flexDirection: 'row', gap: 8}}>
                      <Input label="Kirim Soni" value={String(c.qty)} onChangeText={t => updateKirimValue(c.productId, 'qty', Number(t))} keyboardType="numeric" style={{flex: 1}} />
                      <Input label="Tannarx" value={String(c.cost)} onChangeText={t => updateKirimValue(c.productId, 'cost', Number(t))} keyboardType="numeric" style={{flex: 1}} />
                    </View>
                    <Text style={{textAlign: 'right', fontWeight: '800', color: T.accent, marginTop: 4}}>Jami: {fmt(c.qty * c.cost)}</Text>
                  </View>
                ))
              }
            </ScrollView>

            <View style={{flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderColor: T.borderLight}}>
              <Text style={{fontWeight: '800'}}>Jami Kirim Summasi:</Text>
              <Text style={{fontWeight: '800', color: T.accent}}>{fmt(kirimCart.reduce((s, c) => s + (c.qty*c.cost), 0))}</Text>
            </View>

            <Button title="Tasdiqlash" onPress={handleKirimSave} disabled={kirimCart.length === 0} />
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
  totalBox: { backgroundColor: T.redLight, borderLeftWidth: 6, borderLeftColor: T.red, padding: 16, borderRadius: 12 },
  totalLabel: { fontSize: 13, color: T.red, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  totalVal: { fontSize: 32, fontWeight: '800', color: T.red },
  card: { padding: 14, overflow: 'hidden' },
  dealerName: { fontSize: 18, fontWeight: '800', color: T.text, marginBottom: 4 },
  dealerPhone: { fontSize: 13, color: T.textD },
  iconBtn: { width: 34, height: 34, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  balanceBox: { padding: 12, borderRadius: 10, marginTop: 12 },
  balanceLabel: { fontSize: 11, color: T.textM, fontWeight: '600', marginBottom: 4 },
  balanceVal: { fontSize: 18, fontWeight: '800' },
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
  typeBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  prodBadge: { backgroundColor: T.card, borderWidth: 1, borderColor: T.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  cartItem: { backgroundColor: T.cardAlt, padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: T.borderLight }
});
