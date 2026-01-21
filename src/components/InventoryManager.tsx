import React, { useState } from 'react';
import { InventoryItem, ProductType, FlowerGrade } from '../../types';
import { Plus, Edit2, Save, X, AlertTriangle, ClipboardList, AlertOctagon } from 'lucide-react';
import { generateId } from '../utils/pricing';

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateInventory: (item: InventoryItem) => void;
  onAdjustStock: (id: string, amount: number) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, onUpdateInventory, onAdjustStock }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state for new/edit item
  const [formState, setFormState] = useState<Partial<InventoryItem>>({
    category: ProductType.FLOWER,
    grade: FlowerGrade.MID,
    stockLevel: 0
  });

  const handleSave = () => {
    if (!formState.name) return alert("Name is required");
    
    const item: InventoryItem = {
      id: editingId || generateId(),
      category: formState.category || ProductType.FLOWER,
      name: formState.name,
      grade: formState.category === ProductType.FLOWER ? formState.grade : undefined,
      stockLevel: Number(formState.stockLevel) || 0,
      lastUpdated: Date.now()
    };
    
    onUpdateInventory(item);
    resetForm();
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormState({ category: ProductType.FLOWER, grade: FlowerGrade.MID, stockLevel: 0 });
  };

  const startEdit = (item: InventoryItem) => {
    setFormState(item);
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleCheckLowStock = () => {
    const outOfStock = inventory.filter(item => item.stockLevel <= 0);
    const lowStock = inventory.filter(item => item.stockLevel > 0 && item.stockLevel <= 10);

    if (outOfStock.length === 0 && lowStock.length === 0) {
       alert("✅ Inventory Status: Healthy\nAll items have sufficient stock levels.");
       return;
    }

    let message = "";

    if (outOfStock.length > 0) {
        message += "🚨 OUT OF STOCK (Order Immediately):\n";
        message += outOfStock.map(i => `• ${i.name} (${i.category})`).join("\n");
        message += "\n\n";
    }

    if (lowStock.length > 0) {
        message += "⚠️ LOW STOCK (Order Soon):\n";
        message += lowStock.map(i => `• ${i.name}: ${i.stockLevel} left`).join("\n");
        message += "\n\n";
    }

    message += "Please copy this list for your supplier.";
    alert(message);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/30">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">Inventory Management</h2>
        <div className="flex space-x-2">
            <button 
              onClick={handleCheckLowStock}
              className="flex items-center text-xs bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
              title="Check for items that need reordering"
            >
              <ClipboardList className="w-3 h-3 mr-1" /> Order List
            </button>
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Product
            </button>
        </div>
      </div>

      {isAdding && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <input 
              type="text" 
              placeholder="Product Name" 
              value={formState.name || ''}
              onChange={e => setFormState({...formState, name: e.target.value})}
              className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500"
            />
            <select 
              value={formState.category}
              onChange={e => setFormState({...formState, category: e.target.value as ProductType})}
              className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500"
            >
              {Object.values(ProductType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            
            {formState.category === ProductType.FLOWER && (
              <select 
                value={formState.grade}
                onChange={e => setFormState({...formState, grade: e.target.value as FlowerGrade})}
                className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500"
              >
                {Object.values(FlowerGrade).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
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
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {inventory.length === 0 ? (
               <tr><td colSpan={5} className="text-center py-4 text-gray-400 dark:text-gray-500">No items in inventory.</td></tr>
            ) : (
              inventory.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{item.category}</td>
                  <td className="px-4 py-3">
                    {item.grade ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold 
                        ${item.grade === FlowerGrade.TOP_SHELF ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' : 
                          item.grade === FlowerGrade.TOP ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                          item.grade === FlowerGrade.EXOTIC ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 
                          'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                        {item.grade}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <span className={`font-mono ${item.stockLevel <= 0 ? 'text-red-600 dark:text-red-400 font-black text-xs' : item.stockLevel <= 10 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                        {item.stockLevel <= 0 ? 'OUT OF STOCK' : item.stockLevel}
                      </span>
                      {item.stockLevel <= 0 ? (
                         <AlertOctagon className="w-3 h-3 text-red-500 animate-pulse" />
                      ) : item.stockLevel <= 10 ? (
                         <AlertTriangle className="w-3 h-3 text-amber-500" />
                      ) : null}
                      <div className="flex flex-col space-y-0.5 ml-2">
                         <button onClick={() => onAdjustStock(item.id, 1)} className="text-[10px] bg-gray-200 dark:bg-gray-600 dark:text-gray-200 px-1 rounded hover:bg-gray-300 dark:hover:bg-gray-500">▲</button>
                         <button onClick={() => onAdjustStock(item.id, -1)} className="text-[10px] bg-gray-200 dark:bg-gray-600 dark:text-gray-200 px-1 rounded hover:bg-gray-300 dark:hover:bg-gray-500">▼</button>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400">
                      <Edit2 className="w-4 h-4" />
                    </button>
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