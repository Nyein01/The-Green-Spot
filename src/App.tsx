import React, { useState, useEffect, useRef } from 'react';
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
  BarChart3,
  Archive,
  Loader2,
  UserCircle2,
  Globe,
  Bell,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { LoginForm } from './components/LoginForm';
import { SalesForm } from './components/SalesForm';
import { InventoryManager } from './components/InventoryManager';
import { DailyReport } from './components/DailyReport';
import { HistoricalReport } from './components/HistoricalReport';
import { ArchiveView } from './components/ArchiveView';
import { ToastContainer, ToastMessage } from './components/Toast';
import { 
  subscribeToSales, 
  subscribeToInventory,
  subscribeToReports,
  subscribeToExpenses,
  subscribeToAppNotifications,
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
  deleteReportFromCloud,
  sendAppNotification
} from './services/storageService';
import { SaleItem, InventoryItem, DayReport, Tab, Expense } from './types';
import { generateId } from './utils/pricing';
import { translations, Language } from './utils/translations';

type ShopId = 'greenspot' | 'nearcannabis';

const App: React.FC = () => {
  // --- MAINTENANCE MODE STATE ---
  const [isSiteClosed, setIsSiteClosed] = useState(false); 
  // -----------------------------

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
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  // Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const prevInventoryRef = useRef<Record<string, number>>({});
  const isFirstLoadRef = useRef(true);
  const loginTimeRef = useRef(Date.now());
  const [customAlertMsg, setCustomAlertMsg] = useState('');

  // Language State
  const [language, setLanguage] = useState<Language>('en');

  const shopNames = {
    greenspot: "The Green Spot",
    nearcannabis: "Near Cannabis"
  };

  const t = translations[language];

  // Helper to add toast
  const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    // Force dark mode class on body for this design
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    setLoading(true);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeSales = subscribeToSales(currentShop, (data) => setSales(data));
    const unsubscribeExpenses = subscribeToExpenses(currentShop, (data) => setExpenses(data));
    const unsubscribeReports = subscribeToReports(currentShop, (data) => {
        setReports(data);
        setLoading(false);
    });

    const unsubscribeInventory = subscribeToInventory(currentShop, (data) => {
        setInventory(data);
        if (!isFirstLoadRef.current) {
            data.forEach(item => {
                const prevStock = prevInventoryRef.current[item.id];
                if (item.stockLevel <= 10 && item.stockLevel > 0 && (prevStock === undefined || prevStock > 10)) {
                    addToast(`⚠️ Low Stock: ${item.name}`, 'warning');
                }
                if (item.stockLevel <= 0 && (prevStock === undefined || prevStock > 0)) {
                    addToast(`🚨 OUT OF STOCK: ${item.name}`, 'error');
                }
            });
        }
        const newStockMap: Record<string, number> = {};
        data.forEach(i => newStockMap[i.id] = i.stockLevel);
        prevInventoryRef.current = newStockMap;
        isFirstLoadRef.current = false;
    });

    const unsubscribeNotifications = subscribeToAppNotifications(currentShop, loginTimeRef.current, (note) => {
        addToast(note.message, note.type);
    });

    return () => {
      unsubscribeSales();
      unsubscribeInventory();
      unsubscribeReports();
      unsubscribeExpenses();
      unsubscribeNotifications();
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
    if (!success) {
        addToast("Error saving sale", 'error');
        return;
    }
    const item = inventory.find(i => i.name === sale.productName);
    if (item) await adjustStockInCloud(currentShop, item.id, item.stockLevel, -sale.quantity);
    addToast("Sale recorded successfully", 'success');
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
    addToast("Expense added", 'info');
  };

  const handleDeleteExpense = async (id: string) => {
    if (!isOnline) return alert("Offline: Cannot delete expense.");
    await deleteExpenseFromCloud(currentShop, id);
    addToast("Expense deleted", 'info');
  };

  const handleDeleteSale = async (sale: SaleItem) => {
    if (!isOnline) return alert("⚠️ You are offline. Cannot delete sales.");
    setDeletingIds(prev => new Set(prev).add(sale.id));
    try {
        const success = await deleteSaleFromCloud(currentShop, sale.id);
        if (success) {
            const item = inventory.find(i => i.name === sale.productName);
            if (item) await adjustStockInCloud(currentShop, item.id, item.stockLevel, sale.quantity);
            addToast("Sale deleted & stock restored", 'success');
        } else {
            addToast("Failed to delete sale", 'error');
        }
    } catch (error) {
        console.error(error);
        addToast("Error deleting sale", 'error');
    } finally {
        setDeletingIds(prev => { const n = new Set(prev); n.delete(sale.id); return n; });
    }
  };

  const handleDeleteInventory = async (id: string) => {
    if (!isOnline) return alert("Cannot delete items while offline.");
    await deleteInventoryItemFromCloud(currentShop, id);
    addToast("Product deleted", 'info');
  }

  const handleResetDay = async () => {
    await clearSalesInCloud(currentShop, sales);
    await clearExpensesInCloud(currentShop, expenses);
    addToast("Register cleared for new shift", 'success');
  };

  const handleRestoreReport = async (report: DayReport) => {
      if (!isOnline) return alert("Cannot restore while offline.");
      if (confirm(`Restore ${report.sales.length} sales from ${new Date(report.date).toLocaleDateString()}?`)) {
          const success = await restoreSalesBatch(currentShop, report.sales);
          if (success) {
              addToast("Sales restored successfully", 'success');
              setActiveTab(Tab.SALES);
          } else {
              addToast("Failed to restore sales", 'error');
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
          addToast("Error deleting report", 'error');
      } else {
          addToast("Report deleted from archive", 'success');
      }
  }

  const handleMigrate = async () => {
    if(confirm("Upload local storage data to cloud?")) {
        const result = await migrateLocalToCloud();
        alert(result);
    }
  };

  const handleSeed = async () => {
    await seedDefaultInventory(currentShop);
    addToast("Default inventory loaded", 'success');
  }

  const handleSendBroadcast = async () => {
    if (!customAlertMsg) return;
    const success = await sendAppNotification(currentShop, {
        id: generateId(),
        message: customAlertMsg,
        type: 'info',
        timestamp: Date.now(),
        sentBy: currentStaff
    });
    if (success) {
        setCustomAlertMsg('');
    } else {
        addToast("Failed to send broadcast", 'error');
    }
  }
  
  const handleBroadcastLowStock = async (outOfStockItems: InventoryItem[]) => {
      if (outOfStockItems.length === 0) return;
      const message = `🚨 CRITICAL ALERT: ${outOfStockItems.length} items are OUT OF STOCK!`;
      await sendAppNotification(currentShop, {
          id: generateId(),
          message: message,
          type: 'error',
          timestamp: Date.now(),
          sentBy: currentStaff
      });
  }

  const handleLogin = (shopId: 'greenspot' | 'nearcannabis', isAdmin: boolean, staffName: string) => {
    setCurrentShop(shopId);
    setIsSuperAdmin(isAdmin);
    setCurrentStaff(staffName);
    setIsAuthenticated(true);
    isFirstLoadRef.current = true;
    prevInventoryRef.current = {};
    loginTimeRef.current = Date.now();
    if (!shiftStartTime) {
        const start = Date.now();
        setShiftStartTime(start);
        localStorage.setItem('gs_shift_start', start.toString());
    }
    addToast(`Welcome back, ${staffName.split(' ')[0]}`, 'success');
  }

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSales([]); setInventory([]); setReports([]); setExpenses([]);
    setCurrentShop('greenspot'); setIsSuperAdmin(false); setCurrentStaff('');
    setShiftStartTime(null);
    localStorage.removeItem('gs_shift_start');
  }

  if (isSiteClosed) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white font-mono text-2xl">CLOSED</div>;
  if (!isAuthenticated) return <LoginForm onLogin={handleLogin} language={language} setLanguage={changeLanguage} />;

  const renderContent = () => {
    if (loading) return <div className="flex h-full items-center justify-center text-green-500"><Loader2 className="animate-spin h-10 w-10" /></div>;

    const contentClass = "animate-fade-in";

    switch (activeTab) {
      case Tab.SALES:
        return <div className={contentClass}><SalesForm inventory={inventory} onSaleComplete={handleNewSale} onStockUpdate={() => {}} staffName={currentStaff} language={language} /></div>;
      case Tab.INVENTORY:
        return <div className={contentClass}><InventoryManager inventory={inventory} onUpdateInventory={(item) => updateInventoryInCloud(currentShop, item)} onAdjustStock={(id, adj) => { const item = inventory.find(i => i.id === id); if(item) adjustStockInCloud(currentShop, id, item.stockLevel, adj); }} onDeleteInventory={handleDeleteInventory} shopName={shopNames[currentShop]} isSuperAdmin={isSuperAdmin} language={language} onBroadcastLowStock={handleBroadcastLowStock} /></div>;
      case Tab.REPORT:
        return <div className={contentClass}><DailyReport sales={sales} expenses={expenses} inventory={inventory} onDeleteSale={handleDeleteSale} onAddExpense={handleAddExpense} onDeleteExpense={handleDeleteExpense} onReset={handleResetDay} deletingIds={deletingIds} shopName={shopNames[currentShop]} staffName={currentStaff} /></div>;
      case Tab.ARCHIVE:
        return <div className={contentClass}><ArchiveView reports={reports} onRestore={handleRestoreReport} onDelete={handleDeleteReport} /></div>;
      case Tab.MONTHLY:
        return <div className={contentClass}><HistoricalReport archivedReports={reports} inventory={inventory} timeframe="monthly" shopName={shopNames[currentShop]} /></div>;
      case Tab.SETTINGS:
        return (
          <div className={`max-w-4xl mx-auto ${contentClass}`}>
            <h2 className="text-3xl font-extrabold mb-1 text-white">{t.settings}</h2>
            <div className="glass-panel p-6 rounded-2xl mt-6">
                <div className="flex items-center text-white mb-6 font-bold text-lg">
                    <Database className="w-5 h-5 mr-2 text-green-400" /> System Management
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className={`p-4 rounded-xl border ${isOnline ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                        <div className={`flex items-center font-bold mb-1 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
                            {isOnline ? <Wifi className="w-4 h-4 mr-2" /> : <WifiOff className="w-4 h-4 mr-2" />} 
                            Status: {isOnline ? 'Connected' : 'Offline'}
                        </div>
                     </div>
                     <button onClick={handleMigrate} className="p-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl border border-slate-600 transition-colors flex items-center justify-center font-medium">
                        <Cloud className="w-4 h-4 mr-2" /> Sync Local Data
                     </button>
                </div>
            </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen w-full flex text-slate-200 selection:bg-green-500 selection:text-white">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {/* --- Sidebar (Floating Dock Style) --- */}
      <nav className={`
        fixed inset-y-4 left-4 z-50 w-72 glass-panel rounded-3xl flex flex-col justify-between shadow-2xl transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[110%]'} md:translate-x-0 md:relative md:inset-auto md:h-[calc(100vh-2rem)] md:my-4 md:ml-4
      `}>
         <div className="p-6">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-green-900/40">
                  <Leaf className="text-white w-6 h-6" />
               </div>
               <div>
                  <h1 className="font-bold text-white text-lg leading-tight tracking-tight">{shopNames[currentShop]}</h1>
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">POS v3.1</span>
               </div>
            </div>

            <div className="space-y-1">
               {[
                 { id: Tab.SALES, label: t.sales, icon: PlusCircle },
                 { id: Tab.INVENTORY, label: t.inventory, icon: Package },
                 { id: Tab.REPORT, label: t.report, icon: FileText },
                 { id: Tab.ARCHIVE, label: t.archive, icon: Archive },
               ].map(tab => (
                 <button 
                   key={tab.id}
                   onClick={() => { setActiveTab(tab.id); setIsMobileMenuOpen(false); }}
                   className={`w-full flex items-center p-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden ${
                     activeTab === tab.id 
                     ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md shadow-green-900/20' 
                     : 'text-slate-400 hover:bg-white/5 hover:text-white'
                   }`}
                 >
                   <tab.icon className={`w-5 h-5 mr-3 ${activeTab === tab.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} />
                   {tab.label}
                   {activeTab === tab.id && <div className="absolute right-0 w-1 h-6 bg-white/20 rounded-l-full"></div>}
                 </button>
               ))}

               <div className="my-4 h-px bg-white/5 w-full"></div>
               <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Analytics</p>
               
               <button 
                  onClick={() => { setActiveTab(Tab.MONTHLY); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center p-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === Tab.MONTHLY ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
               >
                  <BarChart3 className="w-5 h-5 mr-3" /> Dashboard
               </button>
               <button 
                  onClick={() => { setActiveTab(Tab.SETTINGS); setIsMobileMenuOpen(false); }}
                  className={`w-full flex items-center p-3 rounded-xl text-sm font-medium transition-all duration-200 ${activeTab === Tab.SETTINGS ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
               >
                  <Settings className="w-5 h-5 mr-3" /> {t.settings}
               </button>
            </div>
         </div>

         <div className="p-4 mx-2 mb-2 bg-slate-900/50 rounded-2xl border border-white/5">
             <div className="flex items-center gap-3 mb-3">
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10">
                     <UserCircle2 className="w-5 h-5 text-slate-400" />
                 </div>
                 <div className="overflow-hidden">
                     <p className="text-xs text-white font-bold truncate">{currentStaff}</p>
                     <p className="text-[10px] text-slate-500 truncate">Logged in</p>
                 </div>
             </div>
             <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center py-2 text-xs font-bold text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-lg border border-red-400/10 transition-colors"
             >
                <LogOut className="w-3 h-3 mr-1.5" /> Sign Out
             </button>
         </div>
      </nav>

      {/* --- Main Content Area --- */}
      <main className="flex-1 h-[100vh] overflow-hidden flex flex-col relative">
         
         {/* Mobile Header */}
         <header className="md:hidden flex items-center justify-between p-4 glass-panel border-b-0 m-4 rounded-2xl">
            <div className="flex items-center gap-2 font-bold text-white">
               <Leaf className="w-6 h-6 text-green-500" /> {shopNames[currentShop]}
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-white bg-white/10 rounded-lg">
               <Menu className="w-5 h-5" />
            </button>
         </header>

         {/* Top Bar (Desktop) */}
         <div className="hidden md:flex items-center justify-between px-8 py-6">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-slate-400" />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-white">
                      {activeTab === Tab.MONTHLY ? 'Analytics Dashboard' : activeTab}
                  </h2>
                  <p className="text-xs text-slate-400">Manage your dispensary operations</p>
               </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="bg-slate-800/50 rounded-full px-4 py-2 border border-white/5 flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Daily Total</span>
                  <span className="text-sm font-bold text-green-400">{sales.reduce((a, b) => a + b.price, 0).toLocaleString()} ฿</span>
               </div>
               <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                   <Bell className="w-5 h-5" />
                   <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
               </button>
            </div>
         </div>

         {/* Scrollable Content */}
         <div className="flex-1 overflow-y-auto px-4 pb-20 md:px-8 md:pb-8 scroll-smooth">
             <div className="max-w-7xl mx-auto">
                {renderContent()}
             </div>
         </div>

      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
    </div>
  );
};

export default App;