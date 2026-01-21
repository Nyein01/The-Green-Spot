import React, { useState } from 'react';
import { InventoryItem, ProductType, FlowerGrade } from '../types';
import { Plus, Edit2, Save, X, ClipboardList, AlertOctagon, AlertTriangle, Minus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { generateId } from '../utils/pricing';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateInventory: (item: InventoryItem) => void;
  onAdjustStock: (id: string, amount: number) => void;
  onDeleteInventory: (id: string) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, onUpdateInventory, onAdjustStock }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showOrderList, setShowOrderList] = useState(false);

  // Filter inventory logic
  const activeItems = inventory.filter(item => item.stockLevel > 0);
  const outOfStockItems = inventory.filter(item => item.stockLevel <= 0);

  // Form state for new/edit item
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

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormState({ category: ProductType.FLOWER, grade: FlowerGrade.MID, stockLevel: 0, price: 0 });
  };

  const startEdit = (item: InventoryItem) => {
    setFormState(item);
    setEditingId(item.id);
    setIsAdding(true);
    // If editing from order list, ensure we stay on order list if user cancels, 
    // but the modal overlay works for both views.
  };

  // Filter out 'Other' from available categories
  const availableCategories = Object.values(ProductType).filter(t => t !== ProductType.OTHER);

  const displayedInventory = showOrderList ? outOfStockItems : activeItems;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
            {showOrderList ? (
                <>
                    <ShoppingCart className="w-5 h-5 mr-2 text-amber-500" />
                    Order List ({outOfStockItems.length})
                </>
            ) : (
                "Inventory Management"
            )}
        </h2>
        <div className="flex space-x-2">
            <button 
              onClick={() => setShowOrderList(!showOrderList)}
              className={`flex items-center text-xs px-3 py-1.5 rounded-lg transition-colors shadow-sm ${showOrderList ? 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
            >
              {showOrderList ? (
                  <>
                    <ArrowLeft className="w-3 h-3 mr-1" /> Back to Stock
                  </>
              ) : (
                  <>
                    <ClipboardList className="w-3 h-3 mr-1" /> Order List
                    {outOfStockItems.length > 0 && (
                        <span className="ml-1.5 bg-white text-amber-600 px-1.5 rounded-full text-[10px] font-bold">
                            {outOfStockItems.length}
                        </span>
                    )}
                  </>
              )}
            </button>
            {!showOrderList && (
                <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                >
                <Plus className="w-3 h-3 mr-1" /> Add Product
                </button>
            )}
        </div>
      </div>

      {isAdding && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
            <div className="lg:col-span-2">
                <input 
                type="text" 
                placeholder="Product Name" 
                value={formState.name || ''}
                onChange={e => setFormState({...formState, name: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500"
                />
            </div>
            <select 
              value={formState.category}
              onChange={e => setFormState({...formState, category: e.target.value as ProductType})}
              className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500"
            >
              {availableCategories.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            
            {formState.category === ProductType.FLOWER ? (
              <select 
                value={formState.grade}
                onChange={e => setFormState({...formState, grade: e.target.value as FlowerGrade})}
                className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500"
              >
                {Object.values(FlowerGrade).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
                <input 
                type="number" 
                placeholder="Unit Price (฿)" 
                value={formState.price || ''}
                onChange={e => setFormState({...formState, price: parseFloat(e.target.value)})}
                className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500"
                />
            )}

            <input 
              type="number" 
              placeholder="Current Stock" 
              value={formState.stockLevel}
              onChange={e => setFormState({...formState, stockLevel: parseFloat(e.target.value)})}
              className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <button onClick={handleSave} className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700">
              <Save className="w-3 h-3 mr-1" /> Save
            </button>
            <button onClick={resetForm} className="flex items-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 px-3 py-1.5 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-600">
              <X className="w-3 h-3 mr-1" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {displayedInventory.length === 0 ? (
               <tr>
                   <td colSpan={5} className="text-center py-8 text-gray-400 dark:text-gray-500">
                       {showOrderList ? (
                           <div className="flex flex-col items-center">
                               <ClipboardList className="w-8 h-8 mb-2 opacity-50" />
                               <p>Order list is empty. All items are in stock!</p>
                           </div>
                       ) : (
                           "No items in inventory."
                       )}
                   </td>
               </tr>
            ) : (
              displayedInventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.category}</td>
                  <td className="px-4 py-3">
                    {item.category === ProductType.FLOWER && item.grade ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold 
                        ${item.grade === FlowerGrade.TOP_SHELF ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' : 
                          item.grade === FlowerGrade.TOP ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                          item.grade === FlowerGrade.EXOTIC ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 
                          'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                        {item.grade}
                      </span>
                    ) : item.price ? (
                        <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                            {item.price} ฿
                        </span>
                    ) : (
                        <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-3">
                       <button 
                         onClick={() => onAdjustStock(item.id, -1)} 
                         disabled={item.stockLevel <= 0 && showOrderList} // Can't go below 0 in order list view comfortably
                         className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors touch-manipulation disabled:opacity-30"
                       >
                         <Minus className="w-4 h-4" />
                       </button>
                       <div className="flex flex-col items-center w-16">
                          <span className={`font-mono text-base ${item.stockLevel <= 0 ? 'text-red-600 dark:text-red-400 font-bold' : item.stockLevel <= 10 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                            {item.stockLevel}
                          </span>
                          {item.stockLevel <= 0 && <span className="text-[10px] text-red-500 font-bold">EMPTY</span>}
                       </div>
                       <button 
                         onClick={() => onAdjustStock(item.id, 1)} 
                         className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors touch-manipulation"
                       >
                         <Plus className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end space-x-1 items-center">
                      <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};