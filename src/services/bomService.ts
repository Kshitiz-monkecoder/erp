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
  /**
   * Child BOM linked to this specific raw material row.
   * Pass null to explicitly unlink an existing child BOM.
   * Omit (undefined) when no change is intended.
   */
  subBomId?: number | null;
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
  /**
   * Required for UPDATE (PUT) — the existing bomItem row ID.
   * Omit for CREATE (POST).
   */
  id?: number;
  finishedGoods: FinishedGoodRequest;
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
  status: 'planned' | 'published' | 'wip' | 'completed';
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
  /** subBom is returned nested per raw material row in GET responses */
  rawMaterials: (RawMaterialRequest & { subBom?: any })[];
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
  /** Create a new BOM (defaults to planned status) */
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