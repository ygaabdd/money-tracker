export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  addedBy: 'Ry' | 'Partner' | string;
  createdAt?: string;
  walletId?: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  emoji: string;
  type: 'income' | 'expense' | 'both';
}

export interface Wallet {
  id: string;
  name: string;
  type: string; // e.g., 'Bank BCA', 'GoPay', 'Kas Tunai', 'REKENING_BANK', etc.
  balance: number;
  ownerId?: 'Ry' | 'Partner';
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
}

export interface Debt {
  id: string;
  title: string;
  amount: number;
  person: string;
  type: 'debt' | 'receivable'; // debt = menghutang, receivable = dihutangi
  status: 'unpaid' | 'paid';
  date: string;
}

export interface SheetsConfig {
  connected: boolean;
  spreadsheetId: string;
  sheetName: string;
  spreadsheetUrl?: string;
  accessToken?: string;
  lastSyncedAt?: string;
  user1Name?: string;
  user1Wallet?: number;
  user2Name?: string;
  user2Wallet?: number;
}

export type Category = 
  | 'Makanan & Minuman'
  | 'Transportasi'
  | 'Belanja'
  | 'Hiburan'
  | 'Tagihan & Utilitas'
  | 'Kesehatan'
  | 'Investasi'
  | 'Gaji'
  | 'Bonus'
  | 'Lainnya';

export const CATEGORIES: { name: Category; type: 'income' | 'expense' | 'both'; color: string; icon: string }[] = [
  { name: 'Makanan & Minuman', type: 'expense', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: 'Utensils' },
  { name: 'Transportasi', type: 'expense', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: 'Car' },
  { name: 'Belanja', type: 'expense', color: 'bg-pink-100 text-pink-700 border-pink-200', icon: 'ShoppingBag' },
  { name: 'Hiburan', type: 'expense', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: 'Gamepad2' },
  { name: 'Tagihan & Utilitas', type: 'expense', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: 'Receipt' },
  { name: 'Kesehatan', type: 'expense', color: 'bg-red-100 text-red-700 border-red-200', icon: 'HeartPulse' },
  { name: 'Investasi', type: 'both', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: 'TrendingUp' },
  { name: 'Gaji', type: 'income', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: 'DollarSign' },
  { name: 'Bonus', type: 'income', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: 'Sparkles' },
  { name: 'Lainnya', type: 'both', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: 'CircleEllipsis' },
];
