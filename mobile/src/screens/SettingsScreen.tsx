import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStorage } from '../hooks/useStorage';
import { useAuth } from '../hooks/useAuth';
import { T } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

const TABS = [
  { id: "dashboard", label: "Boshqaruv", icon: "◉" },
  { id: "sales", label: "Sotuv", icon: "⊕" },
  { id: "history", label: "Tarix", icon: "◷" },
  { id: "warehouse", label: "Ombor", icon: "⬡" },
  { id: "customers", label: "Mijozlar", icon: "◎" },
  { id: "debts", label: "Qarzlar", icon: "◈" },
  { id: "expenses", label: "Xarajatlar", icon: "▣" },
  { id: "dealers", label: "Dillerlar", icon: "◇" },
  { id: "reports", label: "Hisobotlar", icon: "△" },
  { id: "settings", label: "Sozlamalar", icon: "⚙" },
];

export function SettingsScreen() {
  const { tgBotToken, tgChatId, setTgBotToken, setTgChatId, activityLog, users, setUsers } = useStorage();
  const { currentUser, logout } = useAuth();

  const [botTokenInput, setBotTokenInput] = useState(tgBotToken);
  const [chatIdInput, setChatIdInput] = useState(tgChatId);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [userForm, setUserForm] = useState<any>({ login: "", pass: "", name: "", role: "sotuvchi", permissions: [] });

  const saveTg = () => {
    setTgBotToken(botTokenInput);
    setTgChatId(chatIdInput);
    Alert.alert("Muvaffaqiyatli", "Telegram sozlamalari saqlandi!");
  };



  const togglePermission = (tabId: string) => {
    setUserForm((prev: any) => {
      const perms = prev.permissions || [];
      return {
        ...prev,
        permissions: perms.includes(tabId) 
          ? perms.filter((p: string) => p !== tabId) 
          : [...perms, tabId]
      };
    });
  };

  const handleSaveUser = () => {
    if (!userForm.login || !userForm.pass || !userForm.name) {
      Alert.alert("Xatolik", "Barcha qatorlarni to'ldiring");
      return;
    }
    if (editUser && editUser.role === 'admin' && userForm.role !== 'admin') {
      Alert.alert("Xatolik", "Asosiy admin rolini o'zgartirib bo'lmaydi."); 
      return;
    }
    
    if (editUser) {
      setUsers((prev:any[]) => prev.map(u => u.id === editUser.id ? { ...u, ...userForm } : u));
    } else {
      setUsers((prev:any[]) => [...prev, { id: Math.max(0, ...prev.map(x => x.id)) + 1, ...userForm }]);
    }
    setShowUserModal(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Sozlamalar</Text>
      </View>

      <ScrollView contentContainerStyle={{paddingHorizontal: 16, paddingBottom: 40, gap: 16}}>
        
        {/* Profile Card */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Xavfsizlik & Profil</Text>
          <View style={styles.profileBox}>
            <View style={{flex: 1}}>
              <Text style={{fontSize: 18, fontWeight: '800', color: T.text}}>{currentUser?.name}</Text>
              <Text style={{fontSize: 13, color: T.textM, marginTop: 4}}>
                Login: {currentUser?.login} • Rol: <Text style={{color: T.accent, fontWeight: '700', textTransform: 'capitalize'}}>{currentUser?.role}</Text>
              </Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
              <Text style={{color: T.red, fontWeight: '700'}}>Chiqish</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {currentUser?.role === 'admin' && (
          <>
            {/* Users Card */}
            <Card style={styles.card}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                <Text style={styles.sectionTitle}>Xodimlar va Rollar</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => { setEditUser(null); setUserForm({ login: "", pass: "", name: "", role: "sotuvchi", permissions: ['sales', 'history', 'customers'] }); setShowUserModal(true); }}>
                  <Text style={{color: '#fff', fontWeight: '700', fontSize: 13}}>+ Yangi</Text>
                </TouchableOpacity>
              </View>
              <View style={{gap: 8}}>
                {users.map(u => (
                  <View key={u.id} style={styles.userRow}>
                    <View style={{flex: 1}}>
                      <Text style={{fontWeight: '700', fontSize: 15}}>{u.name}</Text>
                      <Text style={{fontSize: 12, color: T.textD}}>{u.login} / ••••••••</Text>
                    </View>
                    <View style={{alignItems: 'flex-end', gap: 6}}>
                      <View style={[styles.roleBadge, {backgroundColor: u.role === 'admin' ? T.redLight : T.blueLight}]}>
                        <Text style={{color: u.role === 'admin' ? T.red : T.blue, fontSize: 10, fontWeight: '800', textTransform: 'uppercase'}}>{u.role}</Text>
                      </View>
                      <TouchableOpacity onPress={() => { setEditUser(u); setUserForm({ ...u, permissions: u.permissions || [] }); setShowUserModal(true); }}>
                        <Text style={{color: T.blue, fontWeight: '800', padding: 4}}>Tahrir</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </Card>

            {/* Telegram Card */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}><Text style={{color: T.blue}}>✈ </Text>Telegram Bot (Xabarnoma)</Text>
              <Text style={styles.subTxt}>Avtomatik xabar yuborish uchun bot tokeni va Chat ID sini kiritib saqlang.</Text>
              <Input label="Bot Token" value={botTokenInput} onChangeText={setBotTokenInput} placeholder="Misol: 123456:ABC..." />
              <Input label="Chat ID" value={chatIdInput} onChangeText={setChatIdInput} placeholder="Misol: -10012345..." />
              <Button title="Telegram sozlamalarini saqlash" onPress={saveTg} />
            </Card>

            {/* Data Management */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Ma'lumotlar Boshqaruvi</Text>
              <TouchableOpacity style={[styles.dangerBtn, {backgroundColor: T.cardAlt, borderColor: T.borderLight}]} onPress={() => Alert.alert("E'tibor bering", "Zaxira nusxa (Excel) yuklab olish uchun web versiyadan kiring.")}>
                <Text style={{color: T.text, fontWeight: '700'}}>Zaxira nusxa olish (Faqat Webda)</Text>
              </TouchableOpacity>

            </Card>

            {/* Activity Log */}
            <Card style={[styles.card, {padding: 0, overflow: 'hidden'}]}>
              <View style={{padding: 16, backgroundColor: T.cardAlt, borderBottomWidth: 1, borderBottomColor: T.borderLight}}>
                <Text style={{fontSize: 16, fontWeight: '800'}}>Tizim Jurnali (Log)</Text>
                <Text style={{fontSize: 12, color: T.textD}}>So'nggi amal ko'rinishlari</Text>
              </View>
              <ScrollView style={{maxHeight: 250}} contentContainerStyle={{padding: 16, gap: 12}}>
                {activityLog.length === 0 ? <Text style={{textAlign: 'center', color: T.textD}}>Jurnal bo'sh</Text> : 
                  activityLog.slice(0, 100).map(l => (
                    <View key={l.id} style={{borderBottomWidth: 1, borderBottomColor: T.borderLight, paddingBottom: 8, borderStyle: 'dashed'}}>
                      <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4}}>
                        <Text style={{fontWeight: '700', fontSize: 13, color: T.accent}}>{l.user}</Text>
                        <Text style={{fontSize: 11, color: T.textD}}>{l.date} {l.time}</Text>
                      </View>
                      <Text style={{fontSize: 13, color: T.textM}}>{l.action}</Text>
                    </View>
                  ))
                }
              </ScrollView>
            </Card>
          </>
        )}

      </ScrollView>

      {/* User Edit Modal */}
      <Modal visible={showUserModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalBox, {maxHeight: '90%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editUser ? "Tahrirlash" : "Yangi xodim"}</Text>
              <TouchableOpacity onPress={() => setShowUserModal(false)}><Text style={styles.closeTxt}>✕</Text></TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <Input label="F.I.SH" value={userForm.name} onChangeText={t => setUserForm({...userForm, name: t})} />
              <Input label="Login" value={userForm.login} onChangeText={t => setUserForm({...userForm, login: t})} autoCapitalize="none" />
              <Input label="Parol" value={userForm.pass} onChangeText={t => setUserForm({...userForm, pass: t})} />

              {editUser?.role !== 'admin' && (
                <>
                  <Text style={styles.label}>Rol</Text>
                  <View style={{flexDirection: 'row', gap: 10, marginBottom: 16}}>
                    <TouchableOpacity style={[styles.roleSelectBtn, userForm.role === 'sotuvchi' && styles.roleActive]} onPress={() => setUserForm({...userForm, role: 'sotuvchi'})}>
                      <Text style={[styles.roleSelectTxt, userForm.role === 'sotuvchi' && styles.roleActiveTxt]}>Oddiy xodim</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.roleSelectBtn, userForm.role === 'admin' && styles.roleActive]} onPress={() => setUserForm({...userForm, role: 'admin'})}>
                      <Text style={[styles.roleSelectTxt, userForm.role === 'admin' && styles.roleActiveTxt]}>Admin</Text>
                    </TouchableOpacity>
                  </View>

                  {userForm.role !== 'admin' && (
                    <View>
                      <Text style={styles.label}>Ruxsatlar</Text>
                      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16}}>
                        {TABS.map(t => (
                          <TouchableOpacity 
                            key={t.id} 
                            style={[styles.permBadge, userForm.permissions.includes(t.id) && {backgroundColor: T.accentLight, borderColor: T.accent}]}
                            onPress={() => togglePermission(t.id)}
                          >
                            <Text style={userForm.permissions.includes(t.id) ? {color: T.accent, fontWeight: '700'} : {color: T.textM}}>{t.icon} {t.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}

              <Button title="Saqlash" onPress={handleSaveUser} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: T.bg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '900', color: T.text },
  card: { padding: 16, borderRadius: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  profileBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: T.cardAlt, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: T.borderLight },
  logoutBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: T.red },
  addBtn: { backgroundColor: T.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  userRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.borderLight },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  subTxt: { fontSize: 13, color: T.textD, marginBottom: 16 },
  dangerBtn: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(220,38,38,0.3)', backgroundColor: T.redLight, alignItems: 'center', marginBottom: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', width: '90%', maxWidth: 400, padding: 20, borderRadius: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  closeTxt: { fontSize: 20, color: T.textM, fontWeight: '700', padding: 4 },
  label: { fontSize: 13, fontWeight: '700', color: T.textM, marginBottom: 8 },
  roleSelectBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: T.border, alignItems: 'center', backgroundColor: T.cardAlt },
  roleActive: { backgroundColor: T.accentLight, borderColor: T.accent },
  roleSelectTxt: { fontWeight: '600', color: T.textM },
  roleActiveTxt: { color: T.accent, fontWeight: '800' },
  permBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: T.cardAlt, borderWidth: 1, borderColor: T.borderLight }
});
