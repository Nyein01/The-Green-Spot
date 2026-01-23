import React, { useState, useMemo } from 'react';
import { SaleItem, InventoryItem } from '../types';
import { formatCurrency } from '../utils/pricing';
import { generateSalesAnalysis } from '../services/geminiService';
import { 
  TrendingUp, 
  Award, 
  BarChart3, 
  Calendar, 
  Wand2, 
  Loader2, 
  Package, 
  ArrowUpRight,
  ChevronRight
} from 'lucide-react';

interface HistoricalReportProps {
  sales: SaleItem[];
  inventory: InventoryItem[];
  timeframe: 'weekly' | 'monthly';
  shopName: string;
}

export const HistoricalReport: React.FC<HistoricalReportProps> = ({ sales, inventory, timeframe, shopName }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Filter sales based on timeframe
  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfPeriod = new Date();
    
    if (timeframe === 'weekly') {
      // Current week (starting Sunday)
      startOfPeriod.setDate(now.getDate() - now.getDay());
      startOfPeriod.setHours(0, 0, 0, 0);
    } else {
      // Current month
      startOfPeriod.setDate(1);
      startOfPeriod.setHours(0, 0, 0, 0);
    }

    return sales.filter(s => s.timestamp >= startOfPeriod.getTime());
  }, [sales, timeframe]);

  // Calculations
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.price, 0);
  const totalTransactions = filteredSales.length;
  
  const bestSellers = useMemo(() => {
    const stats = filteredSales.reduce((acc, curr) => {
      if (!acc[curr.productName]) {
        acc[curr.productName] = { 
          name: curr.productName, 
          qty: 0, 
          revenue: 0, 
          type: curr.productType,
          grade: curr.grade
        };
      }
      acc[curr.productName].qty += curr.quantity;
      acc[curr.productName].revenue += curr.price;
      return acc;
    }, {} as Record<string, { name: string; qty: number; revenue: number; type: string; grade?: string }>);

    return (Object.values(stats) as { name: string; qty: number; revenue: number; type: string; grade?: string }[]).sort((a, b) => b.qty - a.qty).slice(0, 6);
  }, [filteredSales]);

  const handleGenerateInsight = async () => {
    setLoadingAi(true);
    const result = await generateSalesAnalysis(filteredSales, inventory, timeframe);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const periodLabel = timeframe === 'weekly' ? 'This Week' : 'This Month';
  const accentColor = timeframe === 'weekly' ? 'indigo' : 'purple';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-4 border-${accentColor}-500 flex items-center`}>
          <div className={`p-3 bg-${accentColor}-50 dark:bg-${accentColor}-900/20 rounded-xl mr-4`}>
            <TrendingUp className={`w-6 h-6 text-${accentColor}-600 dark:text-${accentColor}-400`} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-4 border-green-500 flex items-center">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl mr-4">
            <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Volume</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {filteredSales.reduce((sum, s) => sum + s.quantity, 0).toFixed(1)} <span className="text-sm font-normal text-gray-400">units/g</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-4 border-blue-500 flex items-center">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mr-4">
            <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transactions</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{totalTransactions}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Sellers List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-500" />
              Best Selling Products ({periodLabel})
            </h3>
            <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold uppercase">Performance Leader</span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {bestSellers.length === 0 ? (
              <div className="p-12 text-center text-gray-400 italic">No sales data for this period.</div>
            ) : (
              bestSellers.map((item, idx) => (
                <div key={item.name} className="p-4 flex items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm mr-4 ${idx === 0 ? 'bg-yellow-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-900 dark:text-white">{item.name}</h4>
                      <p className="text-sm font-bold text-green-600">{formatCurrency(item.revenue)}</p>
                    </div>
                    <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span className="bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded mr-2">{item.type}</span>
                      {item.grade && <span className="mr-2">• {item.grade}</span>}
                      <span>{item.qty.toFixed(1)} {item.type === 'Flower' ? 'g' : 'units'} sold</span>
                    </div>
                    {/* Tiny Progress Bar */}
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div 
                        className={`h-full bg-${accentColor}-500 rounded-full transition-all duration-1000`} 
                        style={{ width: `${(item.qty / bestSellers[0].qty) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Insight Section */}
        <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-${accentColor}-100 dark:border-${accentColor}-900/30 overflow-hidden relative`}>
          <div className={`absolute top-0 right-0 w-32 h-32 bg-${accentColor}-50 dark:bg-${accentColor}-900/20 rounded-bl-full -mr-8 -mt-8 opacity-50`}></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <div className={`p-2 bg-${accentColor}-100 dark:bg-${accentColor}-900/50 rounded-lg mr-3 text-${accentColor}-600 dark:text-${accentColor}-400`}>
                <Wand2 className="w-5 h-5" />
              </div>
              Executive Analysis
            </h3>
            <button
              onClick={handleGenerateInsight}
              disabled={loadingAi || filteredSales.length === 0}
              className={`text-xs px-4 py-2 rounded-full font-semibold transition-all shadow-sm ${
                loadingAi 
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                  : `bg-${accentColor}-600 text-white hover:bg-${accentColor}-700 shadow-${accentColor}-200 shadow-lg active:scale-95`
              }`}
            >
              {loadingAi ? 'Analyzing Trends...' : `Generate ${timeframe === 'weekly' ? 'Weekly' : 'Monthly'} Highlight`}
            </button>
          </div>
          
          <div className="relative z-10 min-h-[300px]">
            {aiAnalysis ? (
              <div className="prose prose-sm prose-indigo dark:prose-invert text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700 animate-fade-in shadow-inner">
                 <div className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{aiAnalysis}</div>
                 <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <p className="text-[10px] text-gray-400 italic">Report generated for {shopName} management</p>
                 </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500 text-sm bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 border-dashed">
                <BarChart3 className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">Unlock deep business insights</p>
                <p className="text-xs mt-1">Get an AI-powered breakdown of your {timeframe} performance.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};