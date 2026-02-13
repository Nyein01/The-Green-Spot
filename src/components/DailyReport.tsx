import React, { useState } from 'react';
import { SaleItem, InventoryItem, DayReport, Expense } from '../types';
import { formatCurrency, generateId } from '../utils/pricing';
import { saveDayReportToCloud } from '../services/storageService';
import { Download, TrendingUp, Save, LogOut, Wallet, Plus, Trash2, QrCode, AlertTriangle, RefreshCw, Loader2, Leaf, Calendar, X } from 'lucide-react';
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
  sales, expenses, inventory, onDeleteSale, onAddExpense, onDeleteExpense, onReset, deletingIds, shopName, staffName
}) => {
  const [savingReport, setSavingReport] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  
  // Delete Modal State
  const [saleToDelete, setSaleToDelete] = useState<SaleItem | null>(null);

  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.price, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netIncome = totalRevenue - totalExpenses;
  const totalItems = sales.length;
  
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

  const handleDownloadPDF = async () => {
    const element = document.getElementById('receipt-container');
    if (!element) return;

    setDownloadingPdf(true);

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        onclone: (clonedDoc) => {
          const scrollableDiv = clonedDoc.querySelector('.receipt-scroll') as HTMLElement;
          if (scrollableDiv) {
            scrollableDiv.style.maxHeight = 'none';
            scrollableDiv.style.overflow = 'visible';
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`DailySales_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("Failed to generate PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in max-w-6xl mx-auto pb-20 relative">
      
      {/* Custom Confirmation Modal */}
      {saleToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSaleToDelete(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-100 dark:border-gray-700 relative animate-fade-in" onClick={e => e.stopPropagation()}>
                <button onClick={() => setSaleToDelete(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
                <div className="flex justify-center mb-4"><div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full"><AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" /></div></div>
                <h3 className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white">Void Transaction?</h3>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">Are you sure you want to delete <b>{saleToDelete.productName}</b>? Stock will be restored.</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setSaleToDelete(null)} className="py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Cancel</button>
                    <button onClick={() => { onDeleteSale(saleToDelete); setSaleToDelete(null); }} className="py-3 rounded-xl font-bold bg-red-600 text-white shadow-lg shadow-red-500/30">Confirm Void</button>
                </div>
            </div>
        </div>
      )}

      {/* Left Column: Visual Receipt */}
      <div className="glass-panel p-6 rounded-2xl relative">
          <div id="receipt-container" className="bg-white text-slate-900 p-6 rounded-lg shadow-xl font-mono text-sm relative overflow-hidden">
             {/* Receipt decoration */}
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-500 via-green-400 to-green-500"></div>
             
             <div className="text-center mb-6">
                 <h2 className="text-2xl font-black uppercase tracking-widest">{shopName}</h2>
                 <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">{new Date().toLocaleDateString()}</p>
                 <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Daily Sales Report</p>
             </div>

             <div className="border-b-2 border-dashed border-slate-200 pb-2 mb-2 flex justify-between text-xs font-bold text-slate-400 uppercase">
                 <span>Item / Date</span>
                 <span>Amt</span>
             </div>

             <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar-light pr-2 receipt-scroll">
                 {sales.map((sale, i) => (
                     <div key={sale.id} className="flex justify-between items-start group hover:bg-slate-50 p-1 rounded transition-colors">
                         <div className="flex-1">
                             <div className="font-bold flex items-center text-slate-800">
                                 <span className="text-slate-400 mr-2 text-[10px] w-4">{i + 1}.</span>
                                 {sale.productName}
                                 {sale.paymentMethod === 'Scan' && <QrCode className="w-3 h-3 ml-1 text-blue-500" />}
                             </div>
                             <div className="text-xs text-slate-500 ml-6 flex flex-wrap items-center gap-2">
                                <span>{sale.quantity}{sale.productType === 'Flower'?'g':'u'} {sale.discount ? `(-${sale.discount})` : ''}</span>
                                <span className="text-slate-300">|</span>
                                <span className="flex items-center text-slate-400 text-[10px]">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {sale.date || new Date(sale.timestamp).toLocaleDateString()}
                                </span>
                             </div>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{formatCurrency(sale.price)}</span>
                            <button 
                                onClick={() => setSaleToDelete(sale)} 
                                disabled={deletingIds.has(sale.id)}
                                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-all ml-2" 
                                data-html2canvas-ignore
                                title="Delete Sale"
                            >
                                {deletingIds.has(sale.id) ? <Loader2 className="w-3 h-3 animate-spin"/> : <Trash2 className="w-3 h-3"/>}
                            </button>
                         </div>
                     </div>
                 ))}
             </div>

             <div className="mt-6 pt-4 border-t-2 border-dashed border-slate-200">
                 <div className="flex justify-between items-center text-lg font-black text-slate-800">
                     <span>TOTAL</span>
                     <span>{formatCurrency(totalRevenue)}</span>
                 </div>
                 {totalExpenses > 0 && (
                     <div className="flex justify-between items-center text-xs text-red-500 mt-1">
                        <span>Expenses</span>
                        <span>-{formatCurrency(totalExpenses)}</span>
                     </div>
                 )}
                 <div className="flex justify-between items-center text-sm font-bold text-green-600 mt-2 border-t border-slate-100 pt-2">
                    <span>NET INCOME</span>
                    <span>{formatCurrency(netIncome)}</span>
                 </div>
             </div>

             <div className="mt-8 text-center text-[10px] text-slate-400 uppercase tracking-widest">
                 Generated by {staffName}
             </div>
          </div>
          
           {/* Download Button Overlaid */}
           <div className="absolute top-8 right-8">
               <button 
                  onClick={handleDownloadPDF}
                  disabled={downloadingPdf}
                  className={`group flex items-center justify-center w-10 h-10 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-green-200 rounded-full text-gray-500 hover:text-green-600 transition-all duration-200 ${downloadingPdf ? 'opacity-50 cursor-wait' : ''}`}
                  title="Download Professional PDF Report"
               >
                  {downloadingPdf ? (
                    <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                  ) : (
                    <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  )}
               </button>
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
                onClick={() => {
                  if (confirmReset) {
                      onReset();
                      setConfirmReset(false);
                  } else {
                      setConfirmReset(true);
                      setTimeout(() => setConfirmReset(false), 3000);
                  }
                }}
                className={`p-4 rounded-xl font-bold flex flex-col items-center justify-center gap-2 transition-all border ${
                   confirmReset 
                   ? 'bg-red-600 text-white border-red-500' 
                   : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                }`}
              >
                  {confirmReset ? <RefreshCw className="animate-spin"/> : <LogOut />}
                  {confirmReset ? 'Confirm Close?' : 'Close Shift'}
              </button>
          </div>
      </div>

    </div>
  );
};
