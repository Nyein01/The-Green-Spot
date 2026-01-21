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
  productType: ProductType;
  productName: string; // Strain name or Custom name
  grade?: FlowerGrade;
  quantity: number; // grams for flower, units for others
  price: number; // Final price after negotiation
  originalPrice: number; // Calculated standard price
  isNegotiated: boolean;
  notes?: string;
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

export interface DayReport {
  date: string; // YYYY-MM-DD
  totalSales: number;
  totalRevenue: number;
  itemsSold: number;
  sales: SaleItem[];
}