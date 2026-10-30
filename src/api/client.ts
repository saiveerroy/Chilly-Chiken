import { User, Shop, Bill, AuditLog, ConsolidatedAnalytics } from '../types/billing';

const TOKEN_KEY = 'bac_auth_token';
const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = (data && typeof data === 'object' && 'error' in data) 
      ? (data as { error: string }).error 
      : `HTTP Error ${response.status}`;
    throw new ApiError(errorMsg, response.status);
  }

  return data as T;
}

export const api = {
  // --- Token helpers ---
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),

  // --- Auth ---
  login: async (username: string, passwordPlain: string): Promise<{ token: string; user: User; shop: Shop | null }> => {
    const res = await request<{ token: string; user: User; shop: Shop | null }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password: passwordPlain }),
    });
    if (res.token) {
      api.setToken(res.token);
    }
    return res;
  },

  logout: async (): Promise<void> => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network failure on logout
    } finally {
      api.clearToken();
    }
  },

  getMe: async (): Promise<{ user: User; shop: Shop | null }> => {
    return request<{ user: User; shop: Shop | null }>('/auth/me');
  },

  // --- Shops ---
  getShops: async (): Promise<Shop[]> => {
    return request<Shop[]>('/shops');
  },

  getShop: async (id: string): Promise<Shop> => {
    return request<Shop>(`/shops/${id}`);
  },

  createShop: async (shopData: Partial<Shop>): Promise<Shop> => {
    return request<Shop>('/shops', {
      method: 'POST',
      body: JSON.stringify(shopData),
    });
  },

  updateShop: async (id: string, updates: Partial<Shop>): Promise<Shop> => {
    return request<Shop>(`/shops/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // --- Employees (Owner only) ---
  getEmployees: async (): Promise<User[]> => {
    return request<User[]>('/employees');
  },

  createEmployee: async (data: {
    username: string;
    password: string;
    shopId: string;
    fullName: string;
    phone?: string;
  }): Promise<User> => {
    return request<User>('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resetEmployeePassword: async (employeeId: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(`/employees/${employeeId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
  },

  updateEmployeeStatus: async (employeeId: string, status: 'active' | 'inactive'): Promise<{ success: boolean; status: string }> => {
    return request<{ success: boolean; status: string }>(`/employees/${employeeId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // --- Bills ---
  getBills: async (shopIdFilter?: string | null, search?: string): Promise<Bill[]> => {
    const params = new URLSearchParams();
    if (shopIdFilter) params.append('shopId', shopIdFilter);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<Bill[]>(`/bills${qs}`);
  },

  createBill: async (billData: Partial<Bill>): Promise<Bill> => {
    return request<Bill>('/bills', {
      method: 'POST',
      body: JSON.stringify(billData),
    });
  },

  reprintBill: async (billId: string): Promise<{ success: boolean; bill: Bill }> => {
    return request<{ success: boolean; bill: Bill }>(`/bills/${billId}/reprint`, {
      method: 'POST',
    });
  },

  adjustBill: async (billId: string, reason: string, adjustments: Partial<Bill>): Promise<Bill> => {
    return request<Bill>(`/bills/${billId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ reason, adjustments }),
    });
  },

  attemptDeleteBill: async (billId: string): Promise<void> => {
    // This will trigger the backend security restriction and log an audit security event
    return request<void>(`/bills/${billId}`, {
      method: 'DELETE',
    });
  },

  // --- Analytics & Audit (Owner only) ---
  getConsolidatedAnalytics: async (): Promise<ConsolidatedAnalytics> => {
    return request<ConsolidatedAnalytics>('/analytics/consolidated');
  },

  getAuditLogs: async (limit = 200): Promise<AuditLog[]> => {
    return request<AuditLog[]>(`/audit-logs?limit=${limit}`);
  },
};
