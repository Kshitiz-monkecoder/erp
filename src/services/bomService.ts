import { get, post, put, del } from './apiService';

// Types
export interface Item {
  id: string;
  name: string;
  sku: string;
  unit?: {
    name: string;
    description: string;
    uom: string;
    id: number;
  };
  category?: {
    name: string;
    id: number;
    description: string;
  };
  currentStock: string;
  defaultPrice: string;
  hsnCode: string;
  minimumStockLevel: string;
  maximumStockLevel: string;
}

export interface BOMItemRequest {
  finishedGoods: {
    itemId: number;
    unitId: number;
    quantity: number;
    costAlloc: number;
    comment: string;
    hasAlternate: boolean;
  };
  rawMaterials: Array<{
    itemId: number;
    unitId: number;
    quantity: number;
    costAlloc: number;
    comment: string;
    hasAlternate: boolean;
  }>;
  routing: Array<{
    routingId: number;
    comment: string;
  }>;
  scrap: Array<{
    itemId: number;
    unitId: number;
    quantity: number;
    costAlloc: number;
    comment?: string;
  }>;
  otherCharges: Array<{
    charges: number;
    classification: string;
    comment?: string;
  }>;
}

export interface BOMCreateRequest {
  docNumber: string;
  docDate: string;
  docName: string;
  docDescription?: string;
  rmStoreId: number;
  fgStoreId: number;
  scrapStoreId: number;
  status: "draft" | "published";
  docComment?: string;
  bomItems: BOMItemRequest[];
}

export interface BOMResponse {
  id: number;
  docNumber: string;
  docDate: string;
  docName: string;
  docDescription?: string;
  docComment?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  rmStore: any;
  fgStore: any;
  scrapStore: any;
  createdBy: any;
  bomItems: any[];
}

// API Response type
export interface APIResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// BOM API Functions
export const bomAPI = {
  // Create BOM
  createBOM: async (data: BOMCreateRequest): Promise<APIResponse<BOMResponse>> => {
    return await post("/production/bom", data);
  },

  // Get BOM by ID
  getBOM: async (id: number): Promise<APIResponse<BOMResponse>> => {
    return await get(`/production/bom/${id}`);
  },

  // Get all BOMs
  getAllBOMs: async (): Promise<APIResponse<BOMResponse[]>> => {
    return await get("/production/bom");
  },

  // Update BOM
  updateBOM: async (id: number, data: Partial<BOMCreateRequest>): Promise<APIResponse<BOMResponse>> => {
    return await put(`/production/bom/${id}`, data);
  },

  // Delete BOM
  deleteBOM: async (id: number): Promise<APIResponse<{ message: string }>> => {
    return await del(`/production/bom/${id}`);
  },

  // Get items for BOM
  getItems: async (): Promise<APIResponse<Item[]>> => {
    return await get("/inventory/item");
  }
};