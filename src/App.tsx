import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  Package, 
  FileText, 
  Cloud, 
  Menu,
  X,
  Leaf,
  Moon,
  Sun,
  Database,
  Wifi,
  WifiOff,
  Store,
  LogOut,
  TrendingUp,
  BarChart3,
  Library,
  Archive,
  Loader2
} from 'lucide-react';
import { LoginForm } from './components/LoginForm';
import { SalesForm } from './components/SalesForm';
import { InventoryManager } from './components/InventoryManager';
import { DailyReport } from './components/DailyReport';
import { HistoricalReport } from './components/HistoricalReport';
import { ArchiveView } from './components/ArchiveView';
import { 
  subscribeToSales, 
  subscribeToInventory,
  subscribeToReports,
  addSaleToCloud,
  updateInventoryInCloud,
  adjustStockInCloud,
  deleteSaleFromCloud,
  clearSalesInCloud,
  migrateLocalToCloud,
  seedDefaultInventory
} from './services/storageService';
import { SaleItem, InventoryItem, DayReport, Tab } from './types';

type ShopId = 'greenspot' | 'nearcannabis';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SALES);
  const [currentShop, setCurrentShop] = useState<ShopId>('greenspot');
  
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [reports, setReports] = useState<DayReport[]>([]);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const shopNames = {
    greenspot: "The Green Spot",
    nearcannabis: "Near Cannabis"
  };

  useEffect(() => {
    // Check local storage for theme preference on mount
    const savedTheme = localStorage.getItem('greentrack_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeSales = subscribeToSales(currentShop, (data) => setSales(data));
    const unsubscribeInventory = subscribeToInventory(currentShop, (data) => setInventory(data));
    const unsubscribeReports = subscribeToReports(currentShop, (data) => {
        setReports(data);
        setLoading(false);
    });

    return () => {
      unsubscribeSales();
      unsubscribeInventory();
      unsubscribeReports();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentShop, isAuthenticated]);

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('greentrack_theme', newMode ? 'dark' : 'light');
  };

  const handleNewSale = async (sale: SaleItem) => {
    if (!isOnline) return alert("⚠️ You are offline.");
    const success = await addSaleToCloud(currentShop, sale);
    if (!success) return alert("⚠️ Error saving sale.");
    const item = inventory.find(i => i.name === sale.productName);
    if (item) await adjustStockInCloud(currentShop, item.id, item.stockLevel, -sale.quantity);
  };

  const handleDeleteSale = async (sale: SaleItem) => {
    if (!isOnline) return alert("⚠️ You are offline. Cannot delete sales.");
    
    // Immediate feedback
    setDeletingIds(prev => new Set(prev).add(sale.id));
    
    try {
        const success = await deleteSaleFromCloud(currentShop, sale.id);
        if (success) {
            const item = inventory.find(i => i.name === sale.productName);
            if (item) await adjustStockInCloud(currentShop, item.id, item.stockLevel, sale.quantity);
        } else {
            alert("Failed to delete sale from cloud.");
        }
    } catch (error) {
        console.error(error);
        alert("Error deleting sale.");
    } finally {
        setDeletingIds(prev => { const n = new Set(prev); n.delete(sale.id); return n; });
    }
  };

  const handleResetDay = async () => {
    await clearSalesInCloud(currentShop, sales);
  };

  const handleMigrate = async () => {
    if(confirm("This will upload your local storage data to the cloud database. Continue?")) {
        const result = await migrateLocalToCloud();
        alert(result);
    }
  };

  const handleSeed = async () => {
    await seedDefaultInventory(currentShop);
    alert("Default inventory added!");
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSales([]); setInventory([]); setReports([]);
    setCurrentShop('greenspot'); setIsSuperAdmin(false);
  }

  if (!isAuthenticated) return <LoginForm onLogin={(shopId, isAdmin) => { setCurrentShop(shopId); setIsSuperAdmin(isAdmin); setIsAuthenticated(true); }} />;

  const renderContent = () => {
    if (loading) return <div className="flex h-full items-center justify-center text-green-600"><Loader2 className="animate-spin h-10 w-10" /></div>;

    const contentClass = "animate-slide-up";

    switch (activeTab) {
      case Tab.SALES:
        return (
          <div className={`max-w-2xl mx-auto pb-20 ${contentClass}`}>
            <SalesForm inventory={inventory} onSaleComplete={handleNewSale} onStockUpdate={() => {}} />
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 px-1 flex items-center">
                Today's Transactions
                <span className="ml-2 text-xs font-normal bg-green-100 text-green-800 px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">Live</span>
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y dark:divide-gray-700 overflow-hidden">
                {sales.length === 0 && <div className="p-12 text-center text-gray-400">No sales recorded yet today.</div>}
                {sales.map((sale, idx) => (
                  <div key={sale.id} className={`p-4 flex justify-between items-center ${deletingIds.has(sale.id) ? 'opacity-0 scale-95' : 'opacity-100'} transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50`} style={{ animationDelay: `${idx * 50}ms` }}>
                    <div>
                      <div className="font-medium dark:text-gray-200">{sale.productName}</div>
                      <div className="text-xs text-gray-500">{new Date(sale.timestamp).toLocaleTimeString()} • {sale.quantity} {sale.productType === 'Flower' ? 'g' : 'units'}</div>
                    </div>
                    <div className="font-bold text-green-600">+{sale.price} ฿</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case Tab.INVENTORY:
        return <div className={contentClass}><InventoryManager inventory={inventory} onUpdateInventory={(item) => updateInventoryInCloud(currentShop, item)} onAdjustStock={(id, adj) => { const item = inventory.find(i => i.id === id); if(item) adjustStockInCloud(currentShop, id, item.stockLevel, adj); }} onDeleteInventory={() => {}} shopName={shopNames[currentShop]} /></div>;
      case Tab.REPORT:
        return <div className={contentClass}><DailyReport sales={sales} inventory={inventory} onDeleteSale={handleDeleteSale} onReset={handleResetDay} deletingIds={deletingIds} shopName={shopNames[currentShop]} /></div>;
      case Tab.ARCHIVE:
        return <div className={contentClass}><ArchiveView reports={reports} /></div>;
      case Tab.WEEKLY:
        return <div className={contentClass}><HistoricalReport sales={sales} inventory={inventory} timeframe="weekly" shopName={shopNames[currentShop]} /></div>;
      case Tab.MONTHLY:
        return <div className={contentClass}><HistoricalReport sales={sales} inventory={inventory} timeframe="monthly" shopName={shopNames[currentShop]} /></div>;
      case Tab.SETTINGS:
        return (
          <div className={`max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm pb-20 dark:border-gray-700 border ${contentClass}`}>
            <h2 className="text-xl font-bold mb-6 dark:text-white">System Settings</h2>
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border transition-all duration-500 ${
                isOnline 
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' 
                  : 'bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:border-orange-800'
              }`}>
                <div className={`flex items-center font-bold mb-2 ${
                    isOnline 
                    ? 'text-blue-900 dark:text-blue-100' 
                    : 'text-orange-900 dark:text-orange-100'
                }`}>
                    {isOnline ? <Wifi className="w-5 h-5 mr-2" /> : <WifiOff className="w-5 h-5 mr-2" />} 
                    Status: {isOnline ? 'Connected' : 'Offline'}
                </div>
                <p className={`text-xs ${
                    isOnline 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-orange-700 dark:text-orange-300'
                }`}>
                    {isOnline ? 'All data is syncing live with Google Cloud.' : 'Data restoration is disabled while offline.'}
                </p>
              </div>
              
              <button 
                  onClick={handleMigrate} 
                  className="group w-full flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-300 transition-all text-gray-700 dark:text-gray-200"
              >
                  <Cloud className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Migrate Local Data
              </button>

              {inventory.length === 0 && (
                  <button 
                    onClick={handleSeed} 
                    className="group w-full flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-700 hover:text-green-700 dark:hover:text-green-300 transition-all text-gray-700 dark:text-gray-200"
                  >
                      <Database className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> Seed Starter Data
                  </button>
              )}
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <style>{`
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-up {
          animation: slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
      <div className="h-screen w-full bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
        <div className="md:hidden bg-white dark:bg-gray-800 p-4 shadow-sm flex justify-between items-center z-20 border-b dark:border-gray-700">
          <div className="flex items-center"><Leaf className="w-6 h-6 text-green-600 mr-2" /><span className="font-bold text-lg dark:text-white">{shopNames[currentShop]}</span></div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">{isMobileMenuOpen ? <X /> : <Menu />}</button>
        </div>

        <nav className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform w-72 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col justify-between border-r dark:border-gray-700 overflow-y-auto duration-300 ease-in-out`}>
          <div>
            <div className="p-6 hidden md:block">
              <div className="flex items-center mb-1 group">
                  <Leaf className="w-8 h-8 text-green-600 mr-2 group-hover:rotate-12 transition-transform duration-300" />
                  <h1 className="text-2xl font-black text-green-600 tracking-tight">{shopNames[currentShop]}</h1>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold pl-1">Cloud POS v3.1</p>
            </div>
            {isSuperAdmin && <div className="px-4 mb-4"><select value={currentShop} onChange={(e) => setCurrentShop(e.target.value as ShopId)} className="w-full p-2.5 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"><option value="greenspot">The Green Spot</option><option value="nearcannabis">Near Cannabis</option></select></div>}
            
            <div className="px-4 space-y-1 mt-4">
              {[
                { t: Tab.SALES, i: <PlusCircle className="w-5 h-5 mr-3" /> },
                { t: Tab.INVENTORY, i: <Package className="w-5 h-5 mr-3" /> },
                { t: Tab.REPORT, i: <FileText className="w-5 h-5 mr-3" /> },
                { t: Tab.ARCHIVE, i: <Archive className="w-5 h-5 mr-3" /> },
              ].map(item => (
                <button key={item.t} onClick={() => { setActiveTab(item.t); setIsMobileMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${activeTab === item.t ? 'bg-green-600 text-white shadow-lg shadow-green-200 dark:shadow-none font-bold scale-105' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{item.i}{item.t}</button>
              ))}
              <div className="pt-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Analytics</div>
              {[
                { t: Tab.WEEKLY, i: <TrendingUp className="w-5 h-5 mr-3" /> },
                { t: Tab.MONTHLY, i: <BarChart3 className="w-5 h-5 mr-3" /> },
                { t: Tab.SETTINGS, i: <Cloud className="w-5 h-5 mr-3" /> },
              ].map(item => (
                <button key={item.t} onClick={() => { setActiveTab(item.t); setIsMobileMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${activeTab === item.t ? 'bg-indigo-600 text-white font-bold scale-105' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{item.i}{item.t}</button>
              ))}
            </div>
          </div>
          <div className="p-4 border-t dark:border-gray-700 space-y-3">
            <button onClick={toggleDarkMode} className="w-full flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{isDarkMode ? <Sun className="w-5 h-5 mr-2" /> : <Moon className="w-5 h-5 mr-2" />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}</button>
            <button onClick={handleLogout} className="w-full flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors"><LogOut className="w-4 h-4 mr-2" /> Log Out</button>
            <div className="bg-green-900 rounded-xl p-4 text-white text-center shadow-lg transform transition-transform hover:scale-105"><p className="text-[10px] font-bold uppercase opacity-60 mb-1">Daily Total</p><p className="text-2xl font-black">{sales.reduce((a, b) => a + b.price, 0).toLocaleString()} ฿</p></div>
          </div>
        </nav>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-gray-50 dark:bg-gray-900 transition-colors duration-300">{renderContent()}</main>
        {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>}
      </div>
    </div>
  );
};

export default App;