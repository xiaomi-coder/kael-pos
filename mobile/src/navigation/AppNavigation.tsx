import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LayoutDashboard, ShoppingCart, Package, Wallet, BadgeMinus } from 'lucide-react-native';

import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ProductsScreen } from '../screens/ProductsScreen';
import { SalesScreen } from '../screens/SalesScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { DebtsScreen } from '../screens/DebtsScreen';
import { useAuth } from '../hooks/useAuth';
import { useStorage } from '../hooks/useStorage';
import { T } from '../constants/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: T.accent,
        tabBarInactiveTintColor: T.textD,
        tabBarStyle: { backgroundColor: T.navBg, borderTopColor: 'rgba(255,255,255,0.1)' },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Dashboard') return <LayoutDashboard color={color} size={size} />;
          if (route.name === 'Kassa') return <ShoppingCart color={color} size={size} />;
          if (route.name === 'Ombor') return <Package color={color} size={size} />;
          if (route.name === 'Xarajatlar') return <Wallet color={color} size={size} />;
          if (route.name === 'Qarzlar') return <BadgeMinus color={color} size={size} />;
          return null;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Kassa" component={SalesScreen} />
      <Tab.Screen name="Ombor" component={ProductsScreen} />
      <Tab.Screen name="Xarajatlar" component={ExpensesScreen} />
      <Tab.Screen name="Qarzlar" component={DebtsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigation() {
  const { currentUser, isRestoring, restoreSession } = useAuth();
  const { fetchData, isLoading } = useStorage();

  // Restore existing Supabase session on app start
  useEffect(() => {
    restoreSession();
  }, []);

  // Load data after login
  useEffect(() => {
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, fetchData]);

  // Show spinner while restoring session
  if (isRestoring) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={T.accent} />
      </View>
    );
  }

  // Show loading screen while fetching data after login
  if (currentUser && isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={T.accent} />
        <Text style={{ color: T.textM, fontSize: 16, fontWeight: '600', marginTop: 16 }}>Ma'lumotlar yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});
