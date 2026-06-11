import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@supabase/supabase-js';
import {
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  TrendingUp,
  Search,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  LogOut,
  Landmark,
  User,
  Users,
  Filter,
  X,
  Database,
  Calculator,
  Download,
  AlertCircle,
  Home,
  PiggyBank,
  Settings,
  Receipt,
  FileText
} from 'lucide-react';
import { Transaction, SheetsConfig, Category, Wallet as CustomWallet, Budget, Debt, CATEGORIES, CustomCategory } from './types';
import { jsPDF } from 'jspdf';
import { apiUrl } from './api';
import Login from './components/Login';
import TransactionModal from './components/TransactionModal';
import CategoryChart from './components/CategoryChart';
import SheetsPanel from './components/SheetsPanel';
import TransactionSuccessModal from './components/TransactionSuccessModal';
import BudgetCategoryModal from './components/BudgetCategoryModal';

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function App() {
  // Authentication State
  const [user, setUser] = useState<{ username: string } | null>(null);

  // Active identity selected (to support 2 people on the same account)
  const [activeUserIdentity, setActiveUserIdentity] = useState<'Ry' | 'Partner'>('Ry');

  // Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [sheetsConfig, setSheetsConfig] = useState<SheetsConfig>(() => {
    let initialConfig: SheetsConfig = {
      connected: false,
      spreadsheetId: '',
      sheetName: 'Transaksi',
      spreadsheetUrl: '',
      lastSyncedAt: '',
      user1Name: 'Ry',
      user1Wallet: 500000,
      user2Name: 'Partner',
      user2Wallet: 2500000,
      activeUserIdentity: 'Ry',
    };

    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlSpreadsheetId = params.get('spreadsheetId') || params.get('sid');
        const urlUser1Name = params.get('user1Name') || params.get('u1');
        const urlUser2Name = params.get('user2Name') || params.get('u2');

        if (urlSpreadsheetId || urlUser1Name || urlUser2Name) {
          initialConfig = {
            ...initialConfig,
            connected: urlSpreadsheetId ? true : initialConfig.connected,
            spreadsheetId: urlSpreadsheetId ? urlSpreadsheetId.trim() : initialConfig.spreadsheetId,
            spreadsheetUrl: urlSpreadsheetId ? `https://docs.google.com/spreadsheets/d/${urlSpreadsheetId.trim()}` : initialConfig.spreadsheetUrl,
            user1Name: urlUser1Name ? decodeURIComponent(urlUser1Name) : initialConfig.user1Name,
            user2Name: urlUser2Name ? decodeURIComponent(urlUser2Name) : initialConfig.user2Name,
          };
        }
      } catch (_) {}
    }

    return initialConfig;
  });

  // UI States
  const [activeMainTab, setActiveMainTab] = useState<'dashboard' | 'dompet' | 'budgeting' | 'hutang' | 'setting'>('dashboard');
  const [mainChartType, setMainChartType] = useState<'expense' | 'income'>('expense');
  const [loading, setLoading] = useState(false);
  const [pollingActive, setPollingActive] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [syncingSheets, setSyncingSheets] = useState(false);

  // Extra states for mobile feature sets
  const [wallets, setWallets] = useState<CustomWallet[]>(() => {
    let initialWallets: CustomWallet[] = [
      { id: "w-1", name: "Dompet Utama", type: "Tunai", balance: 500000, ownerId: "Ry" },
      { id: "w-2", name: "Rekening Bank", type: "Rekening Bank", balance: 2500000, ownerId: "Partner" }
    ];

    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlUser1Name = params.get('user1Name') || params.get('u1');
        const urlUser2Name = params.get('user2Name') || params.get('u2');

        if (urlUser1Name || urlUser2Name) {
          initialWallets = initialWallets.map(w => {
            if (w.ownerId === 'Ry') {
              return { ...w, name: urlUser1Name ? decodeURIComponent(urlUser1Name) : w.name };
            }
            if (w.ownerId === 'Partner') {
              return { ...w, name: urlUser2Name ? decodeURIComponent(urlUser2Name) : w.name };
            }
            return w;
          });
        }
      } catch (_) {}
    }
    return initialWallets;
  });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);

  // Form states for adding custom items
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState('Rekening Bank');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [editingWalletId, setEditingWalletId] = useState<string | null>(null);

  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryEmoji, setNewCategoryEmoji] = useState('🍔');
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense' | 'both'>('expense');

  const [newDebtTitle, setNewDebtTitle] = useState('');
  const [newDebtAmount, setNewDebtAmount] = useState('');
  const [newDebtPerson, setNewDebtPerson] = useState('');
  const [newDebtType, setNewDebtType] = useState<'debt' | 'receivable'>('debt');
  const [newDebtDate, setNewDebtDate] = useState(new Date().toISOString().split('T')[0]);

  // Digital Wallet Input States
  const [user1EditName, setUser1EditName] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlUser1Name = params.get('user1Name') || params.get('u1');
        if (urlUser1Name) return decodeURIComponent(urlUser1Name);
      } catch (_) {}
    }
    return 'Ry';
  });
  const [user2EditName, setUser2EditName] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlUser2Name = params.get('user2Name') || params.get('u2');
        if (urlUser2Name) return decodeURIComponent(urlUser2Name);
      } catch (_) {}
    }
    return 'Partner';
  });
  const [user1InputAmount, setUser1InputAmount] = useState('');
  const [user2InputAmount, setUser2InputAmount] = useState('');
  
  // Filter States
  const [search, setSearch] = useState('');
  const [selectedReportMonth, setSelectedReportMonth] = useState(new Date().toISOString().substring(0, 7));
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterIdentity, setFilterIdentity] = useState<'all' | string>('all');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Success receipt Modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastSavedTx, setLastSavedTx] = useState<Transaction | null>(null);

  // Budget & Category customizable FAB Modal
  const [isBudgetCategoryModalOpen, setIsBudgetCategoryModalOpen] = useState(false);


  // Load and synchronize config from URL query parameters (useful for sharing configs across devices easily!)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlSpreadsheetId = params.get('spreadsheetId') || params.get('sid');
      const urlUser1Name = params.get('user1Name') || params.get('u1');
      const urlUser2Name = params.get('user2Name') || params.get('u2');

      if (urlSpreadsheetId || urlUser1Name || urlUser2Name) {
        // Clear query parameters from URL to keep it clean
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);

        // Push setup to backend server so both devices can share the same config
        const syncUrlConfigToServer = async () => {
          try {
            await fetch(apiUrl('/sheets-config'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(sheetsConfig)
            });
          } catch (err) {
            console.warn('Silent server config save on link load failed:', err);
          }
          if (user) {
            fetchData();
          }
        };

        syncUrlConfigToServer();
      }
    }
  }, [user]);

  // Silent background sync from Google Sheets to support true multiple devices real-time database sync
  const syncFromSheetsSilent = async (token: string, spreadsheetId: string) => {
    if (!token || !spreadsheetId) return;
    try {
      const cleanId = spreadsheetId.trim();
      const [txRes, dompetRes] = await Promise.all([
        fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/Transaksi!A2:H1000`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/Dompet!A2:C10`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (txRes.ok) {
        const txData = await txRes.json();
        const sheetTxs = (txData.values || []).map((row: any) => ({
          id: row[0] || "",
          date: row[1] || "",
          description: row[2] || "",
          category: row[3] || "",
          type: row[4] || "expense",
          amount: parseFloat(row[5]) || 0,
          addedBy: row[6] || "",
          createdAt: row[7] || "",
        }));

        setTransactions(prevTxs => {
          const prevSerialized = JSON.stringify(prevTxs);
          const nextSerialized = JSON.stringify(sheetTxs);
          return prevSerialized !== nextSerialized ? sheetTxs : prevTxs;
        });
      }

      if (dompetRes.ok) {
        const dData = await dompetRes.json();
        const vals = dData.values || [];
        const user1Row = vals.find((r: any) => r[0] === 'user1');
        const user2Row = vals.find((r: any) => r[0] === 'user2');

        let updatedUser1Name = sheetsConfig.user1Name;
        let updatedUser1Wallet = sheetsConfig.user1Wallet;
        let updatedUser2Name = sheetsConfig.user2Name;
        let updatedUser2Wallet = sheetsConfig.user2Wallet;

        if (user1Row) {
          updatedUser1Name = user1Row[1] || updatedUser1Name;
          const parsed = parseFloat(user1Row[2]);
          if (!isNaN(parsed)) updatedUser1Wallet = parsed;
        }
        if (user2Row) {
          updatedUser2Name = user2Row[1] || updatedUser2Name;
          const parsed = parseFloat(user2Row[2]);
          if (!isNaN(parsed)) updatedUser2Wallet = parsed;
        }

        const shouldUpdateConfig =
          updatedUser1Name !== sheetsConfig.user1Name ||
          updatedUser1Wallet !== sheetsConfig.user1Wallet ||
          updatedUser2Name !== sheetsConfig.user2Name ||
          updatedUser2Wallet !== sheetsConfig.user2Wallet;

        if (shouldUpdateConfig) {
          const newConfig = {
            ...sheetsConfig,
            user1Name: updatedUser1Name,
            user1Wallet: updatedUser1Wallet,
            user2Name: updatedUser2Name,
            user2Wallet: updatedUser2Wallet,
          };

          setSheetsConfig(newConfig);
          setWallets(prevWallets => prevWallets.map(w => {
            if (w.ownerId === 'Ry') {
              return { ...w, name: updatedUser1Name, balance: updatedUser1Wallet };
            }
            if (w.ownerId === 'Partner') {
              return { ...w, name: updatedUser2Name, balance: updatedUser2Wallet };
            }
            return w;
          }));
        }
      }
    } catch (error) {
      console.warn('Silent Sheets sync failed:', error);
    }
  };

  // Background polling every 15 seconds if Google Sheets is connected
  useEffect(() => {
    if (!user || !sheetsConfig.connected || !sheetsConfig.spreadsheetId || !sheetsConfig.accessToken) {
      return;
    }

    // Run once immediately on connection or page load
    syncFromSheetsSilent(sheetsConfig.accessToken, sheetsConfig.spreadsheetId);

    const intervalId = setInterval(() => {
      syncFromSheetsSilent(sheetsConfig.accessToken, sheetsConfig.spreadsheetId);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [user, sheetsConfig.connected, sheetsConfig.spreadsheetId, sheetsConfig.accessToken]);

  // Sync wallet names based on received dynamic configuration
  useEffect(() => {
    if (sheetsConfig.user1Name) {
      setUser1EditName(sheetsConfig.user1Name);
    }
    if (sheetsConfig.user2Name) {
      setUser2EditName(sheetsConfig.user2Name);
    }
  }, [sheetsConfig.user1Name, sheetsConfig.user2Name]);

  // Fetch transactions and configs from backend API
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [txResponse, configResponse, walletResponse, budgetResponse, debtResponse, categoryResponse] = await Promise.all([
        fetch(apiUrl('/transactions')),
        fetch(apiUrl('/sheets-config')),
        fetch(apiUrl('/wallets')),
        fetch(apiUrl('/budgets')),
        fetch(apiUrl('/debts')),
        fetch(apiUrl('/categories')),
      ]);

      if (txResponse.ok) {
        const txData = await txResponse.json();
        if (txData.success) {
          setTransactions(txData.transactions);
        }
      }

      if (configResponse.ok) {
        const configData = await configResponse.json();
        if (configData.success) {
          setSheetsConfig(configData.config);
          if (configData.config?.activeUserIdentity) {
            setActiveUserIdentity(configData.config.activeUserIdentity);
          }
        }
      }

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        if (walletData.success) {
          setWallets(walletData.wallets);
        }
      }

      if (budgetResponse.ok) {
        const budgetData = await budgetResponse.json();
        if (budgetData.success) {
          setBudgets(budgetData.budgets);
        }
      }

      if (debtResponse.ok) {
        const debtData = await debtResponse.json();
        if (debtData.success) {
          setDebts(debtData.debts);
        }
      }

      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        if (categoryData.success) {
          setCategories(categoryData.categories);
          // Auto-set default budget category to the first available expense/both category if not set yet
          if (categoryData.categories.length > 0) {
            const expOnly = categoryData.categories.filter((c: any) => c.type === 'expense' || c.type === 'both');
            if (expOnly.length > 0 && !newBudgetCategory) {
              setNewBudgetCategory(expOnly[0].name);
            }
          }
        }
      }
      setErrorBanner(null);
    } catch (err) {
      console.error('Failed fetching data:', err);
      setErrorBanner('Sambungan ke server terputus. Mencoba menghubungkan kembali...');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Initial Fetch & Real-Time Polling (every 4 seconds) to support multi-user updates
  useEffect(() => {
    if (user) {
      fetchData();
      const interval = setInterval(() => {
        fetchData(true); // silent fetch to keep state up-to-date
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Setup Realtime Subscriptions for instant sync across devices
  useEffect(() => {
    if (!user || !supabase) return;
    const subscriptions: any[] = [];
    try {
      const handleDataChange = () => fetchData(true);
      const txSub = supabase.channel('transactions').on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, handleDataChange).subscribe();
      const walletSub = supabase.channel('wallets').on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, handleDataChange).subscribe();
      const budgetSub = supabase.channel('budgets').on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, handleDataChange).subscribe();
      const debtSub = supabase.channel('debts').on('postgres_changes', { event: '*', schema: 'public', table: 'debts' }, handleDataChange).subscribe();
      const categorySub = supabase.channel('categories').on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, handleDataChange).subscribe();
      subscriptions.push(txSub, walletSub, budgetSub, debtSub, categorySub);
      console.log('Realtime subscriptions active');
    } catch (err) {
      console.warn('Realtime subscriptions failed:', err);
    }
    return () => {
      subscriptions.forEach((sub) => supabase?.removeChannel(sub));
    };
  }, [user]);

  const handleLoginSuccess = (userData: { username: string }) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    // Erase transactions and reset states
    setTransactions([]);
    setWallets([]);
    setBudgets([]);
    setDebts([]);
    setCategories([]);
  };

  const switchActiveIdentity = async (identity: 'Ry' | 'Partner') => {
    setActiveUserIdentity(identity);
    setSheetsConfig(prev => ({ ...prev, activeUserIdentity: identity }));

    try {
      await fetch(apiUrl('/sheets-config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeUserIdentity: identity }),
      });
    } catch (err) {
      console.warn('Failed to persist active user identity:', err);
    }

    // Force refresh data from server when switching user
    setTransactions([]);
    setWallets([]);
    setBudgets([]);
    setDebts([]);
    setCategories([]);
    fetchData(false);
  };

  // Core Mutation Handlers (Call Express Backend API)
  const handleUpdateProfile = async (updates: Partial<SheetsConfig>) => {
    const updated = {
      ...sheetsConfig,
      ...updates,
    };
    try {
      const response = await fetch(apiUrl('/sheets-config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const resData = await response.json();
      if (response.ok && resData.success) {
        setSheetsConfig(resData.config);
      }
    } catch (err) {
      console.error('Failed to update config profile:', err);
    }
  };

  // Custom Wallet Handlers
  const handleSaveWallet = async (name: string, type: string, balance: number, id?: string, ownerId?: 'Ry' | 'Partner') => {
    try {
      const isEditing = !!id;
      const url = isEditing ? apiUrl(`/wallets/${id}`) : apiUrl('/wallets');
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, balance, ownerId }),
      });
      if (response.ok) {
        fetchData(true);
      } else {
        const errorBody = await response.json().catch(() => null);
        const message = errorBody?.message || errorBody?.error?.message || 'Gagal menyimpan dompet. Periksa koneksi dan konfigurasi server.';
        setErrorBanner(message);
        console.error('Failed saving wallet:', message, errorBody);
      }
    } catch (err) {
      console.error('Failed saving wallet:', err);
      setErrorBanner('Gagal menyimpan dompet karena masalah jaringan. Pastikan server aktif.');
    }
  };

  const handleDeleteWallet = async (id: string, name: string) => {
    if (!window.confirm(`Hapus dompet "${name}"?`)) return;
    try {
      const response = await fetch(apiUrl(`/wallets/${id}`), {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed deleting wallet:', err);
    }
  };

  // Custom Budget Handlers
  const handleSaveBudget = async (category: string, limit: number, id?: string) => {
    try {
      const isEditing = !!id;
      const url = isEditing ? `/api/budgets/${id}` : '/api/budgets';
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, limit }),
      });
      if (response.ok) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed saving budget:', err);
    }
  };

  const handleDeleteBudget = async (id: string, category: string) => {
    if (!window.confirm(`Hapus anggaran untuk kategori "${category}"?`)) return;
    try {
      const response = await fetch(apiUrl(`/budgets/${id}`), {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed deleting budget:', err);
    }
  };

  // Custom Category Handlers
  const handleSaveCategory = async (name: string, emoji: string, type: 'income' | 'expense' | 'both') => {
    try {
      const response = await fetch(apiUrl('/categories'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, emoji, type }),
      });
      if (response.ok) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed saving category:', err);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`Hapus kategori "${name}" secara permanen?`)) return;
    try {
      const response = await fetch(apiUrl(`/categories/${id}`), {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed deleting category:', err);
    }
  };

  // Custom Debt Handlers
  const handleSaveDebt = async (title: string, amount: number, person: string, type: 'debt' | 'receivable', date: string, id?: string) => {
    try {
      const isEditing = !!id;
      const url = isEditing ? `/api/debts/${id}` : '/api/debts';
      const method = isEditing ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, amount, person, type, date }),
      });
      if (response.ok) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed saving debt:', err);
    }
  };

  const handleUpdateDebtStatus = async (id: string, status: 'unpaid' | 'paid') => {
    try {
      const response = await fetch(apiUrl(`/debts/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed updating debt status:', err);
    }
  };

  const handleDeleteDebt = async (id: string, title: string) => {
    if (!window.confirm(`Hapus catatan hutang "${title}"?`)) return;
    try {
      const response = await fetch(apiUrl(`/debts/${id}`), {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed deleting debt:', err);
    }
  };

  const handleSaveTransaction = async (txData: Omit<Transaction, 'createdAt'> & { id?: string }) => {
    try {
      const isEditing = !!editTarget;
      const url = isEditing ? `/api/transactions/${txData.id}` : '/api/transactions';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData),
      });

      const resJson = await response.json();
      if (response.ok && resJson.success) {
        // Optimistic UI updates
        fetchData(true);
        const finalTx: Transaction = {
          id: txData.id || resJson.id || String(Date.now()),
          amount: txData.amount,
          type: txData.type,
          description: txData.description,
          category: txData.category,
          date: txData.date,
          addedBy: txData.addedBy,
          walletId: txData.walletId,
          createdAt: new Date().toISOString()
        };
        setLastSavedTx(finalTx);
        setIsSuccessModalOpen(true);
      }
    } catch (err) {
      console.error('Failed saving transaction:', err);
    } finally {
      setEditTarget(null);
    }
  };

  const handleDeleteTransaction = async (id: string, description: string) => {
    if (!window.confirm(`Hapus transaksi "${description}" secara permanen?`)) return;
    try {
      const response = await fetch(apiUrl(`/transactions/${id}`), {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchData(true);
      }
    } catch (err) {
      console.error('Failed deleting transaction:', err);
    }
  };

  // Google Sheets Sync Client-Side Helper
  const syncToSheetsClient = async (spreadsheetId: string, token: string, txs: Transaction[], config: SheetsConfig) => {
    // Clear and write Transaksi
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transaksi!A2:H1000:clear`;
    await fetch(clearUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const txRows = txs.map((tx) => [
      tx.id || "",
      tx.date || "",
      tx.description || "",
      tx.category || "",
      tx.type || "",
      tx.amount || 0,
      tx.addedBy || "Sistem",
      tx.createdAt || new Date().toISOString(),
    ]);

    if (txRows.length > 0) {
      const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transaksi!A2:append?valueInputOption=USER_ENTERED`;
      await fetch(updateUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ values: txRows }),
      });
    }

    // Clear and write Dompet
    const clearDompetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Dompet!A2:C10:clear`;
    await fetch(clearDompetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const dompetRows = [
      ["user1", config.user1Name || "Ry", config.user1Wallet || 0],
      ["user2", config.user2Name || "Partner", config.user2Wallet || 0]
    ];

    const updateDompetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Dompet!A2:append?valueInputOption=USER_ENTERED`;
    await fetch(updateDompetUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: dompetRows }),
    });
  };

  const connectExistingGoogleSheetsDatabase = async (token: string, spreadsheetId: string) => {
    setSyncingSheets(true);
    try {
      let cleanId = spreadsheetId.trim();
      if (cleanId.includes('docs.google.com/spreadsheets')) {
        const match = cleanId.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) cleanId = match[1];
      }

      if (!cleanId) {
        throw new Error("ID Google Spreadsheet tidak boleh kosong.");
      }

      // 1. Fetch metadata to check if spreadsheet exists
      const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!metaRes.ok) {
        let details = "Periksa kembali Token / ID Google Spreadsheet Anda.";
        try {
          const errData = await metaRes.json();
          if (errData?.error?.message) {
            details = `Google API Error: ${errData.error.message}`;
          }
        } catch (_) {}
        throw new Error(`Gagal mengambil info spreadsheet. ${details}`);
      }

      const metaData = await metaRes.json();
      const sheetsList = metaData.sheets || [];
      const hasTransaksi = sheetsList.some((s: any) => s.properties.title === 'Transaksi');
      const hasDompet = sheetsList.some((s: any) => s.properties.title === 'Dompet');

      // If tabs do not exist, let's create/add them to the spreadsheet
      if (!hasTransaksi || !hasDompet) {
        const requests: any[] = [];
        if (!hasTransaksi) {
          requests.push({ addSheet: { properties: { title: 'Transaksi' } } });
        }
        if (!hasDompet) {
          requests.push({ addSheet: { properties: { title: 'Dompet' } } });
        }

        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests })
        });

        // Initialize Transaksi Tab Headers
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/Transaksi!A1:H1?valueInputOption=USER_ENTERED`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [["ID", "Tanggal", "Deskripsi", "Kategori", "Tipe", "Jumlah", "Ditambahkan Oleh", "Waktu Input"]],
          }),
        });

        // Initialize Dompet Tab Headers and Initial profiles
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/Dompet!A1:C3?valueInputOption=USER_ENTERED`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            values: [
              ["ID_User", "Nama_User", "Saldo_Dompet"],
              ["user1", sheetsConfig.user1Name || "Ry", sheetsConfig.user1Wallet || 500000],
              ["user2", sheetsConfig.user2Name || "Partner", sheetsConfig.user2Wallet || 2500000]
            ],
          }),
        });
      }

      const newConfig: SheetsConfig = {
        connected: true,
        spreadsheetId: cleanId,
        sheetName: 'Transaksi',
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}`,
        lastSyncedAt: new Date().toISOString(),
        accessToken: token,
        user1Name: sheetsConfig.user1Name || 'Ry',
        user1Wallet: sheetsConfig.user1Wallet || 500000,
        user2Name: sheetsConfig.user2Name || 'Partner',
        user2Wallet: sheetsConfig.user2Wallet || 2500000,
      };

      setSheetsConfig(newConfig);

      // Fetch existing transactions from Google Sheets immediately to load them!
      const txRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/Transaksi!A2:H1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (txRes.ok) {
        const txData = await txRes.json();
        const sheetTxs = (txData.values || []).map((row: any) => ({
          id: row[0] || "",
          date: row[1] || "",
          description: row[2] || "",
          category: row[3] || "",
          type: row[4] || "expense",
          amount: parseFloat(row[5]) || 0,
          addedBy: row[6] || "",
          createdAt: row[7] || "",
        }));

        if (sheetTxs.length > 0) {
          setTransactions(sheetTxs);
        } else if (transactions.length > 0) {
          // If sheet is empty, push existing local transactions to sheets to sync them!
          await syncToSheetsClient(cleanId, token, transactions, newConfig);
        }
      }

      // Fetch wallet data from Google sheets if it is present!
      const dompetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/Dompet!A2:C10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (dompetRes.ok) {
        const dData = await dompetRes.json();
        const vals = dData.values || [];
        const user1Row = vals.find((r: any) => r[0] === 'user1');
        const user2Row = vals.find((r: any) => r[0] === 'user2');
        let updatedUser1W = newConfig.user1Wallet;
        let updatedUser2W = newConfig.user2Wallet;
        if (user1Row) {
          newConfig.user1Name = user1Row[1] || newConfig.user1Name;
          newConfig.user1Wallet = parseFloat(user1Row[2]) !== undefined && !isNaN(parseFloat(user1Row[2])) ? parseFloat(user1Row[2]) : newConfig.user1Wallet;
          updatedUser1W = newConfig.user1Wallet;
        }
        if (user2Row) {
          newConfig.user2Name = user2Row[1] || newConfig.user2Name;
          newConfig.user2Wallet = parseFloat(user2Row[2]) !== undefined && !isNaN(parseFloat(user2Row[2])) ? parseFloat(user2Row[2]) : newConfig.user2Wallet;
          updatedUser2W = newConfig.user2Wallet;
        }

        // Sync local wallet balances in active state as well
        const updatedWallets = wallets.map(w => {
          if (w.ownerId === 'Ry') {
            return { ...w, name: newConfig.user1Name, balance: updatedUser1W };
          }
          if (w.ownerId === 'Partner') {
            return { ...w, name: newConfig.user2Name, balance: updatedUser2W };
          }
          return w;
        });

        setWallets(updatedWallets);

        setSheetsConfig({ ...newConfig });
      }

    } catch (err: any) {
      console.error(err);
      throw new Error(err.message || "Gagal menghubungkan spreadsheet. Periksa token Anda.");
    } finally {
      setSyncingSheets(false);
    }
  };

  // Google Sheets Action Managers
  const createGoogleSheetsDatabase = async (token: string) => {
    setSyncingSheets(true);
    try {
const response = await fetch(apiUrl('/sheets/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token }),
      });

      const resJson = await response.json();
      if (response.ok && resJson.success) {
        setSheetsConfig(resJson.config);
      } else {
        throw new Error(resJson.message);
      }
    } finally {
      setSyncingSheets(false);
    }
  };

  const syncToGoogleSheets = async (token: string, silent = false) => {
    if (!silent) setSyncingSheets(true);
    try {
      const config = sheetsConfig;
      if (!config.connected || !config.spreadsheetId) {
        throw new Error('Spreadsheet belum terhubung. Konfigurasikan ID Spreadsheet terlebih dahulu.');
      }

      // Run direct client-side sync
      await syncToSheetsClient(config.spreadsheetId, token, transactions, config);

      // Fetch back updated config / wallets
      const dompetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Dompet!A2:C10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      let updatedUser1Wallet = config.user1Wallet;
      let updatedUser2Wallet = config.user2Wallet;
      let updatedUser1Name = config.user1Name;
      let updatedUser2Name = config.user2Name;

      if (dompetRes.ok) {
        const dData = await dompetRes.json();
        const vals = dData.values || [];
        const user1Row = vals.find((r: any) => r[0] === 'user1');
        const user2Row = vals.find((r: any) => r[0] === 'user2');
        if (user1Row) {
          updatedUser1Name = user1Row[1] || updatedUser1Name;
          updatedUser1Wallet = parseFloat(user1Row[2]) !== undefined && !isNaN(parseFloat(user1Row[2])) ? parseFloat(user1Row[2]) : updatedUser1Wallet;
        }
        if (user2Row) {
          updatedUser2Name = user2Row[1] || updatedUser2Name;
          updatedUser2Wallet = parseFloat(user2Row[2]) !== undefined && !isNaN(parseFloat(user2Row[2])) ? parseFloat(user2Row[2]) : updatedUser2Wallet;
        }
      }

      const updatedConfig = {
        ...config,
        user1Name: updatedUser1Name,
        user1Wallet: updatedUser1Wallet,
        user2Name: updatedUser2Name,
        user2Wallet: updatedUser2Wallet,
        lastSyncedAt: new Date().toISOString(),
        accessToken: token
      };

      // Update wallets in state
      const updatedWallets = wallets.map(w => {
        if (w.ownerId === 'Ry') {
          return { ...w, name: updatedUser1Name, balance: updatedUser1Wallet };
        }
        if (w.ownerId === 'Partner') {
          return { ...w, name: updatedUser2Name, balance: updatedUser2Wallet };
        }
        return w;
      });

      setWallets(updatedWallets);
      setSheetsConfig(updatedConfig);
    } catch (err) {
      console.error('Failed syncing to Google Sheets:', err);
      throw err;
    } finally {
      if (!silent) setSyncingSheets(false);
    }
  };

  // Helper: Export current local JSON transactions to standard CSV for custom spreadsheets imports
  const handleExportCsv = () => {
    if (transactions.length === 0) {
      alert('Belum ada data transaksi untuk diekspor!');
      return;
    }

    const headers = 'ID,Tanggal,Deskripsi,Kategori,Tipe,Jumlah,Penginput,TanggalInput\n';
    const rows = transactions
      .map((tx) => {
        return `"${tx.id}","${tx.date}","${tx.description.replace(/"/g, '""')}","${tx.category}","${tx.type}",${tx.amount},"${tx.addedBy}","${tx.createdAt || ''}"`;
      })
      .join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    
    const [yearPart, monthPart] = selectedReportMonth.split('-');
    const monthsId = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIndex = parseInt(monthPart, 10) - 1;
    const monthLabel = `${monthsId[monthIndex] || 'Bulan'} ${yearPart}`;
    const activeUserName = activeUserIdentity === 'Ry' ? (sheetsConfig.user1Name || 'Ry') : (sheetsConfig.user2Name || 'Partner');

    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan Keuangan - ${monthLabel} - ${activeUserName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper: Export monthly summary invoice report to PDF format (Minimalist Mutasi BCA Style)
  const handleDownloadPdf = () => {
    const doc = new jsPDF();
    
    // Sort & filter transactions for the selected month (YYYY-MM)
    const monthlyTrans = transactions.filter(t => t.date && t.date.startsWith(selectedReportMonth));
    const monthlyIncome = monthlyTrans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = monthlyTrans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    // Parse month name
    const [yearPart, monthPart] = selectedReportMonth.split('-');
    const monthsId = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIndex = parseInt(monthPart, 10) - 1;
    const monthLabel = `${monthsId[monthIndex] || 'Bulan'} ${yearPart}`;

    // BCA Style Color Palette Setup
    const primaryColor = [15, 76, 129]; // Classic BCA Blue
    const textDark = [15, 23, 42];
    const textMedium = [71, 85, 105];
    const lineGray = [226, 232, 240];

    // Page 1: Mutasi Statement Header
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('DUO WALLET - LAPORAN MUTASI REKENING', 15, 20);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textMedium[0], textMedium[1], textMedium[2]);
    doc.text('MUTASI REKENING KAS BERSAMA (INDIVIDUAL STATEMENT)', 15, 25);
    
    // Metadata block right-aligned
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Periode: ${monthLabel}`, 135, 20);
    doc.text(`Tgl Cetak: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' })}`, 135, 25);
    doc.text('Mata Uang: IDR', 135, 30);

    // Separator line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.6);
    doc.line(15, 33, 195, 33);

    // Profile Box (Owner Names)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('INFORMASI NASABAH BERSAMA', 15, 40);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`Nama Anggota 1 : ${sheetsConfig.user1Name || 'Ry'}`, 15, 46);
    doc.text(`Nama Anggota 2 : ${sheetsConfig.user2Name || 'Partner'}`, 115, 46);
    doc.text(`Koneksi Sink   : ${sheetsConfig.connected ? 'Google Sheets (Connected)' : 'Penyimpanan Lokal (Offline)'}`, 15, 51);

    // Divider line
    doc.setDrawColor(lineGray[0], lineGray[1], lineGray[2]);
    doc.setLineWidth(0.3);
    doc.line(15, 55, 195, 55);

    let y = 62;

    // Summary Statistics Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('IKHTISAR MUTASI REKENING (SUMMARY)', 15, y);
    
    y += 4;
    // Drawn Box like bank ledger
    doc.setFillColor(252, 252, 252);
    doc.rect(15, y, 180, 22, 'F');
    doc.rect(15, y, 180, 22, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textMedium[0], textMedium[1], textMedium[2]);
    doc.text('TOTAL PEMASUKAN (+)', 18, y + 6);
    doc.text('TOTAL PENGELUARAN (-)', 78, y + 6);
    doc.text('SELISIH BERSIH (NET CHANGE)', 138, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(5, 150, 105); // Green-600
    doc.text('+' + formatRupiah(monthlyIncome), 18, y + 14);
    
    doc.setTextColor(225, 29, 72); // Rose-600
    doc.text('-' + formatRupiah(monthlyExpense), 78, y + 14);

    const netSurplus = monthlyIncome - monthlyExpense;
    doc.setTextColor(netSurplus >= 0 ? 5 : 225, netSurplus >= 0 ? 150 : 29, netSurplus >= 0 ? 105 : 72);
    doc.text((netSurplus >= 0 ? '+' : '') + formatRupiah(netSurplus), 138, y + 14);

    y += 31;

    // Category-wise Breakdown table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('RINCIAN ANGGARAN & PENGELUARAN KATEGORI', 15, y);

    y += 4;
    // Table Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, y, 180, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Kategori', 18, y + 4);
    doc.text('Batas Anggaran', 75, y + 4);
    doc.text('Total Pemakaian Bulan Ini', 125, y + 4);
    doc.text('Persentase', 170, y + 4);

    y += 6;
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // List out categories spending
    const spendMap = new Map<string, number>();
    monthlyTrans.filter(t => t.type === 'expense').forEach(t => {
      spendMap.set(t.category, (spendMap.get(t.category) || 0) + t.amount);
    });

    if (spendMap.size === 0) {
      doc.text('Tidak ada pengeluaran di periode bulan ini.', 18, y + 5);
      y += 10;
    } else {
      spendMap.forEach((spent, catName) => {
        // Find budget for this category
        const b = budgets.find(bg => bg.category === catName);
        const limitText = b ? formatRupiah(b.limit) : 'Tanpa Limit';
        const ratioText = b && b.limit > 0 ? `${((spent / b.limit) * 100).toFixed(1)}%` : 'N/A';
        
        doc.text(catName, 18, y + 4);
        doc.text(limitText, 75, y + 4);
        doc.text(formatRupiah(spent), 125, y + 4);
        doc.text(ratioText, 170, y + 4);

        // Underline row
        doc.setDrawColor(241, 245, 249);
        doc.line(15, y + 5.5, 195, y + 5.5);
        y += 5.5;
      });
      y += 2;
    }

    y += 4;

    // Section 4: Hutang (Baik dihutangi maupun menghutang)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('POSISI PIUTANG & UTANG AKTIF', 15, y);
    y += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    if (debts.length === 0) {
      doc.text('- Tidak ada catatan utang/piutang.', 18, y + 4);
      y += 10;
    } else {
      debts.forEach((d) => {
        const typeStr = d.type === 'debt' ? 'Utang ke' : 'Piutang ke';
        const statStr = d.status === 'paid' ? 'LUNAS' : 'BELUM LUNAS';
        doc.text(`* [${statStr}] ${d.title}: ${typeStr} ${d.person} senilai ${formatRupiah(d.amount)}`, 18, y + 4);
        y += 5;
      });
      y += 2;
    }

    // Page 2: Mutasi Statement Ledger (Tabel Rincian Lengkap)
    doc.addPage();
    let yTable = 20;
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RINCIAN DETAIL MUTASI TRANSAKSI (STATEMENT DETAILS)', 15, yTable);
    
    yTable += 6;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, yTable, 180, 7, 'F');
    
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('TANGGAL', 17, yTable + 4.5);
    doc.text('KATEGORI', 38, yTable + 4.5);
    doc.text('KETERANGAN / DESKRIPSI', 72, yTable + 4.5);
    doc.text('PENCATAT', 135, yTable + 4.5);
    doc.text('NOMINAL (MUTASI)', 162, yTable + 4.5);
    
    yTable += 7;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFontSize(8);
    
    if (monthlyTrans.length === 0) {
      doc.text('Tidak ada catatan mutasi transaksi pada bulan ini.', 18, yTable + 5);
    } else {
      // Sort transactions chronologically
      const sortedTrans = [...monthlyTrans].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      sortedTrans.forEach((tx) => {
        if (yTable > 280) {
          doc.addPage();
          // repeat table header on next page in minimal style
          yTable = 15;
          doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
          doc.rect(15, yTable, 180, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(255, 255, 255);
          doc.text('TANGGAL', 17, yTable + 4.5);
          doc.text('KATEGORI', 38, yTable + 4.5);
          doc.text('KETERANGAN / DESKRIPSI', 72, yTable + 4.5);
          doc.text('PENCATAT', 135, yTable + 4.5);
          doc.text('NOMINAL (MUTASI)', 162, yTable + 4.5);
          
          yTable += 7;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(textDark[0], textDark[1], textDark[2]);
        }
        
        // Print transaction row
        doc.text(tx.date || '', 17, yTable + 4.5);
        doc.text(tx.category || '', 38, yTable + 4.5);
        
        const descTrunc = tx.description.length > 32 ? `${tx.description.substring(0, 32)}...` : tx.description;
        doc.text(descTrunc, 72, yTable + 4.5);
        doc.text(tx.addedBy || '', 135, yTable + 4.5);
        
        // Mutasi Column with DB/CR formatting (like Bank BCA)
        const marker = tx.type === 'income' ? 'CR' : 'DB';
        doc.setFont('helvetica', 'bold');
        if (tx.type === 'income') {
          doc.setTextColor(5, 150, 105); // Green CR
        } else {
          doc.setTextColor(225, 29, 72); // Red DB
        }
        
        const amountStr = `${tx.amount.toLocaleString('id-ID')} ${marker}`;
        doc.text(amountStr, 162, yTable + 4.5);
        
        // Reset colors
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textDark[0], textDark[1], textDark[2]);

        // Draw line separator
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(15, yTable + 6, 195, yTable + 6);
        yTable += 6;
      });
    }

    const activeUserName = activeUserIdentity === 'Ry' ? (sheetsConfig.user1Name || 'Ry') : (sheetsConfig.user2Name || 'Partner');
    // Save PDF
    doc.save(`Laporan Keuangan - ${monthLabel} - ${activeUserName}.pdf`);
  };

  // Summary Metrics Analysis values
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalBalance = totalIncome - totalExpense;

  // Filter application of client search inputs
  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.category.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesIdentity = filterIdentity === 'all' || tx.addedBy === filterIdentity;

    return matchesSearch && matchesType && matchesIdentity;
  });

  // Formatter for Indonesian currency presentation
  const formatRupiah = (val: number) => {
    const isNeg = val < 0;
    const posVal = Math.abs(val);
    const parts = posVal.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${isNeg ? '-' : ''}${'Rp '}${parts}`;
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const user1Name = sheetsConfig.user1Name || 'Ry';
  const user2Name = sheetsConfig.user2Name || 'Partner';
  const user1Wallet = wallets.filter(w => w.ownerId === 'Ry' || !w.ownerId).reduce((s, w) => s + w.balance, 0);
  const user2Wallet = wallets.filter(w => w.ownerId === 'Partner').reduce((s, w) => s + w.balance, 0);
  const customWalletsTotal = wallets.reduce((s, w) => s + w.balance, 0);
  const totalSharedBalance = user1Wallet + user2Wallet;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-emerald-100 selection:text-emerald-950 pb-28">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-xs h-15 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-md font-bold text-base">
            $
          </div>
          <div>
            <span className="font-black text-slate-900 text-sm tracking-tight">WalletKami</span>
            <span className="ml-1 text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1 py-0.2 rounded border border-emerald-100 uppercase tracking-wide">
              Shared
            </span>
          </div>
        </div>

        {/* User identification badge */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Pencatatan</span>
            <span className="text-xs font-bold text-slate-705 capitalize">
              {activeUserIdentity === 'Ry' ? user1Name : user2Name}
            </span>
          </div>
          
          <button
            id="mobile-logout-btn"
            onClick={handleLogout}
            className="p-1.5 border border-slate-100 hover:bg-slate-50 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container Content */}
      <main className="max-w-xl w-full mx-auto px-4 pt-4 flex-1">
        
        {/* Real-time warning banner */}
        {errorBanner && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-[11px] font-semibold flex items-center gap-2 shadow-xs mb-4">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="flex-1">{errorBanner}</span>
          </div>
        )}

        {/* Identity Selector Drawer always handy on top */}
        <div className="flex items-center justify-between gap-3 bg-white p-3 border border-slate-200/80 shadow-xs rounded-xl mb-5">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-900 leading-tight">Pengguna Aktif</p>
              <p className="text-[10px] text-slate-400">Klik nama untuk berganti peran</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => switchActiveIdentity('Ry')}
              className={`px-2.5 py-1.5 rounded text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
                activeUserIdentity === 'Ry'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {user1Name}
            </button>
            <button
              onClick={() => switchActiveIdentity('Partner')}
              className={`px-2.5 py-1.5 rounded text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
                activeUserIdentity === 'Partner'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {user2Name}
            </button>
          </div>
        </div>

        {/* VIEW ROUTER FOR TABS */}
        <AnimatePresence mode="wait">
          {activeMainTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Saldo Bersama Big Card */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500 rounded-full opacity-10 blur-xl pointer-events-none"></div>
                <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-500 rounded-full opacity-10 blur-xl pointer-events-none"></div>
                
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total Saldo Bersama</span>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2 leading-none">
                  {formatRupiah(totalSharedBalance)}
                </h1>
                
                <div className="border-t border-white/10 pt-3 mt-3 flex justify-between items-center text-[10px] text-white/70 font-semibold">
                  <div>
                    <span>{user1Name}: </span>
                    <span className="text-emerald-400">{formatRupiah(user1Wallet)}</span>
                  </div>
                  <div>
                    <span>{user2Name}: </span>
                    <span className="text-emerald-400">{formatRupiah(user2Wallet)}</span>
                  </div>
                </div>
              </div>

              {/* Transactions List Division */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Aktivitas Transaksi</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">Riwayat keluar masuk kas bersama</p>
                  </div>
                  
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                    {filteredTransactions.length} Transaksi
                  </span>
                </div>

                {/* Search Bar / Filters */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2 relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari transaksi..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white text-slate-800 transition-all font-semibold"
                    />
                  </div>

                  <div>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer text-ellipsis overflow-hidden"
                    >
                      <option value="all">Semua Tipe</option>
                      <option value="income">Kas Masuk</option>
                      <option value="expense">Kas Keluar</option>
                    </select>
                  </div>

                  <div>
                    <select
                      value={filterIdentity}
                      onChange={(e) => setFilterIdentity(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer text-ellipsis overflow-hidden"
                    >
                      <option value="all">Semua Pencatat</option>
                      <option value={user1Name}>{user1Name}</option>
                      <option value={user2Name}>{user2Name}</option>
                    </select>
                  </div>
                </div>

                {/* List Body */}
                <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                  {filteredTransactions.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 space-y-2">
                      <p className="text-xs font-bold">Tidak ada transaksi ditemukan</p>
                      <p className="text-[10px] text-slate-400">Silakan tambahkan menggunakan tombol + di bawah kanan</p>
                    </div>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <div key={tx.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50/50 rounded-lg px-1 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shadow-xs ${
                            tx.addedBy === user2Name ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {tx.addedBy ? tx.addedBy.substring(0, 2).toUpperCase() : 'RY'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs line-clamp-1">{tx.description}</p>
                            <p className="text-[10px] text-slate-450 font-medium">
                              {tx.category} • {tx.date}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <span className={`text-xs font-bold tracking-tight block ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                              {tx.type === 'income' ? '+' : '-'} {formatRupiah(tx.amount)}
                            </span>
                            <span className="text-[9px] text-slate-404 block font-mono">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-0.5 border-l border-slate-100 pl-1.5 ml-1">
                            <button
                              onClick={() => {
                                setEditTarget(tx);
                                setIsModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTransaction(tx.id, tx.description)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Grafik Distribusi Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Grafik Ringkasan</h3>
                    <p className="text-[10px] text-slate-400 font-semibold">Proporsi distribusi dana bersama</p>
                  </div>
                  
                  {/* Selector Toggle */}
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setMainChartType('expense')}
                      className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
                        mainChartType === 'expense'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Pengeluaran
                    </button>
                    <button
                      type="button"
                      onClick={() => setMainChartType('income')}
                      className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer ${
                        mainChartType === 'income'
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Pemasukan
                    </button>
                  </div>
                </div>

                {/* Render the CategoryChart */}
                <CategoryChart transactions={transactions} type={mainChartType} categories={categories} />
              </div>
            </motion.div>
          )}          {activeMainTab === 'dompet' && (
            <motion.div
              key="dompet"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Title Section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Dompetmu</h2>
                  <p className="text-xs text-slate-500">Kelola dan kustomisasi saldo dari rekening bank, dompet digital, maupun tunai.</p>
                </div>
                
                {/* Active Role Quick Indicator */}
                <div className="bg-emerald-50 border border-emerald-150 rounded-xl px-3 py-1.5 flex items-center gap-2 self-start sm:self-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] text-emerald-800 font-extrabold uppercase">
                    Status Aktif: {activeUserIdentity === 'Ry' ? user1Name : user2Name}
                  </span>
                </div>
              </div>

              {/* TWO SIDES GRID: USER 1 vs USER 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* USER 1 CARD (RY / ENTRAINMENT ACCENT) */}
                <div id="wallet-hub-user1" className={`rounded-2xl border p-5 shadow-xs transition-all ${
                  activeUserIdentity === 'Ry'
                    ? 'bg-emerald-50/20 border-emerald-200 ring-1 ring-emerald-100'
                    : 'bg-white border-slate-200'
                }`}>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-150 mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                        activeUserIdentity === 'Ry' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {user1Name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={user1EditName}
                          onChange={(e) => setUser1EditName(e.target.value)}
                          onBlur={() => {
                            if (activeUserIdentity === 'Ry') {
                              handleUpdateProfile({ user1Name: user1EditName });
                            }
                          }}
                          disabled={activeUserIdentity !== 'Ry'}
                          className={`font-black text-xs uppercase tracking-wide bg-transparent outline-none border-b border-transparent ${
                            activeUserIdentity === 'Ry' ? 'focus:border-emerald-500 text-slate-800' : 'text-slate-400'
                          } w-28`}
                          placeholder="User 1"
                        />
                        <p className="text-[9px] text-slate-400 font-semibold uppercase leading-tight">Pengguna 1 (Klik Edit)</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      activeUserIdentity === 'Ry'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {activeUserIdentity === 'Ry' ? 'Pengguna Aktif' : 'Dibaca Saja'}
                    </span>
                  </div>

                  {/* Main Balance Display */}
                  <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo Utama ({user1Name})</span>
                      <p className="text-base font-extrabold text-slate-950 font-mono">{formatRupiah(user1Wallet)}</p>
                    </div>
                  </div>

                  {/* Addition Form (only enabled/shown for active user) */}
                  <div className="mb-4">
                    {activeUserIdentity === 'Ry' ? (
                      <div className="bg-emerald-50/40 p-3.5 rounded-xl border border-emerald-100 space-y-2.5">
                        <p className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">Tambah Dompet</p>
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            type="text"
                            placeholder="Contoh: Bank BCA, Gopay, Kas Tunai..."
                            value={newWalletName}
                            onChange={(e) => setNewWalletName(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-semibold text-slate-800"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newWalletType}
                              onChange={(e) => setNewWalletType(e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-semibold text-slate-700 cursor-pointer"
                            >
                              <option value="Rekening Bank">Rekening Bank</option>
                              <option value="Dompet Digital">Dompet Digital</option>
                              <option value="Dompet Tunai">Dompet Tunai</option>
                              <option value="Kartu Kredit">Kartu Kredit</option>
                              <option value="Lainnya">Lainnya</option>
                            </select>
                            <input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="Saldo Awal..."
                              value={newWalletBalance}
                              onChange={(e) => setNewWalletBalance(e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-emerald-500 font-semibold text-slate-800"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (!newWalletName.trim()) {
                                alert('Silakan isi nama dompet terlebih dahulu!');
                                return;
                              }
                              handleSaveWallet(newWalletName, newWalletType, parseFloat(newWalletBalance) || 0, undefined, 'Ry');
                              setNewWalletName('');
                              setNewWalletBalance('');
                            }}
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            Tambah Rekening / Dompet Baru
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-150 text-center">
                        <p className="text-[10px] text-slate-400 font-bold block">
                          Untuk menambahkan dompet baru milik <span className="text-slate-600 font-extrabold">{user1Name}</span>, silakan ganti status pengguna aktif ke <span className="font-extrabold">{user1Name}</span> di pojok kanan atas.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* List of Custom Wallets owned by Ry */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Daftar Dompet ({user1Name})</p>
                    {wallets.filter(w => w.ownerId === 'Ry' || !w.ownerId).length === 0 ? (
                      <p className="text-center text-[10px] text-slate-400 py-4 font-semibold italic bg-slate-50 border border-slate-100 rounded-xl">Belum ada dompet tambahan.</p>
                    ) : (
                      wallets.filter(w => w.ownerId === 'Ry' || !w.ownerId).map((w) => (
                        <div key={w.id} className="border border-slate-100 rounded-xl p-3 flex flex-col justify-between hover:bg-slate-50/40 transition-colors bg-white shadow-3xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                <Landmark className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-xs">{w.name}</p>
                                <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-semibold">{w.type}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              {editingWalletId === w.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={newWalletBalance}
                                    onChange={(e) => setNewWalletBalance(e.target.value)}
                                    className="w-20 px-1.5 py-0.5 text-xs border border-slate-300 rounded font-semibold text-slate-800"
                                  />
                                  <button
                                    onClick={() => {
                                      handleSaveWallet(w.name, w.type, parseFloat(newWalletBalance) || 0, w.id, w.ownerId || 'Ry');
                                      setEditingWalletId(null);
                                      setNewWalletBalance('');
                                    }}
                                    className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    Ok
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 justify-end">
                                  <p className="font-extrabold text-slate-800 text-xs font-mono">{formatRupiah(w.balance)}</p>
                                  {activeUserIdentity === 'Ry' && (
                                    <button
                                      onClick={() => {
                                        setEditingWalletId(w.id);
                                        setNewWalletBalance(w.balance.toString());
                                      }}
                                      className="p-1 hover:text-emerald-700 hover:bg-slate-100 rounded text-slate-400 cursor-pointer"
                                      title="Edit Saldo"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}

                              {activeUserIdentity === 'Ry' && (
                                <button
                                  onClick={() => handleDeleteWallet(w.id, w.name)}
                                  className="text-[9px] font-bold text-rose-500 hover:underline mt-0.5 block ml-auto cursor-pointer"
                                >
                                  Hapus Dompet
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* USER 2 CARD (PARTNER / INDIGO ACCENT) */}
                <div id="wallet-hub-user2" className={`rounded-2xl border p-5 shadow-xs transition-all ${
                  activeUserIdentity === 'Partner'
                    ? 'bg-indigo-50/20 border-indigo-200 ring-1 ring-indigo-100'
                    : 'bg-white border-slate-200'
                }`}>
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-150 mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                        activeUserIdentity === 'Partner' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {user2Name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <input
                          type="text"
                          value={user2EditName}
                          onChange={(e) => setUser2EditName(e.target.value)}
                          onBlur={() => {
                            if (activeUserIdentity === 'Partner') {
                              handleUpdateProfile({ user2Name: user2EditName });
                            }
                          }}
                          disabled={activeUserIdentity !== 'Partner'}
                          className={`font-black text-xs uppercase tracking-wide bg-transparent outline-none border-b border-transparent ${
                            activeUserIdentity === 'Partner' ? 'focus:border-indigo-505 text-slate-800' : 'text-slate-400'
                          } w-28`}
                          placeholder="User 2"
                        />
                        <p className="text-[9px] text-slate-400 font-semibold uppercase leading-tight">Pengguna 2 (Klik Edit)</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      activeUserIdentity === 'Partner'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {activeUserIdentity === 'Partner' ? 'Pengguna Aktif' : 'Dibaca Saja'}
                    </span>
                  </div>

                  {/* Main Balance Display */}
                  <div className="bg-slate-50/60 rounded-xl p-4 border border-slate-100 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Saldo Utama ({user2Name})</span>
                      <p className="text-base font-extrabold text-slate-950 font-mono">{formatRupiah(user2Wallet)}</p>
                    </div>
                  </div>

                  {/* Addition Form (only enabled/shown for active user) */}
                  <div className="mb-4">
                    {activeUserIdentity === 'Partner' ? (
                      <div className="bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100 space-y-2.5">
                        <p className="text-[10px] font-black uppercase text-indigo-800 tracking-wider">Tambah Dompet</p>
                        <div className="grid grid-cols-1 gap-2">
                          <input
                            type="text"
                            placeholder="Contoh: Bank BCA, Gopay, Kas Tunai..."
                            value={newWalletName}
                            onChange={(e) => setNewWalletName(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-550 font-semibold text-slate-800"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={newWalletType}
                              onChange={(e) => setNewWalletType(e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none font-semibold text-slate-700 cursor-pointer"
                            >
                              <option value="Rekening Bank">Rekening Bank</option>
                              <option value="Dompet Digital">Dompet Digital</option>
                              <option value="Dompet Tunai">Dompet Tunai</option>
                              <option value="Kartu Kredit">Kartu Kredit</option>
                              <option value="Lainnya">Lainnya</option>
                            </select>
                            <input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="Saldo Awal..."
                              value={newWalletBalance}
                              onChange={(e) => setNewWalletBalance(e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-indigo-550 font-semibold text-slate-800"
                            />
                          </div>
                          <button
                            onClick={() => {
                              if (!newWalletName.trim()) {
                                alert('Silakan isi nama dompet terlebih dahulu!');
                                return;
                              }
                              handleSaveWallet(newWalletName, newWalletType, parseFloat(newWalletBalance) || 0, undefined, 'Partner');
                              setNewWalletName('');
                              setNewWalletBalance('');
                            }}
                            className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            Tambah Rekening / Dompet Baru
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-150 text-center">
                        <p className="text-[10px] text-slate-400 font-bold block">
                          Untuk menambahkan dompet baru milik <span className="text-slate-600 font-extrabold">{user2Name}</span>, silakan ganti status pengguna aktif ke <span className="font-extrabold">{user2Name}</span> di pojok kanan atas.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* List of Custom Wallets owned by Partner */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Daftar Dompet ({user2Name})</p>
                    {wallets.filter(w => w.ownerId === 'Partner').length === 0 ? (
                      <p className="text-center text-[10px] text-slate-400 py-4 font-semibold italic bg-slate-50 border border-slate-100 rounded-xl">Belum ada dompet tambahan.</p>
                    ) : (
                      wallets.filter(w => w.ownerId === 'Partner').map((w) => (
                        <div key={w.id} className="border border-slate-100 rounded-xl p-3 flex flex-col justify-between hover:bg-slate-50/40 transition-colors bg-white shadow-3xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                <Landmark className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-xs">{w.name}</p>
                                <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-semibold">{w.type}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              {editingWalletId === w.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={newWalletBalance}
                                    onChange={(e) => setNewWalletBalance(e.target.value)}
                                    className="w-20 px-1.5 py-0.5 text-xs border border-slate-300 rounded font-semibold text-slate-800"
                                  />
                                  <button
                                    onClick={() => {
                                      handleSaveWallet(w.name, w.type, parseFloat(newWalletBalance) || 0, w.id, w.ownerId || 'Partner');
                                      setEditingWalletId(null);
                                      setNewWalletBalance('');
                                    }}
                                    className="px-2 py-0.5 bg-indigo-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                  >
                                    Ok
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 justify-end">
                                  <p className="font-extrabold text-slate-800 text-xs font-mono">{formatRupiah(w.balance)}</p>
                                  {activeUserIdentity === 'Partner' && (
                                    <button
                                      onClick={() => {
                                        setEditingWalletId(w.id);
                                        setNewWalletBalance(w.balance.toString());
                                      }}
                                      className="p-1 hover:text-indigo-700 hover:bg-slate-100 rounded text-slate-400 cursor-pointer"
                                      title="Edit Saldo"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}

                              {activeUserIdentity === 'Partner' && (
                                <button
                                  onClick={() => handleDeleteWallet(w.id, w.name)}
                                  className="text-[9px] font-bold text-rose-500 hover:underline mt-0.5 block ml-auto cursor-pointer"
                                >
                                  Hapus Dompet
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeMainTab === 'budgeting' && (
            <motion.div
              key="budgeting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Title Header */}
              <div className="pb-2">
                <h2 className="text-xl font-bold text-slate-900">Budgeting (Anggaran Belanja)</h2>
                <p className="text-xs text-slate-500">Buat batasan bulanan per kategori transaksi demi mencegah pemborosan bersama.</p>
              </div>

              {/* Info Tips Guide to use the Floating action button */}
              <div className="bg-indigo-50/40 border border-indigo-105/40 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <span className="animate-pulse">✨</span>
                    Kustomisasi Budgets & Kategori
                  </h4>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-relaxed">
                    Untuk menambahkan kategori baru atau mengaktifkan limit bulanan, gunakan tombol <span className="text-indigo-605 font-extrabold">+ (Plus)</span> di sudut kanan bawah layar Anda.
                  </p>
                </div>
              </div>

              {/* Budget Display Collection */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Daftar Anggaran Terdaftar</h3>

                <div className="space-y-4">
                  {budgets.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 space-y-1">
                      <p className="text-xs font-bold">Belum ada anggaran terdaftar.</p>
                      <p className="text-[10px]">Tentukan anggaran kategori makanan, hobi, dsb di atas.</p>
                    </div>
                  ) : (
                    budgets.map((b) => {
                      const spent = transactions
                        .filter((t) => t.category === b.category && t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0);
                      const pctReal = b.limit > 0 ? Math.round((spent / b.limit) * 100) : 0;
                      const isMelebihi = spent > b.limit;
                      const catDetails = categories.find(c => c.name === b.category);

                      return (
                        <div key={b.id} className="space-y-1.5 relative border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-slate-800">
                              <span className="mr-1.5 text-base">{catDetails?.emoji || '🏷️'}</span>
                              {b.category}
                            </span>
                            <button
                              onClick={() => handleDeleteBudget(b.id, b.category)}
                              className="text-slate-400 hover:text-rose-600 font-bold text-[10px]"
                            >
                              Hapus
                            </button>
                          </div>

                          <div className="flex justify-between items-center text-[11px] text-slate-500 font-semibold mb-1">
                            <div>
                              Terpakai: <span className="text-slate-950 font-bold">{formatRupiah(spent)}</span>
                            </div>
                            <div>
                              Batas: <span className="font-extrabold text-slate-700">{formatRupiah(b.limit)}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden relative shadow-inner">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isMelebihi
                                  ? 'bg-rose-500'
                                  : pctReal > 80
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, pctReal)}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between items-center text-[10px]">
                            <span className={`font-black ${isMelebihi ? 'text-rose-650' : 'text-slate-400'}`}>
                              {pctReal}% terpakai
                            </span>
                            {isMelebihi && (
                              <span className="text-rose-600 bg-rose-50 text-[9px] px-1.5 py-0.5 font-bold rounded">
                                Melebihi Limit Anggaran
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Category Management Division (Kustomisasi Kategori) */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">🎨 Daftar Kategori</h3>
                  </div>
                </div>



                {/* List of custom categories */}
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Daftar Semua Kategori</p>
                  {categories.length === 0 ? (
                    <p className="text-center text-[10px] text-slate-400 py-4 italic">Belum ada kategori.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categories.map((cat) => (
                        <div key={cat.id} className="border border-slate-100 rounded-xl p-2.5 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{cat.emoji}</span>
                            <div>
                              <p className="font-bold text-slate-950 text-xs">{cat.name}</p>
                              <span className="text-[8px] uppercase px-1.5 py-0.2 rounded font-black bg-white border border-slate-100 text-slate-500">
                                {cat.type === 'expense' ? 'Pengeluaran' : cat.type === 'income' ? 'Pemasukan' : 'Keduanya'}
                              </span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Hapus Kategori"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeMainTab === 'hutang' && (
            <motion.div
              key="hutang"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Title Section */}
              <div className="pb-2">
                <h2 className="text-xl font-bold text-slate-900">Catatan Hutang & Piutang</h2>
                <p className="text-xs text-slate-500">Mencatat hutang piutang dengan teman, keluarga, maupun rekan kerja, bebas repot.</p>
              </div>

              {/* Form to add */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Tambah Hutang Baru</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Tujuan / Keperluan</label>
                    <input
                      type="text"
                      placeholder="Contoh: Utang beli makan siang..."
                      value={newDebtTitle}
                      onChange={(e) => setNewDebtTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white text-slate-800 transition-colors font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Tipe Catatan</label>
                    <select
                      value={newDebtType}
                      onChange={(e) => setNewDebtType(e.target.value as any)}
                      className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none font-bold text-slate-700 cursor-pointer shadow-xs"
                    >
                      <option value="debt">Saya Berhutang</option>
                      <option value="receivable">Dia Berhutang (Piutang)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Nama Orang</label>
                    <input
                      type="text"
                      placeholder="Nama orang..."
                      value={newDebtPerson}
                      onChange={(e) => setNewDebtPerson(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white text-slate-800 transition-colors font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Jumlah</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Jumlah Rupiah..."
                      value={newDebtAmount}
                      onChange={(e) => setNewDebtAmount(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white text-slate-800 transition-colors font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={newDebtDate}
                      onChange={(e) => setNewDebtDate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold outline-none text-slate-850 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    const amt = parseFloat(newDebtAmount);
                    if (!newDebtTitle.trim() || !newDebtPerson.trim() || isNaN(amt)) {
                      alert('Harap isi deskripsi, nama orang, dan nilai Rupiah dengan lengkap!');
                      return;
                    }
                    handleSaveDebt(newDebtTitle, amt, newDebtPerson, newDebtType, newDebtDate);
                    setNewDebtTitle('');
                    setNewDebtPerson('');
                    setNewDebtAmount('');
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-555 text-white text-xs font-black uppercase rounded-lg transition-all cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  Simpan Catatan Hutang
                </button>
              </div>

              {/* Debt Records Listings */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Semua Daftar Hutang</h3>

                <div className="space-y-3">
                  {debts.length === 0 ? (
                    <p className="text-center text-[11px] text-slate-400 py-6 font-semibold">Tidak ada catatan hutang/piutang.</p>
                  ) : (
                    debts.map((d) => (
                      <div key={d.id} className="border border-slate-100 rounded-xl p-3 space-y-2 hover:bg-slate-50/20 transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className={`inline-block text-[9px] font-black uppercase px-1.5 py-0.2 rounded mb-1 border ${
                              d.type === 'debt'
                                ? 'bg-rose-55 border-rose-100 text-rose-700'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            }`}>
                              {d.type === 'debt' ? 'Saya Berhutang' : 'Orang Berhutang'}
                            </span>
                            <h4 className="font-bold text-slate-900 text-xs">{d.title}</h4>
                            <p className="text-[10px] font-medium text-slate-500">
                              Orang: <span className="font-bold text-slate-700">{d.person}</span> • {d.date}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-slate-900 text-xs block">{formatRupiah(d.amount)}</span>
                            <span className={`inline-block text-[9px] font-black uppercase mt-1 px-1.5 rounded ${
                              d.status === 'paid' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-705'
                            }`}>
                              {d.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                            </span>
                          </div>
                        </div>

                        {/* Quick Trigger actions */}
                        <div className="pt-2 border-t border-slate-100/60 flex justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateDebtStatus(d.id, d.status === 'paid' ? 'unpaid' : 'paid')}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-650 text-[10px] font-bold cursor-pointer"
                          >
                            Mark {d.status === 'unpaid' ? 'Lunas' : 'Belum Lunas'}
                          </button>
                          
                          <button
                            onClick={() => handleDeleteDebt(d.id, d.title)}
                            className="p-1 px-2.5 text-rose-500 hover:bg-rose-50 rounded text-[10px] font-bold cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeMainTab === 'setting' && (
            <motion.div
              key="setting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Title Section */}
              <div className="pb-2">
                <h2 className="text-xl font-bold text-slate-900">Setting & Laporan Bulanan</h2>
                <p className="text-xs text-slate-500">Kombinasi data Google Sheets dan unduh Laporan Finansial Bulanan dalam format file PDF.</p>
              </div>

              {/* Connected spreadsheet details */}
              <SheetsPanel
                config={sheetsConfig}
                onSync={(token) => syncToGoogleSheets(token)}
                onCreateSheets={(token) => createGoogleSheetsDatabase(token)}
                onConnectExisting={connectExistingGoogleSheetsDatabase}
                onExportCsv={handleExportCsv}
                syncing={syncingSheets}
              />

              {/* Google Sheets status summary section on request */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-black uppercase text-slate-450 tracking-wider">Unduh Invoice Laporan PDF</h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <span className="relative flex h-2 w-2">
                      <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${sheetsConfig.connected ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${sheetsConfig.connected ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                    </span>
                    {sheetsConfig.connected ? 'Spreadsheet Terhubung' : 'Lokal/Offline'}
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-black text-slate-500 tracking-wider">Pilih Bulan Laporan</label>
                    <input
                      type="month"
                      value={selectedReportMonth}
                      onChange={(e) => setSelectedReportMonth(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none text-slate-800 focus:border-emerald-500 transition-all cursor-pointer"
                    />
                  </div>

                  <button
                    onClick={handleDownloadPdf}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-555 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/15"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Data Mutasi PDF ({selectedReportMonth})
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action '+' Button on Halaman Utama Bottom-Right Corner on request */}
      {activeMainTab === 'dashboard' && (
        <button
          id="fb-add-transaction"
          onClick={() => {
            setEditTarget(null);
            setIsModalOpen(true);
          }}
          className="fixed bottom-22 right-5 z-45 w-14 h-14 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer border-2 border-white"
          title="Catat Transaksi Baru"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Floating Action '+' Button on Budgeting Halaman to Add Custom Category / Budget Limit */}
      {activeMainTab === 'budgeting' && (
        <button
          id="fb-add-budget-category"
          onClick={() => {
            setIsBudgetCategoryModalOpen(true);
          }}
          className="fixed bottom-22 right-5 z-45 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-full flex items-center justify-center shadow-xl transition-all cursor-pointer border-2 border-white"
          title="Atur Budget & Kategori Baru"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}

      {/* Fixed Bottom NavBar - Icons only, Sleek Minimalist, Mobile-Comfortable - Touch-targets optimized */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl px-6 py-2.5 pb-safe flex items-center justify-between">
        <button
          id="mobile-nav-home"
          onClick={() => setActiveMainTab('dashboard')}
          className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeMainTab === 'dashboard'
              ? 'text-emerald-600 bg-emerald-50 scale-110 shadow-xs'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Halaman Utama"
        >
          <Home className="w-6 h-6" />
        </button>

        <button
          id="mobile-nav-wallets"
          onClick={() => setActiveMainTab('dompet')}
          className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeMainTab === 'dompet'
              ? 'text-emerald-600 bg-emerald-50 scale-110 shadow-xs'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Dompetmu"
        >
          <Wallet className="w-6 h-6" />
        </button>

        <button
          id="mobile-nav-budgets"
          onClick={() => setActiveMainTab('budgeting')}
          className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeMainTab === 'budgeting'
              ? 'text-emerald-600 bg-emerald-50 scale-110 shadow-xs'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Budgeting"
        >
          <PiggyBank className="w-6 h-6" />
        </button>

        <button
          id="mobile-nav-debts"
          onClick={() => setActiveMainTab('hutang')}
          className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeMainTab === 'hutang'
              ? 'text-emerald-600 bg-emerald-50 scale-110 shadow-xs'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Hutang"
        >
          <Receipt className="w-6 h-6" />
        </button>

        <button
          id="mobile-nav-settings"
          onClick={() => setActiveMainTab('setting')}
          className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${
            activeMainTab === 'setting'
              ? 'text-emerald-600 bg-emerald-50 scale-110 shadow-xs'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </nav>

      {/* Transaction Entry/Editing Modal helper */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditTarget(null);
        }}
        onSave={handleSaveTransaction}
        transaction={editTarget}
        activeUser={activeUserIdentity}
        user1Name={user1Name}
        user2Name={user2Name}
        categories={categories}
        wallets={wallets}
      />

      {/* Transaction Success Receipt Modal Overlay */}
      <TransactionSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        transaction={lastSavedTx}
        categories={categories}
      />

      {/* Budget & Category Customizable Modal Overlay */}
      <BudgetCategoryModal
        isOpen={isBudgetCategoryModalOpen}
        onClose={() => setIsBudgetCategoryModalOpen(false)}
        categories={categories}
        onSaveBudget={handleSaveBudget}
        onSaveCategory={handleSaveCategory}
      />
    </div>
  );
}
