// services/itemService.ts
import { get, post } from './apiService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ItemDetails {
  id: number;
  name: string;
  type: string;
  isProduct: boolean;
  sku: string;
  warehouse?: number;
  hsnCode?: string;
  currentStock?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  defaultPrice?: number;
  regularBuyingPrice?: number;
  wholesaleBuyingPrice?: number;
  regularSellingPrice?: number;
  mrp?: number;
  dealerPrice?: number;
  distributorPrice?: number;
  unit?: { id: number; name: string };
  category?: { id: number; name: string };
  tax?: { id: number; name: string };
  stockData?: any[];
}

export interface ItemHistoryRecord {
  creation_date: string;
  itemid: string;
  product_name: string;
  unit: string;
  old_amount: number;
  change_type: string;      // "1" = IN, "-1" = OUT
  change_amount: string;    // e.g. "+1000" or "-900"
  new_amount: number;
  stock_valuation_price: string;
  transaction_price: string;
  comment: string;
  created_by: string;
  store: string;
  source_object_type: string;
  source_object_name: string;
  document_id: number;
}

// ─── Request / Response ───────────────────────────────────────────────────────

export interface ItemHistoryFilters {
  product_id: number;
  store?: number[];
  conversion?: number;
}

export interface ItemHistorySearch {
  itemid?: { type: 'str'; value: string };
  product_name?: { type: 'str'; value: string };
  source_object_type?: { type: 'str'; value: string };
  comment?: { type: 'str'; value: string };
}

export interface ItemHistoryPagination {
  page: number;
  items_per_page: number;
  sort_by?: string[];
  sort_desc?: boolean[];
}

export interface ItemHistoryRequest {
  filters: ItemHistoryFilters;
  search?: ItemHistorySearch;
  pagination: ItemHistoryPagination;
}

export interface ItemHistoryResponseData {
  data: ItemHistoryRecord[];
  total_length: number;
  product_stock: number;
}

export interface ItemHistoryResponse {
  data: ItemHistoryResponseData;
  status: number;
  message: string;
}

export interface APIResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// ─── Item API ─────────────────────────────────────────────────────────────────

export const itemAPI = {
  // Get single item details
  getItem: async (id: number | string): Promise<APIResponse<ItemDetails>> => {
    return await get(`/inventory/item/${id}`);
  },

  // Get all items
  getAllItems: async (): Promise<APIResponse<ItemDetails[]>> => {
    return await get('/inventory/item');
  },

  // Get item history with filters, search, and pagination
  getItemHistory: async (payload: ItemHistoryRequest): Promise<ItemHistoryResponse> => {
    return await post('/inventory/item/history', payload);
  },
};