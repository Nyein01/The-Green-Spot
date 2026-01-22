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
  BarChart3
} from 'lucide-react';
import { LoginForm } from './components/LoginForm';
import { SalesForm } from './components/SalesForm';
import { InventoryManager } from './components/InventoryManager';
import { DailyReport } from './components/DailyReport';
import { HistoricalReport } from './components/HistoricalReport';
import { 
  subscribeToSales, 
  subscribeToInventory,
  addSaleToCloud,
  updateInventoryInCloud,
  adjustStockInCloud,
  deleteSaleFromCloud,
  deleteInventoryItemFromCloud,
  clearSalesInCloud,
  migrateLocalToCloud,
  seedDefaultInventory
} from './services/storageService';
import { SaleItem, InventoryItem, Tab } from './types';

type ShopId = 'greenspot' | 'nearcannabis';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SALES);
  const [currentShop, setCurrentShop] = useState<ShopId>('greenspot');
  
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Animation state for deletions
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Shop display names
  const shopNames = {
    greenspot: "The Green Spot",
    nearcannabis: "Near Cannabis"
  };

  // Data Sync
  useEffect(() => {
    if (!isAuthenticated) return;

    setLoading(true);
    const savedTheme = localStorage.getItem('greentrack_theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    } else if (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const localSales = localStorage.getItem('greentrack_sales');
    const localInv = localStorage.getItem('greentrack_inventory');
    if ((localSales && localSales !== '[]') || (localInv && localInv !== '[]')) {
      setHasLocalData(true);
    }

    const unsubscribeSales = subscribeToSales(currentShop, (data) => {
      setSales(data);
    });

    const unsubscribeInventory = subscribeToInventory(currentShop, (data) => {
      setInventory(data);
      setLoading(false);
    });

    return () => {
      unsubscribeSales();
      unsubscribeInventory();
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
    if (!isOnline) {
      alert("⚠️ You are offline. Sales cannot be saved to the cloud right now.");
      return;
    }
    const success = await addSaleToCloud(currentShop, sale);
    
    if (!success) {
      alert("⚠️ Error saving sale to cloud. Check your internet connection.");
      return;
    }
    
    const item = inventory.find(i => i.name === sale.productName);
    if (item) {
        await adjustStockInCloud(currentShop, item.id, item.stockLevel, -sale.quantity);
    }
  };

  const handleDeleteSale = async (sale: SaleItem) => {
    // Confirmation is now handled by the UI component for better UX
    setDeletingIds(prev => {
        const next = new Set(prev);
        next.add(sale.id);
        return next;
    });

    setTimeout(async () => {
        await deleteSaleFromCloud(currentShop, sale.id);
        const item = inventory.find(i => i.name === sale.productName);
        if (item) {
             await adjustStockInCloud(currentShop, item.id, item.stockLevel, sale.quantity);
        }
        setDeletingIds(prev => {
            const next = new Set(prev);
            next.delete(sale.id);
            return next;
        });
    }, 400);
  };

  const handleUpdateInventory = async (item: InventoryItem) => {
    await updateInventoryInCloud(currentShop, item);
  };

  const handleAdjustStock = async (id: string, adjustment: number) => {
    const item = inventory.find(i => i.id === id);
    if(item) {
        await adjustStockInCloud(currentShop, id, item.stockLevel, adjustment);
    }
  };

  const handleResetDay = async () => {
    await clearSalesInCloud(currentShop, sales);
  };

  const handleMigrate = async () => {
    if (currentShop !== 'greenspot') {
        alert("Legacy data migration is only available for 'The Green Spot' shop.");
        return;
    }
    if(confirm("This will upload your OLD offline data to the cloud. \n\nNote: The data you currently see on screen is already in the cloud. This button is only for recovering data from before the cloud update.")) {
        const result = await migrateLocalToCloud();
        alert(result);
        const localSales = localStorage.getItem('greentrack_sales');
        const localInv = localStorage.getItem('greentrack_inventory');
        if ((!localSales || localSales === '[]') && (!localInv || localInv === '[]')) {
            setHasLocalData(false);
        }
    }
  };

  const handleSeed = async () => {
    await seedDefaultInventory(currentShop);
    alert(`Default inventory added to ${shopNames[currentShop]}!`);
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSales([]);
    setInventory([]);
    setCurrentShop('greenspot');
    setIsSuperAdmin(false);
  }

  if (!isAuthenticated) {
      return <LoginForm onLogin={(shopId, isAdmin) => {
          setCurrentShop(shopId);
          setIsSuperAdmin(isAdmin);
          setIsAuthenticated(true);
      }} />;
  }

  const renderContent = () => {
    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-green-600">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <span className="ml-3 font-medium">Loading {shopNames[currentShop]}...</span>
            </div>
        );
    }

    switch (activeTab) {
      case Tab.SALES:
        return (
          <div className="max-w-2xl mx-auto pb-20 md:pb-0">
            <SalesForm 
              inventory={inventory} 
              onSaleComplete={handleNewSale} 
              onStockUpdate={() => {}} 
            />
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 px-1">Recent Transactions</h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y dark:divide-gray-700">
                {sales.length === 0 && <div className="p-4 text-center text-gray-400 dark:text-gray-500">No sales today yet.</div>}
                {sales.slice(0, 5).map(sale => (
                  <div 
                    key={sale.id} 
                    className={`p-4 flex justify-between items-center group transition-all duration-500 ease-in-out transform ${deletingIds.has(sale.id) ? 'opacity-0 translate-x-12 max-h-0 py-0 overflow-hidden' : 'opacity-100 max-h-24'}`}
                  >
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200">{sale.productName}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(sale.timestamp).toLocaleTimeString()} • {sale.quantity} units</div>
                    </div>
                    <div className="font-bold text-green-600 dark:text-green-400">+{sale.price} ฿</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case Tab.INVENTORY:
        return (
          <div className="pb-20 md:pb-0">
            <InventoryManager 
              inventory={inventory} 
              onUpdateInventory={handleUpdateInventory}
              onAdjustStock={handleAdjustStock}
              onDeleteInventory={() => {}} 
            />
          </div>
        );
      case Tab.REPORT:
        return (
          <div className="pb-20 md:pb-0">
            <DailyReport 
              sales={sales} 
              inventory={inventory}
              onReset={handleResetDay}
              onDeleteSale={handleDeleteSale}
              deletingIds={deletingIds}
              shopName={shopNames[currentShop]}
            />
          </div>
        );
      case Tab.WEEKLY:
        return (
          <div className="pb-20 md:pb-0">
            <HistoricalReport 
              sales={sales} 
              inventory={inventory}
              timeframe="weekly"
              shopName={shopNames[currentShop]}
            />
          </div>
        );
      case Tab.MONTHLY:
        return (
          <div className="pb-20 md:pb-0">
            <HistoricalReport 
              sales={sales} 
              inventory={inventory}
              timeframe="monthly"
              shopName={shopNames[currentShop]}
            />
          </div>
        );
      case Tab.SETTINGS:
        return (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm pb-20 md:pb-6 dark:border dark:border-gray-700">
            <h2 className="text-xl font-bold mb-6 dark:text-white">Cloud Settings</h2>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${isOnline ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800'}`}>
                <div className={`flex items-center mb-2 font-bold ${isOnline ? 'text-blue-800 dark:text-blue-300' : 'text-orange-800 dark:text-orange-300'}`}>
                    {isOnline ? <Cloud className="w-5 h-5 mr-2" /> : <WifiOff className="w-5 h-5 mr-2" />}
                    Status: {isOnline ? 'Connected' : 'Offline'}
                </div>
                <p className={`text-xs ${isOnline ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {isOnline 
                      ? "Your data is safely stored in Google Cloud. Changes appear instantly on other devices."
                      : "You are currently offline. Please reconnect to save new sales."}
                </p>
              </div>

              {hasLocalData && currentShop === 'greenspot' && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-100 dark:border-yellow-800">
                  <h4 className="text-sm font-bold text-yellow-800 dark:text-yellow-400 mb-2">Legacy Data Detected</h4>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                    We found data from the old offline version of the app on this device.
                  </p>
                  <button onClick={handleMigrate} className="w-full flex items-center justify-center p-3 bg-white dark:bg-gray-800 rounded border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-400 font-medium hover:bg-yellow-100 dark:hover:bg-gray-700">
                    <Database className="w-4 h-4 mr-2" />
                    Recover & Upload Old Data
                  </button>
                </div>
              )}
              
              {inventory.length === 0 && (
                <button onClick={handleSeed} className="w-full flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                    <Package className="w-5 h-5 mr-3" />
                    Load Default Inventory for {shopNames[currentShop]}
                </button>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''}`}>
      <div className="h-screen w-full bg-gray-100 dark:bg-gray-900 flex flex-col md:flex-row overflow-hidden transition-colors duration-200">
        {/* Mobile Header */}
        <div className="md:hidden bg-white dark:bg-gray-800 p-4 shadow-sm flex justify-between items-center z-20 flex-shrink-0 relative border-b dark:border-gray-700">
          <div className="flex items-center">
            <Leaf className="w-6 h-6 text-green-600 mr-2" />
            <span className="font-bold text-green-700 dark:text-green-500 text-lg">{shopNames[currentShop]}</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Sidebar Navigation (Desktop) & Mobile Menu */}
        <nav className={`
          fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1)
          w-72 bg-white dark:bg-gray-800 shadow-2xl md:shadow-lg z-50 flex flex-col justify-between
          border-r dark:border-gray-700 overflow-y-auto
        `}>
          <div>
            <div className="p-6 hidden md:block">
              <div className="flex items-center mb-2">
                <Leaf className="w-8 h-8 text-green-600 mr-2" />
                <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-400 leading-tight">
                  {shopNames[currentShop]}
                </h1>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 pl-1">POS & Inventory</p>
            </div>

            {isSuperAdmin && (
              <div className="px-4 mb-4">
                  <div className="relative">
                      <select 
                        value={currentShop}
                        onChange={(e) => setCurrentShop(e.target.value as ShopId)}
                        className="w-full appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 px-4 pr-8 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                      >
                        <option value="greenspot">The Green Spot</option>
                        <option value="nearcannabis">Near Cannabis</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-gray-400">
                          <Store className="w-4 h-4" />
                      </div>
                  </div>
                  <p className="text-[10px] text-center text-blue-500 mt-2 font-semibold">Admin Mode</p>
              </div>
            )}
            
            <div className="md:hidden p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span className="font-bold text-xl text-green-700 dark:text-green-500">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X className="text-gray-400 dark:text-gray-500" />
              </button>
            </div>
            
            <div className="px-4 space-y-1 mt-4 md:mt-0">
              <button 
                onClick={() => { setActiveTab(Tab.SALES); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.SALES ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <PlusCircle className="w-5 h-5 mr-3" />
                Sales
              </button>
              <button 
                onClick={() => { setActiveTab(Tab.INVENTORY); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.INVENTORY ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <Package className="w-5 h-5 mr-3" />
                Inventory
              </button>
              
              <div className="pt-4 pb-2">
                <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Reports</p>
                <button 
                  onClick={() => { setActiveTab(Tab.REPORT); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.REPORT ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <FileText className="w-5 h-5 mr-3" />
                  Daily
                </button>
                <button 
                  onClick={() => { setActiveTab(Tab.WEEKLY); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.WEEKLY ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <TrendingUp className="w-5 h-5 mr-3" />
                  Weekly
                </button>
                <button 
                  onClick={() => { setActiveTab(Tab.MONTHLY); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.MONTHLY ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <BarChart3 className="w-5 h-5 mr-3" />
                  Monthly
                </button>
              </div>

              <button 
                onClick={() => { setActiveTab(Tab.SETTINGS); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === Tab.SETTINGS ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                <Cloud className="w-5 h-5 mr-3" />
                Settings
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-4">
            <button 
              onClick={toggleDarkMode}
              className="w-full flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {isDarkMode ? <Sun className="w-5 h-5 mr-2" /> : <Moon className="w-5 h-5 mr-2" />}
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </button>

            <div className="bg-green-900 dark:bg-black/50 rounded-lg p-4 text-white text-center">
              <p className="text-xs font-semibold opacity-80">Today's Total</p>
              <p className="text-xl font-bold">{sales.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString()).reduce((a, b) => a + b.price, 0).toLocaleString()} ฿</p>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 relative bg-gray-100 dark:bg-gray-900 scroll-smooth transition-colors duration-200">
          {renderContent()}
        </main>

        {/* Overlay for mobile menu */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}
      </div>
    </div>
  );
};

export default App;