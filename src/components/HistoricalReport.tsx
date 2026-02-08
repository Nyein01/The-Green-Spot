
import React, { useMemo } from 'react';
import { InventoryItem, DayReport } from '../types';
import { formatCurrency } from '../utils/pricing';
import { 
  TrendingUp, 
  Award, 
  Calendar, 
  Package,
  Archive,
  BarChart3,
  PieChart
} from 'lucide-react';

interface HistoricalReportProps {
  archivedReports: DayReport[];
  inventory: InventoryItem[];
  timeframe: 'weekly' | 'monthly';
  shopName: string;
}

// Simple Bar Chart Component (CSS only)
const SimpleBarChart = ({ data, color }: { data: { label: string; value: number }[]; color: string }) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div className="flex items-end space-x-2 h-40 w-full pt-4">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                    <div className="w-full relative flex-1 flex items-end bg-gray-50 dark:bg-gray-700/30 rounded-t-sm overflow-hidden">
                         <div 
                           style={{ height: `${(d.value / maxVal) * 100}%` }}
                           className={`w-full bg-${color}-500 opacity-80 group-hover:opacity-100 transition-all duration-500 rounded-t-sm`}
                         ></div>
                         {/* Tooltip */}
                         <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-gray-900 text-white px-1.5 py-0.5 rounded pointer-events-none">
                            {d.value}
                         </div>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-2 font-mono uppercase truncate w-full text-center">{d.label}</span>
                </div>
            ))}
        </div>
    );
};

export const HistoricalReport: React.FC<HistoricalReportProps> = ({ archivedReports, inventory, timeframe, shopName }) => {
  
  // STRICTLY use Archived Sales from Reports (Closed Shifts)
  const allSales = useMemo(() => {
      return archivedReports.flatMap(report => report.sales);
  }, [archivedReports]);

  // Filter sales based on timeframe
  const { filteredSales, chartData } = useMemo(() => {
    const now = new Date();
    const startOfPeriod = new Date();
    const cData: { label: string; value: number }[] = [];
    
    if (timeframe === 'weekly') {
      // Last 7 Days
      startOfPeriod.setDate(now.getDate() - 6);
      startOfPeriod.setHours(0, 0, 0, 0);

      // Generate labels for last 7 days
      for (let i = 0; i < 7; i++) {
          const d = new Date(startOfPeriod);
          d.setDate(d.getDate() + i);
          cData.push({ 
              label: d.toLocaleDateString('en-US', { weekday: 'short' }), 
              value: 0 
          });
      }
    } else {
      // Current month
      startOfPeriod.setDate(1);
      startOfPeriod.setHours(0, 0, 0, 0);
      
      // Generate weeks (approx)
      cData.push({ label: 'W1', value: 0 }, { label: 'W2', value: 0 }, { label: 'W3', value: 0 }, { label: 'W4', value: 0 });
    }

    const filtered = allSales.filter(s => s.timestamp >= startOfPeriod.getTime());

    // Populate chart data
    filtered.forEach(s => {
        const d = new Date(s.timestamp);
        if (timeframe === 'weekly') {
            const dayIndex = Math.floor((s.timestamp - startOfPeriod.getTime()) / (1000 * 60 * 60 * 24));
            if (cData[dayIndex]) cData[dayIndex].value += s.price;
        } else {
            const weekIndex = Math.floor((d.getDate() - 1) / 7);
            if (cData[weekIndex]) cData[weekIndex].value += s.price;
        }
    });

    return { filteredSales: filtered, chartData: cData };
  }, [allSales, timeframe]);

  // Calculations
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.price, 0);
  const totalTransactions = filteredSales.length;
  const avgTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  
  const categoryStats = useMemo(() => {
     const stats = filteredSales.reduce((acc, curr) => {
         acc[curr.productType] = (acc[curr.productType] || 0) + curr.price;
         return acc;
     }, {} as Record<string, number>);
     const total = Object.values(stats).reduce((a, b) => a + b, 0);
     return Object.entries(stats).map(([type, val]) => ({ type, val, pct: total ? (val / total) * 100 : 0 }));
  }, [filteredSales]);

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

    return (Object.values(stats) as { name: string; qty: number; revenue: number; type: string; grade?: string }[]).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [filteredSales]);

  const periodLabel = timeframe === 'weekly' ? 'Last 7 Days' : 'This Month';
  const accentColor = timeframe === 'weekly' ? 'indigo' : 'purple';

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
             {timeframe === 'weekly' ? <TrendingUp className="w-6 h-6 mr-2 text-indigo-500" /> : <Calendar className="w-6 h-6 mr-2 text-purple-500" />}
             {timeframe === 'weekly' ? 'Weekly Dashboard' : 'Monthly Dashboard'}
          </h2>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-3 py-1 rounded-full flex items-center">
             <Archive className="w-3 h-3 mr-1" />
             Source: Archived Reports
          </span>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" /> Revenue Trend
                </h3>
                <span className={`text-xs font-bold text-${accentColor}-500 bg-${accentColor}-50 dark:bg-${accentColor}-900/30 px-2 py-0.5 rounded`}>{periodLabel}</span>
             </div>
             <SimpleBarChart data={chartData} color={accentColor} />
          </div>

          {/* Category Distribution */}
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center">
                    <PieChart className="w-4 h-4 mr-2" /> Distribution
                </h3>
             </div>
             <div className="space-y-4">
                {categoryStats.sort((a,b) => b.val - a.val).map(stat => (
                    <div key={stat.type}>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 dark:text-gray-300">{stat.type}</span>
                            <span className="font-bold">{Math.round(stat.pct)}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div 
                                style={{ width: `${stat.pct}%` }} 
                                className={`h-full rounded-full ${stat.type === 'Flower' ? 'bg-green-500' : stat.type === 'Accessory' ? 'bg-blue-500' : 'bg-orange-500'}`}
                            ></div>
                        </div>
                    </div>
                ))}
                {categoryStats.length === 0 && <p className="text-xs text-gray-400 italic text-center py-4">No data yet</p>}
             </div>
          </div>
      </div>

      {/* KPI Cards */}
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
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Ticket</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">
              {formatCurrency(avgTicket)}
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

      {/* Best Sellers List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden w-full">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/30">
        <h3 className="font-bold text-gray-800 dark:text-white flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-500" />
            Top Products ({periodLabel})
        </h3>
        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold uppercase">Performance Leaders</span>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700">
        {bestSellers.length === 0 ? (
            <div className="p-12 text-center text-gray-400 italic">No archived sales data for this period.</div>
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
    </div>
  );
};
