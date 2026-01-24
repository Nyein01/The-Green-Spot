import React, { useState } from 'react';
import { DayReport } from '../types';
import { formatCurrency } from '../utils/pricing';
import { Calendar, ChevronDown, ChevronRight, RotateCcw, Trash2, Search, UserCircle2, Loader2, AlertCircle, X } from 'lucide-react';

interface ArchiveViewProps {
  reports: DayReport[];
  onRestore: (report: DayReport) => void;
  onDelete: (reportId: string) => Promise<void>;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ reports, onRestore, onDelete }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const filteredReports = reports.filter(r => {
    const searchLower = searchQuery.toLowerCase();
    return (
        r.date.includes(searchQuery) || 
        r.sales.some(s => s.productName.toLowerCase().includes(searchLower)) ||
        (r.closedBy && r.closedBy.toLowerCase().includes(searchLower))
    );
  });

  const handleDeleteClick = (e: React.MouseEvent, reportId: string) => {
    // Critical: Stop the click from bubbling up to the card expand toggle
    e.stopPropagation(); 
    e.preventDefault();
    setReportToDelete(reportId);
  };

  const confirmDelete = async () => {
    if (!reportToDelete) return;
    
    setIsDeleting(reportToDelete);
    try {
        await onDelete(reportToDelete);
    } catch (error) {
        console.error("Delete failed", error);
    } finally {
        setIsDeleting(null);
        setReportToDelete(null);
    }
  };

  const handleRestore = (e: React.MouseEvent, report: DayReport) => {
      e.stopPropagation();
      onRestore(report);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Sales Archive</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">View and manage past daily reports</p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search date, product, or staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all dark:text-white"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredReports.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-12 rounded-2xl text-center border-2 border-dashed border-gray-100 dark:border-gray-700">
            <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No archived reports found.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div 
              key={report.id} 
              className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all duration-300 ${
                expandedId === report.id 
                  ? 'border-green-500 ring-4 ring-green-500/5 shadow-xl' 
                  : 'border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md'
              }`}
            >
              <div 
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none"
                onClick={() => toggleExpand(report.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl transition-colors ${expandedId === report.id ? 'bg-green-500 text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-col sm:flex-row sm:items-center mt-1 gap-1 sm:gap-3">
                      <div className="flex items-center">
                          <span className="font-mono font-bold text-green-600 dark:text-green-400 mr-2">{formatCurrency(report.totalRevenue)}</span>
                          • {report.totalSales} Transactions
                      </div>
                      {report.closedBy && (
                          <div className="flex items-center bg-gray-100 dark:bg-gray-700/50 px-2 py-0.5 rounded-full w-fit">
                              <UserCircle2 className="w-3 h-3 mr-1.5 text-gray-400" />
                              <span className="font-medium text-gray-700 dark:text-gray-300">Shift: {report.closedBy}</span>
                          </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    type="button"
                    onClick={(e) => handleRestore(e, report)}
                    className="hidden sm:flex items-center px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors z-10"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore
                  </button>
                  {expandedId === report.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {expandedId === report.id && (
                <div className="border-t border-gray-50 dark:border-gray-700 animate-in slide-in-from-top-2 duration-200">
                  <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Transaction Details</h4>
                        <div className="flex space-x-2">
                            <button 
                              type="button"
                              onClick={(e) => handleRestore(e, report)}
                              className="sm:hidden flex items-center px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"
                            >
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore
                            </button>
                            <button 
                              type="button"
                              onClick={(e) => handleDeleteClick(e, report.id)}
                              disabled={isDeleting === report.id}
                              className={`flex items-center px-3 py-1.5 text-xs font-bold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors ${isDeleting === report.id ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                {isDeleting === report.id ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-3.5 h-3.5 mr-1.5" /> 
                                        Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                      {report.sales.map((sale) => (
                        <div key={sale.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{sale.productName}</p>
                            <div className="flex items-center text-[10px] text-gray-400 dark:text-gray-500 uppercase mt-0.5">
                              {sale.quantity}{sale.productType === 'Flower' ? 'g' : ' units'} • {sale.grade || 'No Grade'}
                              {sale.staffName && <span className="ml-2 pl-2 border-l border-gray-200 dark:border-gray-600">Sold by: {sale.staffName.split(' ')[0]}</span>}
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
          ))
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {reportToDelete && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setReportToDelete(null)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-modal border border-gray-100 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-full mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">Delete Report?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-6">
                Are you sure you want to permanently delete this daily report? This action cannot be undone.
              </p>
              
              <div className="flex flex-col space-y-3">
                <button
                  onClick={confirmDelete}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 dark:shadow-none transition-all active:scale-95"
                >
                  Yes, Delete Report
                </button>
                <button
                  onClick={() => setReportToDelete(null)}
                  className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
            <div className="absolute top-3 right-3">
              <button 
                onClick={() => setReportToDelete(null)}
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