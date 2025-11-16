const BASE_URL = import.meta.env.VITE_BASE_URL || "";

export const get = async <T = any>(
  endpoint: string,
  requiresAuth: boolean = true
): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers.Authorization = token;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }

  return await response.json();
};

export const post = async <T = any>(
  endpoint: string,
  data?: any,
  requiresAuth: boolean = true
): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers.Authorization = token;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }

  return await response.json();
};

export const put = async <T = any>(
  endpoint: string,
  data?: any,
  requiresAuth: boolean = true
): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers.Authorization = token;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "PUT",
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }

  return await response.json();
};

export const del = async <T = any>(
  endpoint: string,
  requiresAuth: boolean = true
): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = localStorage.getItem("token");
    if (token) {
      headers.Authorization = token;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw errorData;
  }

  return await response.json();
};
