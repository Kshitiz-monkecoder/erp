export interface Unit {
  name: string;
  description: string;
  uom: string;
  status: boolean;
  id: number;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  name: string;
  id: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tax {
  name: string;
  rate: string;
  id: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  sku: string;
  name: string;
  isProduct: boolean;
  type: string;
  unit: Unit;
  category: Category;
  currentStock: string;
  defaultPrice: string;
  hsnCode: string;
  tax: Tax;
  minimumStockLevel: string;
  maximumStockLevel: string;
  id: number;
  regularBuyingPrice: string;
  regularSellingPrice: string;
  wholesaleBuyingPrice: string;
  mrp: string;
  dealerPrice: string;
  distributorPrice: string;
  lastTransactionAt: string;
}