import React, { useState, useMemo } from 'react';
import { InventoryItem, ProductType, FlowerGrade } from '../types';
import { Plus, Edit2, Save, X, ClipboardList, Minus, ShoppingCart, ArrowLeft, FileSpreadsheet, FileText, Loader2, ChevronUp, ChevronDown, ArrowUpDown, Leaf, Flame, Utensils, Zap, Package, Search, Lock, Trash2, CheckCircle2 } from 'lucide-react';
import { generateId } from '../utils/pricing';
import { generateInventoryAnalysis } from '../services/geminiService';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface InventoryManagerProps {
  inventory: InventoryItem[];
  onUpdateInventory: (item: InventoryItem) => void;
  onAdjustStock: (id: string, amount: number) => void;
  onDeleteInventory: (id: string) => void;
  shopName: string;
  isSuperAdmin: boolean;
}

type SortField = 'name' | 'category' | 'grade' | 'stockLevel';
type SortDirection = 'asc' | 'desc';

export const InventoryManager: React.FC<InventoryManagerProps> = ({ inventory, onUpdateInventory, onAdjustStock, onDeleteInventory, shopName, isSuperAdmin }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showOrderList, setShowOrderList] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('grade'); // Default sort by grade
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Top Shelf first

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Grade Weight for sorting (Higher number = Better grade)
  const getGradeWeight = (grade?: string): number => {
    switch (grade) {
      case FlowerGrade.TOP_SHELF: return 4;
      case FlowerGrade.TOP: return 3;
      case FlowerGrade.EXOTIC: return 2;
      case FlowerGrade.MID: return 1;
      default: return 0;
    }
  };

  // Grouped and Sorted Inventory
  const groupedInventory = useMemo(() => {
    const baseList = showOrderList ? outOfStockItems : activeItems;
    
    // Filter by search query first
    const filteredList = baseList.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
            item.name.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query) ||
            (item.grade && item.grade.toLowerCase().includes(query))
        );
    });

    // Then, sort the filtered list based on the criteria
    const sorted = [...filteredList].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'grade') {
        valA = getGradeWeight(a.grade);
        valB = getGradeWeight(b.grade);
      } else {
        valA = a[sortField] || '';
        valB = b[sortField] || '';
      }

      // Handle string case insensitivity
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Then, group them by category for display
    const groups: Record<ProductType, InventoryItem[]> = {
      [ProductType.FLOWER]: [],
      [ProductType.PRE_ROLL]: [],
      [ProductType.EDIBLE]: [],
      [ProductType.ACCESSORY]: [],
      [ProductType.OTHER]: []
    };

    sorted.forEach(item => {
      if (groups[item.category]) {
        groups[item.category].push(item);
      } else {
        groups[ProductType.OTHER].push(item);
      }
    });

    return groups;
  }, [showOrderList, activeItems, outOfStockItems, sortField, sortDirection, searchQuery]);

  const handleExportCSV = () => {
    if (inventory.length === 0) {
      alert("Inventory is empty. Nothing to export.");
      return;
    }

    const headers = ["Product Name", "Category", "Grade", "Stock Level", "Unit Price (THB)", "Last Updated"];
    const rows = inventory.map(item => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.category,
      item.grade || "N/A",
      item.stockLevel,
      item.price || 0,
      new Date(item.lastUpdated).toLocaleString()
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (inventory.length === 0) {
      alert("Inventory is empty.");
      return;
    }

    setIsExportingPDF(true);

    try {
      // 1. Get AI Summary
      const aiSummary = await generateInventoryAnalysis(inventory);

      // 2. Create an invisible container on the DOM to act as our "Paper"
      // We do this to ensure it renders at desktop width even on mobile phones.
      const printContainer = document.createElement('div');
      printContainer.id = 'pdf-print-container';
      printContainer.style.position = 'fixed';
      printContainer.style.top = '-9999px';
      printContainer.style.left = '0';
      printContainer.style.width = '1200px'; // Force wide layout
      printContainer.style.backgroundColor = '#ffffff';
      printContainer.style.fontFamily = 'Inter, sans-serif';
      printContainer.style.color = '#000000'; // FORCE BLACK TEXT
      printContainer.style.padding = '40px';
      
      // 3. Build the HTML String for the report
      let tableRows = '';
      
      Object.entries(groupedInventory).forEach(([category, items]) => {
         const invItems = items as InventoryItem[];
         if (invItems.length === 0) return;

         // Category Header - Force Text Color
         tableRows += `
            <tr style="background-color: #f0fdf4; border-bottom: 2px solid #22c55e;">
                <td colspan="4" style="padding: 12px; font-weight: 800; text-transform: uppercase; font-size: 14px; color: #166534;">
                    ${category} (${invItems.length})
                </td>
            </tr>
         `;

         // Items
         invItems.forEach((item, index) => {
             const rowBg = index % 2 === 0 ? '#ffffff' : '#f9fafb';
             const stockColor = item.stockLevel <= 5 ? '#dc2626' : '#374151'; // Red if low, Dark Gray otherwise
             
             // STRICTLY ENFORCE COLOR ON TD TO OVERRIDE ANY DARK MODE INHERITANCE
             tableRows += `
                <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 12px; font-weight: 600; color: #111827;">${item.name}</td>
                    <td style="padding: 12px; color: #6b7280; font-size: 12px;">${item.category}</td>
                    <td style="padding: 12px; color: #374151;">
                        ${item.grade 
                            ? `<span style="background-color: #e5e7eb; padding: 4px 8px; border-radius: 99px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #374151;">${item.grade}</span>` 
                            : item.price 
                                ? `<span style="font-family: monospace; color: #374151;">${item.price} THB</span>`
                                : '-'
                        }
                    </td>
                    <td style="padding: 12px; font-family: monospace; font-size: 14px; font-weight: bold; color: ${stockColor};">
                        ${item.stockLevel}
                    </td>
                </tr>
             `;
         });
      });

      printContainer.innerHTML = `
        <div style="margin-bottom: 30px; border-bottom: 4px solid #22c55e; padding-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: end;">
                <div>
                    <h1 style="font-size: 32px; font-weight: 900; margin: 0; color: #111827; text-transform: uppercase;">${shopName}</h1>
                    <p style="margin: 4px 0 0 0; color: #6b7280; letter-spacing: 0.1em; text-transform: uppercase; font-size: 12px;">Inventory Status Report</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-size: 14px; font-weight: bold; color: #111827;">${new Date().toLocaleDateString()}</p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">Generated by AI POS</p>
                </div>
            </div>
        </div>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e5e7eb;">
            <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #4b5563; text-transform: uppercase; display: flex; align-items: center;">
                <span style="background-color: #4f46e5; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; margin-right: 8px;">AI Summary</span>
                Executive Overview
            </h3>
            <p style="margin: 0; font-size: 14px; color: #374151; line-height: 1.5; font-style: italic;">
                "${aiSummary}"
            </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
            <thead>
                <tr style="background-color: #111827; color: white;">
                    <th style="padding: 12px; font-weight: 600; border-top-left-radius: 8px; color: #ffffff;">Product</th>
                    <th style="padding: 12px; font-weight: 600; color: #ffffff;">Type</th>
                    <th style="padding: 12px; font-weight: 600; color: #ffffff;">Details</th>
                    <th style="padding: 12px; font-weight: 600; border-top-right-radius: 8px; color: #ffffff;">Stock Level</th>
                </tr>
            </thead>
            <tbody>
                ${tableRows}
            </tbody>
        </table>
        
        <div style="margin-top: 40px; text-align: center; color: #d1d5db; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">
            End of Report • Internal Use Only
        </div>
      `;

      document.body.appendChild(printContainer);

      // 4. Capture the High-Res Image of the "Desktop" container
      const canvas = await html2canvas(printContainer, {
        scale: 2, // Retina quality
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // 5. Remove the temporary container
      document.body.removeChild(printContainer);

      // 6. Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `${shopName.replace(/\s+/g, '')}_Inventory_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error("PDF Generation failed", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExportingPDF(false);
    }
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
  };

  const handleDeleteClick = (id: string) => {
    if (deleteConfirmationId === id) {
        onDeleteInventory(id);
        setDeleteConfirmationId(null);
    } else {
        setDeleteConfirmationId(id);
        // Auto-reset confirmation after 3 seconds
        setTimeout(() => setDeleteConfirmationId(null), 3000);
    }
  }

  const availableCategories = Object.values(ProductType).filter(t => t !== ProductType.OTHER);

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-20" />;
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  const getCategoryIcon = (type: ProductType) => {
    switch (type) {
      case ProductType.FLOWER: return <Leaf className="w-4 h-4 mr-2 text-green-500" />;
      case ProductType.PRE_ROLL: return <Flame className="w-4 h-4 mr-2 text-orange-500" />;
      case ProductType.EDIBLE: return <Utensils className="w-4 h-4 mr-2 text-pink-500" />;
      case ProductType.ACCESSORY: return <Zap className="w-4 h-4 mr-2 text-blue-500" />;
      default: return <Package className="w-4 h-4 mr-2 text-gray-500" />;
    }
  };

  const getCategoryColor = (type: ProductType) => {
    switch (type) {
      case ProductType.FLOWER: return 'bg-green-50/50 dark:bg-green-900/10 text-green-800 dark:text-green-300';
      case ProductType.PRE_ROLL: return 'bg-orange-50/50 dark:bg-orange-900/10 text-orange-800 dark:text-orange-300';
      case ProductType.EDIBLE: return 'bg-pink-50/50 dark:bg-pink-900/10 text-pink-800 dark:text-pink-300';
      case ProductType.ACCESSORY: return 'bg-blue-50/50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300';
      default: return 'bg-gray-50/50 dark:bg-gray-700/30 text-gray-800 dark:text-gray-300';
    }
  };

  const hasData = Object.values(groupedInventory).some(list => (list as InventoryItem[]).length > 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors animate-fade-in">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col xl:flex-row justify-between items-start xl:items-center bg-gray-50 dark:bg-gray-700/30 gap-3">
        
        <div className="flex items-center justify-between w-full xl:w-auto">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center mr-4">
                {showOrderList ? (
                    <>
                        <ShoppingCart className="w-5 h-5 mr-2 text-amber-500" />
                        Order List ({outOfStockItems.length})
                    </>
                ) : (
                    "Inventory Management"
                )}
            </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 w-full xl:w-auto">
            
            {/* Search Bar */}
            <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search product..."
                    className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                <button 
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="flex items-center text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                title="Download Inventory as PDF"
                >
                {isExportingPDF ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <FileText className="w-3 h-3 mr-1" />} 
                PDF + AI
                </button>
                <button 
                onClick={handleExportCSV}
                className="flex items-center text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                title="Download Inventory as CSV"
                >
                <FileSpreadsheet className="w-3 h-3 mr-1" /> CSV
                </button>
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
                {!showOrderList && isSuperAdmin && (
                    <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                    >
                    <Plus className="w-3 h-3 mr-1" /> Add Product
                    </button>
                )}
            </div>
        </div>
      </div>

      {isAdding && isSuperAdmin && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3">{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
            <div className="lg:col-span-2">
                <input 
                type="text" 
                placeholder="Product Name" 
                value={formState.name || ''}
                onChange={e => setFormState({...formState, name: e.target.value})}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500 transition-all"
                />
            </div>
            <select 
              value={formState.category}
              onChange={e => setFormState({...formState, category: e.target.value as ProductType})}
              className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500 transition-all"
            >
              {availableCategories.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            
            {formState.category === ProductType.FLOWER ? (
              <select 
                value={formState.grade}
                onChange={e => setFormState({...formState, grade: e.target.value as FlowerGrade})}
                className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500 transition-all"
              >
                {Object.values(FlowerGrade).map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            ) : (
                <input 
                type="number" 
                placeholder="Unit Price (฿)" 
                value={formState.price || ''}
                onChange={e => setFormState({...formState, price: parseFloat(e.target.value)})}
                className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500 transition-all"
                />
            )}

            <input 
              type="number" 
              placeholder="Current Stock" 
              value={formState.stockLevel}
              onChange={e => setFormState({...formState, stockLevel: parseFloat(e.target.value)})}
              className="p-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md text-sm outline-none focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex space-x-2">
            <button onClick={handleSave} className="flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 transition-colors shadow-sm">
              <Save className="w-3 h-3 mr-1" /> Save
            </button>
            <button onClick={resetForm} className="flex items-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-200 px-3 py-1.5 rounded-md text-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm">
              <X className="w-3 h-3 mr-1" /> Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto" id="inventory-table-container">
        <table className="w-full text-sm text-left bg-transparent">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Product <SortIndicator field="name" />
                </div>
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center">
                  Type <SortIndicator field="category" />
                </div>
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('grade')}
              >
                <div className="flex items-center">
                  Details <SortIndicator field="grade" />
                </div>
              </th>
              <th 
                className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('stockLevel')}
              >
                <div className="flex items-center">
                  Stock <SortIndicator field="stockLevel" />
                </div>
              </th>
              {isSuperAdmin && <th className="px-4 py-3 text-right" data-pdf-hide>Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {!hasData ? (
               <tr>
                   <td colSpan={5} className="text-center py-12 text-gray-400 dark:text-gray-500">
                       {searchQuery ? (
                            <div className="flex flex-col items-center">
                                <Search className="w-10 h-10 mb-2 opacity-30" />
                                <p className="text-base font-medium">No matching items found.</p>
                                <p className="text-xs opacity-75">Try a different search term.</p>
                            </div>
                       ) : showOrderList ? (
                           <div className="flex flex-col items-center">
                               <ClipboardList className="w-10 h-10 mb-2 opacity-30" />
                               <p className="text-base font-medium">Order list is empty.</p>
                               <p className="text-xs opacity-75">All items are currently in stock!</p>
                           </div>
                       ) : (
                           <div className="flex flex-col items-center">
                               <Package className="w-10 h-10 mb-2 opacity-30" />
                               <p className="text-base font-medium">No items in inventory.</p>
                               <p className="text-xs opacity-75">Start by adding your first product.</p>
                           </div>
                       )}
                   </td>
               </tr>
            ) : (
              Object.entries(groupedInventory).map(([category, items]) => {
                const inventoryItems = items as InventoryItem[];
                if (inventoryItems.length === 0) return null;
                
                return (
                  <React.Fragment key={category}>
                    {/* Group Header Row */}
                    <tr className={`${getCategoryColor(category as ProductType)} border-y dark:border-gray-700`}>
                      <td colSpan={isSuperAdmin ? 5 : 4} className="px-4 py-2 font-bold uppercase tracking-widest text-[11px] flex items-center">
                        {getCategoryIcon(category as ProductType)}
                        {category} ({inventoryItems.length})
                      </td>
                    </tr>
                    
                    {/* Group Items */}
                    {inventoryItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{item.category}</td>
                        <td className="px-4 py-3">
                          {item.category === ProductType.FLOWER && item.grade ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm
                              ${item.grade === FlowerGrade.TOP_SHELF ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300' : 
                                item.grade === FlowerGrade.TOP ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                                item.grade === FlowerGrade.EXOTIC ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' : 
                                'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'}`}>
                              {item.grade}
                            </span>
                          ) : item.price ? (
                              <span className="text-gray-600 dark:text-gray-400 font-mono text-xs font-bold">
                                  {item.price} ฿
                              </span>
                          ) : (
                              <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-3">
                             <button 
                               onClick={() => onAdjustStock(item.id, -1)} 
                               disabled={!isSuperAdmin || (item.stockLevel <= 0 && showOrderList)}
                               className={`w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors touch-manipulation disabled:opacity-30 active:scale-95 ${!isSuperAdmin ? 'cursor-not-allowed opacity-40' : ''}`}
                               data-pdf-hide
                             >
                               <Minus className="w-3.5 h-3.5" />
                             </button>
                             <div className="flex flex-col items-center w-14">
                                <span className={`font-mono text-sm ${item.stockLevel <= 0 ? 'text-red-600 dark:text-red-400 font-bold' : item.stockLevel <= 10 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {item.stockLevel}
                                </span>
                                {item.stockLevel <= 0 && <span className="text-[9px] text-red-500 font-black tracking-tighter">EMPTY</span>}
                             </div>
                             <button 
                               onClick={() => onAdjustStock(item.id, 1)} 
                               disabled={!isSuperAdmin}
                               className={`w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors touch-manipulation active:scale-95 ${!isSuperAdmin ? 'cursor-not-allowed opacity-40' : ''}`}
                               data-pdf-hide
                             >
                               <Plus className="w-3.5 h-3.5" />
                             </button>
                             {!isSuperAdmin && (
                                <Lock className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                             )}
                          </div>
                        </td>
                        {isSuperAdmin && (
                            <td className="px-4 py-3 text-right" data-pdf-hide>
                            <div className="flex justify-end space-x-1 items-center">
                                <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                    onClick={() => handleDeleteClick(item.id)}
                                    className={`p-2 rounded-lg transition-all ${
                                        deleteConfirmationId === item.id 
                                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-md scale-110' 
                                        : 'text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20'
                                    }`}
                                    title={deleteConfirmationId === item.id ? "Confirm Delete" : "Delete Product"}
                                >
                                    {deleteConfirmationId === item.id ? (
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : (
                                        <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                </button>
                            </div>
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