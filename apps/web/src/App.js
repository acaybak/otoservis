import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { authApi, setToken, getToken, customerApi, vehicleApi, serviceOrderApi, reportingApi } from './services/api';
// ============ STYLES ============
const S = {
    page: { minHeight: '100vh', background: '#f1f5f9' },
    loginWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' },
    loginCard: { background: 'white', borderRadius: 16, padding: 40, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },
    loginTitle: { fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8, textAlign: 'center' },
    loginSub: { color: '#64748b', textAlign: 'center', marginBottom: 32 },
    input: { width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 15, marginBottom: 16, outline: 'none' },
    btnPrimary: { width: '100%', padding: '14px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' },
    btnSecondary: { padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    btnDanger: { padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    btnSuccess: { padding: '8px 16px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    error: { background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 },
    link: { color: '#2563eb', cursor: 'pointer', fontSize: 14 },
    layout: { display: 'flex', minHeight: '100vh' },
    sidebar: { width: 240, background: '#0f172a', color: 'white', padding: '20px 0', position: 'fixed', top: 0, bottom: 0, overflowY: 'auto' },
    sidebarLogo: { padding: '0 20px 20px', fontSize: 20, fontWeight: 800, borderBottom: '1px solid #1e293b', marginBottom: 16 },
    navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.2s', borderLeft: '3px solid transparent' },
    navItemActive: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600, background: '#1e293b', borderLeft: '3px solid #2563eb' },
    main: { flex: 1, marginLeft: 240, padding: 32 },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    pageTitle: { fontSize: 24, fontWeight: 700, color: '#0f172a' },
    card: { background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 },
    statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 },
    statCard: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    statLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 },
    statValue: { fontSize: 28, fontWeight: 700, color: '#0f172a' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
    th: { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' },
    td: { padding: '12px 16px', borderBottom: '1px solid #f1f5f9' },
    badge: (color) => ({ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: color === 'green' ? '#f0fdf4' : color === 'red' ? '#fef2f2' : color === 'yellow' ? '#fefce8' : '#f0f9ff', color: color === 'green' ? '#16a34a' : color === 'red' ? '#dc2626' : color === 'yellow' ? '#ca8a04' : '#2563eb' }),
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: 16, padding: 32, width: 500, maxHeight: '80vh', overflowY: 'auto' },
    modalTitle: { fontSize: 20, fontWeight: 700, marginBottom: 20 },
    formGroup: { marginBottom: 16 },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 },
    select: { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' },
    toolbar: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' },
    searchInput: { padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: 280, outline: 'none' },
    empty: { textAlign: 'center', padding: 40, color: '#94a3b8' },
};
function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const token = getToken();
        if (token) {
            authApi.me().then((res) => {
                setUser({ id: res.id, email: res.email, firstName: res.firstName, lastName: res.lastName, tenantId: res.tenantId, roles: res.roles || [], status: res.status });
            }).catch(() => { setToken(null); setLoading(false); });
        }
        else {
            setLoading(false);
        }
    }, []);
    const login = async (email, password) => {
        const res = await authApi.login({ email, password });
        setToken(res.accessToken);
        const u = res.user;
        setUser({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, tenantId: u.tenantId, roles: u.roles || [], status: u.status });
        return res;
    };
    const register = async (data) => {
        await authApi.register(data);
        const loginRes = await authApi.login({ email: data.adminEmail, password: data.adminPassword });
        setToken(loginRes.accessToken);
        const u = loginRes.user;
        setUser({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, tenantId: u.tenantId, roles: u.roles || [], status: u.status });
        return loginRes;
    };
    const logout = () => { setToken(null); setUser(null); };
    return { user, loading, login, register, logout };
}
// ============ LOGIN PAGE ============
function LoginPage({ onLogin, onSwitch }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [tenantName, setTenantName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await onLogin(email, password);
        }
        catch (err) {
            setError(err.message || 'Giriş başarısız');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { style: S.loginWrap, children: _jsxs("div", { style: S.loginCard, children: [_jsx("div", { style: S.loginTitle, children: "OtoServis" }), _jsx("div", { style: S.loginSub, children: "Servis Y\u00F6netim Sistemi" }), error && _jsx("div", { style: S.error, children: error }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { style: S.input, placeholder: "E-posta", type: "email", value: email, onChange: e => setEmail(e.target.value), required: true }), _jsx("input", { style: S.input, placeholder: "\u015Eifre", type: "password", value: password, onChange: e => setPassword(e.target.value), required: true }), _jsx("button", { type: "submit", style: { ...S.btnPrimary, opacity: loading ? 0.7 : 1 }, disabled: loading, children: loading ? 'Giriş yapılıyor...' : 'Giriş Yap' })] }), _jsxs("div", { style: { marginTop: 16, textAlign: 'center' }, children: [_jsx("span", { style: { color: '#64748b', fontSize: 14 }, children: "Hesab\u0131n\u0131z yok mu? " }), _jsx("span", { style: S.link, onClick: onSwitch, children: "Kay\u0131t Ol" })] })] }) }));
}
// ============ REGISTER PAGE ============
function RegisterPage({ onRegister, onSwitch }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [tenantName, setTenantName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            await onRegister({ tenantName, tenantSlug: slug, adminEmail: email, adminPassword: password, adminFirstName: firstName, adminLastName: lastName });
        }
        catch (err) {
            setError(err.message || 'Kayıt başarısız');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { style: S.loginWrap, children: _jsxs("div", { style: S.loginCard, children: [_jsx("div", { style: S.loginTitle, children: "Hesap Olu\u015Ftur" }), _jsx("div", { style: S.loginSub, children: "Servisinizi buluta ta\u015F\u0131y\u0131n" }), error && _jsx("div", { style: S.error, children: error }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("input", { style: S.input, placeholder: "Firma Ad\u0131", value: tenantName, onChange: e => setTenantName(e.target.value), required: true }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }, children: [_jsx("input", { style: S.input, placeholder: "Ad", value: firstName, onChange: e => setFirstName(e.target.value), required: true }), _jsx("input", { style: S.input, placeholder: "Soyad", value: lastName, onChange: e => setLastName(e.target.value), required: true })] }), _jsx("input", { style: S.input, placeholder: "E-posta", type: "email", value: email, onChange: e => setEmail(e.target.value), required: true }), _jsx("input", { style: S.input, placeholder: "\u015Eifre (min 8, b\u00FCy\u00FCk+k\u00FC\u00E7\u00FCk+rakam)", type: "password", value: password, onChange: e => setPassword(e.target.value), required: true, minLength: 8 }), _jsx("button", { type: "submit", style: { ...S.btnPrimary, opacity: loading ? 0.7 : 1 }, disabled: loading, children: loading ? 'Oluşturuluyor...' : 'Kayıt Ol' })] }), _jsxs("div", { style: { marginTop: 16, textAlign: 'center' }, children: [_jsx("span", { style: { color: '#64748b', fontSize: 14 }, children: "Zaten hesab\u0131n\u0131z var m\u0131? " }), _jsx("span", { style: S.link, onClick: onSwitch, children: "Giri\u015F Yap" })] })] }) }));
}
// ============ LAYOUT ============
function Layout({ user, onLogout, children }) {
    const location = useLocation();
    const navItems = [
        { path: '/', icon: '📊', label: 'Dashboard' },
        { path: '/customers', icon: '👥', label: 'Müşteriler' },
        { path: '/vehicles', icon: '🚗', label: 'Araçlar' },
        { path: '/service-orders', icon: '🔧', label: 'Servis Siparişleri' },
        { path: '/receivables', icon: '💳', label: 'Cari Hesaplar' },
        { path: '/financial', icon: '💰', label: 'Ön Muhasebe' },
        { path: '/settings', icon: '⚙️', label: 'Ayarlar' },
    ];
    return (_jsxs("div", { style: S.layout, children: [_jsxs("aside", { style: S.sidebar, children: [_jsx("div", { style: S.sidebarLogo, children: "OtoServis" }), _jsx("nav", { children: navItems.map(item => (_jsxs(Link, { to: item.path, style: location.pathname === item.path ? S.navItemActive : S.navItem, children: [_jsx("span", { children: item.icon }), _jsx("span", { children: item.label })] }, item.path))) }), _jsxs("div", { style: { padding: '20px', marginTop: 'auto', borderTop: '1px solid #1e293b', position: 'absolute', bottom: 0, width: 240 }, children: [_jsxs("div", { style: { fontSize: 13, color: '#94a3b8', marginBottom: 4 }, children: [user.firstName, " ", user.lastName] }), _jsx("div", { style: { fontSize: 12, color: '#64748b', marginBottom: 12 }, children: user.email }), _jsx("button", { onClick: onLogout, style: { ...S.btnDanger, width: '100%', fontSize: 13 }, children: "\u00C7\u0131k\u0131\u015F Yap" })] })] }), _jsx("main", { style: S.main, children: children })] }));
}
// ============ DASHBOARD ============
function DashboardPage({ tenantId }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        Promise.all([
            reportingApi.getDashboard(tenantId).catch(() => null),
            customerApi.list(tenantId, 'limit=1000').catch(() => ({ data: [] })),
            vehicleApi.list(tenantId, 'limit=1000').catch(() => ({ data: [] })),
            serviceOrderApi.list(tenantId, 'limit=1000').catch(() => ({ data: [] })),
        ]).then(([report, cust, veh, ord]) => {
            const customers = cust?.data || cust || [];
            const vehicles = veh?.data || veh || [];
            const orders = ord?.data || ord || [];
            const activeOrders = orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
            const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
            const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
            const totalPaid = completedOrders.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
            setStats({
                customerCount: Array.isArray(customers) ? customers.length : 0,
                vehicleCount: Array.isArray(vehicles) ? vehicles.length : 0,
                activeOrderCount: activeOrders.length,
                completedOrderCount: completedOrders.length,
                totalRevenue,
                totalPaid,
                receivables: totalRevenue - totalPaid,
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [tenantId]);
    if (loading)
        return _jsx("div", { style: S.empty, children: "Y\u00FCkleniyor..." });
    return (_jsxs("div", { children: [_jsx("div", { style: S.header, children: _jsx("h1", { style: S.pageTitle, children: "Dashboard" }) }), _jsxs("div", { style: S.statGrid, children: [_jsxs("div", { style: S.statCard, children: [_jsx("div", { style: S.statLabel, children: "Toplam M\u00FC\u015Fteri" }), _jsx("div", { style: S.statValue, children: stats?.customerCount || 0 })] }), _jsxs("div", { style: S.statCard, children: [_jsx("div", { style: S.statLabel, children: "Toplam Ara\u00E7" }), _jsx("div", { style: S.statValue, children: stats?.vehicleCount || 0 })] }), _jsxs("div", { style: S.statCard, children: [_jsx("div", { style: S.statLabel, children: "Aktif Sipari\u015Fler" }), _jsx("div", { style: { ...S.statValue, color: '#2563eb' }, children: stats?.activeOrderCount || 0 })] }), _jsxs("div", { style: S.statCard, children: [_jsx("div", { style: S.statLabel, children: "Tamamlanan" }), _jsx("div", { style: { ...S.statValue, color: '#16a34a' }, children: stats?.completedOrderCount || 0 })] }), _jsxs("div", { style: S.statCard, children: [_jsx("div", { style: S.statLabel, children: "Toplam Gelir" }), _jsxs("div", { style: { ...S.statValue, color: '#16a34a' }, children: ["\u20BA", (stats?.totalRevenue || 0).toLocaleString('tr-TR')] })] }), _jsxs("div", { style: S.statCard, children: [_jsx("div", { style: S.statLabel, children: "Tahsil Edilen" }), _jsxs("div", { style: { ...S.statValue, color: '#16a34a' }, children: ["\u20BA", (stats?.totalPaid || 0).toLocaleString('tr-TR')] })] }), _jsxs("div", { style: S.statCard, children: [_jsx("div", { style: S.statLabel, children: "Alacaklar" }), _jsxs("div", { style: { ...S.statValue, color: '#dc2626' }, children: ["\u20BA", (stats?.receivables || 0).toLocaleString('tr-TR')] })] })] })] }));
}
// ============ CUSTOMERS PAGE ============
function CustomersPage({ tenantId }) {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '', notes: '' });
    const load = useCallback(async () => {
        try {
            const res = await customerApi.list(tenantId, 'limit=1000');
            setCustomers(res?.data || res || []);
        }
        catch {
            setCustomers([]);
        }
        setLoading(false);
    }, [tenantId]);
    useEffect(() => { load(); }, [load]);
    const handleCreate = async () => {
        await customerApi.create(tenantId, form);
        setShowForm(false);
        setForm({ fullName: '', phone: '', email: '', address: '', notes: '' });
        load();
    };
    const handleDelete = async (id) => {
        if (!confirm('Silmek istediğinize emin misiniz?'))
            return;
        await customerApi.remove(tenantId, id);
        load();
    };
    const filtered = customers.filter(c => (c.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
        (c.phone || '').includes(search));
    return (_jsxs("div", { children: [_jsxs("div", { style: S.header, children: [_jsx("h1", { style: S.pageTitle, children: "M\u00FC\u015Fteriler" }), _jsx("button", { style: S.btnPrimary, onClick: () => setShowForm(true), children: "+ Yeni M\u00FC\u015Fteri" })] }), _jsxs("div", { style: S.card, children: [_jsx("div", { style: S.toolbar, children: _jsx("input", { style: S.searchInput, placeholder: "M\u00FC\u015Fteri ara...", value: search, onChange: e => setSearch(e.target.value) }) }), loading ? _jsx("div", { style: S.empty, children: "Y\u00FCkleniyor..." }) : filtered.length === 0 ? _jsx("div", { style: S.empty, children: "M\u00FC\u015Fteri bulunamad\u0131" }) : (_jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Ad Soyad" }), _jsx("th", { style: S.th, children: "Telefon" }), _jsx("th", { style: S.th, children: "E-posta" }), _jsx("th", { style: S.th, children: "\u0130\u015Flem" })] }) }), _jsx("tbody", { children: filtered.map(c => (_jsxs("tr", { children: [_jsx("td", { style: S.td, children: _jsx("strong", { children: c.fullName }) }), _jsx("td", { style: S.td, children: c.phone || '-' }), _jsx("td", { style: S.td, children: c.email || '-' }), _jsx("td", { style: S.td, children: _jsx("button", { style: S.btnDanger, onClick: () => handleDelete(c.id), children: "Sil" }) })] }, c.id))) })] }))] }), showForm && (_jsx("div", { style: S.modal, onClick: () => setShowForm(false), children: _jsxs("div", { style: S.modalContent, onClick: e => e.stopPropagation(), children: [_jsx("div", { style: S.modalTitle, children: "Yeni M\u00FC\u015Fteri" }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "Ad Soyad" }), _jsx("input", { style: S.input, value: form.fullName, onChange: e => setForm({ ...form, fullName: e.target.value }) })] }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "Telefon" }), _jsx("input", { style: S.input, value: form.phone, onChange: e => setForm({ ...form, phone: e.target.value }) })] }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "E-posta" }), _jsx("input", { style: S.input, type: "email", value: form.email, onChange: e => setForm({ ...form, email: e.target.value }) })] }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "Adres" }), _jsx("input", { style: S.input, value: form.address, onChange: e => setForm({ ...form, address: e.target.value }) })] }), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' }, children: [_jsx("button", { style: S.btnSecondary, onClick: () => setShowForm(false), children: "\u0130ptal" }), _jsx("button", { style: S.btnPrimary, onClick: handleCreate, children: "Kaydet" })] })] }) }))] }));
}
// ============ VEHICLES PAGE ============
function VehiclesPage({ tenantId }) {
    const [vehicles, setVehicles] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ plate: '', brand: '', model: '', year: '', color: '', customerId: '' });
    const load = useCallback(async () => {
        try {
            const [vRes, cRes] = await Promise.all([
                vehicleApi.list(tenantId, 'limit=1000'),
                customerApi.list(tenantId, 'limit=1000'),
            ]);
            setVehicles(vRes?.data || vRes || []);
            setCustomers(cRes?.data || cRes || []);
        }
        catch { /* ignore */ }
        setLoading(false);
    }, [tenantId]);
    useEffect(() => { load(); }, [load]);
    const handleCreate = async () => {
        await vehicleApi.create(tenantId, { ...form, year: form.year ? Number(form.year) : null });
        setShowForm(false);
        setForm({ plate: '', brand: '', model: '', year: '', color: '', customerId: '' });
        load();
    };
    const filtered = vehicles.filter(v => (v.plate || '').toLowerCase().includes(search.toLowerCase()) ||
        (v.brand || '').toLowerCase().includes(search.toLowerCase()));
    const getCustomerName = (id) => customers.find(c => c.id === id)?.fullName || '-';
    return (_jsxs("div", { children: [_jsxs("div", { style: S.header, children: [_jsx("h1", { style: S.pageTitle, children: "Ara\u00E7lar" }), _jsx("button", { style: S.btnPrimary, onClick: () => setShowForm(true), children: "+ Yeni Ara\u00E7" })] }), _jsxs("div", { style: S.card, children: [_jsx("div", { style: S.toolbar, children: _jsx("input", { style: S.searchInput, placeholder: "Plaka veya marka ara...", value: search, onChange: e => setSearch(e.target.value) }) }), loading ? _jsx("div", { style: S.empty, children: "Y\u00FCkleniyor..." }) : filtered.length === 0 ? _jsx("div", { style: S.empty, children: "Ara\u00E7 bulunamad\u0131" }) : (_jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Plaka" }), _jsx("th", { style: S.th, children: "Marka/Model" }), _jsx("th", { style: S.th, children: "Y\u0131l" }), _jsx("th", { style: S.th, children: "Renk" }), _jsx("th", { style: S.th, children: "M\u00FC\u015Fteri" }), _jsx("th", { style: S.th, children: "\u0130\u015Flem" })] }) }), _jsx("tbody", { children: filtered.map(v => (_jsxs("tr", { children: [_jsx("td", { style: S.td, children: _jsx("strong", { children: v.plate }) }), _jsxs("td", { style: S.td, children: [v.brand, " ", v.model] }), _jsx("td", { style: S.td, children: v.year || '-' }), _jsx("td", { style: S.td, children: v.color || '-' }), _jsx("td", { style: S.td, children: getCustomerName(v.customerId) }), _jsx("td", { style: S.td, children: _jsx("button", { style: S.btnDanger, onClick: () => { vehicleApi.remove(tenantId, v.id); load(); }, children: "Sil" }) })] }, v.id))) })] }))] }), showForm && (_jsx("div", { style: S.modal, onClick: () => setShowForm(false), children: _jsxs("div", { style: S.modalContent, onClick: e => e.stopPropagation(), children: [_jsx("div", { style: S.modalTitle, children: "Yeni Ara\u00E7" }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "Plaka" }), _jsx("input", { style: S.input, value: form.plate, onChange: e => setForm({ ...form, plate: e.target.value }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }, children: [_jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "Marka" }), _jsx("input", { style: S.input, value: form.brand, onChange: e => setForm({ ...form, brand: e.target.value }) })] }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "Model" }), _jsx("input", { style: S.input, value: form.model, onChange: e => setForm({ ...form, model: e.target.value }) })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }, children: [_jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "Y\u0131l" }), _jsx("input", { style: S.input, type: "number", value: form.year, onChange: e => setForm({ ...form, year: e.target.value }) })] }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "Renk" }), _jsx("input", { style: S.input, value: form.color, onChange: e => setForm({ ...form, color: e.target.value }) })] })] }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "M\u00FC\u015Fteri" }), _jsxs("select", { style: S.select, value: form.customerId, onChange: e => setForm({ ...form, customerId: e.target.value }), children: [_jsx("option", { value: "", children: "Se\u00E7iniz..." }), customers.map(c => _jsx("option", { value: c.id, children: c.fullName }, c.id))] })] }), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' }, children: [_jsx("button", { style: S.btnSecondary, onClick: () => setShowForm(false), children: "\u0130ptal" }), _jsx("button", { style: S.btnPrimary, onClick: handleCreate, children: "Kaydet" })] })] }) }))] }));
}
// ============ SERVICE ORDERS PAGE ============
function ServiceOrdersPage({ tenantId }) {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ customerId: '', vehicleId: '', description: '', totalAmount: '', laborAmount: '', partsAmount: '' });
    const load = useCallback(async () => {
        try {
            const [oRes, cRes, vRes] = await Promise.all([
                serviceOrderApi.list(tenantId, 'limit=1000'),
                customerApi.list(tenantId, 'limit=1000'),
                vehicleApi.list(tenantId, 'limit=1000'),
            ]);
            setOrders(oRes?.data || oRes || []);
            setCustomers(cRes?.data || cRes || []);
            setVehicles(vRes?.data || vRes || []);
        }
        catch { /* ignore */ }
        setLoading(false);
    }, [tenantId]);
    useEffect(() => { load(); }, [load]);
    const handleCreate = async () => {
        await serviceOrderApi.create(tenantId, {
            ...form,
            totalAmount: Number(form.totalAmount) || 0,
            laborAmount: Number(form.laborAmount) || 0,
            partsAmount: Number(form.partsAmount) || 0,
        });
        setShowForm(false);
        setForm({ customerId: '', vehicleId: '', description: '', totalAmount: '', laborAmount: '', partsAmount: '' });
        load();
    };
    const getCustomerName = (id) => customers.find(c => c.id === id)?.fullName || '-';
    const getVehiclePlate = (id) => vehicles.find(v => v.id === id)?.plate || '-';
    const statusLabel = {
        PENDING: { text: 'Bekliyor', color: 'yellow' },
        IN_PROGRESS: { text: 'Devam Ediyor', color: 'blue' },
        WAITING_PARTS: { text: 'Parça Bekliyor', color: 'yellow' },
        COMPLETED: { text: 'Tamamlandı', color: 'green' },
        CANCELLED: { text: 'İptal', color: 'red' },
    };
    return (_jsxs("div", { children: [_jsxs("div", { style: S.header, children: [_jsx("h1", { style: S.pageTitle, children: "Servis Sipari\u015Fleri" }), _jsx("button", { style: S.btnPrimary, onClick: () => setShowForm(true), children: "+ Yeni Sipari\u015F" })] }), _jsx("div", { style: S.card, children: loading ? _jsx("div", { style: S.empty, children: "Y\u00FCkleniyor..." }) : orders.length === 0 ? _jsx("div", { style: S.empty, children: "Sipari\u015F bulunamad\u0131" }) : (_jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "M\u00FC\u015Fteri" }), _jsx("th", { style: S.th, children: "Ara\u00E7" }), _jsx("th", { style: S.th, children: "A\u00E7\u0131klama" }), _jsx("th", { style: S.th, children: "Tutar" }), _jsx("th", { style: S.th, children: "Durum" })] }) }), _jsx("tbody", { children: orders.map(o => (_jsxs("tr", { children: [_jsx("td", { style: S.td, children: getCustomerName(o.customerId) }), _jsx("td", { style: S.td, children: getVehiclePlate(o.vehicleId) }), _jsx("td", { style: S.td, children: o.description || '-' }), _jsx("td", { style: S.td, children: _jsxs("strong", { children: ["\u20BA", Number(o.totalAmount || 0).toLocaleString('tr-TR')] }) }), _jsx("td", { style: S.td, children: _jsx("span", { style: S.badge(statusLabel[o.status]?.color || 'blue'), children: statusLabel[o.status]?.text || o.status }) })] }, o.id))) })] })) }), showForm && (_jsx("div", { style: S.modal, onClick: () => setShowForm(false), children: _jsxs("div", { style: S.modalContent, onClick: e => e.stopPropagation(), children: [_jsx("div", { style: S.modalTitle, children: "Yeni Servis Sipari\u015Fi" }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "M\u00FC\u015Fteri" }), _jsxs("select", { style: S.select, value: form.customerId, onChange: e => setForm({ ...form, customerId: e.target.value }), children: [_jsx("option", { value: "", children: "Se\u00E7iniz..." }), customers.map(c => _jsx("option", { value: c.id, children: c.fullName }, c.id))] })] }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "Ara\u00E7" }), _jsxs("select", { style: S.select, value: form.vehicleId, onChange: e => setForm({ ...form, vehicleId: e.target.value }), children: [_jsx("option", { value: "", children: "Se\u00E7iniz..." }), vehicles.map(v => _jsxs("option", { value: v.id, children: [v.plate, " - ", v.brand, " ", v.model] }, v.id))] })] }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "A\u00E7\u0131klama" }), _jsx("input", { style: S.input, value: form.description, onChange: e => setForm({ ...form, description: e.target.value }) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }, children: [_jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "Toplam Tutar" }), _jsx("input", { style: S.input, type: "number", value: form.totalAmount, onChange: e => setForm({ ...form, totalAmount: e.target.value }) })] }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "\u0130\u015F\u00E7ilik" }), _jsx("input", { style: S.input, type: "number", value: form.laborAmount, onChange: e => setForm({ ...form, laborAmount: e.target.value }) })] }), _jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: "Par\u00E7a" }), _jsx("input", { style: S.input, type: "number", value: form.partsAmount, onChange: e => setForm({ ...form, partsAmount: e.target.value }) })] })] }), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'flex-end' }, children: [_jsx("button", { style: S.btnSecondary, onClick: () => setShowForm(false), children: "\u0130ptal" }), _jsx("button", { style: S.btnPrimary, onClick: handleCreate, children: "Kaydet" })] })] }) }))] }));
}
// ============ RECEIVABLES PAGE ============
function ReceivablesPage({ tenantId }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        Promise.all([
            customerApi.list(tenantId, 'limit=1000'),
            serviceOrderApi.list(tenantId, 'limit=1000'),
        ]).then(([cRes, oRes]) => {
            const customers = cRes?.data || cRes || [];
            const orders = oRes?.data || oRes || [];
            const map = new Map();
            for (const c of customers) {
                map.set(c.id, { ...c, totalDebt: 0, totalPaid: 0, remainingBalance: 0, orderCount: 0 });
            }
            for (const o of orders) {
                const cust = map.get(o.customerId);
                if (cust) {
                    cust.totalDebt += Number(o.totalAmount || 0);
                    cust.totalPaid += Number(o.paidAmount || 0);
                    cust.remainingBalance += (Number(o.totalAmount || 0) - Number(o.paidAmount || 0));
                    cust.orderCount += 1;
                }
            }
            setData(Array.from(map.values()).filter(c => c.orderCount > 0));
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [tenantId]);
    return (_jsxs("div", { children: [_jsx("div", { style: S.header, children: _jsx("h1", { style: S.pageTitle, children: "Cari Hesaplar" }) }), _jsx("div", { style: S.card, children: loading ? _jsx("div", { style: S.empty, children: "Y\u00FCkleniyor..." }) : data.length === 0 ? _jsx("div", { style: S.empty, children: "Kay\u0131t bulunamad\u0131" }) : (_jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "M\u00FC\u015Fteri" }), _jsx("th", { style: S.th, children: "Toplam Bor\u00E7" }), _jsx("th", { style: S.th, children: "\u00D6denen" }), _jsx("th", { style: S.th, children: "Kalan" }), _jsx("th", { style: S.th, children: "Durum" })] }) }), _jsx("tbody", { children: data.map(c => (_jsxs("tr", { children: [_jsx("td", { style: S.td, children: _jsx("strong", { children: c.fullName }) }), _jsxs("td", { style: S.td, children: ["\u20BA", c.totalDebt.toLocaleString('tr-TR')] }), _jsxs("td", { style: S.td, children: ["\u20BA", c.totalPaid.toLocaleString('tr-TR')] }), _jsx("td", { style: S.td, children: _jsxs("strong", { style: { color: c.remainingBalance > 0 ? '#dc2626' : '#16a34a' }, children: ["\u20BA", c.remainingBalance.toLocaleString('tr-TR')] }) }), _jsx("td", { style: S.td, children: _jsx("span", { style: S.badge(c.remainingBalance > 0 ? 'red' : 'green'), children: c.remainingBalance > 0 ? 'Borçlu' : 'Temiz' }) })] }, c.id))) })] })) })] }));
}
// ============ FINANCIAL PAGE ============
function FinancialPage({ tenantId }) {
    const [period, setPeriod] = useState('monthly');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        serviceOrderApi.list(tenantId, 'limit=1000').then(res => {
            setOrders(res?.data || res || []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [tenantId]);
    const now = new Date();
    const filteredOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        if (period === 'daily')
            return d.toDateString() === now.toDateString();
        if (period === 'weekly') {
            const weekAgo = new Date(now.getTime() - 7 * 86400000);
            return d >= weekAgo;
        }
        if (period === 'monthly')
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        return d.getFullYear() === now.getFullYear();
    });
    const totalIncome = filteredOrders.reduce((s, o) => s + Number(o.paidAmount || 0), 0);
    const totalRevenue = filteredOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    const totalUnpaid = totalRevenue - totalIncome;
    return (_jsxs("div", { children: [_jsxs("div", { style: S.header, children: [_jsx("h1", { style: S.pageTitle, children: "\u00D6n Muhasebe" }), _jsx("div", { style: { display: 'flex', gap: 8 }, children: ['daily', 'weekly', 'monthly', 'yearly'].map(p => (_jsx("button", { style: period === p ? { ...S.btnPrimary, width: 'auto' } : S.btnSecondary, onClick: () => setPeriod(p), children: p === 'daily' ? 'Günlük' : p === 'weekly' ? 'Haftalık' : p === 'monthly' ? 'Aylık' : 'Yıllık' }, p))) })] }), _jsxs("div", { style: S.statGrid, children: [_jsxs("div", { style: S.statCard, children: [_jsx("div", { style: S.statLabel, children: "Toplam Gelir (Tahsil)" }), _jsxs("div", { style: { ...S.statValue, color: '#16a34a' }, children: ["\u20BA", totalIncome.toLocaleString('tr-TR')] })] }), _jsxs("div", { style: S.statCard, children: [_jsx("div", { style: S.statLabel, children: "Toplam Sipari\u015F Tutar\u0131" }), _jsxs("div", { style: S.statValue, children: ["\u20BA", totalRevenue.toLocaleString('tr-TR')] })] }), _jsxs("div", { style: S.statCard, children: [_jsx("div", { style: S.statLabel, children: "Tahsil Edilmeyen" }), _jsxs("div", { style: { ...S.statValue, color: '#dc2626' }, children: ["\u20BA", totalUnpaid.toLocaleString('tr-TR')] })] }), _jsxs("div", { style: S.statCard, children: [_jsx("div", { style: S.statLabel, children: "Sipari\u015F Say\u0131s\u0131" }), _jsx("div", { style: S.statValue, children: filteredOrders.length })] })] }), _jsxs("div", { style: S.card, children: [_jsx("h3", { style: { marginBottom: 16, fontWeight: 600 }, children: "Sipari\u015F Detaylar\u0131" }), loading ? _jsx("div", { style: S.empty, children: "Y\u00FCkleniyor..." }) : filteredOrders.length === 0 ? _jsx("div", { style: S.empty, children: "Bu d\u00F6nemde sipari\u015F yok" }) : (_jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Tarih" }), _jsx("th", { style: S.th, children: "Tutar" }), _jsx("th", { style: S.th, children: "\u00D6denen" }), _jsx("th", { style: S.th, children: "Kalan" }), _jsx("th", { style: S.th, children: "Durum" })] }) }), _jsx("tbody", { children: filteredOrders.map(o => (_jsxs("tr", { children: [_jsx("td", { style: S.td, children: new Date(o.createdAt).toLocaleDateString('tr-TR') }), _jsxs("td", { style: S.td, children: ["\u20BA", Number(o.totalAmount || 0).toLocaleString('tr-TR')] }), _jsxs("td", { style: S.td, children: ["\u20BA", Number(o.paidAmount || 0).toLocaleString('tr-TR')] }), _jsx("td", { style: S.td, children: _jsxs("strong", { style: { color: Number(o.totalAmount) - Number(o.paidAmount) > 0 ? '#dc2626' : '#16a34a' }, children: ["\u20BA", (Number(o.totalAmount) - Number(o.paidAmount)).toLocaleString('tr-TR')] }) }), _jsx("td", { style: S.td, children: _jsx("span", { style: S.badge(o.paymentStatus === 'PAID' ? 'green' : o.paymentStatus === 'PARTIAL' ? 'yellow' : 'red'), children: o.paymentStatus === 'PAID' ? 'Ödendi' : o.paymentStatus === 'PARTIAL' ? 'Kısmi' : 'Ödenmedi' }) })] }, o.id))) })] }))] })] }));
}
// ============ SETTINGS PAGE ============
function SettingsPage({ user }) {
    return (_jsxs("div", { children: [_jsx("div", { style: S.header, children: _jsx("h1", { style: S.pageTitle, children: "Ayarlar" }) }), _jsxs("div", { style: S.card, children: [_jsx("h3", { style: { marginBottom: 16, fontWeight: 600 }, children: "Firma Bilgileri" }), _jsxs("div", { style: { display: 'grid', gap: 12 }, children: [_jsxs("div", { children: [_jsx("strong", { children: "E-posta:" }), " ", user.email] }), _jsxs("div", { children: [_jsx("strong", { children: "Ad Soyad:" }), " ", user.firstName, " ", user.lastName] }), _jsxs("div", { children: [_jsx("strong", { children: "Rol:" }), " ", user.roles?.map((r) => r.name).join(', ') || 'Admin'] }), _jsxs("div", { children: [_jsx("strong", { children: "Tenant ID:" }), " ", user.tenantId] })] })] })] }));
}
// ============ MAIN APP ============
export function App() {
    const { user, loading, login, register, logout } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    if (loading)
        return _jsx("div", { style: { ...S.loginWrap, color: 'white' }, children: "Y\u00FCkleniyor..." });
    if (!user) {
        return isLogin ? (_jsx(LoginPage, { onLogin: login, onSwitch: () => setIsLogin(false) })) : (_jsx(RegisterPage, { onRegister: register, onSwitch: () => setIsLogin(true) }));
    }
    return (_jsx(BrowserRouter, { children: _jsx(Layout, { user: user, onLogout: logout, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(DashboardPage, { tenantId: user.tenantId }) }), _jsx(Route, { path: "/customers", element: _jsx(CustomersPage, { tenantId: user.tenantId }) }), _jsx(Route, { path: "/vehicles", element: _jsx(VehiclesPage, { tenantId: user.tenantId }) }), _jsx(Route, { path: "/service-orders", element: _jsx(ServiceOrdersPage, { tenantId: user.tenantId }) }), _jsx(Route, { path: "/receivables", element: _jsx(ReceivablesPage, { tenantId: user.tenantId }) }), _jsx(Route, { path: "/financial", element: _jsx(FinancialPage, { tenantId: user.tenantId }) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, { user: user }) })] }) }) }));
}
