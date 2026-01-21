import { SaleItem, InventoryItem, ProductType } from '../../types';
import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from "firebase/firestore";

// Collection Names
const SALES_COLLECTION = 'sales';
const INVENTORY_COLLECTION = 'inventory';

// --- REAL-TIME SUBSCRIPTIONS ---

// Listen to Sales updates
export const subscribeToSales = (callback: (sales: SaleItem[]) => void) => {
  // Query sales ordered by timestamp descending (newest first)
  const q = query(collection(db, SALES_COLLECTION), orderBy("timestamp", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const salesData: SaleItem[] = [];
    snapshot.forEach((doc) => {
      salesData.push(doc.data() as SaleItem);
    });
    callback(salesData);
  }, (error) => {
    console.error("Error subscribing to sales:", error);
  });
};

// Listen to Inventory updates
export const subscribeToInventory = (callback: (inventory: InventoryItem[]) => void) => {
  const q = query(collection(db, INVENTORY_COLLECTION));
  
  return onSnapshot(q, (snapshot) => {
    const inventoryData: InventoryItem[] = [];
    snapshot.forEach((doc) => {
      inventoryData.push(doc.data() as InventoryItem);
    });
    callback(inventoryData);
  }, (error) => {
    console.error("Error subscribing to inventory:", error);
  });
};

// --- ACTIONS ---

export const addSaleToCloud = async (sale: SaleItem) => {
  try {
    // Save the sale document using its ID
    await setDoc(doc(db, SALES_COLLECTION, sale.id), sale);
    return true;
  } catch (e) {
    console.error("Error adding sale: ", e);
    return false;
  }
};

export const updateInventoryInCloud = async (item: InventoryItem) => {
  try {
    await setDoc(doc(db, INVENTORY_COLLECTION, item.id), item);
    return true;
  } catch (e) {
    console.error("Error updating inventory: ", e);
    return false;
  }
};

export const adjustStockInCloud = async (itemId: string, currentStock: number, adjustment: number) => {
  try {
    const itemRef = doc(db, INVENTORY_COLLECTION, itemId);
    // We pass the new calculated value directly to ensure consistency with the UI state passed in
    await updateDoc(itemRef, {
      stockLevel: currentStock + adjustment,
      lastUpdated: Date.now()
    });
    return true;
  } catch (e) {
    console.error("Error adjusting stock: ", e);
    return false;
  }
};

export const clearSalesInCloud = async (sales: SaleItem[]) => {
  const batch = writeBatch(db);
  sales.forEach((sale) => {
    const ref = doc(db, SALES_COLLECTION, sale.id);
    batch.delete(ref);
  });
  await batch.commit();
};

// --- MIGRATION TOOL (LocalStorage -> Firestore) ---

export const migrateLocalToCloud = async () => {
  try {
    const localSales = localStorage.getItem('greentrack_sales');
    const localInv = localStorage.getItem('greentrack_inventory');
    
    const batch = writeBatch(db);
    let count = 0;

    if (localInv) {
      const items: InventoryItem[] = JSON.parse(localInv);
      items.forEach(item => {
        const ref = doc(db, INVENTORY_COLLECTION, item.id);
        batch.set(ref, item);
        count++;
      });
    }

    if (localSales) {
      const sales: SaleItem[] = JSON.parse(localSales);
      sales.forEach(sale => {
        const ref = doc(db, SALES_COLLECTION, sale.id);
        batch.set(ref, sale);
        count++;
      });
    }

    if (count > 0) {
      await batch.commit();
      return `Successfully migrated ${count} items to cloud!`;
    }
    return "No legacy offline data found on this device. Your recent data is already in the Cloud.";

  } catch (e) {
    console.error("Migration failed", e);
    return "Migration failed. Check console for details.";
  }
};

// Fallback for default inventory if cloud is empty
export const seedDefaultInventory = async () => {
    const defaultInventory: InventoryItem[] = [
      { id: '1', category: ProductType.FLOWER, name: 'Sour Diesel', grade: 'Mid' as any, stockLevel: 100, lastUpdated: Date.now() },
      { id: '2', category: ProductType.FLOWER, name: 'Blue Dream', grade: 'Top' as any, stockLevel: 50, lastUpdated: Date.now() },
    ];
    
    const batch = writeBatch(db);
    defaultInventory.forEach(item => {
        batch.set(doc(db, INVENTORY_COLLECTION, item.id), item);
    });
    await batch.commit();
}