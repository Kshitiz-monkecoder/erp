// services/routingService.ts
import { get, post, put, del } from './apiService';

// Make sure to export the Routing type
export interface Routing {
  id: number;
  number: string;
  name: string;
  desc: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: any;
  company?: any;
}

export interface CreateRoutingRequest {
  number: string;
  name: string;
  desc: string;
}

export interface UpdateRoutingRequest {
  number?: string;
  name?: string;
  desc?: string;
}

// API Response type
export interface APIResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

// Routing API Functions
export const routingAPI = {
  // Create Routing
  createRouting: async (data: CreateRoutingRequest): Promise<APIResponse<Routing>> => {
    return await post("/production/routing", data);
  },

  // Get all Routings
  getAllRoutings: async (): Promise<APIResponse<Routing[]>> => {
    return await get("/production/routing");
  },

  // Get Routing by ID
  getRouting: async (id: number): Promise<APIResponse<Routing>> => {
    return await get(`/production/routing/${id}`);
  },

  // Update Routing
  updateRouting: async (id: number, data: UpdateRoutingRequest): Promise<APIResponse<Routing>> => {
    return await put(`/production/routing/${id}`, data);
  },

  // Delete Routing
  deleteRouting: async (id: number): Promise<APIResponse<{ message: string }>> => {
    return await del(`/production/routing/${id}`);
  }
};