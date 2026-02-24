// services/permissionService.ts
import { get } from "./apiService";

export interface Permission {
  basic: boolean;
  moderate: boolean;
  full: boolean;
  critical: boolean;
}

export interface PermissionsResponse {
  status: boolean;
  message: string;
  data: {
    [key: string]: Permission;
  };
}

export const permissionService = {
  // Get user permissions
  getUserPermissions: async (): Promise<PermissionsResponse> =>
    await get("/permissions"),
};