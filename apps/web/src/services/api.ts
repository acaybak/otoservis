const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';

let accessToken: string | null = null;

export function setToken(token: string | null) {
  accessToken = token;
  if (token) localStorage.setItem('access_token', token);
  else localStorage.removeItem('access_token');
}

export function getToken() {
  if (accessToken) return accessToken;
  const stored = localStorage.getItem('access_token');
  if (stored) { accessToken = stored; return stored; }
  return null;
}

async function request<T>(method: string, path: string, body?: any, tenantId?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['x-tenant-id'] = tenantId;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Sunucu hatası' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string, tenantId?: string) => request<T>('GET', path, undefined, tenantId),
  post: <T>(path: string, body?: any, tenantId?: string) => request<T>('POST', path, body, tenantId),
  patch: <T>(path: string, body?: any, tenantId?: string) => request<T>('PATCH', path, body, tenantId),
  put: <T>(path: string, body?: any, tenantId?: string) => request<T>('PUT', path, body, tenantId),
  delete: <T>(path: string, tenantId?: string) => request<T>('DELETE', path, undefined, tenantId),
};

// Auth
export const authApi = {
  register: (data: { tenantName: string; tenantSlug: string; adminEmail: string; adminPassword: string; adminFirstName: string; adminLastName: string }) =>
    api.post<any>('/tenants/setup', data),
  login: (data: { email: string; password: string }) =>
    api.post<any>('/auth/login', data),
  me: () => api.get<any>('/auth/me'),
};

// Tenants
export const tenantApi = {
  setup: (data: { name: string; slug: string; timezone?: string }) =>
    api.post<any>('/tenants/setup', data),
};

// Customers
export const customerApi = {
  list: (tenantId: string, params?: string) =>
    api.get<any>(`/customers${params ? `?${params}` : ''}`, tenantId),
  get: (tenantId: string, id: string) =>
    api.get<any>(`/customers/${id}`, tenantId),
  create: (tenantId: string, data: any) =>
    api.post<any>('/customers', data, tenantId),
  update: (tenantId: string, id: string, data: any) =>
    api.patch<any>(`/customers/${id}`, data, tenantId),
  remove: (tenantId: string, id: string) =>
    api.delete<any>(`/customers/${id}`, tenantId),
};

// Vehicles
export const vehicleApi = {
  list: (tenantId: string, params?: string) =>
    api.get<any>(`/vehicles${params ? `?${params}` : ''}`, tenantId),
  create: (tenantId: string, data: any) =>
    api.post<any>('/vehicles', data, tenantId),
  update: (tenantId: string, id: string, data: any) =>
    api.patch<any>(`/vehicles/${id}`, data, tenantId),
  remove: (tenantId: string, id: string) =>
    api.delete<any>(`/vehicles/${id}`, tenantId),
};

// Service Orders
export const serviceOrderApi = {
  list: (tenantId: string, params?: string) =>
    api.get<any>(`/service-orders${params ? `?${params}` : ''}`, tenantId),
  get: (tenantId: string, id: string) =>
    api.get<any>(`/service-orders/${id}`, tenantId),
  create: (tenantId: string, data: any) =>
    api.post<any>('/service-orders', data, tenantId),
  update: (tenantId: string, id: string, data: any) =>
    api.patch<any>(`/service-orders/${id}`, data, tenantId),
  remove: (tenantId: string, id: string) =>
    api.delete<any>(`/service-orders/${id}`, tenantId),
};

// Accounting
export const accountingApi = {
  getDashboard: (tenantId: string) =>
    api.get<any>('/accounting/dashboard', tenantId),
  getCustomerAccounts: (tenantId: string) =>
    api.get<any>('/accounting/customer-accounts', tenantId),
  getPayments: (tenantId: string, params?: string) =>
    api.get<any>(`/accounting/payments${params ? `?${params}` : ''}`, tenantId),
  recordPayment: (tenantId: string, data: any) =>
    api.post<any>('/accounting/payments', data, tenantId),
  getInvoices: (tenantId: string, params?: string) =>
    api.get<any>(`/accounting/invoices${params ? `?${params}` : ''}`, tenantId),
  createInvoice: (tenantId: string, data: any) =>
    api.post<any>('/accounting/invoices', data, tenantId),
};

// Reporting
export const reportingApi = {
  getDashboard: (tenantId: string) =>
    api.get<any>('/reporting/dashboard', tenantId),
  getSales: (tenantId: string, params?: string) =>
    api.get<any>(`/reporting/sales${params ? `?${params}` : ''}`, tenantId),
  getInventory: (tenantId: string) =>
    api.get<any>('/reporting/inventory', tenantId),
  getAging: (tenantId: string) =>
    api.get<any>('/reporting/aging', tenantId),
};

// Settings
export const settingsApi = {
  get: (tenantId: string) => api.get<any>('/settings', tenantId),
  update: (tenantId: string, data: any) => api.put<any>('/settings', data, tenantId),
};
