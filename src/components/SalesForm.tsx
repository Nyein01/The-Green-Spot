import React, { useState, useEffect, useRef } from 'react';
import { ProductType, FlowerGrade, InventoryItem, SaleItem } from '../types';
import { calculateFlowerPrice, formatCurrency, generateId } from '../utils/pricing';
import { ShoppingCart, Search, X, Check, Banknote, QrCode, User, Plus, Trash2, ListChecks, Flower2, Cigarette, Cookie, Flame, Package } from 'lucide-react';
import { translations, Language } from '../utils/translations';

interface SalesFormProps {
  inventory: InventoryItem[];
  onSaleComplete: (sale: SaleItem) => void;
  onStockUpdate: (inventory: InventoryItem[]) => void;
  staffName: string;
  language: Language;
}

export const SalesForm: React.FC<SalesFormProps> = ({ inventory, onSaleComplete, staffName, language }) => {
  // Cart State
  const [cart, setCart] = useState<SaleItem[]>([]);

  // Form Input State
  const [productType, setProductType] = useState<ProductType>(ProductType.FLOWER);
  const [selectedStrain, setSelectedStrain] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [grade, setGrade] = useState<FlowerGrade>(FlowerGrade.MID);
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [basePrice, setBasePrice] = useState<number>(0); 
  const [isAutoPrice, setIsAutoPrice] = useState<boolean>(true);
  
  // Transaction Global Settings
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Scan'>('Cash');
  const [customerName, setCustomerName] = useState<string>('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

  const availableItems = inventory.filter(i => 
    i.category === productType && 
    i.stockLevel > 0 &&
    (searchQuery === '' || i.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Price Calculation Logic
  useEffect(() => {
    let calculated = 0;
    if (productType === ProductType.FLOWER) {
      const item = inventory.find(i => i.name === selectedStrain && i.category === ProductType.FLOWER);
      const effectiveGrade = item?.grade || grade;
      if (item && item.grade && item.grade !== grade) setGrade(item.grade);
      calculated = calculateFlowerPrice(effectiveGrade, quantity);
    } else {
        const item = inventory.find(i => i.name === selectedStrain && i.category === productType);
        if (item && item.price) calculated = item.price * quantity;
    }
    setBasePrice(calculated);
  }, [productType, selectedStrain, grade, quantity, inventory]);

  // Auto-Price Logic (Discount logic removed)
  useEffect(() => {
    if (!isAutoPrice) return;
    setPrice(basePrice);
  }, [basePrice, isAutoPrice]);

  const handleAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStrain) return;

    const newItem: SaleItem = {
      id: generateId(),
      timestamp: Date.now(), // Temporary timestamp
      date: new Date().toISOString().split('T')[0],
      productType,
      productName: selectedStrain,
      grade: productType === ProductType.FLOWER ? grade : undefined,
      quantity,
      price: Number(price),
      originalPrice: basePrice,
      isNegotiated: !isAutoPrice,
      staffName: staffName,
      paymentMethod: paymentMethod, // Placeholder, will be overwritten at checkout
      discount: 0,
      customerName: customerName // Placeholder
    };

    setCart([...cart, newItem]);
    
    // Reset Item Fields
    setQuantity(1);
    setIsAutoPrice(true);
    setSearchQuery('');
    setSelectedStrain('');
    setIsDropdownOpen(false);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Apply global settings (Payment method, Customer Name, Timestamp) to all items
    const timestamp = Date.now();
    const date = new Date().toISOString().split('T')[0];

    cart.forEach(item => {
        const finalItem: SaleItem = {
            ...item,
            timestamp,
            date,
            paymentMethod,
            customerName: customerName || undefined,
            staffName: staffName
        };
        onSaleComplete(finalItem);
    });

    // Clear everything
    setCart([]);
    setCustomerName('');
    setPaymentMethod('Cash');
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

  const getProductIcon = (type: ProductType) => {
    switch (type) {
      case ProductType.FLOWER: return <Flower2 className="w-4 h-4" />;
      case ProductType.PRE_ROLL: return <Cigarette className="w-4 h-4" />;
      case ProductType.EDIBLE: return <Cookie className="w-4 h-4" />;
      case ProductType.ACCESSORY: return <Flame className="w-4 h-4" />;
      case ProductType.OTHER: return <Package className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const visibleTypes = Object.values(ProductType).filter(t => t !== ProductType.OTHER);

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fade-in max-w-7xl mx-auto">
      
      {/* LEFT SIDE: Item Entry Form */}
      <div className="glass-panel p-6 rounded-2xl relative flex-1">
          <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                <Plus className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-bold text-white">Add Item to Order</h2>
          </div>

          {/* Product Type Tabs */}
          <div className="bg-slate-900/50 p-1 rounded-xl flex gap-1 mb-6 border border-white/5 overflow-x-auto">
              {visibleTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`flex-1 min-w-[100px] py-3 px-3 text-xs font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    productType === type
                      ? 'bg-gradient-to-br from-green-500 to-emerald-700 text-white shadow-lg shadow-green-900/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {getProductIcon(type)}
                  {type}
                </button>
              ))}
          </div>

          <form onSubmit={handleAddToCart} className="space-y-6">
            
            {/* Search Input */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">{t.productStrain}</label>
              <div className="relative group">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500 group-focus-within:text-green-400 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-11 pr-10 py-3 bg-slate-900/60 border border-slate-700/50 rounded-xl text-sm text-white focus:ring-1 focus:ring-green-500 focus:border-green-500/50 transition-all outline-none"
                />
                {searchQuery && (
                    <button type="button" onClick={() => { setSearchQuery(''); setSelectedStrain(''); }} className="absolute right-3 top-3.5 text-slate-500 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                )}
              </div>

              {isDropdownOpen && (
                <div className="absolute z-30 mt-2 w-full bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto custom-scrollbar">
                  {availableItems.length === 0 ? (
                    <div className="p-4 text-center text-sm text-slate-500 italic">No items found.</div>
                  ) : (
                    availableItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors flex justify-between items-center group"
                      >
                        <div>
                          <div className="font-bold text-white flex items-center">
                            {item.name}
                            {selectedStrain === item.name && <Check className="w-4 h-4 ml-2 text-green-400" />}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                            {item.grade && <span className="bg-slate-700 px-1.5 rounded text-slate-300">{item.grade}</span>}
                            <span className={item.stockLevel < 10 ? "text-amber-500" : ""}>{t.stock}: {item.stockLevel}</span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Grade & Quantity Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {productType === ProductType.FLOWER && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">{t.grade}</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.values(FlowerGrade).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => { setGrade(g); setIsAutoPrice(true); }}
                          className={`py-2 px-1 text-[10px] font-bold uppercase rounded-lg border transition-all ${
                            grade === g
                              ? 'bg-green-500/20 border-green-500 text-green-400'
                              : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">
                    {t.quantity} <span className="text-slate-600 normal-case">({productType === ProductType.FLOWER ? 'grams' : 'units'})</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setQuantity(Math.max(0.5, quantity - 0.5))} className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold transition-colors">-</button>
                    <input
                      type="number"
                      step="0.5"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                      className="flex-1 h-10 bg-slate-900/60 border border-slate-700 rounded-lg text-center text-white font-mono font-bold focus:border-green-500 outline-none"
                    />
                    <button type="button" onClick={() => setQuantity(quantity + 0.5)} className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold transition-colors">+</button>
                  </div>
                </div>
            </div>

            {/* Price Display */}
            <div className="bg-black/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.totalPrice}</label>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-green-400 font-mono tracking-tighter">{formatCurrency(price)}</span>
                    </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsAutoPrice(!isAutoPrice); }}
                  className="text-[10px] text-blue-400 hover:text-white underline decoration-dashed underline-offset-4 opacity-60 hover:opacity-100"
                >
                  {isAutoPrice ? t.manualAdjustment : t.revertAuto}
                </button>
            </div>
            
            {!isAutoPrice && (
                <input 
                    type="number" 
                    value={price} 
                    onChange={e => setPrice(parseFloat(e.target.value)||0)} 
                    className="w-full bg-slate-900 border border-blue-500/50 text-blue-400 font-bold text-center py-2 rounded-lg outline-none"
                />
            )}

            {/* Add to Cart Button */}
            <button
              type="submit"
              disabled={!selectedStrain}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 rounded-xl shadow-lg border border-white/5 transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
               <ShoppingCart className="w-5 h-5" />
               Add to Order
            </button>
          </form>
      </div>

      {/* RIGHT SIDE: Cart & Checkout */}
      <div className="glass-panel p-6 rounded-2xl relative w-full lg:w-[400px] flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
             <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <ListChecks className="w-5 h-5" />
             </div>
             <h2 className="text-xl font-bold text-white">Current Order</h2>
             <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">{cart.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 space-y-3 custom-scrollbar pr-2">
              {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl p-8">
                      <ShoppingCart className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-sm">Cart is empty</p>
                  </div>
              ) : (
                  cart.map((item) => (
                      <div key={item.id} className="bg-slate-800/50 border border-white/5 p-3 rounded-xl flex justify-between items-center group hover:bg-slate-800 transition-colors">
                          <div>
                              <p className="font-bold text-sm text-white">{item.productName}</p>
                              <p className="text-xs text-slate-400">
                                  {item.quantity}{item.productType === ProductType.FLOWER ? 'g' : 'u'} 
                                  {item.grade && ` • ${item.grade}`}
                              </p>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="font-mono font-bold text-green-400">{formatCurrency(item.price)}</span>
                              <button onClick={() => handleRemoveFromCart(item.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      </div>
                  ))
              )}
          </div>

          {/* Checkout Controls */}
          <div className="mt-auto space-y-4 pt-4 border-t border-white/10">
              
              {/* Global Customer & Payment */}
              <div className="bg-slate-900/50 p-3 rounded-xl space-y-3">
                 <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input 
                        type="text" 
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer Name (Optional)"
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-green-500 outline-none"
                    />
                 </div>
                 <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
                     <button type="button" onClick={() => setPaymentMethod('Cash')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold transition-all ${paymentMethod === 'Cash' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}><Banknote className="w-3 h-3" /> {t.cash}</button>
                     <button type="button" onClick={() => setPaymentMethod('Scan')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-bold transition-all ${paymentMethod === 'Scan' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}><QrCode className="w-3 h-3" /> {t.scan}</button>
                 </div>
              </div>

              {/* Total & Action */}
              <div className="flex justify-between items-end">
                  <div>
                      <p className="text-xs text-slate-400 uppercase tracking-widest">Grand Total</p>
                      <p className="text-3xl font-black text-green-400 font-mono tracking-tighter">{formatCurrency(cartTotal)}</p>
                  </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-lg"
              >
                 Complete Transaction
              </button>
          </div>
      </div>
    </div>
  );
};