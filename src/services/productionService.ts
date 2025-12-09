// src/services/productionService.ts
import { get, post, put, del } from './apiService';

// -------------------- TYPES --------------------

// API Response type
export interface APIResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// Store Interface
export interface Store {
  id: number;
  name: string;
  address1?: string;
  address2?: string;
  city?: string;
  postalCode?: string;
}

// User Interface
export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  userType?: string;
}

// Production Item (Finished Good)
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

// Raw Material Item
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

// Routing Step
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

// Scrap Item
export interface ScrapItem {
  id: number;
  itemId: number;
  itemName: string;
  quantity: number;
  unit: string;
  costAllocation: number;
}

// Other Charge
export interface OtherCharge {
  id: number;
  classification: string;
  charges: number;
  comment?: string;
}

// Production Log
export interface ProductionLog {
  id: number;
  action: string;
  details: string;
  createdAt: string;
  createdBy: User;
}

// Production Process (Main Interface)
export interface ProductionProcess {
  id: number;
  docNumber: string;
  status: "planned" | "published" | "completed" | "cancelled";
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
}

// Minimal Production Process (for list view)
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

// Create Production from BOM Request - UPDATED
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

// Update Production Request
export interface UpdateProductionRequest {
  orderDeliveryDate?: string;
  expectedCompletionDate?: string;
  status?: "planned" | "published" | "completed" | "cancelled";
}

// Production List Query Parameters
export interface ProductionListQuery {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

// Production List Response
export interface ProductionListResponse {
  data: MinimalProductionProcess[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// -------------------- API FUNCTIONS --------------------

export const productionAPI = {
  // 📍 1️⃣ Create Production from BOM
  createProductionFromBOM: async (data: CreateProductionRequest): Promise<APIResponse<ProductionProcess>> => {
    return await post("/production/proccess", data);
  },

  // 📍 2️⃣ Get All Production Orders
  getAllProductionOrders: async (query: ProductionListQuery = {}): Promise<APIResponse<ProductionListResponse>> => {
    const { page = 1, limit = 20, status, search } = query;
    
    let url = `/production/proccess?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    return await get(url);
  },

  // 📍 3️⃣ Get Production By ID (Full Detail)
  getProductionById: async (id: number): Promise<APIResponse<ProductionProcess>> => {
    return await get(`/production/proccess/${id}`);
  },

  // 📍 4️⃣ Update Production (Only Production Fields)
  updateProduction: async (id: number, data: UpdateProductionRequest): Promise<APIResponse<ProductionProcess>> => {
    return await put(`/production/proccess/${id}`, data);
  },

  // 📍 5️⃣ Delete Production Order
  deleteProduction: async (id: number): Promise<APIResponse<{ message: string }>> => {
    return await del(`/production/proccess/${id}`);
  },

  // Additional utility functions

  // Get production orders by status
  getProductionByStatus: async (status: string, page = 1, limit = 20): Promise<APIResponse<ProductionListResponse>> => {
    return await get(`/production/proccess?status=${status}&page=${page}&limit=${limit}`);
  },

  // Search production orders
  searchProduction: async (searchTerm: string, page = 1, limit = 20): Promise<APIResponse<ProductionListResponse>> => {
    return await get(`/production/proccess?search=${encodeURIComponent(searchTerm)}&page=${page}&limit=${limit}`);
  },

  // Update production status
  updateProductionStatus: async (id: number, status: "planned" | "published" | "completed" | "cancelled"): Promise<APIResponse<ProductionProcess>> => {
    return await put(`/production/proccess/${id}`, { status });
  },

  // Publish production (change status from planned to published)
  publishProduction: async (id: number): Promise<APIResponse<ProductionProcess>> => {
    return await put(`/production/proccess/${id}`, { status: "published" });
  },

  // Complete production
  completeProduction: async (id: number): Promise<APIResponse<ProductionProcess>> => {
    return await put(`/production/proccess/${id}`, { status: "completed" });
  },

  // Cancel production
  cancelProduction: async (id: number): Promise<APIResponse<ProductionProcess>> => {
    return await put(`/production/proccess/${id}`, { status: "cancelled" });
  }
};