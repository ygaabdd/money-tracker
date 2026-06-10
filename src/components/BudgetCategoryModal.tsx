import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PiggyBank, Palette, Check } from 'lucide-react';
import { CustomCategory } from '../types';

interface BudgetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CustomCategory[];
  onSaveBudget: (category: string, limit: number) => void;
  onSaveCategory: (name: string, emoji: string, type: 'expense' | 'income' | 'both') => void;
}

export default function BudgetCategoryModal({
  isOpen,
  onClose,
  categories,
  onSaveBudget,
  onSaveCategory,
}: BudgetCategoryModalProps) {
  const [activeTab, setActiveTab] = useState<'budget' | 'category'>('budget');

  // Budget States
  const [budgetCategory, setBudgetCategory] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');

  // Category States
  const [categoryName, setCategoryName] = useState('');
  const [categoryEmoji, setCategoryEmoji] = useState('🍔');
  const [categoryType, setCategoryType] = useState<'expense' | 'income' | 'both'>('expense');

  const handleSaveBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetCategory) {
      alert('Silakan pilih kategori anggaran!');
      return;
    }
    const limit = parseFloat(budgetLimit);
    if (!limit || isNaN(limit)) {
      alert('Silakan tulis batas maksimal budget yang sah!');
      return;
    }
    onSaveBudget(budgetCategory, limit);
    setBudgetLimit('');
    setBudgetCategory('');
    onClose();
  };

  const handleSaveCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      alert('Silakan tulis nama kategori terlebih dahulu!');
      return;
    }
    onSaveCategory(categoryName, categoryEmoji, categoryType);
    setCategoryName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-3xl border border-slate-100 p-6 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-900">Kelola Budget & Kategori</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WALLETKAMI KUSTOMISASI</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Unified Tab Selector */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl my-4">
            <button
              onClick={() => setActiveTab('budget')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'budget'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-505 hover:text-slate-700'
              }`}
            >
              <PiggyBank className="w-4 h-4" />
              Batas Anggaran
            </button>
            <button
              onClick={() => setActiveTab('category')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'category'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-505 hover:text-slate-700'
              }`}
            >
              <Palette className="w-4 h-4" />
              Kategori Baru
            </button>
          </div>

          {/* Forms Section */}
          {activeTab === 'budget' ? (
            <form onSubmit={handleSaveBudgetSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider">Kategori Pengeluaran</label>
                <select
                  value={budgetCategory}
                  onChange={(e) => setBudgetCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-750 outline-none focus:border-emerald-500 hover:bg-slate-100/50 cursor-pointer transition-all"
                >
                  <option value="">-- Pilih Kategori --</option>
                  {categories
                    .filter((c) => c.type === 'expense' || c.type === 'both')
                    .map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.emoji} {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider">Batas Maksimal Bulanan</label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Contoh: 1500000"
                  value={budgetLimit}
                  onChange={(e) => setBudgetLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-555 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-emerald-600/10 hover:shadow-lg active:scale-[0.99]"
              >
                Buat & Aktifkan Anggaran
              </button>
            </form>
          ) : (
            <form onSubmit={handleSaveCategorySubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider">Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Langganan Wifi, Kopi, Hobi"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-850 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider">Pilih Emoji</label>
                  <select
                    value={categoryEmoji}
                    onChange={(e) => setCategoryEmoji(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-755 outline-none focus:border-indigo-505 cursor-pointer transition-all"
                  >
                    <option value="🍔">🍔 Makanan</option>
                    <option value="🚗">🚗 Transportasi</option>
                    <option value="🛍️">🛍️ Belanja</option>
                    <option value="🎮">🎮 Hiburan</option>
                    <option value="🔌">🔌 Tagihan</option>
                    <option value="💊">💊 Kesehatan</option>
                    <option value="📈">📈 Investasi</option>
                    <option value="💰">💰 Gaji / Pendapatan</option>
                    <option value="✨">✨ Bonus</option>
                    <option value="☕">☕ Kopi</option>
                    <option value="🏠">🏠 Kos / Tempat Tinggal</option>
                    <option value="🐱">🐱 Hewan Peliharaan</option>
                    <option value="🏫">🏫 Pendidikan</option>
                    <option value="🎁">🎁 Hadiah</option>
                    <option value="✈️">✈️ Travel</option>
                    <option value="❓">❓ Lainnya</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-black text-slate-450 tracking-wider">Tipe Aliran</label>
                  <select
                    value={categoryType}
                    onChange={(e) => setCategoryType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-755 outline-none focus:border-indigo-505 cursor-pointer transition-all"
                  >
                    <option value="expense">Pengeluaran Saja</option>
                    <option value="income">Pemasukan Saja</option>
                    <option value="both">Keduanya (Income & Expense)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-705 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md shadow-indigo-600/10 hover:shadow-lg active:scale-[0.99]"
              >
                Tambah Kategori Kustom
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
