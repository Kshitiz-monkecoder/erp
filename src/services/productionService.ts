// src/services/productionService.ts
import { get, post, put, del } from './apiService';

// ─────────────────────────────────────────────────────────────────────────────
// Common
// ─────────────────────────────────────────────────────────────────────────────
export interface APIResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

export interface Store {
  id: number;
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  postalCode?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  userType?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Production list / detail types
// ─────────────────────────────────────────────────────────────────────────────
export interface ProductionItem {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  costAllocation: number;
  completedQuantity: number;
  targetQuantity: number;
}

export interface RawMaterialItem {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  costAllocation: number;
  required: number;
  issued: number;
  balance: number;
}

export interface RoutingStep {
  id: number;
  routingId: number;
  name: string;
  description?: string;
  comment?: string;
  completed: boolean;
  startedAt?: string;
  completedAt?: string;
}

export interface ScrapItem {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  costAllocation: number;
}

export interface OtherCharge {
  id: number;
  classification: string;
  charges: number;
  comment?: string;
}

export interface ProductionLog {
  id: number;
  action: string;
  details: string;
  createdAt: string;
  createdBy: User;
}

export interface ProductionProcess {
  id: number;
  docNumber: string;
  status: 'planned' | 'publish' | 'in_progress' | 'complete' | 'cancelled';
  orderDeliveryDate: string | null;
  expectedCompletionDate: string | null;
  createdAt: string;
  updatedAt: string;
  attachments: string | null;
  rmStore: Store;
  fgStore: Store;
  scrapStore: Store;
  createdBy: User;
  productionItems: ProductionItem[];
  rawMaterialItems: RawMaterialItem[];
  routingSteps: RoutingStep[];
  scrapItems: ScrapItem[];
  otherCharges: OtherCharge[];
  logs: ProductionLog[];
  bom?: { id: number; docNumber: string };
}

export interface MinimalProductionProcess {
  id: number;
  docNumber: string;
  status: string;
  orderDeliveryDate: string | null;
  expectedCompletionDate: string | null;
  createdAt: string;
  updatedAt: string;
  rmStore: Store;
  fgStore: Store;
  createdBy: User;
}

export interface CreateProductionRequest {
  bomId: number;
  quantity: number;
  orderDeliveryDate?: string;
  expectedCompletionDate?: string;
  referenceNumber?: string;
  fgStoreId?: number;
  rmStoreId?: number;
  scrapStoreId?: number;
  useSameStore?: boolean;
  itemId?: number;
  documentSeries?: string;
}

export interface UpdateProductionRequest {
  orderDeliveryDate?: string;
  expectedCompletionDate?: string;
  status?: 'planned' | 'publish' | 'in_progress' | 'complete' | 'cancelled';
}

export interface ProductionListQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface ProductionListResponse {
  data: MinimalProductionProcess[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Take Action — payload types
// ─────────────────────────────────────────────────────────────────────────────

/** Selected store shape expected by take-action API */
export interface SelectedStore {
  name: string;
  id: string;
}

/** Keyed by production FG record id (string) */
export interface FGActionItem {
  change_quantity: number;
  comment: string;
}

/** Keyed by production RM record id (string) */
export interface RMActionItem {
  change_quantity: number;
  comment: string;
  /** "issue" | "return" | "line_reject" */
  change_type: 'issue' | 'return' | 'line_reject';
  /** Optional: ID of a specific barcode record to consume */
  barcodeId?: number;
  selected_store: SelectedStore;
}

/** Keyed by production Scrap record id (string) */
export interface ScrapActionItem {
  change_quantity: number;
  comment: string;
}

/** Element in the other_charges_data array */
export interface OtherChargeActionItem {
  charges: number;
  comment: string;
  classification: string;
  charges_estimate: number;
  charges_actual: number;
  index: number;
}

/** Element in the routing_data array */
export interface RoutingActionItem {
  comment: string;
  /** Production routing record ID */
  id: string;
  is_done: boolean;
  order: number;
  quantity_completed: number;
  routing_desc: string;
  /** Routing template ID */
  routing_id: string;
  routing_name: string;
  routing_number: string;
  change_in_quantity: number;
  completion_percent: string;
  final_quantity: number;
  index: number;
  mark_done: boolean;
  previous_quantity: number;
}

export interface TakeActionFormData {
  /** Record<productionFGId, FGActionItem> — only items with change_quantity > 0 */
  fg_data: Record<string, FGActionItem>;
  /** Record<productionRMId, RMActionItem> — only items with change_quantity > 0 */
  rm_data: Record<string, RMActionItem>;
  /** Record<productionScrapId, ScrapActionItem> — only items with change_quantity > 0 */
  scrap_data: Record<string, ScrapActionItem>;
  other_charges_data: OtherChargeActionItem[];
  routing_data: RoutingActionItem[];
  mark_items_tested: boolean;
}

export interface TakeActionPayload {
  form_data: TakeActionFormData;
  /** String version of production id */
  process_id: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// FG Test — payload types
// ─────────────────────────────────────────────────────────────────────────────
export interface FGTestPayload {
  tested: number;
  passed: number;
  rejected: number;
  send_for_repair: number;
  comment: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// productionAPI
// ─────────────────────────────────────────────────────────────────────────────
export const productionAPI = {
  // ── BOM ──
  getBOMByFinishedGoodItem: async (itemId: number): Promise<any> =>
    get(`/production/bom/finished-goods-item/${itemId}`),

  // ── CRUD ──
  createProductionFromBOM: async (data: CreateProductionRequest): Promise<APIResponse<ProductionProcess>> =>
    post('/production/proccess', data),

  getAllProductionOrders: async (query: ProductionListQuery = {}): Promise<APIResponse<ProductionListResponse>> => {
    const { page = 1, limit = 20, status, search } = query;
    let url = `/production/proccess?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return get(url);
  },

  getProductionById: async (id: number): Promise<APIResponse<ProductionProcess>> =>
    get(`/production/proccess/${id}`),

  updateProduction: async (id: number, data: UpdateProductionRequest): Promise<APIResponse<ProductionProcess>> =>
    put(`/production/proccess/${id}`, data),

  deleteProduction: async (id: number): Promise<APIResponse<{ message: string }>> =>
    del(`/production/proccess/${id}`),

  // ── Status transitions ──
  getProductionByStatus: async (status: string, page = 1, limit = 20): Promise<APIResponse<ProductionListResponse>> =>
    get(`/production/proccess?status=${status}&page=${page}&limit=${limit}`),

  searchProduction: async (term: string, page = 1, limit = 20): Promise<APIResponse<ProductionListResponse>> =>
    get(`/production/proccess?search=${encodeURIComponent(term)}&page=${page}&limit=${limit}`),

  updateProductionStatus: async (
    id: number,
    status: 'planned' | 'publish' | 'complete' | 'cancelled',
  ): Promise<APIResponse<ProductionProcess>> =>
    put(`/production/proccess/${id}`, { status }),

  publishProduction: async (id: number): Promise<APIResponse<ProductionProcess>> =>
    put(`/production/proccess/${id}`, { status: 'publish' }),

  startProduction: async (id: number): Promise<APIResponse<ProductionProcess>> =>
    put(`/production/proccess/${id}`, { status: 'in_progress' }),

  completeProduction: async (id: number): Promise<APIResponse<ProductionProcess>> =>
    put(`/production/proccess/${id}`, { status: 'complete' }),

  cancelProduction: async (id: number): Promise<APIResponse<ProductionProcess>> =>
    put(`/production/proccess/${id}`, { status: 'cancelled' }),

  // ─────────────────────────────────────────────────────────────────────────
  // ✅ TAKE ACTION
  //    POST /production/proccess/{id}/take-action
  //    Handles: mark FG produced, issue/return RM, log scrap, log routing, log charges
  // ─────────────────────────────────────────────────────────────────────────
  takeAction: async (
    id: number,
    payload: TakeActionPayload,
  ): Promise<APIResponse<any>> =>
    post(`/production/proccess/${id}/take-action`, payload),

  // ─────────────────────────────────────────────────────────────────────────
  // ✅ FG TEST
  //    POST /production/proccess/{id}/fg-test
  //    Marks a finished good as tested/passed/rejected
  // ─────────────────────────────────────────────────────────────────────────
  fgTest: async (
    id: number,
    payload: FGTestPayload,
  ): Promise<APIResponse<any>> =>
    post(`/production/proccess/${id}/fg-test`, payload),
};