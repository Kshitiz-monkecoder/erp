// services/stockTransferService.ts
import { get, post, put } from './apiService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockTransferPayload {
  fromWarehouseId: number;
  fromZoneId: number;
  fromRackId: number;
  toWarehouseId: number;
  toZoneId: number;
  toRackId: number;
  itemId: number;
  quantity: number;
  reason?: string;
}

export interface StockTransferItem {
  id: string;
  fromWarehouse?: { id: number; name: string };
  toWarehouse?: { id: number; name: string };
  fromZone?: { id: number; name: string };
  toZone?: { id: number; name: string };
  fromRack?: { id: number; name: string };
  toRack?: { id: number; name: string };
  quantity: number;
  createdAt: string;
  createdBy?: { id: number; name: string };
  movementType?: string;
  approvedBy?: { id: number; name: string };
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ON_HOLD';
  reason?: string;
}

export interface APIResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// ─── Stock Transfer Actions ───────────────────────────────────────────────────

export type TransferAction = 'approve' | 'reject' | 'hold';

export interface ActionPayload {
  reason?: string;
}

// ─── Stock Transfer API ───────────────────────────────────────────────────────

export const stockTransferAPI = {
  /**
   * Fetch all stock transfer / movement records
   */
  getAll: async (): Promise<APIResponse<StockTransferItem[]>> => {
    return await get('/inventory/transfer');
  },

  /**
   * Create a new stock transfer
   */
  create: async (
    payload: StockTransferPayload,
  ): Promise<APIResponse<StockTransferItem>> => {
    return await post('/inventory/transfer', payload);
  },

  /**
   * Update (edit) an existing stock transfer — API to be implemented later
   */
  update: async (
    id: string,
    payload: Partial<StockTransferPayload>,
  ): Promise<APIResponse<StockTransferItem>> => {
    return await put(`/inventory/transfer/${id}`, payload);
  },

  /**
   * Approve a stock transfer — API to be implemented later
   */
  approve: async (
    id: string,
    payload?: ActionPayload,
  ): Promise<APIResponse<StockTransferItem>> => {
    return await put(`/inventory/transfer/${id}/approve`, payload ?? {});
  },

  /**
   * Put a stock transfer on hold — API to be implemented later
   */
  hold: async (
    id: string,
    payload?: ActionPayload,
  ): Promise<APIResponse<StockTransferItem>> => {
    return await put(`/inventory/transfer/${id}/hold`, payload ?? {});
  },

  /**
   * Reject a stock transfer — API to be implemented later
   */
  reject: async (
    id: string,
    payload?: ActionPayload,
  ): Promise<APIResponse<StockTransferItem>> => {
    return await put(`/inventory/transfer/${id}/reject`, payload ?? {});
  },
};