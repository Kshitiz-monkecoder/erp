import { get, post, put, del } from "./apiService";

// Generic API Response
export interface APIResponse<T> {
  status: boolean;
  message?: string;
  data: T;
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
  usersCount: number;
  permissions?: TeamPermissions;
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
  teamId?: number; // Added for better team assignment
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
  // TEAMS - Correct endpoints
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
    await put(`/teams/${id}`, data),

  deleteTeam: async (
    id: number
  ): Promise<APIResponse<{ message: string }>> =>
    await del(`/teams/${id}`),

  assignUserToTeam: async (
    data: AssignUserRequest
  ): Promise<APIResponse<{ message: string }>> =>
    await post("/teams/assign-user", data),

  // -------------------------------
  // USERS
  // -------------------------------
  getAllUsers: async (page: number = 1, limit: number = 10): Promise<APIResponse<any>> =>
    await get(`/users?page=${page}&limit=${limit}`),

  createUser: async (data: CreateUserRequest): Promise<APIResponse<UserResponse>> =>
    await post("/users", data),

  updateUser: async (
    id: number,
    data: Partial<UserResponse>
  ): Promise<APIResponse<UserResponse>> =>
    await put(`/users/${id}`, data),

  deleteUser: async (
    id: number
  ): Promise<APIResponse<{ message: string }>> =>
    await del(`/users/${id}`),

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