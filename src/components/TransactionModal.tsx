import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, DollarSign, Tag, User, Landmark } from 'lucide-react';
import { Transaction, CustomCategory, Wallet } from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'createdAt'> & { id?: string }) => void;
  transaction?: Transaction | null;
  activeUser: string;
  user1Name?: string;
  user2Name?: string;
  categories: CustomCategory[];
  wallets: Wallet[];
}

export default function TransactionModal({
  isOpen,
  onClose,
  onSave,
  transaction,
  activeUser,
  user1Name = 'Ry',
  user2Name = 'Partner',
  categories = [],
  wallets = [],
}: TransactionModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [addedBy, setAddedBy] = useState<string>('Ry');
  const [walletId, setWalletId] = useState<string>('');

  const hasInitialized = useRef(false);

  // Pre-fill fields for editing or set defaults exactly once when opening or when transaction changes
  useEffect(() => {
    if (!isOpen) {
      hasInitialized.current = false;
      return;
    }

    if (!hasInitialized.current) {
      if (transaction) {
        setDescription(transaction.description);
        setAmount(transaction.amount.toString());
        setType(transaction.type);
        setCategory(transaction.category);
        setDate(transaction.date);
        setAddedBy(transaction.addedBy);
        setWalletId(transaction.walletId || '');
      } else {
        setDescription('');
        setAmount('');
        setType('expense');
        setDate(new Date().toISOString().split('T')[0]);
        setAddedBy(activeUser === 'Ry' ? user1Name : user2Name);

        // Set initial category
        const expenseCats = categories.filter(c => c.type === 'expense' || c.type === 'both');
        if (expenseCats.length > 0) {
          setCategory(expenseCats[0].name);
        } else if (categories.length > 0) {
          setCategory(categories[0].name);
        } else {
          setCategory('');
        }

        // Set initial wallet
        if (wallets.length > 0) {
          setWalletId(wallets[0].id);
        } else {
          setWalletId('');
        }
      }
      hasInitialized.current = true;
    }
  }, [transaction, isOpen, activeUser, user1Name, user2Name, categories, wallets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    onSave({
      id: transaction?.id || Math.random().toString(36).substring(2, 11),
      date,
      description,
      category,
      type,
      amount: parsedAmount,
      addedBy,
      walletId: walletId || undefined,
    });
    onClose();
  };

  const filteredCategories = categories.filter(
    (cat) => cat.type === 'both' || cat.type === type
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden relative z-10"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-900">
                {transaction ? '✏️ Ubah Transaksi' : '✨ Tambah Transaksi Baru'}
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type Switcher */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-2">
                  Tipe Transaksi
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setType('expense');
                      const matchingCats = categories.filter((c) => c.type === 'expense' || c.type === 'both');
                      if (matchingCats.length > 0) {
                        setCategory(matchingCats[0].name);
                      }
                    }}
                    className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      type === 'expense'
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setType('income');
                      const matchingCats = categories.filter((c) => c.type === 'income' || c.type === 'both');
                      if (matchingCats.length > 0) {
                        setCategory(matchingCats[0].name);
                      }
                    }}
                    className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                      type === 'income'
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>
              </div>

              {/* Amount and Date row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
                    Jumlah (Rupiah / Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 font-semibold text-sm">
                      Rp
                    </span>
                    <input
                      id="tx-amount"
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="0"
                      min="1"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 focus:bg-white text-sm rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 transition-all font-semibold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
                    Tanggal
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 pointer-events-none">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      id="tx-date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full box-border min-w-0 pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white text-sm rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 transition-all font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
                  Deskripsi / Keterangan
                </label>
                <input
                  id="tx-desc"
                  type="text"
                  placeholder="Contoh: Kopi pagi, Belanja bulanan, Gaji"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 focus:bg-white text-sm rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 transition-all font-medium"
                  required
                />
              </div>

              {/* Wallet / Account Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
                  Pilih Dompet / Rekening
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Landmark className="w-4 h-4" />
                  </span>
                  <select
                    id="tx-wallet"
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white text-sm rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 transition-all cursor-pointer font-semibold text-indigo-950"
                    required
                  >
                    {wallets.length === 0 ? (
                      <option value="">-- Belum ada dompet, harap buat dompet baru terlebih dahulu --</option>
                    ) : (
                      wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Category & Writer Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
                    Kategori
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Tag className="w-4 h-4" />
                    </span>
                    <select
                      id="tx-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white text-sm rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 transition-all cursor-pointer font-medium"
                      required
                    >
                      {filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.emoji || '❓'} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-widest mb-1.5">
                    Ditulis Oleh
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <select
                      id="tx-by"
                      value={addedBy}
                      onChange={(e) => setAddedBy(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white text-sm rounded-xl border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-900 transition-all cursor-pointer font-medium"
                      required
                    >
                      <option value={user1Name}>{user1Name}</option>
                      <option value={user2Name}>{user2Name}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-center bg-white">
                <button
                  type="submit"
                  disabled={wallets.length === 0}
                  className={`w-full max-w-xs py-2.5 font-semibold text-sm rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer text-center ${
                    wallets.length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/10'
                  }`}
                >
                  {transaction ? 'Simpan Perubahan' : 'Masukkan Transaksi'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
