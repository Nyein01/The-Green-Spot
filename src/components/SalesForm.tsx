import React, { useState, useEffect } from 'react';
import { ProductType, FlowerGrade, InventoryItem, SaleItem } from '../types';
import { calculateFlowerPrice, formatCurrency, generateId } from '../utils/pricing';
import { ShoppingCart, Tag, AlertCircle } from 'lucide-react';

interface SalesFormProps {
  inventory: InventoryItem[];
  onSaleComplete: (sale: SaleItem) => void;
  onStockUpdate: (inventory: InventoryItem[]) => void;
}

export const SalesForm: React.FC<SalesFormProps> = ({ inventory, onSaleComplete, onStockUpdate }) => {
  const [productType, setProductType] = useState<ProductType>(ProductType.FLOWER);
  const [selectedStrain, setSelectedStrain] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [grade, setGrade] = useState<FlowerGrade>(FlowerGrade.MID);
  const [quantity, setQuantity] = useState<number>(1);
  const [price, setPrice] = useState<number>(0);
  const [isAutoPrice, setIsAutoPrice] = useState<boolean>(true);
  const [isCustomEntry, setIsCustomEntry] = useState(false);

  // Filter inventory based on selected type
  const availableItems = inventory.filter(i => i.category === productType && i.stockLevel > 0);

  // Auto-calculate price when dependencies change
  useEffect(() => {
    if (!isAutoPrice) return;

    if (productType === ProductType.FLOWER) {
      // Find the grade of the selected strain if possible
      const item = inventory.find(i => i.name === selectedStrain && i.category === ProductType.FLOWER);
      const effectiveGrade = item?.grade || grade;
      
      // If we found an inventory item, sync the local grade state to it (optional, but good UX)
      if (item && item.grade && item.grade !== grade) {
        setGrade(item.grade);
      }
      
      const calcPrice = calculateFlowerPrice(effectiveGrade, quantity);
      setPrice(calcPrice);
    } else if (productType !== ProductType.OTHER || !isCustomEntry) {
        // For non-flower, non-custom items, calculate based on inventory price
        const item = inventory.find(i => i.name === selectedStrain && i.category === productType);
        if (item && item.price) {
            setPrice(item.price * quantity);
        } else {
             // If no price set, defaults to 0
             setPrice(0); 
        }
    }
  }, [productType, selectedStrain, grade, quantity, isAutoPrice, inventory, isCustomEntry]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isCustom = productType === ProductType.OTHER && (availableItems.length === 0 || isCustomEntry);
    const productName = isCustom ? customName : selectedStrain;
    
    if (!productName) return alert("Please select or enter a product name.");

    // Recalculate original price to ensure data integrity
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
      productType,
      productName,
      grade: productType === ProductType.FLOWER ? grade : undefined,
      quantity,
      price: Number(price),
      originalPrice,
      isNegotiated: !isAutoPrice,
    };

    onSaleComplete(sale);
    
    // Reset minimal fields to make next sale faster
    setQuantity(1);
    setIsAutoPrice(true);
    setCustomName('');
  };

  const handleTypeChange = (type: ProductType) => {
      setProductType(type);
      setSelectedStrain('');
      setIsAutoPrice(true);
      setIsCustomEntry(false);
  }

  // Hide OTHER from UI selection
  const visibleTypes = Object.values(ProductType).filter(t => t !== ProductType.OTHER);

  return (
    <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
      <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800 dark:text-gray-100">
        <ShoppingCart className="w-5 h-5 mr-2 text-green-600 dark:text-green-500" />
        New Sale
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Type Selection */}
        <div className="grid grid-cols-4 gap-2">
          {visibleTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeChange(type)}
              className={`px-2 py-2 sm:px-3 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                productType === type
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Product Name / Strain */}
        <div>
          <div className="flex justify-between items-center mb-1">
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product / Strain</label>
          </div>
          
          <div className="relative">
            <select
            value={selectedStrain}
            onChange={(e) => setSelectedStrain(e.target.value)}
            className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm p-3 sm:p-2 border focus:ring-2 focus:ring-green-500 focus:outline-none appearance-none"
            required
            >
            <option value="">Select Item</option>
            {availableItems.length === 0 && <option disabled>No {productType} items in stock</option>}
            {availableItems.map((item) => (
                <option key={item.id} value={item.name}>
                {item.name} {item.price ? `(${item.price}฿)` : item.grade ? `(${item.grade})` : ''} - Stock: {item.stockLevel}
                </option>
            ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          
          {availableItems.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                  * Go to Inventory tab to add new items or restock.
              </p>
          )}
        </div>

        {/* Flower Specifics: Grade */}
        {productType === ProductType.FLOWER && (
          <div>
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
                  className={`px-2 py-2 text-xs font-semibold rounded-md border ${
                    grade === g
                      ? 'bg-green-50 dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 ring-1 ring-green-500'
                      : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quantity {productType === ProductType.FLOWER ? '(grams)' : '(units)'}
          </label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(productType === ProductType.FLOWER ? 0.5 : 1, quantity - (productType === ProductType.FLOWER ? 0.5 : 1)))}
              className="p-3 sm:p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 touch-manipulation"
            >
              -
            </button>
            <input
              type="number"
              step={productType === ProductType.FLOWER ? "0.1" : "1"}
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              className="w-full text-center border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg shadow-sm p-3 sm:p-2 border"
            />
            <button
              type="button"
              onClick={() => setQuantity(quantity + (productType === ProductType.FLOWER ? 0.5 : 1))}
              className="p-3 sm:p-2 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 touch-manipulation"
            >
              +
            </button>
          </div>
        </div>

        {/* Price & Negotiation */}
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Price</label>
            <button
              type="button"
              onClick={() => setIsAutoPrice(!isAutoPrice)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center p-1"
            >
              <Tag className="w-3 h-3 mr-1" />
              {isAutoPrice ? 'Enable Negotiation' : 'Revert to Auto'}
            </button>
          </div>
          <div className="flex items-center relative">
            <span className="absolute left-3 text-gray-500 dark:text-gray-400 text-lg">฿</span>
            <input
              type="number"
              value={price}
              readOnly={isAutoPrice}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className={`w-full pl-8 pr-4 py-3 text-2xl font-bold rounded-lg border focus:ring-2 focus:outline-none ${
                isAutoPrice 
                  ? 'bg-gray-100 dark:bg-gray-600 border-transparent text-gray-500 dark:text-gray-300' 
                  : 'bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-500 text-blue-600 dark:text-blue-400 focus:ring-blue-500'
              }`}
            />
          </div>
          {!isAutoPrice && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              Price manually adjusted
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!price && productType === ProductType.OTHER} // Basic validation
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:scale-95 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm Sale
        </button>
      </form>
    </div>
  );
};