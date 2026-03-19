import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { T } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { fmt, getToday, filterSales, sumF } from '../utils';

export function ReportsScreen() {
  const { sales, expenses, customers, getTotalDebt, getTotalDealerDebt } = useStorage();
  
  const [reportRange, setReportRange] = useState("14d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  
  const today = getToday();
  const d = new Date();
  
  let fDate = today, tDate = today;
  if (reportRange === "7d") { d.setDate(d.getDate() - 7); fDate = d.toISOString().split("T")[0]; }
  else if (reportRange === "14d") { d.setDate(d.getDate() - 14); fDate = d.toISOString().split("T")[0]; }
  else if (reportRange === "30d") { d.setDate(d.getDate() - 30); fDate = d.toISOString().split("T")[0]; }
  else if (reportRange === "1y") { d.setFullYear(d.getFullYear() - 1); fDate = d.toISOString().split("T")[0]; }
  else if (reportRange === "custom") { fDate = customFrom || today; tDate = customTo || today; }

  const rs = filterSales(sales, fDate, tDate);
  const re = expenses.filter(e => e.date >= fDate && e.date <= tDate);
  
  const rRev = sumF(rs, "total");
  const rProf = sumF(rs, "profit");
  const rExp = sumF(re, "amount");
  const rNet = rProf - rExp;
  
  const topProds = Object.values(rs.reduce((acc: any, s: any) => {
    if (!acc[s.productId]) acc[s.productId] = { id: s.productId, name: s.productName, qty: 0, revenue: 0, profit: 0 };
    acc[s.productId].qty += s.qty; acc[s.productId].revenue += s.total; acc[s.productId].profit += s.profit;
    return acc;
  }, {})).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 10);

  const bestCusts = Object.values(rs.reduce((acc: any, s: any) => {
    if (s.customerId === 0) return acc;
    if (!acc[s.customerId]) acc[s.customerId] = { id: s.customerId, name: s.customerName, qty: 0, revenue: 0, debt: customers.find(c => c.id === s.customerId)?.balance || 0 };
    acc[s.customerId].qty += s.qty; acc[s.customerId].revenue += s.total;
    return acc;
  }, {})).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

  const StatCard = ({ title, value, color }: { title: string, value: string, color: string }) => (
    <Card style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[styles.statTitle, { color }]}>{title}</Text>
      <Text style={styles.statVal}>{value}</Text>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
       <View style={styles.headerRow}>
        <Text style={styles.title}>Hisobot (Tahlil)</Text>
      </View>

      <ScrollView contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 40}}>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16}}>
          {[{id:"7d",l:"7 kun"},{id:"14d",l:"14 kun"},{id:"30d",l:"1 oy"},{id:"1y",l:"1 yil"},{id:"custom",l:"Boshqa"}].map(r => (
            <TouchableOpacity 
              key={r.id} 
              style={[styles.rangeBtn, reportRange === r.id && styles.rangeBtnActive]}
              onPress={() => setReportRange(r.id)}
            >
              <Text style={[styles.rangeTxt, reportRange === r.id && styles.rangeTxtActive]}>{r.l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {reportRange === "custom" && (
          <View style={{flexDirection: 'row', gap: 10, marginBottom: 16}}>
            <Input label="Dan" value={customFrom} onChangeText={setCustomFrom} style={{flex: 1}} />
            <Input label="Gacha" value={customTo} onChangeText={setCustomTo} style={{flex: 1}} />
          </View>
        )}

        <View style={styles.statsGrid}>
          <StatCard title="Tushum (Aylanma)" value={fmt(rRev)} color={T.blue} />
          <StatCard title="Sof Foyda" value={fmt(rNet)} color={rNet >= 0 ? T.green : T.red} />
          <StatCard title="Xarajatlar" value={fmt(rExp)} color={T.red} />
          <StatCard title="Mijozlar qarzi (Jami)" value={fmt(Math.abs(getTotalDebt()))} color={T.accent} />
          <StatCard title="Dillerdan qarzimiz (Jami)" value={fmt(Math.abs(getTotalDealerDebt()))} color={T.orange} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Mahsulotlar (Sotuv haajmi)</Text>
          <Card style={{padding: 0, overflow: 'hidden'}}>
            {topProds.map((p: any, i) => (
              <View key={p.id} style={[styles.tableRow, i !== topProds.length - 1 && styles.borderBottom]}>
                <View style={{flex: 1}}><Text style={{fontWeight: '700', fontSize: 13}}>{p.name}</Text></View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={{color: T.blue, fontWeight: '800'}}>{fmt(p.revenue)}</Text>
                  <Text style={{fontSize: 11, color: T.textD}}>{p.qty} ta sotilgan</Text>
                </View>
              </View>
            ))}
            {topProds.length === 0 && <Text style={styles.emptyTxt}>Ma'lumot yo'q</Text>}
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Eng faol mijozlar</Text>
          <Card style={{padding: 0, overflow: 'hidden'}}>
            {bestCusts.map((c: any, i) => (
              <View key={c.id} style={[styles.tableRow, i !== bestCusts.length - 1 && styles.borderBottom]}>
                <View style={{flex: 1}}>
                  <Text style={{fontWeight: '700', fontSize: 13}}>{c.name}</Text>
                  <Text style={{fontSize: 11, color: c.debt < 0 ? T.red : T.textM}}>
                    Balans: {fmt(Math.abs(c.debt))} {c.debt < 0 ? "(Qarz)" : ""}
                  </Text>
                </View>
                <View style={{alignItems: 'flex-end'}}>
                  <Text style={{color: T.accent, fontWeight: '800'}}>{fmt(c.revenue)}</Text>
                  <Text style={{fontSize: 11, color: T.textD}}>{c.qty} marta xarid</Text>
                </View>
              </View>
            ))}
            {bestCusts.length === 0 && <Text style={styles.emptyTxt}>Ma'lumot yo'q</Text>}
          </Card>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: T.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '900', color: T.text },
  rangeBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: T.borderLight, backgroundColor: T.cardAlt },
  rangeBtnActive: { backgroundColor: T.accentLight, borderColor: T.accent },
  rangeTxt: { fontSize: 13, fontWeight: '600', color: T.textM },
  rangeTxtActive: { color: T.accent, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '48%', borderLeftWidth: 4, padding: 14 },
  statTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  statVal: { fontSize: 18, fontWeight: '900', color: T.text },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, color: T.text },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14, backgroundColor: '#fff' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: T.borderLight },
  emptyTxt: { padding: 20, textAlign: 'center', color: T.textD }
});
