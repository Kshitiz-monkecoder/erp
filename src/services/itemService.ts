// services/itemService.ts
import { get, post } from './apiService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VendorLeadTime {
  id: number;
  leadTimeDays: number;
  isDefault: boolean;
  lastDeliveryDate?: string;
  createdAt?: string;
  updatedAt?: string;
  vendor?: {
    id: number;
    name: string;
    email?: string;
    companyName?: string;
    phoneNo?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface ItemDetails {
  id: number;
  name: string;
  type: string;
  isProduct: boolean;
  sku: string;
  warehouse?: number;
  hsnCode?: string;
  weightedAveragePrice?: string;
  stockValue?: string;
  isFifo?: boolean;
  vendorLeadTimes?: VendorLeadTime[];
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

// ─── Items List Request / Response ───────────────────────────────────────────

export type StockStatus = 'negative' | 'low' | 'excess' | 'optimal' | 'all';

export type ItemSortField =
  | 'sku' | 'name' | 'isProduct' | 'type' | 'unit' | 'category'
  | 'currentStock' | 'defaultPrice' | 'hsnCode' | 'tax'
  | 'minimumStockLevel' | 'maximumStockLevel'
  | 'createdBy' | 'company' | 'status' | 'createdAt';

export interface ItemsFilters {
  isProduct?: boolean | 'all';
  stockStatus?: StockStatus;
  itemStatus?: string;
  itemCategory?: string;
}

export interface ItemsSearch {
  sku?: { type: 'str'; value: string };
  name?: { type: 'str'; value: string };
  [key: string]: { type: string; value: string } | undefined;
}

export interface ItemsPagination {
  page: number;
  itemsPerPage: number;
  sortBy: ItemSortField[];
  sortDesc: boolean[];
}

export interface ItemsRequest {
  filters: ItemsFilters;
  search: ItemsSearch;
  pagination: ItemsPagination;
}

export interface ItemsSummary {
  stockValue: number;
  negativeStock: number;
  lowStock: number;
  excessStock: number;
}

export interface ItemsResponseData {
  data: ItemDetails[];
  total_length: number;
}

export interface ItemsResponse {
  status: boolean;
  message: string;
  data: ItemsResponseData;
}

// ─── Item API ─────────────────────────────────────────────────────────────────

export const itemAPI = {
  // Get single item details
  getItem: async (id: number | string): Promise<APIResponse<ItemDetails>> => {
    return await get(`/inventory/item/${id}`);
  },

  // Get all items (legacy GET)
  getAllItems: async (): Promise<APIResponse<ItemDetails[]>> => {
    return await get('/inventory/item');
  },

  // Get items via POST with filters, search, sorting & pagination
  getItems: async (payload: ItemsRequest): Promise<ItemsResponse> => {
    return await post('/inventory/items', payload);
  },

  // Get item history with filters, search, and pagination
  getItemHistory: async (payload: ItemHistoryRequest): Promise<ItemHistoryResponse> => {
    return await post('/inventory/item/history', payload);
  },
};