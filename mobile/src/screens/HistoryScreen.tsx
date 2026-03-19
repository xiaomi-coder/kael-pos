import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { T } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { fmt } from '../utils';

export function HistoryScreen() {
  const { sales, customers } = useStorage();
  
  const [histSearch, setHistSearch] = useState("");
  const [histFilter, setHistFilter] = useState("all");
  const [histCustomer, setHistCustomer] = useState("");
  const [showCustStatement, setShowCustStatement] = useState<any>(null);

  let f = histFilter === "qarz" ? sales.filter((s:any) => s.payType === "qarz") : 
          histFilter === "naqd" ? sales.filter((s:any) => s.payType === "naqd") : 
          histFilter === "aralash" ? sales.filter((s:any) => s.payType === "aralash") : sales;
          
  if (histCustomer) f = f.filter((s:any) => s.customerId === Number(histCustomer));
  const displayed = histSearch ? f.filter((s:any) => s.customerName.toLowerCase().includes(histSearch.toLowerCase()) || s.productName.toLowerCase().includes(histSearch.toLowerCase())) : f;
  const selCust = histCustomer ? customers.find(c => c.id === Number(histCustomer)) : null;

  const renderTxn = ({item}: {item: any}) => (
    <Card style={styles.txnCard}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8}}>
        <Text style={styles.txnDate}>{item.date} {item.time}</Text>
        <Text style={styles.txnUser}>{item.user || "Admin"}</Text>
      </View>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
        <Text style={styles.txnCust}>{item.customerName}</Text>
        <Text style={styles.txnProd}>{item.productName} ({item.qty} ta)</Text>
      </View>
      
      <View style={styles.amountBox}>
        <View style={{flexDirection: 'row', gap: 6, alignItems: 'center'}}>
          <View style={[styles.badge, {backgroundColor: item.payType === 'naqd' ? T.green : item.payType === 'qarz' ? T.red : T.orange}]}>
            <Text style={styles.badgeTxt}>{item.payType === 'naqd' ? 'Naqd' : item.payType === 'qarz' ? 'Nasiya' : 'Aralash'}</Text>
          </View>
        </View>
        <Text style={styles.txnTotal}>{fmt(item.total)}</Text>
      </View>

      {(item.paidAmount > 0 || item.debtAmount > 0) && (
        <View style={styles.splitBox}>
          <Text style={{color: T.green, fontSize: 12, fontWeight: '700'}}>To'landi: {fmt(item.paidAmount)}</Text>
          {item.debtAmount > 0 && <Text style={{color: T.red, fontSize: 12, fontWeight: '700'}}>Qarzga: {fmt(item.debtAmount)}</Text>}
        </View>
      )}
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Sotuv tarixi</Text>
        <TouchableOpacity style={styles.exportBtn}>
          <Text style={styles.exportTxt}>Excel</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.custScroll}>
          <TouchableOpacity 
            style={[styles.filterChip, histCustomer === "" && styles.filterChipActive]}
            onPress={() => setHistCustomer("")}
          >
            <Text style={[styles.filterTxt, histCustomer === "" && styles.filterTxtActive]}>Barcha mijozlar</Text>
          </TouchableOpacity>
          {customers.map(c => (
            <TouchableOpacity 
              key={c.id} 
              style={[styles.filterChip, histCustomer === String(c.id) && styles.filterChipActive]}
              onPress={() => setHistCustomer(String(c.id))}
            >
              <Text style={[styles.filterTxt, histCustomer === String(c.id) && styles.filterTxtActive]}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selCust && (
          <View style={styles.selCustBox}>
            <Text style={{fontSize: 14, fontWeight: '700'}}>{selCust.name} <Text style={{fontWeight: '400', color: T.textD}}>{selCust.phone}</Text></Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4}}>
              <Text style={{color: selCust.balance < 0 ? T.red : T.green, fontWeight: '800'}}>{fmt(Math.abs(selCust.balance))} {selCust.balance < 0 ? "Qarzingiz bor" : ""}</Text>
              <TouchableOpacity style={styles.sverkaBtn} onPress={() => setShowCustStatement(selCust)}>
                <Text style={styles.sverkaTxt}>Sverka</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={{flexDirection: 'row', gap: 8, marginVertical: 12}}>
          {[['all','Hammasi'],['naqd','Naqd'],['qarz','Nasiya'],['aralash','Aralash']].map(([k,l]) => (
            <TouchableOpacity 
              key={k} 
              style={[styles.typeBtn, histFilter === k && {backgroundColor: T.accentLight, borderColor: T.accent}]}
              onPress={() => setHistFilter(k)}
            >
              <Text style={[styles.typeTxt, histFilter === k && {color: T.accent, fontWeight: '800'}]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <Input 
          placeholder="Qidirish..." 
          value={histSearch} 
          onChangeText={setHistSearch} 
          style={{marginBottom: 0}}
        />
      </View>

      <FlatList
        data={displayed.slice(0, 100)} // performance limit
        keyExtractor={s => s.id.toString()}
        renderItem={renderTxn}
        contentContainerStyle={{paddingHorizontal: 16, gap: 10, paddingBottom: 40}}
      />

      {/* Statement Modal */}
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
  exportBtn: { backgroundColor: T.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: T.border },
  exportTxt: { fontSize: 12, fontWeight: '700', color: T.textM },
  filterSection: { paddingHorizontal: 16, marginBottom: 12 },
  custScroll: { maxHeight: 40, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: T.cardAlt, borderWidth: 1, borderColor: T.borderLight, marginRight: 8, justifyContent: 'center' },
  filterChipActive: { backgroundColor: T.accentDark, borderColor: T.accent },
  filterTxt: { fontSize: 13, color: T.textM, fontWeight: '600' },
  filterTxtActive: { color: '#fff', fontWeight: '800' },
  selCustBox: { backgroundColor: T.card, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: T.border },
  sverkaBtn: { backgroundColor: T.cardAlt, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: T.border },
  sverkaTxt: { fontSize: 11, fontWeight: '700', color: T.textM },
  typeBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: T.cardAlt, borderRadius: 8, borderWidth: 1, borderColor: T.borderLight },
  typeTxt: { fontSize: 12, fontWeight: '600', color: T.textD },
  txnCard: { padding: 14, marginBottom: 4 },
  txnDate: { fontSize: 12, color: T.textD, fontWeight: '600' },
  txnUser: { fontSize: 11, color: T.textM, backgroundColor: T.cardAlt, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  txnCust: { fontSize: 15, fontWeight: '800', color: T.text },
  txnProd: { fontSize: 13, color: T.textM, fontWeight: '600' },
  amountBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeTxt: { color: '#fff', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  txnTotal: { fontSize: 18, fontWeight: '900', color: T.text },
  splitBox: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 6, borderTopWidth: 1, borderTopColor: T.borderLight, paddingTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', width: '90%', maxWidth: 400, padding: 20, borderRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeTxt: { fontSize: 20, color: T.textM, fontWeight: '700', padding: 4 },
  statementItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.borderLight }
});
