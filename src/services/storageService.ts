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

// Helper to determine collection names based on shop ID
const getCollections = (shopId: string) => {
  if (shopId === 'nearcannabis') {
    return {
      sales: 'sales_nc',
      inventory: 'inventory_nc'
    };
  }
  // Default to original collections for The Green Spot to preserve existing data
  return {
    sales: 'sales',
    inventory: 'inventory'
  };
};

// Helper to sanitize objects for Firestore (removes undefined values)
const sanitize = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// --- REAL-TIME SUBSCRIPTIONS ---

// Listen to Sales updates
export const subscribeToSales = (shopId: string, callback: (sales: SaleItem[]) => void) => {
  const { sales } = getCollections(shopId);
  // Query sales ordered by timestamp descending (newest first)
  const q = query(collection(db, sales), orderBy("timestamp", "desc"));
  
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
export const subscribeToInventory = (shopId: string, callback: (inventory: InventoryItem[]) => void) => {
  const { inventory } = getCollections(shopId);
  const q = query(collection(db, inventory));
  
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

export const addSaleToCloud = async (shopId: string, sale: SaleItem) => {
  const { sales } = getCollections(shopId);
  try {
    await setDoc(doc(db, sales, sale.id), sanitize(sale));
    return true;
  } catch (e: any) {
    console.error("Error adding sale: ", e);
    alert(`Failed to save sale: ${e.message}`);
    return false;
  }
};

export const deleteSaleFromCloud = async (shopId: string, saleId: string) => {
  const { sales } = getCollections(shopId);
  try {
    await deleteDoc(doc(db, sales, saleId));
    return true;
  } catch (e: any) {
    console.error("Error deleting sale: ", e);
    alert(`Failed to delete sale: ${e.message}`);
    return false;
  }
};

export const updateInventoryInCloud = async (shopId: string, item: InventoryItem) => {
  const { inventory } = getCollections(shopId);
  try {
    await setDoc(doc(db, inventory, item.id), sanitize(item));
    return true;
  } catch (e: any) {
    console.error("Error updating inventory: ", e);
    alert(`Failed to update inventory: ${e.message}`);
    return false;
  }
};

export const adjustStockInCloud = async (shopId: string, itemId: string, currentStock: number, adjustment: number) => {
  const { inventory } = getCollections(shopId);
  try {
    const itemRef = doc(db, inventory, itemId);
    await updateDoc(itemRef, {
      stockLevel: currentStock + adjustment,
      lastUpdated: Date.now()
    });
    return true;
  } catch (e: any) {
    console.error("Error adjusting stock: ", e);
    return false;
  }
};

export const deleteInventoryItemFromCloud = async (shopId: string, itemId: string) => {
  const { inventory } = getCollections(shopId);
  try {
    await deleteDoc(doc(db, inventory, itemId));
    return true;
  } catch (e: any) {
    console.error("Error deleting inventory item: ", e);
    alert(`Failed to delete item from database.\nError: ${e.message}`);
    return false;
  }
};

export const clearSalesInCloud = async (shopId: string, salesList: SaleItem[]) => {
  if (salesList.length === 0) return true;
  const { sales } = getCollections(shopId);

  const CHUNK_SIZE = 400;
  const chunks = [];
  
  for (let i = 0; i < salesList.length; i += CHUNK_SIZE) {
    chunks.push(salesList.slice(i, i + CHUNK_SIZE));
  }

  try {
    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((sale) => {
            const ref = doc(db, sales, sale.id);
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
// Note: Migration only supports the default shop (Green Spot) for now as legacy data belongs there.
export const migrateLocalToCloud = async () => {
  try {
    const localSales = localStorage.getItem('greentrack_sales');
    const localInv = localStorage.getItem('greentrack_inventory');
    
    // Default collections
    const SALES_COLLECTION = 'sales';
    const INVENTORY_COLLECTION = 'inventory';
    
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
    return "No legacy offline data found on this device.";

  } catch (e) {
    console.error("Migration failed", e);
    return "Migration failed. Check console for details.";
  }
};

export const seedDefaultInventory = async (shopId: string) => {
    const { inventory } = getCollections(shopId);
    const defaultInventory: InventoryItem[] = [
      { id: '1', category: ProductType.FLOWER, name: 'Sour Diesel', grade: 'Mid' as any, stockLevel: 100, lastUpdated: Date.now() },
      { id: '2', category: ProductType.FLOWER, name: 'Blue Dream', grade: 'Top' as any, stockLevel: 50, lastUpdated: Date.now() },
    ];
    
    const batch = writeBatch(db);
    defaultInventory.forEach(item => {
        batch.set(doc(db, inventory, item.id), sanitize(item));
    });
    await batch.commit();
}