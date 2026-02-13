import React, { useState, useMemo } from 'react';
import { InventoryItem, ProductType, FlowerGrade } from '../types';
import { Plus, Edit2, Save, X, ClipboardList, Minus, ShoppingCart, ArrowLeft, FileText, Loader2, ChevronUp, ChevronDown, ChevronRight, ArrowUpDown, Search, Trash2, CheckCircle2 } from 'lucide-react';
import { generateId } from '../utils/pricing';
import { translations, Language } from '../utils/translations';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateInventory: (item: InventoryItem) => void;
  onAdjustStock: (id: string, amount: number) => void;
  onDeleteInventory: (id: string) => void;
  shopName: string;
  isSuperAdmin: boolean;
  language: Language;
  onBroadcastLowStock: (items: InventoryItem[]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, onUpdateInventory, onAdjustStock, onDeleteInventory, shopName, isSuperAdmin, language, onBroadcastLowStock }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showOrderList, setShowOrderList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
  const t = translations[language];
  const activeItems = inventory.filter(item => item.stockLevel > 0);
  const outOfStockItems = inventory.filter(item => item.stockLevel <= 0);

  const [formState, setFormState] = useState<Partial<InventoryItem>>({
    category: ProductType.FLOWER,
    grade: FlowerGrade.MID,
    stockLevel: 0,
    price: 0
  });

  const handleSave = () => {
    if (!formState.name) return alert("Name is required");
    const item: InventoryItem = {
      id: editingId || generateId(),
      category: formState.category || ProductType.FLOWER,
      name: formState.name,
      grade: formState.category === ProductType.FLOWER ? formState.grade : undefined,
      stockLevel: Number(formState.stockLevel) || 0,
      price: Number(formState.price) || 0,
      lastUpdated: Date.now()
    };
    onUpdateInventory(item);
    resetForm();
  };

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) newCollapsed.delete(category);
    else newCollapsed.add(category);
    setCollapsedCategories(newCollapsed);
  };

  const groupedInventory = useMemo(() => {
    const baseList = showOrderList ? outOfStockItems : activeItems;
    const filteredList = baseList.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const groups: Record<string, InventoryItem[]> = {};
    filteredList.forEach(item => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
    });
    return groups;
  }, [showOrderList, activeItems, outOfStockItems, searchQuery]);

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormState({ category: ProductType.FLOWER, grade: FlowerGrade.MID, stockLevel: 0, price: 0 });
  };

  const startEdit = (item: InventoryItem) => {
    setFormState(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const availableCategories = Object.values(ProductType).filter(t => t !== ProductType.OTHER);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in flex flex-col h-full max-h-[85vh]">
      <div className="p-4 border-b border-white/5 flex flex-col xl:flex-row justify-between items-start xl:items-center bg-slate-900/40 gap-3">
        
        <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white flex items-center">
                {showOrderList ? (
                    <>
                        <ShoppingCart className="w-5 h-5 mr-2 text-amber-500" />
                        {t.orderList} <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">{outOfStockItems.length}</span>
                    </>
                ) : (
                    t.inventoryManagement
                )}
            </h2>
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2 h-4 w-4 text-slate-500" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-950/50 border border-slate-700 rounded-lg text-white focus:border-green-500 outline-none"
                />
            </div>

            <button 
              onClick={() => setShowOrderList(!showOrderList)}
              className={`p-2 rounded-lg transition-colors ${showOrderList ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
            >
              {showOrderList ? <ArrowLeft className="w-4 h-4" /> : <ClipboardList className="w-4 h-4" />}
            </button>
            
            {!showOrderList && isSuperAdmin && (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-colors shadow-lg shadow-green-900/20"
                >
                  <Plus className="w-4 h-4" />
                </button>
            )}
        </div>
      </div>

      {isAdding && (
         <div className="bg-slate-800/80 p-4 border-b border-white/5 backdrop-blur-sm animate-fade-in">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                 <input type="text" placeholder="Name" value={formState.name||''} onChange={e=>setFormState({...formState, name: e.target.value})} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                 <select value={formState.category} onChange={e=>setFormState({...formState, category: e.target.value as ProductType})} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white">
                     {availableCategories.map(c=><option key={c} value={c}>{c}</option>)}
                 </select>
                 {formState.category === ProductType.FLOWER ? (
                     <select value={formState.grade} onChange={e=>setFormState({...formState, grade: e.target.value as FlowerGrade})} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white">
                         {Object.values(FlowerGrade).map(g=><option key={g} value={g}>{g}</option>)}
                     </select>
                 ) : (
                     <input type="number" placeholder="Price" value={formState.price||''} onChange={e=>setFormState({...formState, price: parseFloat(e.target.value)})} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                 )}
                 <input type="number" placeholder="Stock" value={formState.stockLevel} onChange={e=>setFormState({...formState, stockLevel: parseFloat(e.target.value)})} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" />
             </div>
             <div className="flex justify-end gap-2">
                 <button onClick={resetForm} className="text-slate-400 text-xs hover:text-white px-3 py-2">Cancel</button>
                 <button onClick={handleSave} className="bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-green-500">Save Product</button>
             </div>
         </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <table className="w-full text-sm text-left border-collapse">
          <tbody className="divide-y divide-white/5">
            {Object.keys(groupedInventory).length === 0 ? (
               <tr><td className="text-center py-12 text-slate-500">No items found.</td></tr>
            ) : (
              Object.entries(groupedInventory).map(([category, items]) => {
                const isCollapsed = collapsedCategories.has(category);
                const categoryItems = items as InventoryItem[];
                return (
                  <React.Fragment key={category}>
                    <tr onClick={() => toggleCategory(category)} className="bg-slate-900/30 cursor-pointer hover:bg-slate-900/50">
                      <td colSpan={5} className="px-4 py-2">
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-300 text-xs uppercase tracking-widest">{category}</span>
                            {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-slate-600" />}
                        </div>
                      </td>
                    </tr>
                    
                    {!isCollapsed && categoryItems.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-3 font-medium text-slate-200">{item.name}</td>
                        <td className="px-4 py-3 text-right">
                          {item.grade ? (
                            <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-slate-700">{item.grade}</span>
                          ) : item.price ? (
                              <span className="font-mono text-xs text-slate-400">{item.price} ฿</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-right">
                           <div className="flex items-center justify-end gap-2">
                               <span className={`font-mono text-sm font-bold ${item.stockLevel < 10 ? 'text-amber-500' : 'text-slate-300'}`}>{item.stockLevel}</span>
                               <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => onAdjustStock(item.id, 1)} className="text-[10px] text-green-500 hover:text-green-400"><ChevronUp className="w-3 h-3"/></button>
                                   <button onClick={() => onAdjustStock(item.id, -1)} className="text-[10px] text-red-500 hover:text-red-400"><ChevronDown className="w-3 h-3"/></button>
                               </div>
                           </div>
                        </td>
                        {isSuperAdmin && (
                            <td className="px-2 py-3 text-right w-10">
                                <button onClick={() => startEdit(item)} className="p-1.5 text-slate-500 hover:text-white"><Edit2 className="w-3 h-3" /></button>
                            </td>
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};