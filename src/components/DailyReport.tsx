import React, { useState } from 'react';
import { SaleItem, InventoryItem } from '../../types';
import { formatCurrency } from '../utils/pricing';
import { generateSalesAnalysis } from '../services/geminiService';
import { RefreshCw, Wand2, Download, Leaf, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface DailyReportProps {
  sales: SaleItem[];
  inventory: InventoryItem[];
  onReset: () => void;
}

export const DailyReport: React.FC<DailyReportProps> = ({ sales, inventory, onReset }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.price, 0);
  const totalItems = sales.length;

  const handleGenerateInsight = async () => {
    setLoadingAi(true);
    const result = await generateSalesAnalysis(sales, inventory);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('receipt-container');
    if (!element) return;

    setDownloadingPdf(true);

    try {
      // We use onclone to expand the scrollable area so the PDF captures the full list
      const canvas = await html2canvas(element, {
        scale: 2, // Higher resolution
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

      // If image is taller than page, we might cut it off in this simple version, 
      // but standard A4 usually fits a daily summary. 
      // For a more robust solution we'd handle multi-page, but single page is best for this UI.
      
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add pages if content spills over (basic implementation)
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`TheGreenSpot_Report_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("Failed to generate PDF");
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="animate-fade-in-up grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Receipt View - Always Keep Light/White for Paper Metaphor and PDF Savings */}
      <div 
        id="receipt-container"
        className="bg-white p-4 sm:p-8 rounded-none sm:rounded-xl shadow-xl border-t-8 border-green-600 font-mono text-sm relative transition-all duration-300 hover:shadow-2xl"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
               <Leaf className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-800 uppercase tracking-widest mb-1">The Green Spot</h2>
          <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase">Premium Dispensary System</p>
          <div className="mt-6 border-b border-dashed border-gray-200 pb-4">
             <p className="text-gray-400 text-[10px] uppercase mb-1">Date of Report</p>
             <p className="text-gray-700 font-bold text-base">{new Date().toLocaleDateString()} <span className="text-gray-400 font-normal">|</span> {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-3 border-b border-gray-200 pb-2 tracking-wider">
            <span>Item Description</span>
            <span>Amount</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 receipt-scroll text-gray-800">
            {sales.length === 0 ? (
              <div className="text-center py-10 text-gray-400 italic bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                No transactions recorded yet.
              </div>
            ) : (
              sales.map((sale, idx) => (
                <div key={sale.id} className="flex justify-between items-start group hover:bg-gray-50 p-2 rounded transition-colors -mx-2">
                  <div className="flex items-start">
                    <span className="text-gray-300 mr-3 text-xs w-4 font-mono">{idx + 1}.</span>
                    <div>
                      <div className="font-bold text-gray-800 text-base">{sale.productName}</div>
                      <div className="text-xs text-gray-500 flex items-center mt-0.5">
                        <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px]">
                          {sale.quantity}{sale.productType === 'Flower' ? 'g' : ' units'}
                        </span>
                        {sale.grade && <span className="mx-1 text-gray-400">•</span>}
                        {sale.grade && <span className="text-gray-500">{sale.grade}</span>}
                        {sale.isNegotiated && <span className="ml-2 text-blue-600 text-[10px] bg-blue-50 px-1.5 py-0.5 rounded font-medium border border-blue-100">Adjusted</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-gray-900 font-bold">{formatCurrency(sale.price)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t-2 border-dashed border-gray-300">
          <div className="flex justify-between text-gray-500 text-xs uppercase tracking-wide">
            <span>Total Sold Items</span>
            <span className="font-mono">{totalItems}</span>
          </div>
          <div className="flex justify-between items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
            <span className="text-sm font-bold text-gray-600 uppercase tracking-tight flex items-center">
              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
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
        {/* AI Insight Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-900/50 overflow-hidden relative group transition-colors">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg mr-3 text-indigo-600 dark:text-indigo-400">
                <Wand2 className="w-5 h-5" />
              </div>
              AI Insights
            </h3>
            <button
              onClick={handleGenerateInsight}
              disabled={loadingAi || sales.length === 0}
              className={`text-xs px-4 py-2 rounded-full font-semibold transition-all shadow-sm ${
                loadingAi 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-200 hover:shadow-lg active:scale-95'
              }`}
            >
              {loadingAi ? 'Analyzing...' : 'Generate Analysis'}
            </button>
          </div>
          
          <div className="relative z-10 min-h-[120px]">
            {aiAnalysis ? (
              <div className="prose prose-sm prose-indigo dark:prose-invert text-gray-600 dark:text-gray-300 bg-indigo-50/50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 animate-fade-in-up">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{aiAnalysis}</pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-500 text-sm bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 border-dashed">
                <Wand2 className="w-8 h-8 mb-2 opacity-20" />
                <p>Generate a smart summary of today's sales.</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin Actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-red-100 dark:border-red-900/30 relative overflow-hidden transition-colors">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mr-3 text-red-500 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            Danger Zone
          </h3>
          <div className="flex flex-col space-y-3">
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
              className={`group w-full flex items-center justify-center font-medium py-3 rounded-xl transition-all border-2 ${
                  confirmReset 
                  ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                  : 'bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/50 hover:border-red-200'
              }`}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${confirmReset ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
              {confirmReset ? 'Click again to confirm' : 'Reset Sales Data'}
            </button>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center px-4">
              This action will permanently delete all sales records for the current session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};