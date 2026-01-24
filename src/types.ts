export enum ProductType {
  FLOWER = 'Flower',
  PRE_ROLL = 'Pre-roll',
  ACCESSORY = 'Accessory',
  EDIBLE = 'Edible',
  OTHER = 'Other'
}

export enum FlowerGrade {
  MID = 'Mid',
  EXOTIC = 'Exotic',
  TOP = 'Top',
  TOP_SHELF = 'Top-Shelf'
}

export interface SaleItem {
  id: string;
  timestamp: number; // Unix timestamp
  date: string; // YYYY-MM-DD for easier filtering
  productType: ProductType;
  productName: string; // Strain name or Custom name
  grade?: FlowerGrade;
  quantity: number; // grams for flower, units for others
  price: number; // Final price after negotiation
  originalPrice: number; // Calculated standard price
  isNegotiated: boolean;
  notes?: string;
  staffName?: string; // Added to track who made the sale
  paymentMethod?: 'Cash' | 'Scan';
}

export interface InventoryItem {
  id: string;
  category: ProductType;
  name: string; // Strain or Item name
  grade?: FlowerGrade;
  stockLevel: number; // grams or units
  price?: number; // Unit price for non-flower items
  lastUpdated: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  timestamp: number;
}

export interface DayReport {
  id: string;
  date: string; // YYYY-MM-DD
  totalSales: number;
  totalRevenue: number;
  itemsSold: number;
  sales: SaleItem[];
  expenses?: Expense[];
  timestamp: number;
  closedBy?: string;
}

export enum Tab {
  SALES = 'Sales',
  INVENTORY = 'Inventory',
  REPORT = 'Daily Report',
  ARCHIVE = 'Sales Archive',
  WEEKLY = 'Weekly Highlights',
  MONTHLY = 'Monthly Summary',
  SETTINGS = 'Settings'
}