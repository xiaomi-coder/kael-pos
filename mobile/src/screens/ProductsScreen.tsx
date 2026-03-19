import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { T } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { fmt } from '../utils';

export function ProductsScreen() {
  const { products, setProducts, logActivity } = useStorage();
  
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProd, setEditProd] = useState<any>(null);
  const [form, setForm] = useState({ name: '', unit: 'dona', price: '', cost: '', stock: '', minStock: '' });

  const filtered = search ? products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase())) : products;

  const handleSave = () => {
    if (!form.name || !form.price) return;
    
    if (editProd) {
      setProducts((prev: any[]) => prev.map((p: any) => p.id === editProd.id ? { 
        ...p, name: form.name, unit: form.unit, 
        price: Number(form.price), cost: Number(form.cost), 
        stock: Number(form.stock) || 0, minStock: Number(form.minStock) || 10 
      } : p));
      logActivity("Tizim", `Mahsulot tahrirlandi: ${form.name}`, "", "");
    } else {
      const newId = products.length > 0 ? Math.max(...products.map((x: any) => x.id)) + 1 : 1;
      setProducts((prev: any[]) => [...prev, { 
        id: newId, name: form.name, unit: form.unit, 
        price: Number(form.price), cost: Number(form.cost), 
        stock: Number(form.stock) || 0, minStock: Number(form.minStock) || 10 
      }]);
      logActivity("Tizim", `Yangi mahsulot: ${form.name}`, "", "");
    }
    closeModal();
  };

  const openAppEdit = (p: any) => {
    setForm({ name: p.name, unit: p.unit, price: String(p.price), cost: String(p.cost), stock: String(p.stock), minStock: String(p.minStock) });
    setEditProd(p);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditProd(null);
    setForm({ name: '', unit: 'dona', price: '', cost: '', stock: '', minStock: '' });
  };

  const handleDelete = (id: number) => {
    Alert.alert("O'chirish", "Mabshulotni o'chirmoqchimisiz?", [
      { text: "Yo'q", style: "cancel" },
      { text: "Ha", style: "destructive", onPress: () => {
        setProducts((prev: any[]) => prev.filter((p: any) => p.id !== id));
        logActivity("Tizim", "Mahsulot o'chirildi", "", "");
      }}
    ]);
  };

  const renderItem = ({ item }: any) => {
    const isLow = item.stock <= item.minStock;
    const isZero = item.stock === 0;

    return (
      <Card style={[styles.productCard, isLow && { borderColor: T.red, borderWidth: 1 }]}>
        <View style={styles.prodHeader}>
          <Text style={styles.prodName}>{item.name}</Text>
          <View style={styles.actionBtns}>
            <TouchableOpacity onPress={() => openAppEdit(item)} style={styles.iconBtn}>
              <Text style={{color: T.blue, fontSize: 16}}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
              <Text style={{color: T.red, fontSize: 16}}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.prodDetails}>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Tannarx</Text>
            <Text style={styles.detailValue}>{fmt(item.cost)}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Sotuv narxi</Text>
            <Text style={[styles.detailValue, {color: T.accent}]}>{fmt(item.price)}</Text>
          </View>
          <View style={styles.detailCol}>
            <Text style={styles.detailLabel}>Qoldiq</Text>
            <Text style={[styles.detailValue, isZero ? {color: T.red} : isLow ? {color: T.orange} : {}]}>
              {item.stock} {item.unit}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Ombor</Text>
          <Button title="+ Yangi" onPress={() => setShowModal(true)} style={{paddingVertical: 10, paddingHorizontal: 16}} />
        </View>
        
        <Input 
          placeholder="Mahsulot qidirish..." 
          value={search}
          onChangeText={setSearch}
        />

        <FlatList
          data={filtered}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />

        <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editProd ? "Tahrirlash" : "Yangi mahsulot"}</Text>
              <TouchableOpacity onPress={closeModal}><Text style={styles.closeBtn}>Bekor qilish</Text></TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Input label="Nomi" value={form.name} onChangeText={(t: string) => setForm((p: any) => ({...p, name: t}))} />
              <Input label="Birlik (dona, kg, metr)" value={form.unit} onChangeText={(t: string) => setForm((p: any) => ({...p, unit: t}))} />
              <Input label="Tannarx" keyboardType="numeric" value={form.cost} onChangeText={(t: string) => setForm((p: any) => ({...p, cost: t}))} />
              <Input label="Sotuv narx" keyboardType="numeric" value={form.price} onChangeText={(t: string) => setForm((p: any) => ({...p, price: t}))} />
              
              <View style={{flexDirection: 'row', gap: 10}}>
                <View style={{flex: 1}}>
                  <Input label="Qoldiq" keyboardType="numeric" value={form.stock} onChangeText={(t: string) => setForm((p: any) => ({...p, stock: t}))} />
                </View>
                <View style={{flex: 1}}>
                  <Input label="Min qoldiq" keyboardType="numeric" value={form.minStock} onChangeText={(t: string) => setForm((p: any) => ({...p, minStock: t}))} />
                </View>
              </View>

              <Button title={editProd ? "Saqlash" : "Qo'shish"} onPress={handleSave} style={{marginTop: 10}} />
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: T.bg },
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: T.text },
  
  productCard: { marginBottom: 12, padding: 16 },
  prodHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  prodName: { fontSize: 16, fontWeight: '700', color: T.text, flex: 1 },
  actionBtns: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  
  prodDetails: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: T.borderLight, paddingTop: 12 },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 11, color: T.textM, marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: '700', color: T.text },

  modalHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: T.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  closeBtn: { color: T.red, fontWeight: '600' },
  modalBody: { padding: 20 },
});
