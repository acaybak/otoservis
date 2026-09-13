const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3002/api/v1';
let accessToken = null;
export function setToken(token) {
    accessToken = token;
    if (token)
        localStorage.setItem('access_token', token);
    else
        localStorage.removeItem('access_token');
}
export function getToken() {
    if (accessToken)
        return accessToken;
    const stored = localStorage.getItem('access_token');
    if (stored) {
        accessToken = stored;
        return stored;
    }
    return null;
}
async function request(method, path, body, tenantId) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token)
        headers['Authorization'] = `Bearer ${token}`;
    if (tenantId)
        headers['x-tenant-id'] = tenantId;
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
    get: (path, tenantId) => request('GET', path, undefined, tenantId),
    post: (path, body, tenantId) => request('POST', path, body, tenantId),
    patch: (path, body, tenantId) => request('PATCH', path, body, tenantId),
    put: (path, body, tenantId) => request('PUT', path, body, tenantId),
    delete: (path, tenantId) => request('DELETE', path, undefined, tenantId),
};
// Auth
export const authApi = {
    register: (data) => api.post('/tenants/setup', data),
    login: (data) => api.post('/auth/login', data),
    me: () => api.get('/auth/me'),
};
// Tenants
export const tenantApi = {
    setup: (data) => api.post('/tenants/setup', data),
};
// Customers
export const customerApi = {
    list: (tenantId, params) => api.get(`/customers${params ? `?${params}` : ''}`, tenantId),
    get: (tenantId, id) => api.get(`/customers/${id}`, tenantId),
    create: (tenantId, data) => api.post('/customers', data, tenantId),
    update: (tenantId, id, data) => api.patch(`/customers/${id}`, data, tenantId),
    remove: (tenantId, id) => api.delete(`/customers/${id}`, tenantId),
};
// Vehicles
export const vehicleApi = {
    list: (tenantId, params) => api.get(`/vehicles${params ? `?${params}` : ''}`, tenantId),
    create: (tenantId, data) => api.post('/vehicles', data, tenantId),
    update: (tenantId, id, data) => api.patch(`/vehicles/${id}`, data, tenantId),
    remove: (tenantId, id) => api.delete(`/vehicles/${id}`, tenantId),
};
// Service Orders
export const serviceOrderApi = {
    list: (tenantId, params) => api.get(`/service-orders${params ? `?${params}` : ''}`, tenantId),
    get: (tenantId, id) => api.get(`/service-orders/${id}`, tenantId),
    create: (tenantId, data) => api.post('/service-orders', data, tenantId),
    update: (tenantId, id, data) => api.patch(`/service-orders/${id}`, data, tenantId),
    remove: (tenantId, id) => api.delete(`/service-orders/${id}`, tenantId),
};
// Accounting
export const accountingApi = {
    getDashboard: (tenantId) => api.get('/accounting/dashboard', tenantId),
    getCustomerAccounts: (tenantId) => api.get('/accounting/customer-accounts', tenantId),
    getPayments: (tenantId, params) => api.get(`/accounting/payments${params ? `?${params}` : ''}`, tenantId),
    recordPayment: (tenantId, data) => api.post('/accounting/payments', data, tenantId),
    getInvoices: (tenantId, params) => api.get(`/accounting/invoices${params ? `?${params}` : ''}`, tenantId),
    createInvoice: (tenantId, data) => api.post('/accounting/invoices', data, tenantId),
};
// Reporting
export const reportingApi = {
    getDashboard: (tenantId) => api.get('/reporting/dashboard', tenantId),
    getSales: (tenantId, params) => api.get(`/reporting/sales${params ? `?${params}` : ''}`, tenantId),
    getInventory: (tenantId) => api.get('/reporting/inventory', tenantId),
    getAging: (tenantId) => api.get('/reporting/aging', tenantId),
};
// Settings
export const settingsApi = {
    get: (tenantId) => api.get('/settings', tenantId),
    update: (tenantId, data) => api.put('/settings', data, tenantId),
};
