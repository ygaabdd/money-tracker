import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ArrowLeft, Heart } from 'lucide-react';
import { Transaction, CustomCategory } from '../types';

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  categories: CustomCategory[];
}

export default function TransactionSuccessModal({
  isOpen,
  onClose,
  transaction,
  categories,
}: TransactionSuccessModalProps) {
  if (!transaction) return null;

  // Helper to format Rupiah
  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  // Helper to get initials of the user who added this transaction (e.g., YOGA -> YA)
  const getInitials = (name: string) => {
    const clean = (name || '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
    if (!clean) return 'WK';
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    if (clean.length >= 2) {
      return (clean[0] + clean[clean.length - 1]).toUpperCase();
    }
    return clean.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(transaction.addedBy);
  const catDetails = categories.find((c) => c.name === transaction.category);

  // Format Date beautifully
  // We can decode transaction date, or use current time if it's today
  const txDate = transaction.date ? new Date(transaction.date) : new Date();
  const dateFormatted = txDate.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  
  const timeFormatted = new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).replace('.', ':');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur & overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-md"
          />

          {/* Card Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="relative w-full max-w-sm bg-gradient-to-b from-blue-50/70 to-white rounded-3xl border border-slate-100 p-6 shadow-2xl overflow-hidden flex flex-col items-center"
          >
            {/* Top Avatar Circle Badge */}
            <div className="relative mt-2 mb-4">
              <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center text-white font-extrabold text-lg tracking-wider shadow-lg shadow-blue-900/20">
                {initials}
              </div>
              {/* Overlapping small badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center shadow-md">
                <Heart className="w-3 h-3 text-white fill-white" />
              </div>
            </div>

            {/* Nominal */}
            <h2 className="text-2xl font-black text-slate-900 tracking-tight font-sans">
              {formatRupiah(transaction.amount)}
            </h2>

            {/* Description/Action */}
            <p className="text-slate-500 text-xs font-semibold mt-2 text-center max-w-[250px] truncate">
              {transaction.type === 'expense' ? 'Pengeluaran ke ' : 'Pemasukkan ke '}
              <span className="text-slate-800 font-extrabold">{transaction.category}</span>
            </p>
            {transaction.description && (
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 italic max-w-[240px] truncate">
                "{transaction.description}"
              </p>
            )}

            {/* Timestamp */}
            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wider">
              Hari ini, {timeFormatted}
            </p>

            {/* Transaction breakdown ledger */}
            <div className="w-full bg-slate-50 border border-slate-100/80 rounded-2xl p-4 mt-5 space-y-3.5">
              
              {/* Status Row */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Status</span>
                <span className="font-extrabold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                  <Check className="w-3 h-3 stroke-[3]" />
                  Success
                </span>
              </div>

              {/* Date Row */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Tanggal</span>
                <span className="font-extrabold text-slate-800">
                  {dateFormatted} · {timeFormatted}
                </span>
              </div>

              {/* Category Row */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-bold">Kategori</span>
                <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <span className="text-base leading-none">{catDetails?.emoji || '🏷️'}</span>
                  {transaction.category}
                </span>
              </div>

              {/* Nominal Detail Row */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50">
                <span className="text-slate-400 font-bold">Nominal</span>
                <span className="font-black text-slate-900">
                  {formatRupiah(transaction.amount)}
                </span>
              </div>

            </div>

            {/* Back Button */}
            <button
              onClick={onClose}
              className="relative z-20 w-full mt-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer pointer-events-auto shadow-md shadow-slate-900/10 active:scale-[0.98] text-center"
            >
              Kembali
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
