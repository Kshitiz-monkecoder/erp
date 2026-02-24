import { get, post, put, del } from './apiService';

// ─────────────────────────────────────────────
// Shared / Base Types
// ─────────────────────────────────────────────

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

export interface Unit {
  id: number;
  name: string;
  description?: string;
  uom?: string;
}

export interface Routing {
  id: number;
  name: string;
  description?: string;
}

// ─────────────────────────────────────────────
// BOM Request Types
// ─────────────────────────────────────────────

export interface AlternateItemRequest {
  itemId: number;
  unitId: number;
  quantity: number;
  costAlloc: number;
  comment?: string;
}

export interface FinishedGoodRequest {
  itemId: number;
  unitId: number;
  quantity: number;
  costAlloc: number;
  comment?: string;
  hasAlternate?: boolean;
}

export interface RawMaterialRequest {
  itemId: number;
  unitId: number;
  quantity: number;
  costAlloc: number;
  comment?: string;
  hasAlternate?: boolean;
  alternateList?: AlternateItemRequest[];
}

export interface RoutingRequest {
  routingId: number;
  comment?: string;
}

export interface ScrapRequest {
  itemId: number;
  unitId: number;
  quantity: number;
  costAlloc: number;
  comment?: string;
}

export interface OtherChargeRequest {
  charges: number;
  classification: string;
  comment?: string;
}

export interface BOMItemRequest {
  finishedGoods: FinishedGoodRequest;
  subBomId?: number;           // ← Child BOM link
  rawMaterials?: RawMaterialRequest[];
  routing?: RoutingRequest[];
  scrap?: ScrapRequest[];
  otherCharges?: OtherChargeRequest[];
}

export interface BOMCreateRequest {
  docNumber: string;
  docDate: string;
  docName: string;
  docDescription?: string;
  rmStoreId: number;
  fgStoreId: number;
  scrapStoreId: number;
  status: 'draft' | 'published';
  docComment?: string;
  bomItems: BOMItemRequest[];
}

export type BOMUpdateRequest = Partial<BOMCreateRequest>;

// ─────────────────────────────────────────────
// BOM Response Types
// ─────────────────────────────────────────────

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
  rmStore: { id: number; name: string } | null;
  fgStore: { id: number; name: string } | null;
  scrapStore: { id: number; name: string } | null;
  createdBy: { id: number; name: string } | null;
  bomItems: BOMItemResponse[];
}

export interface BOMItemResponse {
  id: number;
  finishedGoods: FinishedGoodRequest;
  subBomId?: number;
  rawMaterials: RawMaterialRequest[];
  routing: RoutingRequest[];
  scrap: ScrapRequest[];
  otherCharges: OtherChargeRequest[];
}

// Generic API Response wrapper
export interface APIResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// ─────────────────────────────────────────────
// bomAPI — all CRUD operations
// ─────────────────────────────────────────────

export const bomAPI = {
  /** Create a new BOM (draft or published) */
  createBOM: async (data: BOMCreateRequest): Promise<APIResponse<BOMResponse>> => {
    return await post('/production/bom', data);
  },

  /** Fetch a single BOM by ID */
  getBOM: async (id: number): Promise<APIResponse<BOMResponse>> => {
    return await get(`/production/bom/${id}`);
  },

  /** Fetch all BOMs */
  getAllBOMs: async (): Promise<APIResponse<BOMResponse[]>> => {
    return await get('/production/bom');
  },

  /** Update an existing BOM */
  updateBOM: async (
    id: number,
    data: BOMUpdateRequest
  ): Promise<APIResponse<BOMResponse>> => {
    return await put(`/production/bom/${id}`, data);
  },

  /** Delete a BOM */
  deleteBOM: async (id: number): Promise<APIResponse<{ message: string }>> => {
    return await del(`/production/bom/${id}`);
  },

  /** Fetch inventory items (for dropdowns) */
  getItems: async (): Promise<APIResponse<Item[]>> => {
    return await get('/inventory/item');
  },

  /** Fetch units of measure (for dropdowns) */
  getUnits: async (): Promise<APIResponse<Unit[]>> => {
    return await get('/inventory/unit');
  },

  /** Fetch routing options */
  getRoutings: async (): Promise<APIResponse<Routing[]>> => {
    return await get('/production/routing');
  },

  /** Fetch warehouses / stores */
  getWarehouses: async (): Promise<APIResponse<{ id: number; name: string }[]>> => {
    return await get('/inventory/warehouse');
  },
};