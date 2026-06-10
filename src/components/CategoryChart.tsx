import React from 'react';
import { Transaction, CustomCategory } from '../types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CategoryChartProps {
  transactions: Transaction[];
  type: 'expense' | 'income';
  categories: CustomCategory[];
}

export default function CategoryChart({ transactions, type, categories = [] }: CategoryChartProps) {
  // Filter transactions by type
  const targetTxs = transactions.filter((tx) => tx.type === type);
  
  // Compute total sum
  const totalSum = targetTxs.reduce((sum, tx) => sum + tx.amount, 0);

  // Group by category name
  const groupedAmounts = targetTxs.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  // Sort categories by amount
  const sortedCategories = Object.entries(groupedAmounts)
    .map(([name, amount]) => {
      const matchCat = categories.find((cat) => cat.name === name);
      return {
        name,
        emoji: matchCat?.emoji || '🏷️',
        amount,
        percentage: totalSum > 0 ? (amount / totalSum) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
          {type === 'expense' ? (
            <>
              <ArrowDownRight className="w-4 h-4 text-rose-500" />
              Distribusi Pengeluaran
            </>
          ) : (
            <>
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              Distribusi Pemasukan
            </>
          )}
        </h4>
        <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 rounded-md px-1.5 py-0.5">
          {sortedCategories.length} Kategori
        </span>
      </div>

      {sortedCategories.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <p className="text-slate-400 text-xs">Belum ada data untuk periode ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedCategories.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 line-clamp-1">
                  <span className="mr-1 text-base">{item.emoji}</span> {item.name}
                </span>
                <div className="flex items-center gap-1 font-mono text-slate-500 font-medium">
                  <span>Rp {item.amount.toLocaleString('id-ID')}</span>
                  <span className="text-slate-300 font-normal">({item.percentage.toFixed(0)}%)</span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    type === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
