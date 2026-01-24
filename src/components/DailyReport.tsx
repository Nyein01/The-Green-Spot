import React, { useState } from 'react';
import { SaleItem, InventoryItem, DayReport, Expense } from '../types';
import { formatCurrency, generateId } from '../utils/pricing';
import { saveDayReportToCloud } from '../services/storageService';
import { 
  Download, 
  Leaf, 
  TrendingUp, 
  Loader2, 
  Trash2, 
  X, 
  AlertCircle, 
  Save, 
  CheckCircle2, 
  LogOut,
  Coins,
  Wallet,
  Plus,
  Banknote,
  QrCode
} from 'lucide-react';
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
  sales, 
  expenses, 
  inventory, 
  onDeleteSale, 
  onAddExpense,
  onDeleteExpense,
  onReset, 
  deletingIds, 
  shopName, 
  staffName 
}) => {
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<SaleItem | null>(null);

  // Expense Form State
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [isAddingExpense, setIsAddingExpense] = useState(false);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.price, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const handleSaveAndArchive = async () => {
    if (sales.length === 0 && expenses.length === 0) {
        alert("No data to archive.");
        return;
    }

    setSavingReport(true);
    
    // Determine shopId from shopName
    let shopId = 'greenspot';
    if (shopName.toLowerCase().includes('near')) shopId = 'nearcannabis';

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

    const success = await saveDayReportToCloud(shopId, report);
    
    if (success) {
        setReportSaved(true);
        // Do NOT auto hide the success state immediately, so the user knows they can now close shift
        alert("✅ Daily report saved to Archives!\nYou can now safely Close Shift.");
    } else {
        alert("Failed to save report. Please check connection.");
    }
    
    setSavingReport(false);
  };

  const handleCloseShift = async () => {
      if (!reportSaved && (sales.length > 0 || expenses.length > 0)) {
          alert("⚠️ Please 'Save & Archive Day' before closing the shift to ensure no data is lost.");
          return;
      }
      
      if (confirmReset) {
          setIsClearing(true);
          try {
              await onReset();
              setConfirmReset(false);
              setReportSaved(false); // Reset state for next shift
          } catch (error) {
              console.error("Error clearing shift:", error);
              alert("Failed to clear register. Please check internet connection.");
          } finally {
              setIsClearing(false);
          }
      } else {
          setConfirmReset(true);
          setTimeout(() => setConfirmReset(false), 3000);
      }
  };

  const confirmDelete = async () => {
    if (saleToDelete) {
      onDeleteSale(saleToDelete);
      setSaleToDelete(null);
    }
  };

  const handleNewExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc || !expAmount) return;
    
    setIsAddingExpense(true);
    await onAddExpense(expDesc, Number(expAmount));
    setExpDesc('');
    setExpAmount('');
    setIsAddingExpense(false);
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

      pdf.save(`${shopName.replace(/\s+/g, '')}_Report_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("Failed to generate PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="animate-slide-up grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
      <style>{`
        @keyframes modalEnter {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal {
          animation: modalEnter 0.2s ease-out forwards;
        }
      `}</style>

      {/* Receipt View */}
      <div 
        id="receipt-container"
        className="bg-white p-4 sm:p-8 rounded-none sm:rounded-xl shadow-xl border-t-8 border-green-600 font-mono text-sm relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
               <Leaf className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 uppercase tracking-widest mb-1">{shopName}</h2>
          <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase">Premium Dispensary System</p>
          <div className="mt-6 border-b border-dashed border-gray-200 pb-4">
             <p className="text-gray-400 text-[10px] uppercase mb-1">Date of Report</p>
             <p className="text-gray-700 font-bold text-base">{new Date().toLocaleDateString()} <span className="text-gray-400 font-normal">|</span> {new Date().toLocaleTimeString()}</p>
             <p className="text-xs text-gray-500 mt-1">Staff: {staffName}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-3 border-b border-gray-200 pb-2 tracking-wider">
            <span>Sales Breakdown</span>
            <span>Amount</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 receipt-scroll text-gray-800">
            {sales.length === 0 ? (
              <div className="text-center py-6 text-gray-400 italic bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                No transactions recorded yet.
              </div>
            ) : (
              sales.map((sale, idx) => (
                <div key={sale.id} className={`flex justify-between items-start group hover:bg-gray-50 p-2 rounded transition-all duration-500 ease-in-out -mx-2 transform ${deletingIds.has(sale.id) ? 'opacity-30 bg-red-50' : 'opacity-100'}`}>
                  <div className="flex items-start">
                    <span className="text-gray-300 mr-3 text-xs w-4 font-mono">{idx + 1}.</span>
                    <div>
                      <div className="font-bold text-gray-800 text-base flex items-center">
                        {sale.productName}
                        {sale.paymentMethod === 'Scan' ? (
                            <QrCode className="w-3 h-3 ml-2 text-blue-500" />
                        ) : (
                            <Banknote className="w-3 h-3 ml-2 text-green-500" />
                        )}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-0.5">
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">
                          {sale.quantity}{sale.productType === 'Flower' ? 'g' : ' units'}
                        </span>
                        {sale.grade && <span className="mx-1 text-gray-400">•</span>}
                        {sale.grade && <span className="text-gray-500">{sale.grade}</span>}
                        {sale.staffName && <span className="ml-2 text-gray-400 text-[9px] border border-gray-200 px-1 rounded">By: {sale.staffName.split(' ')[0]}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-gray-900 font-bold mr-2">{formatCurrency(sale.price)}</div>
                    <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSaleToDelete(sale);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="Delete Sale"
                        data-html2canvas-ignore
                        disabled={deletingIds.has(sale.id)}
                    >
                        {deletingIds.has(sale.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expenses Section in Receipt */}
        {expenses.length > 0 && (
          <div className="mb-6 pt-4 border-t border-dashed border-gray-200">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wider">
              <span>Expenses (Internal)</span>
              <span>Cost</span>
            </div>
            <div className="space-y-2 text-gray-800">
                {expenses.map((exp) => (
                    <div key={exp.id} className="flex justify-between items-center -mx-2 p-2 hover:bg-gray-50 rounded">
                        <div className="text-sm">{exp.description}</div>
                        <div className="font-mono text-red-500 text-sm">-{formatCurrency(exp.amount)}</div>
                    </div>
                ))}
            </div>
             <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 text-xs">
                <span className="text-gray-500">Total Expenses</span>
                <span className="font-bold text-red-600">-{formatCurrency(totalExpenses)}</span>
             </div>
          </div>
        )}

        <div className="space-y-3 pt-6 border-t-2 border-dashed border-gray-300">
          
          <div className="flex justify-between items-center text-gray-500 text-xs">
            <span className="flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> Items Sold</span>
            <span className="font-mono font-bold">{sales.length}</span>
          </div>

          <div className="flex justify-between items-end bg-gray-50 p-4 rounded-lg border border-gray-100 mt-2">
            <span className="text-sm font-bold text-gray-800 uppercase tracking-tight flex items-center">
              <Coins className="w-5 h-5 mr-2 text-green-600" />
              Total Revenue
            </span>
            <span className="text-3xl font-black text-gray-900 tracking-tight">{formatCurrency(totalRevenue)}</span>
          </div>
        </div>

        <div className="mt-8 text-center opacity-60">
           <div className="inline-flex items-center justify-center px-4 py-1 border border-gray-200 rounded-full text-[10px] text-gray-400 uppercase tracking-wide">
             <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
             End of Report
           </div>
        </div>

        {/* Download Button */}
        <div className="absolute top-6 right-6" data-html2canvas-ignore>
            <button 
               onClick={handleDownloadPDF}
               disabled={downloadingPdf}
               className={`group flex items-center justify-center w-10 h-10 bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-green-200 rounded-full text-gray-500 hover:text-green-600 transition-all duration-200 ${downloadingPdf ? 'opacity-50 cursor-wait' : ''}`}
               title="Download PDF Report"
            >
               {downloadingPdf ? (
                 <Loader2 className="w-5 h-5 animate-spin text-green-600" />
               ) : (
                 <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
               )}
            </button>
        </div>
      </div>

      {/* Analysis & Actions */}
      <div className="space-y-6">
        
        {/* Expenses Manager Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-orange-100 dark:border-orange-900/30 transition-colors">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg mr-3 text-orange-600 dark:text-orange-400">
                        <Wallet className="w-5 h-5" />
                    </div>
                    Expenses
                </h3>
                <span className="text-xs font-semibold bg-orange-100 text-orange-800 px-2 py-1 rounded">Internal Use</span>
            </div>
            
            {/* Add Expense Form */}
            <form onSubmit={handleNewExpense} className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    placeholder="Item (e.g. Food, Ice)" 
                    value={expDesc}
                    onChange={e => setExpDesc(e.target.value)}
                    className="flex-1 text-sm p-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input 
                    type="number" 
                    placeholder="Cost" 
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value)}
                    className="w-20 text-sm p-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button 
                    type="submit"
                    disabled={!expDesc || !expAmount || isAddingExpense}
                    className="bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isAddingExpense ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </button>
            </form>

            {/* Expenses List */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {expenses.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-2">No extra expenses recorded.</p>
                ) : (
                    expenses.map(exp => (
                        <div key={exp.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                            <span className="text-gray-700 dark:text-gray-300 truncate max-w-[150px]">{exp.description}</span>
                            <div className="flex items-center">
                                <span className="font-bold text-gray-900 dark:text-gray-100 mr-3">{formatCurrency(exp.amount)}</span>
                                <button 
                                    onClick={() => onDeleteExpense(exp.id)}
                                    className="text-gray-400 hover:text-red-500"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {expenses.length > 0 && (
                <div className="mt-4 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase">Total Expenses</span>
                    <span className="text-sm font-black text-orange-600 dark:text-orange-400">{formatCurrency(totalExpenses)}</span>
                </div>
            )}
        </div>

        {/* Save & Archive Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-green-100 dark:border-green-900/30 overflow-hidden transition-colors">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg mr-3 text-green-600 dark:text-green-400">
                        <Save className="w-5 h-5" />
                    </div>
                    Step 1: Save Report
                </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Save the current shift data to the Archive. This data will be used for Weekly & Monthly reports.
            </p>
            <button
                onClick={handleSaveAndArchive}
                disabled={savingReport || (sales.length === 0 && expenses.length === 0)}
                className={`w-full flex items-center justify-center font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 ${
                    reportSaved 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 cursor-default' 
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-green-100 dark:shadow-none'
                } disabled:opacity-50`}
            >
                {savingReport ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Saving...
                    </>
                ) : reportSaved ? (
                    <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Report Saved
                    </>
                ) : (
                    <>
                        <Save className="w-5 h-5 mr-2" />
                        Save & Archive Day
                    </>
                )}
            </button>
        </div>

        {/* Close Shift Section */}
        <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border transition-colors ${
             reportSaved ? 'border-red-100 dark:border-red-900/30' : 'border-gray-100 dark:border-gray-700 opacity-60'
        }`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${reportSaved ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-gray-100 text-gray-400'}`}>
                        <LogOut className="w-5 h-5" />
                    </div>
                    Step 2: Close Shift
                </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Clear the live register for the next shift. Ensure you have saved the report first.
            </p>
            <button
                onClick={handleCloseShift}
                disabled={!reportSaved && (sales.length > 0 || expenses.length > 0)}
                className={`w-full flex items-center justify-center font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all transform active:scale-95 ${
                    confirmReset 
                    ? 'bg-red-600 text-white' 
                    : !reportSaved && (sales.length > 0 || expenses.length > 0)
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border-2 border-red-100 dark:border-red-900/50 hover:border-red-200'
                }`}
            >
                {isClearing ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Clearing Register...
                    </>
                ) : confirmReset ? (
                    <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Confirm Close
                    </>
                ) : (
                    <>
                        <LogOut className="w-5 h-5 mr-2" />
                        Close Shift & Clear Register
                    </>
                )}
            </button>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {saleToDelete && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setSaleToDelete(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-modal border border-gray-100 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Delete Sale?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-6">
                Are you sure you want to delete this sale of <span className="font-bold text-gray-900 dark:text-gray-200">{saleToDelete.productName}</span>? This action will restore the stock level and cannot be undone.
              </p>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={confirmDelete}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95"
                >
                  Yes, Delete Sale
                </button>
                <button
                  onClick={() => setSaleToDelete(null)}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="absolute top-3 right-3">
              <button 
                onClick={() => setSaleToDelete(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};