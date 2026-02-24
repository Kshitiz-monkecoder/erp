import { get, post, put, del } from "./apiService";

// Generic API Response
export interface APIResponse<T> {
  status: boolean;
  message?: string;
  data: T;
}

// ------------------------------
// PERMISSION TYPES (Add these)
// ------------------------------
export interface Permission {
  basic: boolean;
  moderate: boolean;
  full: boolean;
  critical: boolean;
}

export interface Permissions {
  [module: string]: Permission;
}

export interface TeamPermissionsRequest {
  teamId: number;
  permissions: Permissions;
}

export interface PermissionsResponse {
  status: boolean;
  message: string;
  data: {
    [key: string]: Permission;
  };
}

// ------------------------------
// TEAM TYPES
// ------------------------------
export interface TeamPermissions {
  [module: string]: {
    basic: boolean;
    moderate: boolean;
    full: boolean;
    critical: boolean;
  };
}

export interface TeamRequest {
  name: string;
  description?: string;
  permissions?: TeamPermissions;
}

export interface TeamResponse {
  id: number;
  name: string;
  description: string;
  permissions: {
    [key: string]: {
      full: boolean;
      basic: boolean;
      critical: boolean;
      moderate: boolean;
    };
  };
  companyId: number;
  createdAt: string;
  updatedAt: string;
  userCount: number;
}

// ------------------------------
// USER TYPES
// ------------------------------
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  team: string | null;
  teamId?: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
  teamId?: number;
  password?: string;
}

export interface AssignUserRequest {
  userId: number;
  teamId: number;
}

// ------------------------------
// INVITE TYPES
// ------------------------------
export interface InviteRequest {
  teamId: number;
  emails?: string[];
}

export interface InviteResponse {
  link: string;
}

export interface JoinTeamRequest {
  token: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface JoinTeamResponse {
  token: string;
}

// ============================================================
// USER + TEAM API Service
// ============================================================

export const userService = {
  // -------------------------------
  // TEAMS
  // -------------------------------
  createTeam: async (data: TeamRequest): Promise<APIResponse<TeamResponse>> =>
    await post("/team", data),

  getAllTeams: async (): Promise<APIResponse<TeamResponse[]>> =>
    await get("/teams"),

  getTeamById: async (id: number): Promise<APIResponse<TeamResponse>> =>
    await get(`/teams/${id}`),

  updateTeam: async (
    id: number,
    data: Partial<TeamRequest>
  ): Promise<APIResponse<TeamResponse>> =>
    await put(`/team/${id}`, data),

  deleteTeam: async (
    id: number
  ): Promise<APIResponse<{ message: string }>> =>
    await del(`/team/${id}`),

  assignUserToTeam: async (
    data: AssignUserRequest
  ): Promise<APIResponse<{ message: string }>> =>
    await post("/teams/assign-user", data),

  // -------------------------------
  // PERMISSIONS (Add these methods)
  // -------------------------------
  // Get all available permissions (modules)
  getAllPermissions: async (): Promise<APIResponse<Permissions>> =>
    await get("/permissions"),

  // Update team permissions
  // Update team permissions
updateTeamPermissions: async (
  data: TeamPermissionsRequest
): Promise<APIResponse<{ message: string }>> =>
  await put(`/team/${data.teamId}`, { permissions: data.permissions }),
  // Get team permissions
  getTeamPermissions: async (
    teamId: number
  ): Promise<APIResponse<{ permissions: Permissions }>> =>
    await get(`/team/${teamId}`),

  // -------------------------------
  // USERS
  // -------------------------------
  getAllUsers: async (page: number = 1, limit: number = 10): Promise<APIResponse<any>> =>
    await get(`/users?page=${page}&limit=${limit}`),

  createUser: async (data: CreateUserRequest): Promise<APIResponse<UserResponse>> =>
    await post("/user", data),

  updateUser: async (
    id: number,
    data: Partial<CreateUserRequest>
  ): Promise<APIResponse<UserResponse>> => {
    const requestData = {
      ...data,
      id: id
    };
    return await put(`/user/${id}`, requestData);
  },

  deleteUser: async (
    id: number
  ): Promise<APIResponse<{ message: string }>> =>
    await del(`/user/${id}`),

  // -------------------------------
  // INVITES
  // -------------------------------
  generateInviteLink: async (
    data: InviteRequest
  ): Promise<APIResponse<InviteResponse>> =>
    await post("/teams/invite", data),

  joinTeam: async (
    data: JoinTeamRequest
  ): Promise<APIResponse<JoinTeamResponse>> =>
    await post("/auth/join", data),
};