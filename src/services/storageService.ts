import { SaleItem, InventoryItem, ProductType, DayReport, Expense } from '../types';
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
  writeBatch,
  getDocs
} from "firebase/firestore";

// Helper to determine collection names based on shop ID
const getCollections = (shopId: string) => {
  if (shopId === 'nearcannabis') {
    return {
      sales: 'sales_nc',
      inventory: 'inventory_nc',
      reports: 'reports_nc',
      expenses: 'expenses_nc'
    };
  }
  // Default to original collections for The Green Spot
  return {
    sales: 'sales',
    inventory: 'inventory',
    reports: 'reports',
    expenses: 'expenses'
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
  const q = query(collection(db, sales), orderBy("timestamp", "desc"));
  
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
  });
};

// Listen to Archived Reports updates
export const subscribeToReports = (shopId: string, callback: (reports: DayReport[]) => void) => {
  const { reports } = getCollections(shopId);
  const q = query(collection(db, reports), orderBy("timestamp", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const reportsData: DayReport[] = [];
    snapshot.forEach((doc) => {
      reportsData.push(doc.data() as DayReport);
    });
    callback(reportsData);
  }, (error) => {
    console.error("Error subscribing to reports:", error);
  });
};

// Listen to Expenses updates
export const subscribeToExpenses = (shopId: string, callback: (expenses: Expense[]) => void) => {
  const { expenses } = getCollections(shopId);
  const q = query(collection(db, expenses), orderBy("timestamp", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const expensesData: Expense[] = [];
    snapshot.forEach((doc) => {
      expensesData.push(doc.data() as Expense);
    });
    callback(expensesData);
  }, (error) => {
    console.error("Error subscribing to expenses:", error);
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
    return false;
  }
};

export const addExpenseToCloud = async (shopId: string, expense: Expense) => {
  const { expenses } = getCollections(shopId);
  try {
    await setDoc(doc(db, expenses, expense.id), sanitize(expense));
    return true;
  } catch (e: any) {
    console.error("Error adding expense: ", e);
    return false;
  }
};

export const restoreSalesBatch = async (shopId: string, salesList: SaleItem[]) => {
  const { sales } = getCollections(shopId);
  const batch = writeBatch(db);
  
  salesList.forEach(sale => {
    const ref = doc(db, sales, sale.id);
    batch.set(ref, sanitize(sale));
  });

  try {
    await batch.commit();
    return true;
  } catch (e) {
    console.error("Batch restore failed", e);
    return false;
  }
};

export const saveDayReportToCloud = async (shopId: string, report: DayReport) => {
  const { reports } = getCollections(shopId);
  try {
    await setDoc(doc(db, reports, report.id), sanitize(report));
    return true;
  } catch (e: any) {
    console.error("Error saving day report: ", e);
    return false;
  }
};

export const deleteReportFromCloud = async (shopId: string, reportId: string) => {
  const { reports } = getCollections(shopId);
  try {
    await deleteDoc(doc(db, reports, reportId));
    return true;
  } catch (e: any) {
    console.error("Error deleting report: ", e);
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
    return false;
  }
};

export const deleteExpenseFromCloud = async (shopId: string, expenseId: string) => {
  const { expenses } = getCollections(shopId);
  try {
    await deleteDoc(doc(db, expenses, expenseId));
    return true;
  } catch (e: any) {
    console.error("Error deleting expense: ", e);
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

export const clearSalesInCloud = async (shopId: string, salesList: SaleItem[]) => {
  if (salesList.length === 0) return true;
  const { sales } = getCollections(shopId);
  try {
    const batch = writeBatch(db);
    salesList.forEach((sale) => {
      const ref = doc(db, sales, sale.id);
      batch.delete(ref);
    });
    await batch.commit();
    return true;
  } catch (e: any) {
    console.error("Error clearing sales: ", e);
    return false;
  }
};

export const clearExpensesInCloud = async (shopId: string, expensesList: Expense[]) => {
  if (expensesList.length === 0) return true;
  const { expenses } = getCollections(shopId);
  try {
    const batch = writeBatch(db);
    expensesList.forEach((e) => {
      const ref = doc(db, expenses, e.id);
      batch.delete(ref);
    });
    await batch.commit();
    return true;
  } catch (e: any) {
    console.error("Error clearing expenses: ", e);
    return false;
  }
};

export const clearAllReportsInCloud = async (shopId: string) => {
  const { reports } = getCollections(shopId);
  try {
    const q = query(collection(db, reports));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return true;
  } catch (e: any) {
    console.error("Error clearing all reports: ", e);
    return false;
  }
};

export const migrateLocalToCloud = async () => {
  try {
    const localSales = localStorage.getItem('greentrack_sales');
    const localInv = localStorage.getItem('greentrack_inventory');
    const batch = writeBatch(db);
    let count = 0;
    if (localInv) {
      const items: InventoryItem[] = JSON.parse(localInv);
      items.forEach(item => { batch.set(doc(db, 'inventory', item.id), sanitize(item)); count++; });
    }
    if (localSales) {
      const sales: SaleItem[] = JSON.parse(localSales);
      sales.forEach(sale => { batch.set(doc(db, 'sales', sale.id), sanitize(sale)); count++; });
    }
    if (count > 0) { await batch.commit(); return `Migrated ${count} items!`; }
    return "No legacy data found.";
  } catch (e) { return "Migration failed."; }
};

export const seedDefaultInventory = async (shopId: string) => {
    const { inventory } = getCollections(shopId);
    const defaultInventory: InventoryItem[] = [
      { id: '1', category: ProductType.FLOWER, name: 'Sour Diesel', grade: 'Mid' as any, stockLevel: 100, lastUpdated: Date.now() },
      { id: '2', category: ProductType.FLOWER, name: 'Blue Dream', grade: 'Top' as any, stockLevel: 50, lastUpdated: Date.now() },
    ];
    const batch = writeBatch(db);
    defaultInventory.forEach(item => { batch.set(doc(db, inventory, item.id), sanitize(item)); });
    await batch.commit();
}