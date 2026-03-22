export interface User {
  id: number;
  auth_id?: string;
  login: string;
  pass: string;
  name: string;
  role: 'admin' | 'sotuvchi';
  permissions?: string[];
}

export interface Product {
  id: number;
  name: string;
  unit: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  packSize?: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  balance: number;
  tgId?: string;
}

export interface Sale {
  id: number;
  date: string;
  time: string;
  productId: number;
  productName: string;
  customerId: number;
  customerName: string;
  qty: number;
  price: number;
  unitPrice: number;
  cost: number;
  discount: number;
  total: number;
  profit: number;
  paidAmount: number;
  debtAmount: number;
  payType: 'naqd' | 'qarz' | 'aralash';
  user: string;
}

export interface Expense {
  id: number;
  category: string;
  categoryLabel?: string;
  amount: number;
  description: string;
  date: string;
  time?: string;
  user: string;
  vehiclePlate?: string;
}

export interface Dealer {
  id: number;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

export interface DealerTxn {
  id: number;
  dealerId: number;
  type: 'purchase' | 'payment';
  amount: number;
  description: string;
  products: string;
  date: string;
  time: string;
  user: string;
}

export interface ActivityLog {
  id: number;
  date: string;
  time: string;
  user: string;
  action: string;
}

export interface StoreData {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  expenses: Expense[];
  dealers: Dealer[];
  dealerTxns: DealerTxn[];
  activityLog: ActivityLog[];
  tgBotToken: string;
  tgChatId: string;
  smsApiToken: string;
  smsSignature: string;
}
