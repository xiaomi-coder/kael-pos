import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import { T } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { fmt, getToday, nowTime, sendTelegram } from '../utils';

export function SalesScreen() {
  const { products, customers, sales, setSales, setProducts, setCustomers, logActivity, tgBotToken, tgChatId } = useStorage();
  const { currentUser } = useAuth();
  
  const [cart, setCart] = useState<any[]>([]);
  const [saleCustomerId, setSaleCustomerId] = useState("");
  const [isOneTime, setIsOneTime] = useState(false);
  const [oneTimeName, setOneTimeName] = useState("");
  const [paymentType, setPaymentType] = useState("naqd");
  const [cashAmount, setCashAmount] = useState("");
  const [prodSearch, setProdSearch] = useState("");
  const [showReceipt, setShowReceipt] = useState<any>(null);

  const filteredProds = prodSearch ? products.filter((p: any) => p.name.toLowerCase().includes(prodSearch.toLowerCase())) : products;

  const addToCart = (prod: any) => {
    const exists = cart.find(c => c.productId === prod.id);
    if (exists) setCart(cart.map(c => c.productId === prod.id ? { ...c, qty: c.qty + 1, total: (c.qty + 1) * c.unitPrice } : c));
    else setCart([...cart, { productId: prod.id, productName: prod.name, qty: 1, price: prod.price, unitPrice: prod.price, cost: prod.cost, discount: 0, total: prod.price, unit: prod.unit, packSize: prod.packSize }]);
  };
  
  const updateCartQty = (pid: number, qty: number) => { 
    if (qty < 1) return removeFromCart(pid); 
    setCart(cart.map(c => c.productId === pid ? { ...c, qty, total: qty * c.unitPrice } : c)); 
  };
  
  const removeFromCart = (pid: number) => setCart(cart.filter(c => c.productId !== pid));

  const cartTotal = cart.reduce((s, c) => s + c.total, 0);
  const cartProfit = cart.reduce((s, c) => s + (c.unitPrice - c.cost) * c.qty, 0);
  const cartOriginal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartDiscountTotal = cartOriginal - cartTotal;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const custName = isOneTime ? (oneTimeName || "Birmartalik") : (customers.find((c: any) => c.id === Number(saleCustomerId))?.name || "");
    const custPhone = isOneTime ? "" : (customers.find((c: any) => c.id === Number(saleCustomerId))?.phone || "");
    const custId = isOneTime ? 0 : Number(saleCustomerId);
    
    if (!isOneTime && !saleCustomerId) { Alert.alert("Xato", "Mijozni tanlang!"); return; }
    if (isOneTime && paymentType !== "naqd") { Alert.alert("Xato", "Birmartalik mijozga faqat naqd!"); return; }
    
    for (const item of cart) {
      const p = products.find((pr: any) => pr.id === item.productId);
      if (p && p.stock < item.qty) { Alert.alert("Qoldiq yetarli emas", `${p.name} yetarli emas! Qoldiq: ${p.stock}`); return; }
    }
    
    let paidAmt = cartTotal, debtAmt = 0, pType = "naqd";
    if (paymentType === "qarz") { paidAmt = 0; debtAmt = cartTotal; pType = "qarz"; }
    else if (paymentType === "aralash") {
      const cash = Number(cashAmount) || 0;
      if (cash <= 0) { Alert.alert("Xato", "Naqd summa kiriting!"); return; }
      if (cash >= cartTotal) { paidAmt = cartTotal; debtAmt = 0; pType = "naqd"; }
      else { paidAmt = cash; debtAmt = cartTotal - cash; pType = "aralash"; }
    }
    
    const today = getToday();
    const time = nowTime();
    
    const newSales = cart.map((item, i) => {
      const ratio = item.total / cartTotal;
      return {
        id: sales.length + i + 1, date: today, time,
        productId: item.productId, productName: item.productName,
        customerId: custId, customerName: custName,
        qty: item.qty, price: item.price, unitPrice: item.unitPrice, cost: item.cost,
        discount: item.discount, total: item.total,
        profit: (item.unitPrice - item.cost) * item.qty,
        paidAmount: Math.round(paidAmt * ratio), debtAmount: Math.round(debtAmt * ratio), payType: pType as 'naqd'|'qarz'|'aralash',
        user: currentUser?.name || "?",
      };
    });
    
    setSales([...newSales, ...sales]);
    setProducts((prev: any[]) => prev.map((p: any) => { const ci = cart.find(c => c.productId === p.id); return ci ? { ...p, stock: p.stock - ci.qty } : p; }));
    
    if (debtAmt > 0 && !isOneTime && custId) {
      setCustomers((prev: any[]) => prev.map((c: any) => c.id === custId ? { ...c, balance: c.balance - debtAmt } : c));
    }
    logActivity(currentUser?.name || "?", `Sotuv: ${custName} — ${fmt(cartTotal)} so'm (${pType})`, today, time);

    const itemsList = cart.map(it => `  ${it.productName} x${it.qty} = ${fmt(it.total)}`).join("\n");
    const tgMsg = `🛒 <b>YANGI SOTUV</b>\n\n👤 Mijoz: <b>${custName}</b>${custPhone ? "\n📱 " + custPhone : ""}\n📅 ${today} ${time}\n👷 Sotuvchi: ${currentUser?.name}\n\n📦 Tovarlar:\n${itemsList}\n\n💰 <b>JAMI: ${fmt(cartTotal)} so'm</b>\n💵 Naqd: ${fmt(paidAmt)} so'm${debtAmt > 0 ? `\n📋 Nasiya: ${fmt(debtAmt)} so'm` : ""}\n📊 Foyda: ${fmt(cartProfit)} so'm`;
    
    if (tgBotToken && tgChatId) sendTelegram(tgBotToken, tgChatId, tgMsg);

    setShowReceipt({
      date: today, time, customer: custName, phone: custPhone,
      items: [...cart], total: cartTotal, paid: paidAmt, debt: debtAmt, payType: pType,
      discount: cartDiscountTotal, receiptNo: `KL-${Date.now().toString(36).toUpperCase()}`
    });
    
    setCart([]); setSaleCustomerId(""); setIsOneTime(false); setOneTimeName("");
    setPaymentType("naqd"); setCashAmount(""); setProdSearch("");
  };

  const renderProduct = ({ item }: any) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => item.stock > 0 && addToCart(item)}
      style={[styles.productItem, item.stock <= 0 && { opacity: 0.5 }]}
    >
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productPrice}>{fmt(item.price)}</Text>
      <Text style={[styles.productStock, item.stock <= item.minStock && { color: T.red }]}>
        Qoldiq: {item.stock} {item.unit}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Left Side (or Top on Mobile): Product Picker */}
        <View style={styles.searchSection}>
          <Text style={styles.title}>Kassa (Sotuv)</Text>
          <Input 
            placeholder="Kassadan mahsulot qidirish..." 
            value={prodSearch} 
            onChangeText={setProdSearch} 
          />
        </View>

        <View style={{ flex: 1, flexDirection: 'row' }}>
          
          <View style={styles.productsList}>
            <FlatList
              data={filteredProds}
              keyExtractor={item => item.id.toString()}
              renderItem={renderProduct}
              numColumns={2}
              columnWrapperStyle={{ gap: 10 }}
              contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
            />
          </View>

        </View>
        
        {/* Bottom Sheet / Cart Area */}
        <Card style={styles.cartSection}>
          <Text style={styles.cartTitle}>Savat ({cart.length})</Text>
          
          {cart.length === 0 ? (
            <Text style={styles.emptyCart}>Mahsulot tanlang</Text>
          ) : (
            <ScrollView style={styles.cartList}>
              {cart.map(item => (
                <View key={item.productId} style={styles.cartItem}>
                  <View style={styles.cartItemHeader}>
                    <Text style={styles.cartItemName}>{item.productName}</Text>
                    <TouchableOpacity onPress={() => removeFromCart(item.productId)}>
                      <Text style={{color: T.red, fontWeight: '700'}}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.cartItemControls}>
                    <TouchableOpacity onPress={() => updateCartQty(item.productId, item.qty - 1)} style={styles.qtyBtn}><Text>-</Text></TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity onPress={() => updateCartQty(item.productId, item.qty + 1)} style={styles.qtyBtn}><Text>+</Text></TouchableOpacity>
                    <View style={{flex: 1}}/>
                    <Text style={styles.cartItemTotal}>{fmt(item.total)}</Text>
                  </View>
                  {item.packSize > 1 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, padding: 6, backgroundColor: T.accentLight, borderRadius: 8, borderWidth: 1, borderColor: T.accent }}>
                      <Text style={{ fontSize: 11, color: T.accent, fontWeight: '800', marginRight: 6 }}>QOP:</Text>
                      <TextInput 
                        style={{ padding: 0, fontSize: 13, fontWeight: '700', color: T.accent, minWidth: 40 }}
                        keyboardType="numeric"
                        value={String(Math.floor(item.qty / item.packSize))}
                        onChangeText={(t) => updateCartQty(item.productId, (Number(t) || 0) * item.packSize + (item.qty % item.packSize))}
                      />
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.checkoutBox}>
            
            <View style={{flexDirection: 'row', gap: 10, marginBottom: 12}}>
               <TouchableOpacity style={[styles.typeBtn, isOneTime && styles.typeActive]} onPress={() => setIsOneTime(true)}>
                 <Text style={isOneTime ? styles.typeActiveTxt : styles.typeTxt}>Bir martalik</Text>
               </TouchableOpacity>
               <TouchableOpacity style={[styles.typeBtn, !isOneTime && styles.typeActive]} onPress={() => setIsOneTime(false)}>
                 <Text style={!isOneTime ? styles.typeActiveTxt : styles.typeTxt}>Doimiy mijoz</Text>
               </TouchableOpacity>
            </View>

            {isOneTime ? (
              <Input placeholder="Mijoz ismi (Ixtiyoriy)" value={oneTimeName} onChangeText={setOneTimeName} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 12, maxHeight: 45}}>
                {customers.map((c: any) => (
                  <TouchableOpacity 
                    key={c.id} 
                    style={[styles.chip, saleCustomerId === String(c.id) && styles.chipActive]}
                    onPress={() => setSaleCustomerId(String(c.id))}
                  >
                    <Text style={[styles.chipTxt, saleCustomerId === String(c.id) && styles.chipActiveTxt]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={{flexDirection: 'row', gap: 10, marginBottom: 16}}>
               <TouchableOpacity style={[styles.payTypeBtn, paymentType === 'naqd' && styles.payActive]} onPress={() => setPaymentType('naqd')}>
                 <Text style={paymentType === 'naqd' ? styles.payActiveTxt : styles.payTxt}>Naqd</Text>
               </TouchableOpacity>
               {!isOneTime && (
                 <TouchableOpacity style={[styles.payTypeBtn, paymentType === 'qarz' && styles.payActive]} onPress={() => setPaymentType('qarz')}>
                   <Text style={paymentType === 'qarz' ? styles.payActiveTxt : styles.payTxt}>Qarz</Text>
                 </TouchableOpacity>
               )}
               <TouchableOpacity style={[styles.payTypeBtn, paymentType === 'aralash' && styles.payActive]} onPress={() => setPaymentType('aralash')}>
                 <Text style={paymentType === 'aralash' ? styles.payActiveTxt : styles.payTxt}>Aralash</Text>
               </TouchableOpacity>
            </View>

            {paymentType === 'aralash' && (
              <Input placeholder="Naqd to'lanadigan qismi..." keyboardType="numeric" value={cashAmount} onChangeText={setCashAmount} />
            )}

            <Text style={styles.totalText}>JAMI: {fmt(cartTotal)} so'm</Text>
            <Button title="Sotish" onPress={handleCheckout} disabled={cart.length === 0} />
          </View>
        </Card>

        {/* Receipt Modal */}
        <Modal visible={!!showReceipt} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.receiptBox}>
              <Text style={styles.receiptTitle}>KAEL POS</Text>
              <Text style={{textAlign: 'center', color: T.textD, marginBottom: 10}}>Chek #{showReceipt?.receiptNo}</Text>
              <View style={styles.dashedLine} />
              
              <Text style={{fontSize: 13}}>Mijoz: {showReceipt?.customer}</Text>
              <Text style={{fontSize: 12, color: T.textD}}>{showReceipt?.date} {showReceipt?.time}</Text>
              <View style={styles.dashedLine} />
              
              {showReceipt?.items.map((it: any, i: number) => (
                <View key={i} style={{flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4}}>
                  <Text style={{fontSize: 12}}>{it.productName} x{it.qty}</Text>
                  <Text style={{fontSize: 12, fontWeight: '700'}}>{fmt(it.total)}</Text>
                </View>
              ))}
              
              <View style={styles.dashedLine} />
              <View style={{flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8}}>
                <Text style={{fontSize: 16, fontWeight: '800'}}>JAMI:</Text>
                <Text style={{fontSize: 16, fontWeight: '800', color: T.accent}}>{fmt(showReceipt?.total)}</Text>
              </View>
              
              <Button title="Yopish" onPress={() => setShowReceipt(null)} style={{marginTop: 20}} />
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: T.bg },
  container: { flex: 1 },
  searchSection: { padding: 16, paddingBottom: 0 },
  title: { fontSize: 24, fontWeight: '800', color: T.text, marginBottom: 16 },
  
  productsList: { flex: 1, paddingHorizontal: 16 },
  productItem: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(0,0,0,0.05)',
  },
  productName: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: '800', color: T.accent },
  productStock: { fontSize: 11, color: T.textD, marginTop: 4 },

  cartSection: { 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    marginHorizontal: 0, 
    marginBottom: 0,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    padding: 20,
    maxHeight: '50%'
  },
  cartTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  emptyCart: { textAlign: 'center', color: T.textD, paddingVertical: 20 },
  
  cartList: { marginBottom: 16 },
  cartItem: { backgroundColor: T.cardAlt, padding: 12, borderRadius: 12, marginBottom: 8 },
  cartItemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cartItemName: { fontWeight: '600', fontSize: 13, flex: 1 },
  cartItemControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 30, height: 30, backgroundColor: '#fff', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.border },
  qtyText: { fontSize: 16, fontWeight: '700' },
  cartItemTotal: { fontSize: 15, fontWeight: '800', color: T.accent },

  checkoutBox: { borderTopWidth: 1, borderTopColor: T.border, paddingTop: 16 },
  totalText: { fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },

  typeBtn: { flex: 1, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: T.borderLight, alignItems: 'center' },
  typeActive: { backgroundColor: T.accentLight, borderColor: T.accent },
  typeTxt: { fontSize: 12, color: T.textM, fontWeight: '600' },
  typeActiveTxt: { fontSize: 12, color: T.accent, fontWeight: '800' },

  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: T.cardAlt, borderWidth: 1, borderColor: T.borderLight, marginRight: 8, justifyContent: 'center' },
  chipActive: { backgroundColor: T.accentDark, borderColor: T.accent },
  chipTxt: { fontSize: 13, color: T.textM, fontWeight: '600' },
  chipActiveTxt: { color: '#fff', fontWeight: '800' },

  payTypeBtn: { flex: 1, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: T.borderLight, alignItems: 'center' },
  payActive: { backgroundColor: T.greenLight, borderColor: T.green },
  payTxt: { fontSize: 12, color: T.textM, fontWeight: '600' },
  payActiveTxt: { fontSize: 12, color: T.green, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  receiptBox: { backgroundColor: '#fff', width: '90%', maxWidth: 360, padding: 24, borderRadius: 20 },
  receiptTitle: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  dashedLine: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: T.border, marginVertical: 12 },
});
