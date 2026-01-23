import React, { useState } from 'react';
import { DayReport, ProductType } from '../types';
import { formatCurrency } from '../utils/pricing';
import { Calendar, ChevronDown, ChevronRight, Search, Download, Leaf, BarChart3 } from 'lucide-react';
import { jsPDF } from "jspdf";

interface ArchiveViewProps {
  reports: DayReport[];
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ reports }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredReports = reports.filter(r => {
    const query = searchQuery.toLowerCase();
    const formattedDate = new Date(r.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).toLowerCase();
    
    return (
      r.date.includes(query) || 
      formattedDate.includes(query) ||
      r.sales.some(s => s.productName.toLowerCase().includes(query))
    );
  });

  const getDayStats = (report: DayReport) => {
    const avgTicket = report.totalSales > 0 ? report.totalRevenue / report.totalSales : 0;
    
    // Find Best Seller
    const salesCounts: Record<string, number> = {};
    report.sales.forEach(s => { salesCounts[s.productName] = (salesCounts[s.productName] || 0) + s.quantity; });
    const bestSeller = Object.entries(salesCounts).sort((a, b) => b[1] - a[1])[0];

    // Category Breakdown
    const catRevenue: Record<string, number> = {};
    report.sales.forEach(s => { catRevenue[s.productType] = (catRevenue[s.productType] || 0) + s.price; });
    
    // Sort categories by revenue
    const sortedCats = Object.entries(catRevenue)
        .sort((a, b) => b[1] - a[1])
        .map(([type, amount]) => ({
            type: type as ProductType,
            amount,
            percentage: (amount / report.totalRevenue) * 100
        }));

    return { avgTicket, bestSeller, sortedCats };
  };

  const handleReprintPDF = (e: React.MouseEvent, report: DayReport) => {
    e.stopPropagation();
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Daily Sales Report", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(new Date(report.date).toDateString(), 105, 22, { align: "center" });
    
    doc.setDrawColor(200);
    doc.line(10, 25, 200, 25);

    doc.setFontSize(12);
    doc.text(`Total Revenue: ${formatCurrency(report.totalRevenue)}`, 15, 35);
    doc.text(`Transactions: ${report.totalSales}`, 15, 42);
    doc.text(`Items Sold: ${report.itemsSold}`, 15, 49);

    let y = 60;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Item", 15, y);
    doc.text("Type", 90, y);
    doc.text("Qty", 130, y);
    doc.text("Price", 170, y);
    doc.setFont("helvetica", "normal");
    
    y += 5;
    doc.line(15, y, 195, y);
    y += 7;

    report.sales.forEach((sale) => {
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
        doc.text(sale.productName, 15, y);
        doc.text(sale.productType, 90, y);
        doc.text(`${sale.quantity}`, 130, y);
        doc.text(`${sale.price}`, 170, y);
        y += 7;
    });

    doc.save(`Archive_${report.date}.pdf`);
  };

  const getCategoryColor = (type: string) => {
      switch(type) {
          case 'Flower': return 'bg-green-500';
          case 'Edible': return 'bg-pink-500';
          case 'Pre-roll': return 'bg-orange-500';
          case 'Accessory': return 'bg-blue-500';
          default: return 'bg-gray-500';
      }
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            Sales Archive
            <span className="ml-3 text-xs font-normal bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full dark:bg-gray-700 dark:text-gray-400">{filteredReports.length} records</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Secure history of past business days</p>
        </div>
        
        <div className="relative w-full sm:w-64 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-hover:text-green-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white hover:border-green-300 dark:hover:border-green-700"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl text-center border-2 border-dashed border-gray-100 dark:border-gray-700 animate-fade-in">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No archived reports found.</p>
          </div>
        ) : (
          filteredReports.map((report, idx) => {
            const stats = getDayStats(report);
            
            return (
                <div 
                  key={report.id} 
                  style={{ animationDelay: `${idx * 75}ms` }}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-300 overflow-hidden animate-slide-up ${
                    expandedId === report.id 
                      ? 'border-green-500 ring-4 ring-green-500/5 shadow-xl scale-[1.01]' 
                      : 'border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-green-200 dark:hover:border-green-800 hover:-translate-y-0.5'
                  }`}
                >
                  {/* Header Row */}
                  <div 
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer"
                    onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl transition-colors duration-300 ${expandedId === report.id ? 'bg-green-500 text-white rotate-3 scale-110 shadow-lg shadow-green-200 dark:shadow-none' : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                        <div className="flex items-center space-x-2 text-xs mt-1">
                             <span className="font-mono font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 rounded">{formatCurrency(report.totalRevenue)}</span>
                             <span className="text-gray-300">•</span>
                             <span className="text-gray-500 dark:text-gray-400">{report.totalSales} Orders</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={(e) => handleReprintPDF(e, report)}
                        className="hidden sm:flex items-center px-3 py-1.5 text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                        title="Reprint Report PDF"
                      >
                         <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
                      </button>
                      <div className={`transition-transform duration-300 ${expandedId === report.id ? 'rotate-180' : ''}`}>
                         <ChevronDown className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Dashboard */}
                  {expandedId === report.id && (
                    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-5 animate-fade-in origin-top">
                        
                        {/* 1. Key Metrics Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-transform hover:scale-105 duration-300">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Avg. Ticket</p>
                                <p className="text-lg font-black text-gray-800 dark:text-gray-100">{formatCurrency(stats.avgTicket)}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-transform hover:scale-105 duration-300 delay-75">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Top Strain</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate" title={stats.bestSeller?.[0]}>
                                    {stats.bestSeller ? stats.bestSeller[0] : 'N/A'}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm transition-transform hover:scale-105 duration-300 delay-100">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Top Category</p>
                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                                    {stats.sortedCats.length > 0 ? stats.sortedCats[0].type : 'N/A'}
                                </p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-center transition-transform hover:scale-105 duration-300 delay-150">
                                <button 
                                  onClick={(e) => handleReprintPDF(e, report)}
                                  className="w-full h-full flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                >
                                    <Download className="w-5 h-5 mb-1" />
                                    <span className="text-xs font-bold">Reprint PDF</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. Category Breakdown Bars */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-xs font-bold uppercase text-gray-500">Revenue Breakdown</h4>
                            </div>
                            <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 w-full">
                                {stats.sortedCats.map((cat, idx) => (
                                    <div 
                                        key={cat.type}
                                        className={`${getCategoryColor(cat.type)}`}
                                        style={{ width: `${cat.percentage}%` }}
                                        title={`${cat.type}: ${cat.percentage.toFixed(1)}%`}
                                    />
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-2">
                                {stats.sortedCats.map(cat => (
                                    <div key={cat.type} className="flex items-center text-xs">
                                        <div className={`w-2 h-2 rounded-full mr-1.5 ${getCategoryColor(cat.type)}`}></div>
                                        <span className="text-gray-600 dark:text-gray-400 font-medium">{cat.type}</span>
                                        <span className="ml-1 text-gray-400">({cat.percentage.toFixed(0)}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 3. Detailed List Toggle */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                             <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                                 <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Transaction History</h4>
                             </div>
                             <div className="max-h-60 overflow-y-auto p-2 scrollbar-hide">
                                {report.sales.map((sale) => (
                                    <div key={sale.id} className="flex justify-between items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                                    <div className="flex items-center">
                                        <div className="mr-3">
                                            {sale.productType === 'Flower' ? <Leaf className="w-4 h-4 text-green-500" /> : <BarChart3 className="w-4 h-4 text-gray-400" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{sale.productName}</p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">
                                            {sale.quantity}{sale.productType === 'Flower' ? 'g' : ' units'} • {sale.grade || '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-gray-900 dark:text-white">{formatCurrency(sale.price)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                  )}
                </div>
            );
          })
        )}
      </div>
    </div>
  );
};