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
  LogOut,
  TrendingUp,
  BarChart3,
  Archive,
  Loader2,
  UserCircle2,
  Globe,
  Check,
  Palette,
  CloudRain,
  Droplets,
  Circle,
  CheckCircle2,
  Sparkles
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
  subscribeToExpenses,
  addSaleToCloud,
  addExpenseToCloud,
  deleteExpenseFromCloud,
  updateInventoryInCloud,
  adjustStockInCloud,
  deleteSaleFromCloud,
  deleteInventoryItemFromCloud,
  clearSalesInCloud,
  clearExpensesInCloud,
  migrateLocalToCloud,
  seedDefaultInventory,
  restoreSalesBatch,
  deleteReportFromCloud
} from './services/storageService';
import { SaleItem, InventoryItem, DayReport, Tab, Expense } from './types';
import { generateId } from './utils/pricing';
import { translations, Language } from './utils/translations';

type ShopId = 'greenspot' | 'nearcannabis';
type Theme = 'daylight' | 'midnight' | 'sunset' | 'ocean' | 'minimal' | 'glass';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  const [activeTab, setActiveTab] = useState<Tab>(Tab.SALES);
  const [currentShop, setCurrentShop] = useState<ShopId>('greenspot');
  const [currentStaff, setCurrentStaff] = useState<string>('');
  
  // Shift Tracking
  const [shiftStartTime, setShiftStartTime] = useState<number | null>(() => {
      const saved = localStorage.getItem('gs_shift_start');
      return saved ? parseInt(saved) : null;
  });
  
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [reports, setReports] = useState<DayReport[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('daylight');
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  // Language State
  const [language, setLanguage] = useState<Language>('en');

  const shopNames = {
    greenspot: "The Green Spot",
    nearcannabis: "Near Cannabis"
  };

  const t = translations[language];

  useEffect(() => {
    // Check local storage for theme & language
    const savedTheme = localStorage.getItem('greentrack_theme') as Theme;
    const savedLang = localStorage.getItem('greentrack_lang') as Language;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('midnight');
    }

    if (savedLang) {
        setLanguage(savedLang);
    }
  }, []);

  // Apply Theme Classes to HTML root
  useEffect(() => {
    const root = window.document.documentElement;
    root.className = ''; // Clear all
    
    // Always add 'dark' class for midnight and glass themes to trigger tailwind dark mode text/colors
    if (theme === 'midnight' || theme === 'glass') {
      root.classList.add('dark');
    }
    
    // Add specific theme class for global CSS overrides
    root.classList.add(theme);
    
    localStorage.setItem('greentrack_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeSales = subscribeToSales(currentShop, (data) => setSales(data));
    const unsubscribeInventory = subscribeToInventory(currentShop, (data) => setInventory(data));
    const unsubscribeExpenses = subscribeToExpenses(currentShop, (data) => setExpenses(data));
    const unsubscribeReports = subscribeToReports(currentShop, (data) => {
        setReports(data);
        setLoading(false);
    });

    return () => {
      unsubscribeSales();
      unsubscribeInventory();
      unsubscribeReports();
      unsubscribeExpenses();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentShop, isAuthenticated]);

  const changeLanguage = (lang: Language) => {
      setLanguage(lang);
      localStorage.setItem('greentrack_lang', lang);
  }

  const handleNewSale = async (sale: SaleItem) => {
    if (!isOnline) return alert("⚠️ You are offline.");
    const success = await addSaleToCloud(currentShop, sale);
    if (!success) return alert("⚠️ Error saving sale.");
    const item = inventory.find(i => i.name === sale.productName);
    if (item) await adjustStockInCloud(currentShop, item.id, item.stockLevel, -sale.quantity);
  };

  const handleAddExpense = async (description: string, amount: number) => {
    if (!isOnline) return alert("Offline: Cannot add expense.");
    const expense: Expense = {
        id: generateId(),
        description,
        amount,
        timestamp: Date.now()
    };
    await addExpenseToCloud(currentShop, expense);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!isOnline) return alert("Offline: Cannot delete expense.");
    await deleteExpenseFromCloud(currentShop, id);
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

  const handleDeleteInventory = async (id: string) => {
    if (!isOnline) return alert("Cannot delete items while offline.");
    await deleteInventoryItemFromCloud(currentShop, id);
  }

  const handleResetDay = async () => {
    await clearSalesInCloud(currentShop, sales);
    await clearExpensesInCloud(currentShop, expenses);
  };

  const handleRestoreReport = async (report: DayReport) => {
      if (!isOnline) return alert("Cannot restore while offline.");
      if (confirm(`Restore ${report.sales.length} sales from ${new Date(report.date).toLocaleDateString()} to the live register?`)) {
          const success = await restoreSalesBatch(currentShop, report.sales);
          if (success) {
              alert("Sales restored successfully!");
              setActiveTab(Tab.SALES);
          } else {
              alert("Failed to restore sales.");
          }
      }
  };

  const handleDeleteReport = async (reportId: string) => {
      if (!isOnline) {
          alert("Cannot delete while offline.");
          return;
      }
      const success = await deleteReportFromCloud(currentShop, reportId);
      if (!success) {
          alert("Error: Could not delete report from cloud database.");
      }
  }

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

  const handleLogin = (shopId: 'greenspot' | 'nearcannabis', isAdmin: boolean, staffName: string) => {
    setCurrentShop(shopId);
    setIsSuperAdmin(isAdmin);
    setCurrentStaff(staffName);
    setIsAuthenticated(true);

    // Record Shift Start if not already recorded (e.g. from page refresh)
    if (!shiftStartTime) {
        const start = Date.now();
        setShiftStartTime(start);
        localStorage.setItem('gs_shift_start', start.toString());
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSales([]); setInventory([]); setReports([]); setExpenses([]);
    setCurrentShop('greenspot'); setIsSuperAdmin(false); setCurrentStaff('');
    
    // Clear shift data on logout
    setShiftStartTime(null);
    localStorage.removeItem('gs_shift_start');
  }

  if (!isAuthenticated) return <LoginForm onLogin={handleLogin} language={language} setLanguage={changeLanguage} />;

  const themeOptions = [
    { id: 'daylight', name: 'Daylight', desc: 'Bright and airy with soft gradients.', icon: Sun, bg: 'bg-orange-50' },
    { id: 'midnight', name: 'Midnight', desc: 'Dark, deep tones for night shifts.', icon: Moon, bg: 'bg-slate-900 text-white' },
    { id: 'glass', name: 'Glass UI', desc: 'Futuristic frosted glass aesthetic.', icon: Sparkles, bg: 'bg-slate-800 text-white' },
    { id: 'sunset', name: 'Sunset', desc: 'Warm colors inspired by the evening sky.', icon: CloudRain, bg: 'bg-orange-100' },
    { id: 'ocean', name: 'Ocean', desc: 'Calm blue tones for a relaxed vibe.', icon: Droplets, bg: 'bg-cyan-100' },
    { id: 'minimal', name: 'Minimal', desc: 'Clean, solid grey for maximum focus.', icon: Circle, bg: 'bg-gray-100' }
  ];

  const renderContent = () => {
    if (loading) return <div className="flex h-full items-center justify-center text-green-600"><Loader2 className="animate-spin h-10 w-10" /></div>;

    const contentClass = "animate-slide-up";

    switch (activeTab) {
      case Tab.SALES:
        return (
          <div className={`max-w-2xl mx-auto pb-20 ${contentClass}`}>
            <SalesForm inventory={inventory} onSaleComplete={handleNewSale} onStockUpdate={() => {}} staffName={currentStaff} language={language} />
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4 px-1 flex items-center">
                {t.today}
                <span className="ml-2 text-xs font-normal bg-green-100 text-green-800 px-2 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">Live</span>
              </h3>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y dark:divide-gray-700 overflow-hidden">
                {sales.length === 0 && <div className="p-12 text-center text-gray-400">No sales recorded yet today.</div>}
                {sales.map((sale, idx) => (
                  <div key={sale.id} className={`p-4 flex justify-between items-center ${deletingIds.has(sale.id) ? 'opacity-0 scale-95' : 'opacity-100'} transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50`} style={{ animationDelay: `${idx * 50}ms` }}>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-200 flex items-center">
                          {sale.productName}
                      </div>
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
        return <div className={contentClass}><InventoryManager inventory={inventory} onUpdateInventory={(item) => updateInventoryInCloud(currentShop, item)} onAdjustStock={(id, adj) => { const item = inventory.find(i => i.id === id); if(item) adjustStockInCloud(currentShop, id, item.stockLevel, adj); }} onDeleteInventory={handleDeleteInventory} shopName={shopNames[currentShop]} isSuperAdmin={isSuperAdmin} language={language} /></div>;
      case Tab.REPORT:
        return <div className={contentClass}><DailyReport sales={sales} expenses={expenses} inventory={inventory} onDeleteSale={handleDeleteSale} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} onReset={handleResetDay} deletingIds={deletingIds} shopName={shopNames[currentShop]} staffName={currentStaff} /></div>;
      case Tab.ARCHIVE:
        return <div className={contentClass}><ArchiveView reports={reports} onRestore={handleRestoreReport} onDelete={handleDeleteReport} /></div>;
      case Tab.WEEKLY:
        return <div className={contentClass}><HistoricalReport archivedReports={reports} inventory={inventory} timeframe="weekly" shopName={shopNames[currentShop]} /></div>;
      case Tab.MONTHLY:
        return <div className={contentClass}><HistoricalReport archivedReports={reports} inventory={inventory} timeframe="monthly" shopName={shopNames[currentShop]} /></div>;
      case Tab.SETTINGS:
        return (
          <div className={`max-w-4xl mx-auto ${contentClass}`}>
            <h2 className="text-3xl font-extrabold mb-1 dark:text-white">{t.settings}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Customize your app experience</p>
            
            <div className="space-y-8">
              
              {/* Theme Switcher Grid */}
              <div className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                  <div className="flex items-center text-gray-800 dark:text-white mb-6 font-bold text-lg">
                    <Palette className="w-6 h-6 mr-2 text-purple-600" />
                    App Appearance
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {themeOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = theme === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setTheme(opt.id as Theme)}
                          className={`relative flex items-start p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                            isSelected 
                              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-900/20' 
                              : 'border-transparent bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600 shadow-sm'
                          }`}
                        >
                          <div className={`p-3 rounded-full mr-4 ${opt.bg} ${isSelected ? 'ring-2 ring-purple-200 dark:ring-purple-800' : ''}`}>
                             <Icon className={`w-6 h-6 ${opt.id === 'midnight' || opt.id === 'glass' ? 'text-gray-200' : 'text-gray-700'}`} />
                          </div>
                          <div className="flex-1">
                             <div className="flex justify-between items-center mb-1">
                                <h3 className={`font-bold text-base ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-gray-100'}`}>{opt.name}</h3>
                                {isSelected && <CheckCircle2 className="w-5 h-5 text-purple-600 fill-purple-100 dark:fill-purple-900" />}
                             </div>
                             <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                                {opt.desc}
                             </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
              </div>

              {/* Language Selector */}
              <div className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                  <div className="flex items-center text-gray-800 dark:text-white mb-4 font-bold text-lg">
                    <Globe className="w-6 h-6 mr-2 text-blue-600" />
                    {t.language}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => changeLanguage('en')}
                        className={`p-3 rounded-xl text-sm font-bold transition-colors border-2 ${language === 'en' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-transparent bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50'}`}
                    >
                        English
                    </button>
                    <button 
                        onClick={() => changeLanguage('th')}
                        className={`p-3 rounded-xl text-sm font-bold transition-colors border-2 ${language === 'th' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-transparent bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50'}`}
                    >
                        ไทย
                    </button>
                    <button 
                        onClick={() => changeLanguage('mm')}
                        className={`p-3 rounded-xl text-sm font-bold transition-colors border-2 ${language === 'mm' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-transparent bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50'}`}
                    >
                        မြန်မာ
                    </button>
                  </div>
              </div>

              {/* Data Management */}
              <div className="bg-white/50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                <div className="flex items-center text-gray-800 dark:text-white mb-4 font-bold text-lg">
                    <Database className="w-6 h-6 mr-2 text-green-600" />
                    Data & Cloud
                </div>
                <div className={`p-4 rounded-xl border mb-4 transition-all duration-500 ${
                    isOnline 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800'
                }`}>
                    <div className={`flex items-center font-bold mb-1 ${
                        isOnline 
                        ? 'text-green-800 dark:text-green-300' 
                        : 'text-orange-800 dark:text-orange-300'
                    }`}>
                        {isOnline ? <Wifi className="w-5 h-5 mr-2" /> : <WifiOff className="w-5 h-5 mr-2" />} 
                        {t.cloudStatus}: {isOnline ? t.connected : t.offline}
                    </div>
                    <p className="text-xs opacity-80">
                        {isOnline ? "Your data is automatically synced securely." : "Changes are saved locally and will sync when online."}
                    </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                        onClick={handleMigrate} 
                        className="flex items-center justify-center p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-gray-700 dark:text-gray-200 shadow-sm"
                    >
                        <Cloud className="w-4 h-4 mr-2" /> {t.migrateData}
                    </button>

                    {inventory.length === 0 && (
                        <button 
                            onClick={handleSeed} 
                            className="flex items-center justify-center p-3 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-gray-700 dark:text-gray-200 shadow-sm"
                        >
                            <Package className="w-4 h-4 mr-2" /> {t.loadDefault}
                        </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className={`${theme === 'midnight' ? 'dark' : ''}`}>
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
      <div className="h-screen w-full bg-transparent flex flex-col md:flex-row overflow-hidden transition-colors duration-300">
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
              <div className="mt-4 flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                 <UserCircle2 className="w-5 h-5 text-gray-400 mr-2" />
                 <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Logged in as</p>
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate max-w-[140px]">{currentStaff}</p>
                 </div>
              </div>
            </div>
            {isSuperAdmin && <div className="px-4 mb-4"><select value={currentShop} onChange={(e) => setCurrentShop(e.target.value as ShopId)} className="w-full p-2.5 rounded-lg text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"><option value="greenspot">The Green Spot</option><option value="nearcannabis">Near Cannabis</option></select></div>}
            
            <div className="px-4 space-y-1 mt-4">
              {[
                { t: Tab.SALES, l: t.sales, i: <PlusCircle className="w-5 h-5 mr-3" /> },
                { t: Tab.INVENTORY, l: t.inventory, i: <Package className="w-5 h-5 mr-3" /> },
                { t: Tab.REPORT, l: t.report, i: <FileText className="w-5 h-5 mr-3" /> },
                { t: Tab.ARCHIVE, l: t.archive, i: <Archive className="w-5 h-5 mr-3" /> },
              ].map(item => (
                <button key={item.t} onClick={() => { setActiveTab(item.t); setIsMobileMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${activeTab === item.t ? 'bg-green-600 text-white shadow-lg shadow-green-200 dark:shadow-none font-bold scale-105' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{item.i}{item.l}</button>
              ))}
              <div className="pt-4 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{t.dashboard}</div>
              {[
                { t: Tab.WEEKLY, l: 'Weekly', i: <TrendingUp className="w-5 h-5 mr-3" /> },
                { t: Tab.MONTHLY, l: 'Monthly', i: <BarChart3 className="w-5 h-5 mr-3" /> },
                { t: Tab.SETTINGS, l: t.settings, i: <Cloud className="w-5 h-5 mr-3" /> },
              ].map(item => (
                <button key={item.t} onClick={() => { setActiveTab(item.t); setIsMobileMenuOpen(false); }} className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 ${activeTab === item.t ? 'bg-indigo-600 text-white font-bold scale-105' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{item.i}{item.l}</button>
              ))}
            </div>
          </div>
          <div className="p-4 border-t dark:border-gray-700 space-y-3">
            <button onClick={handleLogout} className="w-full flex items-center justify-center p-2 rounded-lg bg-red-50 text-red-600 font-bold text-sm hover:bg-red-100 transition-colors"><LogOut className="w-4 h-4 mr-2" /> {t.logout}</button>
            <div className="bg-green-900 rounded-xl p-4 text-white text-center shadow-lg transform transition-transform hover:scale-105"><p className="text-[10px] font-bold uppercase opacity-60 mb-1">{t.dailyTotal}</p><p className="text-2xl font-black">{sales.reduce((a, b) => a + b.price, 0).toLocaleString()} ฿</p></div>
          </div>
        </nav>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative transition-colors duration-300">{renderContent()}</main>
        {isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>}
      </div>
    </div>
  );
};

export default App;