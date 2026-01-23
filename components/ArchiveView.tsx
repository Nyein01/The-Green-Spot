import React, { useState } from 'react';
import { DayReport } from '../types';
import { formatCurrency } from '../utils/pricing';
import { Calendar, ChevronDown, ChevronRight, RotateCcw, Trash2, Search } from 'lucide-react';

interface ArchiveViewProps {
  reports: DayReport[];
  onRestore: (report: DayReport) => void;
  onDelete: (reportId: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ reports, onRestore, onDelete }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredReports = reports.filter(r => 
    r.date.includes(searchQuery) || 
    r.sales.some(s => s.productName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    if (confirm('Permanently delete this report? This action cannot be undone.')) {
        setIsDeleting(reportId);
        try {
            await onDelete(reportId);
        } finally {
            setIsDeleting(null);
        }
    }
  };

  const handleRestore = (e: React.MouseEvent, report: DayReport) => {
      e.stopPropagation();
      onRestore(report);
  };

  return (
    <div className="space-y-4 pb-12">
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
            placeholder="Search date or product..."
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
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl transition-colors ${expandedId === report.id ? 'bg-green-500 text-white' : 'bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{new Date(report.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                      <span className="font-mono font-bold text-green-600 dark:text-green-400 mr-2">{formatCurrency(report.totalRevenue)}</span>
                      • {report.totalSales} Transactions
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    type="button"
                    onClick={(e) => handleRestore(e, report)}
                    className="hidden sm:flex items-center px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore
                  </button>
                  {expandedId === report.id ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </div>
              </div>

              {expandedId === report.id && (
                <div className="border-t border-gray-50 dark:border-gray-700 animate-fade-in">
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
                              onClick={(e) => handleDelete(e, report.id)}
                              disabled={isDeleting === report.id}
                              className={`flex items-center px-3 py-1.5 text-xs font-bold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors ${isDeleting === report.id ? 'opacity-50 cursor-wait' : ''}`}
                            >
                                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> 
                                {isDeleting === report.id ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                      {report.sales.map((sale) => (
                        <div key={sale.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{sale.productName}</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">
                              {sale.quantity}{sale.productType === 'Flower' ? 'g' : ' units'} • {sale.grade || 'No Grade'}
                            </p>
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
    </div>
  );
};