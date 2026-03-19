import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import { T } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { filterSales, getDateRange, sumF, pctCh, getToday, fmt } from '../utils';

function StatCard({ title, value, color, icon, change }: any) {
  return (
    <Card style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statIcon, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {change !== undefined && (
        <View style={styles.changeBadge}>
          <Text style={[styles.changeText, { color: change >= 0 ? T.green : T.red }]}>
            {change > 0 ? '+' : ''}{change}%
          </Text>
        </View>
      )}
    </Card>
  );
}

export function DashboardScreen() {
  const { products, sales, expenses, getTotalDebt } = useStorage();
  const { currentUser, logout } = useAuth();
  
  const today = getToday();
  const tDebt = getTotalDebt();
  const thisWeek = filterSales(sales, getDateRange(7), today);
  const lastWeek = filterSales(sales, getDateRange(14), getDateRange(7));
  const lowStockProducts = products.filter((p: any) => p.stock <= p.minStock);
  
  const thisMonthExpenses = expenses.filter((e: any) => e.date >= getDateRange(30));
  const totalExpThisMonth = thisMonthExpenses.reduce((s: any, e: any) => s + e.amount, 0);

  const twR = sumF(thisWeek, "total"), lwR = sumF(lastWeek, "total");
  const twP = sumF(thisWeek, "profit"), lwP = sumF(lastWeek, "profit");
  
  const todaySales = sales.filter((s: any) => s.date === today);
  const yesterday = getDateRange(1);
  const yesterdaySales = sales.filter((s: any) => s.date === yesterday);

  const tdR = sumF(todaySales, "total"), ydR = sumF(yesterdaySales, "total");
  const tdP = sumF(todaySales, "profit"), ydP = sumF(yesterdaySales, "profit");

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Boshqaruv</Text>
            <Text style={styles.subtitle}>{today} • {currentUser?.name}</Text>
          </View>
          <Text onPress={logout} style={styles.logoutBtn}>Chiqish</Text>
        </View>

        {lowStockProducts.length > 0 && (
          <Card style={[styles.alertCard, { borderColor: T.red }]}>
            <Text style={styles.alertTitle}>⚠ Kam qolgan tovarlar ({lowStockProducts.length})</Text>
            {lowStockProducts.slice(0, 3).map((p: any) => (
              <View key={p.id} style={styles.alertItem}>
                <Text style={styles.alertItemName}>{p.name}</Text>
                <Text style={styles.alertItemStock}>{p.stock} / {p.minStock}</Text>
              </View>
            ))}
            {lowStockProducts.length > 3 && <Text style={styles.alertMore}>...va yana {lowStockProducts.length - 3} ta</Text>}
          </Card>
        )}

        <View style={styles.statsGrid}>
          <StatCard title="Bugungi tushum" value={fmt(tdR)} change={pctCh(tdR, ydR)} color={T.accentDark} icon="☀" />
          <StatCard title="Bugungi foyda" value={fmt(tdP)} change={pctCh(tdP, ydP)} color={T.green} icon="★" />
          <StatCard title="Haftalik tushum" value={fmt(twR)} change={pctCh(twR, lwR)} color={T.accent} icon="◎" />
          <StatCard title="Jami qarz" value={fmt(Math.abs(tDebt))} color={T.red} icon="◈" />
        </View>

        <Card style={styles.salesCard}>
          <Text style={styles.salesCardTitle}>Bugungi sotuvlar ({todaySales.length})</Text>
          {todaySales.length === 0 ? (
            <Text style={styles.emptyText}>Bugun sotuv yo'q</Text>
          ) : (
            todaySales.slice(0, 5).map((s: any) => (
              <View key={s.id} style={styles.saleRow}>
                <View>
                  <Text style={styles.saleCustomer}>{s.customerName}</Text>
                  <Text style={styles.saleProduct}>{s.productName} • {s.qty}ta</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.saleTotal}>{fmt(s.total)}</Text>
                  <Text style={[styles.saleType, s.payType === 'naqd' ? {color: T.green} : {color: T.orange}]}>{s.payType}</Text>
                </View>
              </View>
            ))
          )}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: T.bg },
  container: { padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', color: T.text },
  subtitle: { fontSize: 13, color: T.textD, marginTop: 4 },
  logoutBtn: { color: T.red, fontWeight: '600' },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 16,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statTitle: { fontSize: 12, color: T.textM, flex: 1 },
  statIcon: { fontSize: 16 },
  statValue: { fontSize: 16, fontWeight: '700', color: T.text, marginTop: 4 },
  changeBadge: { marginTop: 6 },
  changeText: { fontSize: 11, fontWeight: '700' },

  alertCard: { backgroundColor: T.redLight, marginBottom: 20 },
  alertTitle: { color: T.red, fontWeight: '700', marginBottom: 12 },
  alertItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  alertItemName: { fontSize: 13, color: T.text },
  alertItemStock: { fontSize: 13, fontWeight: '700', color: T.red },
  alertMore: { fontSize: 12, color: T.textM, marginTop: 4, fontStyle: 'italic' },

  salesCard: { marginBottom: 30 },
  salesCardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  emptyText: { color: T.textD, textAlign: 'center', paddingVertical: 20 },
  saleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: T.borderLight,
  },
  saleCustomer: { fontSize: 14, fontWeight: '600', color: T.text },
  saleProduct: { fontSize: 12, color: T.textM, marginTop: 2 },
  saleTotal: { fontSize: 14, fontWeight: '700', color: T.accent },
  saleType: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
