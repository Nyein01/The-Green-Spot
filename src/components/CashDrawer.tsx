import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/pricing';
import { Calculator, RotateCcw } from 'lucide-react';

interface CashDrawerProps {
  expectedCash: number;
}

export const CashDrawer: React.FC<CashDrawerProps> = ({ expectedCash }) => {
  const [counts, setCounts] = useState<{ [key: number]: number }>({
    1000: 0,
    500: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
    0.5: 0,
    0.25: 0
  });

  const denominations = [1000, 500, 100, 50, 20, 10, 5, 2, 1, 0.5, 0.25];

  const total = Object.entries(counts).reduce((sum, [denom, count]) => sum + (parseFloat(denom) * count), 0);
  const difference = total - expectedCash;

  const handleChange = (denom: number, value: string) => {
    const count = value === '' ? 0 : parseInt(value);
    if (!isNaN(count) && count >= 0) {
        setCounts(prev => ({ ...prev, [denom]: count }));
    }
  };

  const handleReset = () => {
      setCounts({
        1000: 0, 500: 0, 100: 0, 50: 0, 20: 0,
        10: 0, 5: 0, 2: 0, 1: 0, 0.5: 0, 0.25: 0
      });
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-yellow-400" />
                Cash Drawer
            </h3>
            <button 
                onClick={handleReset}
                className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
            >
                <RotateCcw className="w-3 h-3" /> Reset
            </button>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
            {denominations.map(denom => (
                <div key={denom} className="flex items-center justify-between bg-slate-900/40 p-2 rounded-lg border border-white/5">
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold w-10 ${denom >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {denom >= 20 ? '฿' + denom : denom + 'b'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input 
                            type="number" 
                            min="0"
                            className="w-14 bg-slate-800 border border-slate-700 rounded px-1 py-1 text-right text-white text-sm focus:outline-none focus:border-yellow-500 font-mono"
                            value={counts[denom] || ''}
                            onChange={(e) => handleChange(denom, e.target.value)}
                            placeholder="0"
                        />
                        <span className="text-slate-500 text-xs w-14 text-right font-mono">
                            {formatCurrency(denom * (counts[denom] || 0))}
                        </span>
                    </div>
                </div>
            ))}
        </div>

        <div className="pt-4 border-t border-white/10 space-y-3 bg-slate-900/30 -mx-5 -mb-5 p-5 rounded-b-2xl">
            <div className="flex justify-between text-sm text-slate-400">
                <span>Expected Cash (Sales - Exp)</span>
                <span className="font-mono">{formatCurrency(expectedCash)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white">Counted Total</span>
                <span className="text-xl font-black text-yellow-400 font-mono">{formatCurrency(total)}</span>
            </div>
            
            <div className={`flex justify-between items-center p-3 rounded-xl border ${
                difference === 0 
                    ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                    : difference > 0 
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
                <span className="text-sm font-bold">Difference</span>
                <span className="text-lg font-black font-mono">
                    {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                </span>
            </div>
        </div>
    </div>
  );
};
