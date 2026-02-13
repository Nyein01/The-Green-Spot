import React, { useState } from 'react';
import { SaleItem, InventoryItem, DayReport, Expense } from '../types';
import { formatCurrency, generateId } from '../utils/pricing';
import { saveDayReportToCloud } from '../services/storageService';
import { Download, TrendingUp, Save, LogOut, Coins, Wallet, Plus, Trash2, Banknote, QrCode, Leaf, Loader2 } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface DailyReportProps {
  sales: SaleItem[];
  expenses: Expense[];
  inventory: InventoryItem[];
  onDeleteSale: (sale: SaleItem) => void;
  onAddExpense: (description: string, amount: number) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onReset: () => Promise<void>;
  deletingIds: Set<string>;
  shopName: string;
  staffName: string;
}

export const DailyReport: React.FC<DailyReportProps> = ({ 
  sales, expenses, onDeleteSale, onAddExpense, onDeleteExpense, onReset, deletingIds, shopName, staffName
}) => {
  const [savingReport, setSavingReport] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.price, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const handleSaveAndArchive = async () => {
    setSavingReport(true);
    let shopId = shopName.toLowerCase().includes('near') ? 'nearcannabis' : 'greenspot';
    const report: DayReport = {
        id: `report_${new Date().toISOString().split('T')[0]}_${generateId()}`,
        date: new Date().toISOString().split('T')[0],
        totalSales: sales.length,
        totalRevenue,
        itemsSold: sales.reduce((sum, s) => sum + s.quantity, 0),
        sales: sales,
        expenses: expenses,
        timestamp: Date.now(),
        closedBy: staffName
    };
    await saveDayReportToCloud(shopId, report);
    setSavingReport(false);
    alert("Saved to Archive!");
  };

  const handleNewExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc || !expAmount) return;
    await onAddExpense(expDesc, Number(expAmount));
    setExpDesc('');
    setExpAmount('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in max-w-6xl mx-auto">
      
      {/* Left Column: Visual Receipt */}
      <div className="glass-panel p-6 rounded-2xl relative">
          <div className="bg-white text-slate-900 p-6 rounded-lg shadow-xl font-mono text-sm relative overflow-hidden">
             {/* Receipt decoration */}
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 via-green-400 to-green-500"></div>
             
             <div className="text-center mb-6">
                 <h2 className="text-2xl font-black uppercase tracking-widest">{shopName}</h2>
                 <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">{new Date().toLocaleDateString()}</p>
             </div>

             <div className="border-b-2 border-dashed border-slate-200 pb-2 mb-2 flex justify-between text-xs font-bold text-slate-400 uppercase">
                 <span>Item</span>
                 <span>Amt</span>
             </div>

             <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar-light pr-2">
                 {sales.map((sale, i) => (
                     <div key={sale.id} className="flex justify-between items-start group">
                         <div className="flex-1">
                             <div className="font-bold flex items-center">
                                 {sale.productName}
                                 {sale.paymentMethod === 'Scan' && <QrCode className="w-3 h-3 ml-1 text-blue-500" />}
                             </div>
                             <div className="text-xs text-slate-500">{sale.quantity}{sale.productType === 'Flower'?'g':'u'} {sale.discount ? `(-${sale.discount})` : ''}</div>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="font-bold">{formatCurrency(sale.price)}</span>
                            <button onClick={() => onDeleteSale(sale)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3 h-3"/></button>
                         </div>
                     </div>
                 ))}
             </div>

             <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-200">
                 <div className="flex justify-between items-center text-lg font-black">
                     <span>TOTAL</span>
                     <span>{formatCurrency(totalRevenue)}</span>
                 </div>
                 {totalExpenses > 0 && (
                     <div className="flex justify-between items-center text-xs text-red-500 mt-1">
                        <span>Expenses</span>
                        <span>-{formatCurrency(totalExpenses)}</span>
                     </div>
                 )}
             </div>

             <div className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest">
                 Thank you for visiting
             </div>
          </div>
      </div>

      {/* Right Column: Controls */}
      <div className="space-y-6">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
              <div className="glass-card p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-bold">Net Sales</p>
                  <p className="text-2xl font-black text-green-400">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="glass-card p-4 rounded-xl">
                  <p className="text-xs text-slate-400 uppercase font-bold">Transactions</p>
                  <p className="text-2xl font-black text-white">{sales.length}</p>
              </div>
          </div>

          {/* Expenses */}
          <div className="glass-panel p-5 rounded-2xl">
              <h3 className="font-bold text-white mb-3 flex items-center"><Wallet className="w-4 h-4 mr-2 text-orange-400"/> Expenses</h3>
              <form onSubmit={handleNewExpense} className="flex gap-2 mb-3">
                  <input type="text" placeholder="Desc" value={expDesc} onChange={e=>setExpDesc(e.target.value)} className="flex-1 bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-xs text-white" />
                  <input type="number" placeholder="Amt" value={expAmount} onChange={e=>setExpAmount(e.target.value)} className="w-20 bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-xs text-white" />
                  <button type="submit" className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600"><Plus className="w-4 h-4" /></button>
              </form>
              <div className="space-y-1">
                  {expenses.map(exp => (
                      <div key={exp.id} className="flex justify-between text-xs text-slate-400 bg-slate-900/30 p-2 rounded">
                          <span>{exp.description}</span>
                          <div className="flex gap-2">
                             <span className="text-red-400">-{exp.amount}</span>
                             <button onClick={() => onDeleteExpense(exp.id)} className="text-slate-600 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleSaveAndArchive} 
                disabled={savingReport} 
                className="bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all border border-white/5"
              >
                  {savingReport ? <Loader2 className="animate-spin" /> : <Save />}
                  Save Day
              </button>
              <button 
                onClick={onReset}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all border border-red-500/20"
              >
                  <LogOut />
                  Close Shift
              </button>
          </div>
      </div>

    </div>
  );
};