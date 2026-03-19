import React from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { T } from '../constants/theme';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';

export function LoginScreen() {
  const { loginUser, loginPass, setLoginUser, setLoginPass, loginError, handleLogin, isLoggingIn } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View 
        style={styles.container}
      >
        <Card style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>KAEL POS</Text>
            <Text style={styles.subtitle}>Tizimga kirish</Text>
          </View>
          
          {loginError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{loginError}</Text>
            </View>
          ) : null}

          <Input
            label="Login"
            value={loginUser}
            onChangeText={setLoginUser}
            autoCapitalize="none"
            editable={!isLoggingIn}
          />
          
          <Input
            label="Parol"
            value={loginPass}
            onChangeText={setLoginPass}
            secureTextEntry
            editable={!isLoggingIn}
          />

          <Button
            title={isLoggingIn ? "Tizimga ulanmoqda..." : "Kirish"}
            onPress={handleLogin}
            isLoading={isLoggingIn}
            style={styles.button}
          />
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: T.bg,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: T.text,
  },
  subtitle: {
    color: T.textD,
    fontSize: 14,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: T.redLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: T.red,
    fontSize: 13,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  }
});
