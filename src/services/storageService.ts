import { SaleItem, InventoryItem, ProductType } from '../types';
import { db } from '../firebaseConfig';
// @ts-ignore
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from "firebase/firestore";

// Collection Names
const SALES_COLLECTION = 'sales';
const INVENTORY_COLLECTION = 'inventory';

// Helper to sanitize objects for Firestore (removes undefined values)
const sanitize = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

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
    // @ts-ignore
    if (error.code === 'permission-denied') {
        alert("DATABASE ERROR: Permission Denied.\n\nPlease go to Firebase Console > Firestore > Rules and set 'allow read, write: if true;'");
    } else {
        console.warn("Database connection issue (Sales):", error.message);
    }
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
    // @ts-ignore
    if (error.code === 'permission-denied') {
        alert("DATABASE PERMISSION ERROR (Inventory):\n\nPlease go to Firebase Console > Firestore > Rules and change 'allow read, write: if false;' to 'allow read, write: if true;'");
    }
  });
};

// --- ACTIONS ---

export const addSaleToCloud = async (sale: SaleItem) => {
  try {
    await setDoc(doc(db, SALES_COLLECTION, sale.id), sanitize(sale));
    return true;
  } catch (e: any) {
    console.error("Error adding sale: ", e);
    alert(`Failed to save sale: ${e.message}`);
    return false;
  }
};

export const deleteSaleFromCloud = async (saleId: string) => {
  try {
    await deleteDoc(doc(db, SALES_COLLECTION, saleId));
    return true;
  } catch (e: any) {
    console.error("Error deleting sale: ", e);
    alert(`Failed to delete sale: ${e.message}`);
    return false;
  }
};

export const updateInventoryInCloud = async (item: InventoryItem) => {
  try {
    await setDoc(doc(db, INVENTORY_COLLECTION, item.id), sanitize(item));
    return true;
  } catch (e: any) {
    console.error("Error updating inventory: ", e);
    alert(`Failed to update inventory: ${e.message}`);
    return false;
  }
};

export const adjustStockInCloud = async (itemId: string, currentStock: number, adjustment: number) => {
  try {
    const itemRef = doc(db, INVENTORY_COLLECTION, itemId);
    await updateDoc(itemRef, {
      stockLevel: currentStock + adjustment,
      lastUpdated: Date.now()
    });
    return true;
  } catch (e: any) {
    console.error("Error adjusting stock: ", e);
    // Don't alert on stock adjust for smoother UI, just log
    return false;
  }
};

export const deleteInventoryItemFromCloud = async (itemId: string) => {
  try {
    await deleteDoc(doc(db, INVENTORY_COLLECTION, itemId));
    return true;
  } catch (e: any) {
    console.error("Error deleting inventory item: ", e);
    alert(`Failed to delete item from database.\nError: ${e.message}\n\nCheck your internet or Firebase Rules.`);
    return false;
  }
};

export const clearSalesInCloud = async (sales: SaleItem[]) => {
  if (sales.length === 0) return true;

  const CHUNK_SIZE = 400;
  const chunks = [];
  
  for (let i = 0; i < sales.length; i += CHUNK_SIZE) {
    chunks.push(sales.slice(i, i + CHUNK_SIZE));
  }

  try {
    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((sale) => {
            const ref = doc(db, SALES_COLLECTION, sale.id);
            batch.delete(ref);
        });
        await batch.commit();
    }
    return true;
  } catch (e: any) {
    console.error("Error clearing sales: ", e);
    alert(`Failed to reset sales: ${e.message}`);
    return false;
  }
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
        batch.set(ref, sanitize(item));
        count++;
      });
    }

    if (localSales) {
      const sales: SaleItem[] = JSON.parse(localSales);
      sales.forEach(sale => {
        const ref = doc(db, SALES_COLLECTION, sale.id);
        batch.set(ref, sanitize(sale));
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

export const seedDefaultInventory = async () => {
    const defaultInventory: InventoryItem[] = [
      { id: '1', category: ProductType.FLOWER, name: 'Sour Diesel', grade: 'Mid' as any, stockLevel: 100, lastUpdated: Date.now() },
      { id: '2', category: ProductType.FLOWER, name: 'Blue Dream', grade: 'Top' as any, stockLevel: 50, lastUpdated: Date.now() },
    ];
    
    const batch = writeBatch(db);
    defaultInventory.forEach(item => {
        batch.set(doc(db, INVENTORY_COLLECTION, item.id), sanitize(item));
    });
    await batch.commit();
}