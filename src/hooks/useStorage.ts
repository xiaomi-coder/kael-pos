import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { User, Product, Customer, Sale, Expense, Dealer, DealerTxn, ActivityLog, StoreData } from '../types';

async function syncTable<T extends { id: any }>(tableName: string, oldItems: T[], newItems: T[]): Promise<string | null> {
  const inserted = newItems.filter(n => !oldItems.some(o => o.id === n.id));
  const deleted = oldItems.filter(o => !newItems.some(n => n.id === o.id));
  const updated = newItems.filter(n => {
    const o = oldItems.find(o => o.id === n.id);
    return o && JSON.stringify(o) !== JSON.stringify(n);
  });

  if (inserted.length > 0) {
    const { error } = await supabase.from(tableName).insert(inserted);
    if (error) return `${tableName} qo'shishda xatolik: ${error.message}`;
  }
  if (updated.length > 0) {
    const { error } = await supabase.from(tableName).upsert(updated);
    if (error) return `${tableName} yangilashda xatolik: ${error.message}`;
  }
  if (deleted.length > 0) {
    const { error } = await supabase.from(tableName).delete().in('id', deleted.map(d => d.id));
    if (error) return `${tableName} o'chirishda xatolik: ${error.message}`;
  }
  return null; // null = success
}

interface StorageState extends StoreData {
  users: User[];
  
  isLoading: boolean;
  
  fetchData: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchCustomers: () => Promise<void>;
  fetchSales: () => Promise<void>;
  fetchExpenses: () => Promise<void>;
  fetchDealers: () => Promise<void>;
  fetchDealerTxns: () => Promise<void>;
  fetchActivityLog: () => Promise<void>;
  fetchSettings: () => Promise<void>;

  setUsers: (users: User[] | ((prev: User[]) => User[])) => Promise<void>;
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => Promise<void>;
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => Promise<void>;
  setSales: (sales: Sale[] | ((prev: Sale[]) => Sale[])) => Promise<void>;
  setExpenses: (expenses: Expense[] | ((prev: Expense[]) => Expense[])) => Promise<void>;
  setDealers: (dealers: Dealer[] | ((prev: Dealer[]) => Dealer[])) => Promise<void>;
  setDealerTxns: (txns: DealerTxn[] | ((prev: DealerTxn[]) => DealerTxn[])) => Promise<void>;
  setActivityLog: (log: ActivityLog[] | ((prev: ActivityLog[]) => ActivityLog[])) => Promise<void>;
  
  setTgBotToken: (token: string) => Promise<void>;
  setTgChatId: (id: string) => Promise<void>;
  
  getTotalDebt: () => number;
  getTotalDealerDebt: () => number;

  logActivity: (user: string, action: string, date: string, time: string) => Promise<void>;
  resetStorage: () => Promise<void>;
}

export const useStorage = create<StorageState>((set, get) => ({
  users: [],
  products: [],
  customers: [],
  sales: [],
  expenses: [],
  dealers: [],
  dealerTxns: [],
  activityLog: [],
  tgBotToken: "",
  tgChatId: "",
  isLoading: true,

  fetchData: async () => {
    set({ isLoading: true });
    await Promise.all([
      get().fetchUsers(),
      get().fetchProducts(),
      get().fetchCustomers(),
      get().fetchSales(),
      get().fetchExpenses(),
      get().fetchDealers(),
      get().fetchDealerTxns(),
      get().fetchActivityLog(),
      get().fetchSettings()
    ]);
    set({ isLoading: false });
  },

  fetchUsers: async () => {
    const { data } = await supabase.from('users').select('*').order('id', { ascending: true });
    if (data) set({ users: data as User[] });
  },
  fetchProducts: async () => {
    const { data } = await supabase.from('products').select('*').order('id', { ascending: true });
    if (data) set({ products: data as Product[] });
  },
  fetchCustomers: async () => {
    const { data } = await supabase.from('customers').select('*').order('id', { ascending: true });
    if (data) set({ customers: data as Customer[] });
  },
  fetchSales: async () => {
    const { data } = await supabase.from('sales').select('*').order('id', { ascending: false });
    if (data) set({ sales: data as Sale[] });
  },
  fetchExpenses: async () => {
    const { data } = await supabase.from('expenses').select('*').order('id', { ascending: false });
    if (data) set({ expenses: data as Expense[] });
  },
  fetchDealers: async () => {
    const { data } = await supabase.from('dealers').select('*').order('id', { ascending: true });
    if (data) set({ dealers: data as Dealer[] });
  },
  fetchDealerTxns: async () => {
    const { data } = await supabase.from('dealer_txns').select('*').order('id', { ascending: false });
    if (data) set({ dealerTxns: data as DealerTxn[] });
  },
  fetchActivityLog: async () => {
    const { data } = await supabase.from('activity_log').select('*').order('id', { ascending: false }).limit(500);
    if (data) set({ activityLog: data as ActivityLog[] });
  },
  fetchSettings: async () => {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).maybeSingle();
    if (data) {
      set({ tgBotToken: data.tgBotToken || '', tgChatId: data.tgChatId || '' });
    }
  },

  setUsers: async (updater) => {
    const oldItems = get().users;
    const newItems = typeof updater === 'function' ? updater(oldItems) : updater;
    set({ users: newItems });
    const err = await syncTable('users', oldItems, newItems);
    if (err) { set({ users: oldItems }); alert(`⚠️ Saqlashda xatolik!\n${err}`); }
  },

  resetStorage: async () => {
    const tables = ['sales', 'expenses', 'dealer_txns', 'activity_log', 'customers', 'dealers', 'products', 'users'];
    for (const table of tables) {
      await supabase.from(table).delete().neq('id', 0);
    }
    set({ products: [], customers: [], sales: [], expenses: [], dealers: [], dealerTxns: [], activityLog: [], users: [] });
  },
  setProducts: async (updater) => {
    const oldItems = get().products;
    const newItems = typeof updater === 'function' ? updater(oldItems) : updater;
    set({ products: newItems });
    const err = await syncTable('products', oldItems, newItems);
    if (err) { set({ products: oldItems }); alert(`⚠️ Saqlashda xatolik!\n${err}`); }
  },
  setCustomers: async (updater) => {
    const oldItems = get().customers;
    const newItems = typeof updater === 'function' ? updater(oldItems) : updater;
    set({ customers: newItems });
    const err = await syncTable('customers', oldItems, newItems);
    if (err) { set({ customers: oldItems }); alert(`⚠️ Saqlashda xatolik!\n${err}`); }
  },
  setSales: async (updater) => {
    const oldItems = get().sales;
    const newItems = typeof updater === 'function' ? updater(oldItems) : updater;
    set({ sales: newItems });
    const err = await syncTable('sales', oldItems, newItems);
    if (err) { set({ sales: oldItems }); alert(`⚠️ Sotuv saqlanmadi!\n${err}`); }
  },
  setExpenses: async (updater) => {
    const oldItems = get().expenses;
    const newItems = typeof updater === 'function' ? updater(oldItems) : updater;
    set({ expenses: newItems });
    const err = await syncTable('expenses', oldItems, newItems);
    if (err) { set({ expenses: oldItems }); alert(`⚠️ Saqlashda xatolik!\n${err}`); }
  },
  setDealers: async (updater) => {
    const oldItems = get().dealers;
    const newItems = typeof updater === 'function' ? updater(oldItems) : updater;
    set({ dealers: newItems });
    const err = await syncTable('dealers', oldItems, newItems);
    if (err) { set({ dealers: oldItems }); alert(`⚠️ Saqlashda xatolik!\n${err}`); }
  },
  setDealerTxns: async (updater) => {
    const oldItems = get().dealerTxns;
    const newItems = typeof updater === 'function' ? updater(oldItems) : updater;
    set({ dealerTxns: newItems });
    const err = await syncTable('dealer_txns', oldItems, newItems);
    if (err) { set({ dealerTxns: oldItems }); alert(`⚠️ Saqlashda xatolik!\n${err}`); }
  },
  setActivityLog: async (updater) => {
    const oldItems = get().activityLog;
    const newItems = typeof updater === 'function' ? updater(oldItems) : updater;
    set({ activityLog: newItems });
    await syncTable('activity_log', oldItems, newItems);
  },

  setTgBotToken: async (token) => {
    await supabase.from('settings').upsert({ id: 1, tgBotToken: token });
    set({ tgBotToken: token });
  },
  setTgChatId: async (id) => {
    await supabase.from('settings').upsert({ id: 1, tgChatId: id });
    set({ tgChatId: id });
  },

  getTotalDebt: () => {
    return get().customers.reduce((s, c) => s + Math.min(0, c.balance), 0);
  },
  getTotalDealerDebt: () => {
    return get().dealers.reduce((s, d) => s + Math.min(0, d.balance), 0);
  },

  logActivity: async (user, action, date, time) => {
    const entry = { date, time, user, action };
    const { data } = await supabase.from('activity_log').insert(entry).select().single();
    if (data) {
      set((state) => ({ activityLog: [data, ...state.activityLog].slice(0, 500) }));
    }
  }
}));
