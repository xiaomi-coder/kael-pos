import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Product, Customer, Sale, Expense, Dealer, DealerTxn, ActivityLog, StoreData } from '../types';
import { PRODUCTS_INIT, CUSTOMERS_INIT, DEALERS_INIT, generateSales, USERS } from '../constants';

interface StorageState extends StoreData {
  users: User[];
  setUsers: (users: User[] | ((prev: User[]) => User[])) => void;
  setProducts: (products: Product[] | ((prev: Product[]) => Product[])) => void;
  setCustomers: (customers: Customer[] | ((prev: Customer[]) => Customer[])) => void;
  setSales: (sales: Sale[] | ((prev: Sale[]) => Sale[])) => void;
  setExpenses: (expenses: Expense[] | ((prev: Expense[]) => Expense[])) => void;
  setDealers: (dealers: Dealer[] | ((prev: Dealer[]) => Dealer[])) => void;
  setDealerTxns: (txns: DealerTxn[] | ((prev: DealerTxn[]) => DealerTxn[])) => void;
  setActivityLog: (log: ActivityLog[] | ((prev: ActivityLog[]) => ActivityLog[])) => void;
  setTgBotToken: (token: string) => void;
  setTgChatId: (id: string) => void;
  
  getTotalDebt: () => number;
  getTotalDealerDebt: () => number;

  logActivity: (user: string, action: string, date: string, time: string) => void;
  resetStorage: () => void;
}

export const useStorage = create<StorageState>()(
  persist(
    (set, get) => ({
      users: USERS as User[],
      products: PRODUCTS_INIT,
      customers: CUSTOMERS_INIT,
      sales: generateSales(),
      expenses: [],
      dealers: DEALERS_INIT,
      dealerTxns: [],
      activityLog: [],
      tgBotToken: "",
      tgChatId: "",

      setUsers: (updater) => set((state) => ({ users: typeof updater === 'function' ? updater(state.users) : updater })),
      setProducts: (updater) => set((state) => ({ products: typeof updater === 'function' ? updater(state.products) : updater })),
      setCustomers: (updater) => set((state) => ({ customers: typeof updater === 'function' ? updater(state.customers) : updater })),
      setSales: (updater) => set((state) => ({ sales: typeof updater === 'function' ? updater(state.sales) : updater })),
      setExpenses: (updater) => set((state) => ({ expenses: typeof updater === 'function' ? updater(state.expenses) : updater })),
      setDealers: (updater) => set((state) => ({ dealers: typeof updater === 'function' ? updater(state.dealers) : updater })),
      setDealerTxns: (updater) => set((state) => ({ dealerTxns: typeof updater === 'function' ? updater(state.dealerTxns) : updater })),
      setActivityLog: (updater) => set((state) => ({ activityLog: typeof updater === 'function' ? updater(state.activityLog) : updater })),
      setTgBotToken: (token) => set({ tgBotToken: token }),
      setTgChatId: (id) => set({ tgChatId: id }),

      getTotalDebt: () => {
        return get().customers.reduce((s, c) => s + Math.min(0, c.balance), 0);
      },
      getTotalDealerDebt: () => {
        return get().dealers.reduce((s, d) => s + Math.min(0, d.balance), 0);
      },

      logActivity: (user, action, date, time) => set((state) => {
        const entry: ActivityLog = { id: Date.now(), date, time, user, action };
        return { activityLog: [entry, ...state.activityLog].slice(0, 500) };
      }),

      resetStorage: () => set({
        users: USERS as User[],
        products: PRODUCTS_INIT,
        customers: CUSTOMERS_INIT,
        sales: generateSales(),
        expenses: [],
        dealers: DEALERS_INIT,
        dealerTxns: [],
        activityLog: [],
        tgBotToken: "",
        tgChatId: ""
      }),
    }),
    {
      name: 'kael-pos-v2', // Match the exact local storage key so data is kept
    }
  )
);
