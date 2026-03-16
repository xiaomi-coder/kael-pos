import { Product, Customer, Dealer } from './types';

// ═══════ USERS (Multi-login) ═══════
export const USERS = [
  { id: 1, login: "admin", pass: "admin123", name: "Do'kon egasi", role: "admin" },
  { id: 2, login: "sotuvchi", pass: "sotuvchi1", name: "Sotuvchi", role: "seller" },
  { id: 3, login: "uka", pass: "uka123", name: "Uka (yordamchi)", role: "helper" },
];

// ═══════ DEFAULT DATA ═══════
export const PRODUCTS_INIT: Product[] = [
  { id: 1, name: "Sement M400", unit: "dona", price: 62000, cost: 55000, stock: 450, minStock: 50 },
  { id: 2, name: "Sement M500", unit: "dona", price: 72000, cost: 64000, stock: 320, minStock: 40 },
  { id: 3, name: "Sement Oq", unit: "dona", price: 85000, cost: 76000, stock: 180, minStock: 30 },
  { id: 4, name: "Qum (1 tonna)", unit: "tonna", price: 180000, cost: 120000, stock: 50, minStock: 10 },
  { id: 5, name: "Shag'al (1 tonna)", unit: "tonna", price: 220000, cost: 160000, stock: 40, minStock: 8 },
  { id: 6, name: "G'isht (1000 dona)", unit: "ming", price: 950000, cost: 750000, stock: 25, minStock: 5 },
  { id: 7, name: "Armatura 12mm", unit: "metr", price: 18000, cost: 14000, stock: 2000, minStock: 200 },
  { id: 8, name: "Armatura 16mm", unit: "metr", price: 28000, cost: 22000, stock: 1500, minStock: 150 },
  { id: 9, name: "Sim (1 kg)", unit: "kg", price: 8000, cost: 6000, stock: 500, minStock: 50 },
  { id: 10, name: "Kafel 30x30", unit: "kv.m", price: 45000, cost: 32000, stock: 800, minStock: 100 },
];

export const CUSTOMERS_INIT: Customer[] = [
  { id: 1, name: "Akmal Toshmatov", phone: "+998901234567", address: "Toshkent sh.", balance: -2500000 },
  { id: 2, name: "Bobur Karimov", phone: "+998931234567", address: "Samarqand sh.", balance: -850000 },
  { id: 3, name: "Sardor Aliyev", phone: "+998941234567", address: "Buxoro sh.", balance: 0 },
  { id: 4, name: "Dilshod Rahimov", phone: "+998951234567", address: "Andijon sh.", balance: -4200000 },
  { id: 5, name: "Jasur Ergashev", phone: "+998971234567", address: "Farg'ona sh.", balance: -1200000 },
];

export const EXPENSE_CATEGORIES = [
  { id: "moshina", label: "Moshina xarajati", icon: "🚗", color: "#2563EB" },
  { id: "svet", label: "Svet / Elektr", icon: "💡", color: "#EA580C" },
  { id: "arenda", label: "Arenda", icon: "🏠", color: "#7C3AED" },
  { id: "soliq", label: "Soliq", icon: "📋", color: "#DC2626" },
  { id: "ovqat", label: "Oziq-ovqat", icon: "🍽️", color: "#059669" },
  { id: "xodim", label: "Xodim oylik", icon: "👤", color: "#0D9488" },
  { id: "boshqa", label: "Boshqa", icon: "📦", color: "#57534E" },
];

export const DEALERS_INIT: Dealer[] = [
  { id: 1, name: "Qurilish Optom", phone: "+998901111111", address: "Toshkent", balance: 0 },
  { id: 2, name: "Sement Zavod", phone: "+998902222222", address: "Navoiy", balance: -3500000 },
];

export const TABS = [
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

export const T = {
  bg: "#F5F0EB", card: "#FFFFFF", cardAlt: "#FAF7F4",
  border: "#E8E0D8", borderLight: "#F0EAE3",
  accent: "#0D9488", accentLight: "#CCFBF1", accentDark: "#0F766E",
  green: "#059669", greenLight: "#D1FAE5",
  red: "#DC2626", redLight: "#FEE2E2",
  orange: "#EA580C", orangeLight: "#FFF7ED",
  blue: "#2563EB", blueLight: "#DBEAFE",
  purple: "#7C3AED", purpleLight: "#EDE9FE",
  text: "#1C1917", textM: "#57534E", textD: "#A8A29E",
  navBg: "#1C1917", navText: "#D6D3D1",
  shadow: "0 1px 3px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
  shadowXl: "0 20px 50px rgba(28,25,23,0.12)",
};

export function generateSales() {
  const sales = [];
  const now = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const count = Math.floor(Math.random() * 4) + 1;
    for (let j = 0; j < count; j++) {
      const prod = PRODUCTS_INIT[Math.floor(Math.random() * PRODUCTS_INIT.length)];
      const cust = CUSTOMERS_INIT[Math.floor(Math.random() * CUSTOMERS_INIT.length)];
      const qty = Math.floor(Math.random() * 20) + 1;
      const disc = Math.random() > 0.8 ? Math.floor(Math.random() * 10 + 1) : 0;
      const unitPrice = Math.round(prod.price * (1 - disc / 100));
      const total = unitPrice * qty;
      const isDebt = Math.random() > 0.6;
      const paidAmount = isDebt ? (Math.random() > 0.5 ? Math.round(total * Math.random() * 0.5) : 0) : total;
      sales.push({
        id: sales.length + 1, date: d.toISOString().split("T")[0],
        time: `${String(8 + Math.floor(Math.random() * 10)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}`,
        productId: prod.id, productName: prod.name, customerId: cust.id, customerName: cust.name,
        qty, price: prod.price, unitPrice, cost: prod.cost,
        discount: disc, total, profit: (unitPrice - prod.cost) * qty,
        paidAmount, debtAmount: total - paidAmount,
        payType: paidAmount >= total ? "naqd" : paidAmount > 0 ? "aralash" : "qarz",
        user: "admin",
      });
    }
  }
  return sales;
}
