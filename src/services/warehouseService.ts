// services/warehouseService.ts
import { get, post, put, del } from './apiService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RackItem {
  id: number;
  name: string;
  code?: string;
  capacity?: number;
  description?: string;
}

export interface ZoneItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
  racks?: RackItem[];
}

export interface WarehouseItem {
  id: number;
  name: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  zones?: ZoneItem[];
}

export interface WarehouseHierarchy extends WarehouseItem {
  zones: ZoneItem[];
}

// ─── Request Payloads ─────────────────────────────────────────────────────────

export interface CreateZoneRequest {
  warehouseId: number;
  name: string;
  description?: string;
}

export interface UpdateZoneRequest {
  name?: string;
  description?: string;
}

export interface CreateRackRequest {
  zoneId: number;
  name: string;
  description?: string;
  capacity?: number;
}

export interface UpdateRackRequest {
  name?: string;
  description?: string;
  capacity?: number;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface APIResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// ─── Warehouse API ────────────────────────────────────────────────────────────

export const warehouseAPI = {
  // Get all warehouses (flat list)
  getAllWarehouses: async (): Promise<APIResponse<WarehouseItem[]>> => {
    return await get('/inventory/warehouse');
  },

  // Get complete warehouse hierarchy (warehouse → zones → racks)
  getWarehouseHierarchy: async (
    warehouseId: number,
  ): Promise<APIResponse<WarehouseHierarchy>> => {
    return await get(`/inventory/warehouse/${warehouseId}/hierarchy`);
  },

  // Get all warehouses with zones and racks embedded
  getAllWarehousesWithHierarchy: async (): Promise<APIResponse<WarehouseItem[]>> => {
    return await get('/inventory/warehouse?include=zones,racks');
  },
};

// ─── Zone API ─────────────────────────────────────────────────────────────────

export const zoneAPI = {
  // Create a zone inside a warehouse
  createZone: async (data: CreateZoneRequest): Promise<APIResponse<ZoneItem>> => {
    return await post('/inventory/warehouse/zone', data);
  },

  // Update an existing zone
  updateZone: async (
    zoneId: number,
    data: UpdateZoneRequest,
  ): Promise<APIResponse<ZoneItem>> => {
    return await put(`/inventory/warehouse/zone/${zoneId}`, data);
  },

  // Delete a zone
  deleteZone: async (zoneId: number): Promise<APIResponse<{ message: string }>> => {
    return await del(`/inventory/warehouse/zone/${zoneId}`);
  },
};

// ─── Rack API ─────────────────────────────────────────────────────────────────

export const rackAPI = {
  // Create a rack inside a zone
  createRack: async (data: CreateRackRequest): Promise<APIResponse<RackItem>> => {
    return await post('/inventory/warehouse/rack', data);
  },

  // Update an existing rack
  updateRack: async (
    rackId: number,
    data: UpdateRackRequest,
  ): Promise<APIResponse<RackItem>> => {
    return await put(`/inventory/warehouse/rack/${rackId}`, data);
  },

  // Delete a rack
  deleteRack: async (rackId: number): Promise<APIResponse<{ message: string }>> => {
    return await del(`/inventory/warehouse/rack/${rackId}`);
  },
};