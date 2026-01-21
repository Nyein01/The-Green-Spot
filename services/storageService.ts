import { SaleItem, InventoryItem } from '../types';

const SALES_KEY = 'greentrack_sales';
const INVENTORY_KEY = 'greentrack_inventory';

export const getSales = (): SaleItem[] => {
  const data = localStorage.getItem(SALES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveSale = (sale: SaleItem) => {
  const sales = getSales();
  const newSales = [sale, ...sales];
  localStorage.setItem(SALES_KEY, JSON.stringify(newSales));
  return newSales;
};

export const clearSales = () => {
  localStorage.setItem(SALES_KEY, JSON.stringify([]));
};

export const getInventory = (): InventoryItem[] => {
  const data = localStorage.getItem(INVENTORY_KEY);
  // Default inventory if empty for demo purposes
  if (!data) {
    const defaultInventory: InventoryItem[] = [
      { id: '1', category: 'Flower' as any, name: 'Sour Diesel', grade: 'Mid' as any, stockLevel: 100, lastUpdated: Date.now() },
      { id: '2', category: 'Flower' as any, name: 'Blue Dream', grade: 'Top' as any, stockLevel: 50, lastUpdated: Date.now() },
    ];
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(defaultInventory));
    return defaultInventory;
  }
  return JSON.parse(data);
};

export const updateInventoryItem = (item: InventoryItem) => {
  const inventory = getInventory();
  const index = inventory.findIndex((i) => i.id === item.id);
  if (index >= 0) {
    inventory[index] = item;
  } else {
    inventory.push(item);
  }
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  return inventory;
};

export const adjustStock = (itemId: string, adjustment: number) => {
  const inventory = getInventory();
  const item = inventory.find((i) => i.id === itemId);
  if (item) {
    item.stockLevel += adjustment;
    item.lastUpdated = Date.now();
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
  }
  return inventory;
};

// Data Export/Import for "Multi-user" manual sync
export const exportData = () => {
  const data = {
    sales: getSales(),
    inventory: getInventory(),
    exportedAt: Date.now(),
  };
  return JSON.stringify(data);
};

export const importData = (jsonString: string) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.sales && Array.isArray(data.sales)) {
      localStorage.setItem(SALES_KEY, JSON.stringify(data.sales));
    }
    if (data.inventory && Array.isArray(data.inventory)) {
      localStorage.setItem(INVENTORY_KEY, JSON.stringify(data.inventory));
    }
    return true;
  } catch (e) {
    console.error("Failed to import data", e);
    return false;
  }
};