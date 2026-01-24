import React, { useState, useEffect, useRef } from 'react';
import { ProductType, FlowerGrade, InventoryItem, SaleItem } from '../types';
import { calculateFlowerPrice, formatCurrency, generateId } from '../utils/pricing';
import { ShoppingCart, Tag, AlertCircle, Search, X, ChevronDown, Check, Loader2, PartyPopper, Banknote, QrCode, Flame, Trophy } from 'lucide-react';

interface SalesFormProps {
  inventory: InventoryItem[];
  onSaleComplete: (sale: SaleItem) => void;
  onStockUpdate: (inventory: InventoryItem[]) => void;
  staffName: string;
}

export const SalesForm: React.FC<SalesFormProps> = ({ inventory, onSaleComplete, onStockUpdate, staffName }) => {
  const [productType, setProductType] = useState<ProductType>(ProductType.FLOWER);
  const [selectedStrain, setSelectedStrain] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [grade, setGrade] = useState<FlowerGrade>(FlowerGrade.MID);
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [isAutoPrice, setIsAutoPrice] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Scan'>('Cash');
  
  // Cool Features State
  const [streak, setStreak] = useState(0);
  const [showNice, setShowNice] = useState(false);
  const [showWhale, setShowWhale] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter inventory based on selected type and search query
  const availableItems = inventory.filter(i => 
    i.category === productType && 
    i.stockLevel > 0 &&
    (searchQuery === '' || i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-calculate price when dependencies change
  useEffect(() => {
    if (!isAutoPrice) return;

    if (productType === ProductType.FLOWER) {
      const item = inventory.find(i => i.name === selectedStrain && i.category === ProductType.FLOWER);
      const effectiveGrade = item?.grade || grade;
      
      if (item && item.grade && item.grade !== grade) {
        setGrade(item.grade);
      }
      
      const calcPrice = calculateFlowerPrice(effectiveGrade, quantity);
      setPrice(calcPrice);
    } else {
        const item = inventory.find(i => i.name === selectedStrain && i.category === productType);
        if (item && item.price) {
            setPrice(item.price * quantity);
        } else {
             setPrice(0); 
        }
    }
  }, [productType, selectedStrain, grade, quantity, isAutoPrice, inventory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStrain) return alert("Please select a product.");

    // Gamification Triggers
    setStreak(prev => prev + 1);

    if (price === 420) {
        setShowNice(true);
        setTimeout(() => setShowNice(false), 2500);
    }

    if (price >= 2000) {
        setShowWhale(true);
        setTimeout(() => setShowWhale(false), 3000);
    }

    // Recalculate original price for data integrity
    let originalPrice = 0;
    if (productType === ProductType.FLOWER) {
        originalPrice = calculateFlowerPrice(grade, quantity);
    } else {
        const item = inventory.find(i => i.name === selectedStrain && i.category === productType);
        originalPrice = item && item.price ? item.price * quantity : Number(price);
    }

    const sale: SaleItem = {
      id: generateId(),
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      productType,
      productName: selectedStrain,
      grade: productType === ProductType.FLOWER ? grade : undefined,
      quantity,
      price: Number(price),
      originalPrice,
      isNegotiated: !isAutoPrice,
      staffName: staffName,
      paymentMethod: paymentMethod
    };

    onSaleComplete(sale);
    
    // Reset fields
    setQuantity(1);
    setIsAutoPrice(true);
    setSearchQuery('');
    setSelectedStrain('');
    setIsDropdownOpen(false);
    setPaymentMethod('Cash'); // Reset to default
  };

  const handleTypeChange = (type: ProductType) => {
      setProductType(type);
      setSelectedStrain('');
      setSearchQuery('');
      setIsAutoPrice(true);
      setIsDropdownOpen(false);
  }

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedStrain(item.name);
    setSearchQuery(item.name);
    setIsDropdownOpen(false);
  };

  const visibleTypes = Object.values(ProductType).filter(t => t !== ProductType.OTHER);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors animate-fade-in relative overflow-hidden">
      
      {/* 420 Overlay */}
      {showNice && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
              <div className="text-center animate-bounce">
                  <h1 className="text-8xl font-black text-green-500 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]">420</h1>
                  <p className="text-white text-2xl font-bold uppercase tracking-widest mt-4">Nice.</p>
              </div>
          </div>
      )}

      {/* Whale Alert Overlay */}
      {showWhale && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-900/80 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
              <div className="text-center">
                  <div className="text-9xl animate-pulse">🐋</div>
                  <h1 className="text-4xl font-black text-white mt-4">WHALE ALERT!</h1>
                  <p className="text-blue-200 text-xl font-bold uppercase tracking-widest mt-2">Big Spender Detected</p>
                  <p className="text-white font-mono text-3xl mt-4 bg-blue-800 inline-block px-4 py-2 rounded-lg border border-blue-400">{formatCurrency(price)}</p>
              </div>
          </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center text-gray-800 dark:text-gray-100">
            <ShoppingCart className="w-5 h-5 mr-2 text-green-600 dark:text-green-500" />
            New Sale
        </h2>
        <div className="flex items-center space-x-2">
            {streak > 1 && (
                <div className="flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-bold animate-pulse">
                    <Flame className="w-3 h-3 mr-1" />
                    Hot Streak: {streak}
                </div>
            )}
            <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                Staff: {staffName}
            </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Type Selection */}
        <div className="grid grid-cols-4 gap-2">
          {visibleTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`px-2 py-2 sm:px-3 text-xs sm:text-sm font-medium rounded-lg transition-all transform hover:scale-105 ${
                productType === type
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Searchable Product Selection */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Product / Strain</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-green-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              placeholder={`Type to search ${productType}...`}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none text-sm transition-all"
            />
            {searchQuery && (
                <button 
                  type="button"
                  onClick={() => { setSearchQuery(''); setSelectedStrain(''); }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
            )}
          </div>

          {/* Dropdown Results */}
          {isDropdownOpen && (
            <div className="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
              {availableItems.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 italic dark:text-gray-400">
                  {inventory.filter(i => i.category === productType).length === 0 
                    ? `No ${productType} items in stock.` 
                    : "No matching items found."}
                </div>
              ) : (
                availableItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={`w-full text-left px-4 py-3 flex justify-between items-center hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border-b last:border-0 border-gray-50 dark:border-gray-700 ${selectedStrain === item.name ? 'bg-green-50 dark:bg-green-900/30' : ''}`}
                  >
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white flex items-center">
                        {item.name}
                        {selectedStrain === item.name && <Check className="w-4 h-4 ml-2 text-green-500" />}
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-tight flex items-center mt-0.5">
                        {item.grade ? <span className="mr-2 font-bold text-blue-500 dark:text-blue-400">{item.grade}</span> : null}
                        {item.price ? <span className="mr-2">{item.price} ฿</span> : null}
                        <span>Stock: {item.stockLevel} {productType === ProductType.FLOWER ? 'g' : 'pcs'}</span>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Flower Specifics: Grade (Syncs with selected item but allows override if needed) */}
        {productType === ProductType.FLOWER && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.values(FlowerGrade).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    setGrade(g);
                    setIsAutoPrice(true);
                  }}
                  className={`px-2 py-2 text-xs font-semibold rounded-md border transition-all ${
                    grade === g
                      ? 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 ring-1 ring-green-500 transform scale-105 shadow-sm'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="animate-in fade-in slide-in-from-left-2 duration-300 delay-75">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quantity {productType === ProductType.FLOWER ? '(grams)' : '(units)'}
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(productType === ProductType.FLOWER ? 0.5 : 1, quantity - (productType === ProductType.FLOWER ? 0.5 : 1)))}
              className="p-3 sm:p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 touch-manipulation transition-colors"
            >
              -
            </button>
            <input
              type="number"
              step={productType === ProductType.FLOWER ? "0.1" : "1"}
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full text-center border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm p-3 sm:p-2 border focus:ring-2 focus:ring-green-500 outline-none font-bold"
            />
            <button
              type="button"
              onClick={() => setQuantity(quantity + (productType === ProductType.FLOWER ? 0.5 : 1))}
              className="p-3 sm:p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 touch-manipulation transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Price & Negotiation */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 animate-in fade-in slide-in-from-left-2 duration-300 delay-100">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Price</label>
            <button
              type="button"
              onClick={() => setIsAutoPrice(!isAutoPrice)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center p-1"
            >
              <Tag className="w-3 h-3 mr-1" />
              {isAutoPrice ? 'Manual Adjustment' : 'Revert to Auto'}
            </button>
          </div>
          <div className="flex items-center relative">
            <span className="absolute left-3 text-gray-500 dark:text-gray-400 text-lg">฿</span>
            <input
              type="number"
              value={price}
              readOnly={isAutoPrice}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className={`w-full pl-8 pr-4 py-3 text-2xl font-bold rounded-lg border focus:ring-2 focus:outline-none transition-all ${
                isAutoPrice 
                  ? 'bg-gray-100 dark:bg-gray-600 border-transparent text-gray-500 dark:text-gray-300' 
                  : 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-500 text-blue-600 dark:text-blue-400 focus:ring-blue-500 shadow-inner'
              }`}
            />
            {price === 420 && !showNice && (
                <div className="absolute right-3 animate-bounce">
                    <span className="text-lg">🌿</span>
                </div>
            )}
          </div>
          {price === 420 ? (
             <p className="text-xs font-bold text-green-600 dark:text-green-400 mt-1 flex items-center animate-pulse">
                <PartyPopper className="w-3 h-3 mr-1" />
                Perfect.
             </p>
          ) : !isAutoPrice && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center animate-pulse">
              <AlertCircle className="w-3 h-3 mr-1" />
              Price manually adjusted
            </p>
          )}
        </div>

        {/* Payment Method Selector */}
        <div className="animate-in fade-in slide-in-from-left-2 duration-300 delay-150">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
                <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`flex items-center justify-center p-3 rounded-lg border transition-all ${
                        paymentMethod === 'Cash'
                        ? 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/40 dark:text-green-300 dark:border-green-600 shadow-md transform scale-[1.02]'
                        : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                >
                    <Banknote className="w-5 h-5 mr-2" />
                    <span className="font-bold">Cash</span>
                </button>
                <button
                    type="button"
                    onClick={() => setPaymentMethod('Scan')}
                    className={`flex items-center justify-center p-3 rounded-lg border transition-all ${
                        paymentMethod === 'Scan'
                        ? 'bg-blue-100 border-blue-500 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-600 shadow-md transform scale-[1.02]'
                        : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                >
                    <QrCode className="w-5 h-5 mr-2" />
                    <span className="font-bold">Scan</span>
                </button>
            </div>
        </div>

        <button
          type="submit"
          disabled={!selectedStrain}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 touch-manipulation disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed flex items-center justify-center"
        >
          {streak > 2 ? <Flame className="w-5 h-5 mr-2 animate-bounce" /> : null}
          Confirm Sale
        </button>
      </form>
    </div>
  );
};