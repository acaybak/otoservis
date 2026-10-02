import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { authApi, setToken, getToken, customerApi, vehicleApi, serviceOrderApi, reportingApi, adminApi, licenseApi } from './services/api';
const ToastContext = createContext({ addToast: () => { } });
function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const addToast = useCallback((message, type) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);
    const colors = { success: { bg: '#f0fdf4', border: '#86efac', text: '#166534' }, error: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' }, info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' } };
    return (_jsxs(ToastContext.Provider, { value: { addToast }, children: [children, _jsx("div", { style: { position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }, children: toasts.map(t => {
                    const c = colors[t.type];
                    return _jsxs("div", { style: { background: c.bg, border: `1px solid ${c.border}`, color: c.text, padding: '14px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', animation: 'slideIn 0.3s ease', maxWidth: 360 }, children: [t.type === 'success' ? '✓ ' : t.type === 'error' ? '✕ ' : 'ℹ ', t.message] }, t.id);
                }) })] }));
}
function useToast() { return useContext(ToastContext); }
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
    const { addToast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await onLogin(email, password);
            addToast('Giriş başarılı!', 'success');
        }
        catch (err) {
            const msg = err?.response?.data?.error?.message || err.message || 'Giriş başarısız';
            setError(msg);
            addToast(msg, 'error');
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
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState('');
    const { addToast } = useToast();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
            setStep('Hesap oluşturuluyor...');
            await onRegister({ tenantName, tenantSlug: slug, adminEmail: email, adminPassword: password, adminFirstName: firstName, adminLastName: lastName, phone, address, city });
            setStep('Giriş yapılıyor...');
            addToast('Kayıt başarılı! Hoş geldiniz.', 'success');
        }
        catch (err) {
            setStep('');
            const msg = err?.response?.data?.error?.message || err.message || 'Kayıt başarısız';
            setError(msg);
            addToast(msg, 'error');
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { style: S.loginWrap, children: _jsxs("div", { style: { ...S.loginCard, width: 500 }, children: [_jsx("div", { style: S.loginTitle, children: "Hesap Olu\u015Ftur" }), _jsx("div", { style: S.loginSub, children: "Servisinizi buluta ta\u015F\u0131y\u0131n" }), error && _jsx("div", { style: S.error, children: error }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx("div", { style: { fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, marginTop: 4 }, children: "Firma Bilgileri" }), _jsx("input", { style: S.input, placeholder: "Firma Ad\u0131 *", value: tenantName, onChange: e => setTenantName(e.target.value), required: true }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }, children: [_jsx("input", { style: S.input, placeholder: "Telefon", value: phone, onChange: e => setPhone(e.target.value) }), _jsx("input", { style: S.input, placeholder: "\u015Eehir", value: city, onChange: e => setCity(e.target.value) })] }), _jsx("input", { style: S.input, placeholder: "Adres", value: address, onChange: e => setAddress(e.target.value) }), _jsx("div", { style: { fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8, marginTop: 12 }, children: "Hesap Bilgileri" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }, children: [_jsx("input", { style: S.input, placeholder: "Ad *", value: firstName, onChange: e => setFirstName(e.target.value), required: true }), _jsx("input", { style: S.input, placeholder: "Soyad *", value: lastName, onChange: e => setLastName(e.target.value), required: true })] }), _jsx("input", { style: S.input, placeholder: "E-posta *", type: "email", value: email, onChange: e => setEmail(e.target.value), required: true }), _jsx("input", { style: S.input, placeholder: "\u015Eifre * (min 8, b\u00FCy\u00FCk+k\u00FC\u00E7\u00FCk+rakam)", type: "password", value: password, onChange: e => setPassword(e.target.value), required: true, minLength: 8 }), _jsx("button", { type: "submit", style: { ...S.btnPrimary, opacity: loading ? 0.7 : 1, marginTop: 8 }, disabled: loading, children: loading ? (step || 'Oluşturuluyor...') : 'Kayıt Ol' })] }), _jsxs("div", { style: { marginTop: 16, textAlign: 'center' }, children: [_jsx("span", { style: { color: '#64748b', fontSize: 14 }, children: "Zaten hesab\u0131n\u0131z var m\u0131? " }), _jsx("span", { style: S.link, onClick: onSwitch, children: "Giri\u015F Yap" })] })] }) }));
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
// ============ DOWNLOAD PAGE ============
function DownloadPage({ onBack }) {
    return (_jsxs("div", { style: { minHeight: '100vh', background: '#ffffff' }, children: [_jsxs("nav", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 48px', maxWidth: 1280, margin: '0 auto', borderBottom: '1px solid #f1f5f9' }, children: [_jsx("img", { src: "/logo.png", alt: "OtoServis", style: { height: 40, cursor: 'pointer' }, onClick: onBack }), _jsx("button", { onClick: onBack, style: { padding: '9px 18px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }, children: "\u2190 Geri" })] }), _jsxs("div", { style: { maxWidth: 680, margin: '0 auto', padding: '80px 40px', textAlign: 'center' }, children: [_jsx("div", { style: { display: 'inline-block', padding: '6px 16px', background: '#eff6ff', color: '#2563eb', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 24 }, children: "Desktop Uygulamas\u0131" }), _jsx("h1", { style: { fontSize: 44, fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: -0.5 }, children: "OtoServis Desktop" }), _jsxs("p", { style: { fontSize: 18, color: '#64748b', marginBottom: 48, lineHeight: 1.7 }, children: ["Windows i\u00E7in masa\u00FCst\u00FC uygulamas\u0131n\u0131 indirin.", _jsx("br", {}), "Kurulum ile birlikte Program Files'e y\u00FCklenir."] }), _jsxs("div", { style: { background: '#fafbfc', borderRadius: 20, padding: 40, marginBottom: 48, border: '1px solid #f1f5f9' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 28 }, children: [_jsx("div", { style: { width: 56, height: 56, borderRadius: 14, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }, children: "\uD83E\uDE9F" }), _jsxs("div", { style: { textAlign: 'left' }, children: [_jsx("div", { style: { color: '#0f172a', fontSize: 18, fontWeight: 700 }, children: "Windows 10/11 (64-bit)" }), _jsx("div", { style: { color: '#94a3b8', fontSize: 13 }, children: "Installer (.exe) \u2022 ~81 MB" })] })] }), _jsx("a", { href: "https://github.com/acaybak/otoservis/releases/latest/download/OtoServis.Setup.0.1.0.exe", download: true, style: { display: 'inline-block', padding: '16px 56px', background: '#2563eb', color: 'white', borderRadius: 10, fontSize: 17, fontWeight: 700, textDecoration: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }, children: "\u0130ndir" }), _jsx("p", { style: { color: '#94a3b8', fontSize: 12, marginTop: 16 }, children: "v0.1.0 \u2022 Son g\u00FCncelleme: Eyl\u00FCl 2026" })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }, children: [
                            { icon: '🔑', title: 'Lisans Sistemi', desc: 'Aktivasyon anahtarı ile güvenli kullanım', color: '#2563eb' },
                            { icon: '📡', title: 'Offline + Online', desc: 'İnternet olmadan da çalışır, bulut senkronizasyon', color: '#059669' },
                            { icon: '🔧', title: 'Kolay Kurulum', desc: 'Program Files\'e otomatik kurulum', color: '#7c3aed' },
                        ].map((f, i) => (_jsxs("div", { style: { background: '#fafbfc', borderRadius: 14, padding: 24, border: '1px solid #f1f5f9' }, children: [_jsx("div", { style: { width: 44, height: 44, borderRadius: 10, background: f.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 12, margin: '0 auto 12px' }, children: f.icon }), _jsx("h3", { style: { color: '#0f172a', fontSize: 14, fontWeight: 700, marginBottom: 4 }, children: f.title }), _jsx("p", { style: { color: '#94a3b8', fontSize: 12, margin: 0 }, children: f.desc })] }, i))) }), _jsxs("div", { style: { marginTop: 40, background: '#fafbfc', borderRadius: 16, padding: 28, textAlign: 'left', border: '1px solid #f1f5f9' }, children: [_jsx("h3", { style: { color: '#0f172a', fontSize: 16, fontWeight: 700, marginBottom: 16 }, children: "Kurulum Ad\u0131mlar\u0131" }), ['OtoServis Setup dosyasını indirin', 'Kurulum dosyasını çalıştırın', 'Sunucu adresini girin: https://otoservis-api.onrender.com', 'Lisans anahtarınızı girin', 'Giriş yapın ve kullanmaya başlayın'].map((step, i) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }, children: [_jsx("div", { style: { width: 28, height: 28, borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }, children: i + 1 }), _jsx("span", { style: { color: '#475569', fontSize: 14 }, children: step })] }, i)))] })] })] }));
}
// ============ PRICING PAGE ============
function PricingPage({ onBack, onGetStarted }) {
    const plans = [
        {
            name: 'Başlangıç',
            price: '2.990',
            desc: 'Tek kişilik servisler için',
            features: ['1 kullanıcı', '100 müşteri kaydı', '200 araç kaydı', 'Temel raporlama', 'E-posta desteği'],
            popular: false,
        },
        {
            name: 'Profesyonel',
            price: '5.990',
            desc: 'Küçük-orta servisler için',
            features: ['3 kullanıcı', 'Sınırsız müşteri', 'Sınırsız araç', 'Gelişmiş raporlama', 'SMS bildirimleri', 'Öncelikli destek', 'Müşteri portalı'],
            popular: true,
        },
        {
            name: 'Kurumsal',
            price: '9.990',
            desc: 'Büyük servisler için',
            features: ['10 kullanıcı', 'Sınırsız her şey', 'Özel entegrasyonlar', 'API erişimi', 'Öncelikli destek 7/24', 'Özel raporlama', 'Çoklu şube desteği', 'Beyaz etiket seçeneği'],
            popular: false,
        },
    ];
    return (_jsxs("div", { style: { minHeight: '100vh', background: '#ffffff' }, children: [_jsxs("nav", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 48px', maxWidth: 1280, margin: '0 auto', borderBottom: '1px solid #f1f5f9' }, children: [_jsx("img", { src: "/logo.png", alt: "OtoServis", style: { height: 40, cursor: 'pointer' }, onClick: onBack }), _jsx("button", { onClick: onBack, style: { padding: '9px 18px', background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }, children: "\u2190 Geri" })] }), _jsxs("div", { style: { maxWidth: 1100, margin: '0 auto', padding: '80px 48px' }, children: [_jsxs("div", { style: { textAlign: 'center', marginBottom: 64 }, children: [_jsx("div", { style: { display: 'inline-block', padding: '6px 16px', background: '#eff6ff', color: '#2563eb', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 20 }, children: "Fiyatland\u0131rma" }), _jsx("h1", { style: { fontSize: 48, fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: -0.5 }, children: "\u0130htiyac\u0131n\u0131za uygun plan" }), _jsx("p", { style: { fontSize: 18, color: '#64748b', maxWidth: 500, margin: '0 auto' }, children: "T\u00FCm planlar 7 g\u00FCn \u00FCcretsiz deneme i\u00E7erir. Kredi kart\u0131 gerekmez." })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'stretch' }, children: plans.map((plan, i) => (_jsxs("div", { style: {
                                background: plan.popular ? '#ffffff' : '#fafbfc',
                                borderRadius: 20,
                                padding: '36px 32px',
                                border: plan.popular ? '2px solid #2563eb' : '1px solid #f1f5f9',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: plan.popular ? '0 8px 30px rgba(37,99,235,0.12)' : 'none',
                            }, children: [plan.popular && (_jsx("div", { style: { position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#2563eb', color: 'white', padding: '5px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700 }, children: "EN POP\u00DCLER" })), _jsxs("div", { style: { marginBottom: 28 }, children: [_jsx("h3", { style: { color: '#0f172a', fontSize: 20, fontWeight: 700, marginBottom: 6 }, children: plan.name }), _jsx("p", { style: { color: '#94a3b8', fontSize: 14, marginBottom: 20 }, children: plan.desc }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: 16, color: '#64748b', verticalAlign: 'top' }, children: "\u20BA" }), _jsx("span", { style: { fontSize: 48, fontWeight: 800, color: '#0f172a' }, children: plan.price }), _jsx("span", { style: { fontSize: 15, color: '#94a3b8' }, children: "/y\u0131l" })] })] }), _jsx("div", { style: { flex: 1, marginBottom: 28 }, children: plan.features.map((f, j) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }, children: [_jsx("div", { style: { width: 20, height: 20, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }, children: "\u2713" }), _jsx("span", { style: { color: '#475569', fontSize: 14 }, children: f })] }, j))) }), _jsx("button", { onClick: onGetStarted, style: {
                                        width: '100%',
                                        padding: '14px 24px',
                                        background: plan.popular ? '#2563eb' : '#f8fafc',
                                        color: plan.popular ? 'white' : '#334155',
                                        border: plan.popular ? 'none' : '1px solid #e2e8f0',
                                        borderRadius: 10,
                                        fontSize: 15,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        boxShadow: plan.popular ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
                                    }, children: "\u00DCcretsiz Dene" })] }, i))) }), _jsxs("div", { style: { marginTop: 80, textAlign: 'center' }, children: [_jsx("h2", { style: { fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 32 }, children: "S\u0131k\u00E7a Sorulan Sorular" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 800, margin: '0 auto', textAlign: 'left' }, children: [
                                    { q: 'Ücretsiz deneme süresi ne kadar?', a: 'Tüm planlar 7 gün ücretsiz deneme içerir. Kredi kartı gerekmez.' },
                                    { q: 'Yıllık ödeme zorunlu mu?', a: 'Hayır, aylık ödeme de yapabilirsiniz. Yıllık ödemede 2 ay bedava.' },
                                    { q: 'Paket değiştirebilir miyim?', a: 'Evet, istediğiniz zaman yükseltme veya düşürme yapabilirsiniz.' },
                                    { q: 'Verilerim güvende mi?', a: 'Tüm veriler 256-bit SSL ile şifrelenerek saklanır ve günlük yedekleme yapılır.' },
                                ].map((faq, i) => (_jsxs("div", { style: { background: '#fafbfc', borderRadius: 14, padding: 24, border: '1px solid #f1f5f9' }, children: [_jsx("h4", { style: { color: '#0f172a', fontSize: 15, fontWeight: 700, marginBottom: 8, margin: '0 0 8px' }, children: faq.q }), _jsx("p", { style: { color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }, children: faq.a })] }, i))) })] })] }), _jsx("div", { style: { textAlign: 'center', padding: '32px 20px', borderTop: '1px solid #f1f5f9', color: '#94a3b8', fontSize: 13 }, children: "\u00A9 2026 OtoServis. T\u00FCm haklar\u0131 sakl\u0131d\u0131r." })] }));
}
// ============ LANDING PAGE ============
function LandingPage({ onGetStarted, onLogin }) {
    const [showDownload, setShowDownload] = useState(false);
    const [showPricing, setShowPricing] = useState(false);
    if (showDownload)
        return _jsx(DownloadPage, { onBack: () => setShowDownload(false) });
    if (showPricing)
        return _jsx(PricingPage, { onBack: () => setShowPricing(false), onGetStarted: onGetStarted });
    return (_jsxs("div", { style: { minHeight: '100vh', background: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }, children: [_jsxs("nav", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 48px', maxWidth: 1280, margin: '0 auto', borderBottom: '1px solid #f1f5f9' }, children: [_jsx("img", { src: "/logo.png", alt: "OtoServis", style: { height: 40, cursor: 'pointer' } }), _jsxs("div", { style: { display: 'flex', gap: 12, alignItems: 'center' }, children: [_jsx("button", { onClick: () => setShowPricing(true), style: { padding: '9px 18px', background: 'transparent', color: '#475569', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }, children: "Fiyatlar" }), _jsx("button", { onClick: () => setShowDownload(true), style: { padding: '9px 18px', background: 'transparent', color: '#475569', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }, children: "\u0130ndir" }), _jsx("button", { onClick: onLogin, style: { padding: '9px 18px', background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }, children: "Giri\u015F Yap" }), _jsx("button", { onClick: onGetStarted, style: { padding: '9px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }, children: "\u00DCcretsiz Dene" })] })] }), _jsxs("div", { style: { maxWidth: 1280, margin: '0 auto', padding: '100px 48px 80px', textAlign: 'center' }, children: [_jsx("div", { style: { display: 'inline-block', padding: '6px 16px', background: '#eff6ff', color: '#2563eb', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 24 }, children: "Oto Servis Y\u00F6netim Platformu" }), _jsxs("h1", { style: { fontSize: 64, fontWeight: 800, color: '#0f172a', lineHeight: 1.1, marginBottom: 24, letterSpacing: -1 }, children: ["Servisinizi ", _jsx("span", { style: { color: '#2563eb' }, children: "Buluta" }), " Ta\u015F\u0131y\u0131n"] }), _jsx("p", { style: { fontSize: 20, color: '#64748b', maxWidth: 580, margin: '0 auto 48px', lineHeight: 1.7 }, children: "M\u00FC\u015Fteri y\u00F6netimi, servis sipari\u015Fleri, stok takibi ve \u00F6n muhasebe. Hepsi tek platformda, tek fiyatla." }), _jsxs("div", { style: { display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 100 }, children: [_jsx("button", { onClick: onGetStarted, style: { padding: '16px 36px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }, children: "Hemen Ba\u015Fla \u2192" }), _jsx("button", { onClick: onLogin, style: { padding: '16px 36px', background: 'white', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 17, fontWeight: 600, cursor: 'pointer' }, children: "Demo \u0130zle" })] }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 1000, margin: '0 auto' }, children: [
                            { icon: '👥', title: 'Müşteri Yönetimi', desc: 'Müşteri bilgileri, araç geçmişi ve iletişim tek yerde', color: '#2563eb' },
                            { icon: '🔧', title: 'Servis Siparişleri', desc: 'İş emirleri, parça takibi ve işçilik yönetimi', color: '#7c3aed' },
                            { icon: '💰', title: 'Ön Muhasebe', desc: 'Faturalar, ödemeler ve cari hesap takibi', color: '#059669' },
                            { icon: '🚗', title: 'Araç Takibi', desc: 'Plaka bazlı tüm araç bilgileri ve geçmiş', color: '#dc2626' },
                            { icon: '📊', title: 'Raporlama', desc: 'Gelir-gider analizi ve performans metrikleri', color: '#d97706' },
                            { icon: '📱', title: 'Desktop & Web', desc: 'Her yerde erişim, offline destek', color: '#0891b2' },
                        ].map((f, i) => (_jsxs("div", { style: { background: '#fafbfc', borderRadius: 16, padding: '32px 24px', textAlign: 'left', border: '1px solid #f1f5f9', transition: 'box-shadow 0.2s' }, children: [_jsx("div", { style: { width: 48, height: 48, borderRadius: 12, background: f.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 16 }, children: f.icon }), _jsx("h3", { style: { color: '#0f172a', fontSize: 16, fontWeight: 700, marginBottom: 8 }, children: f.title }), _jsx("p", { style: { color: '#64748b', fontSize: 14, lineHeight: 1.6, margin: 0 }, children: f.desc })] }, i))) })] }), _jsx("div", { style: { background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '48px 48px' }, children: _jsx("div", { style: { maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32, textAlign: 'center' }, children: [
                        { val: '7', label: 'Gün Ücretsiz Deneme' },
                        { val: '%99.9', label: 'Çalışma Süresi' },
                        { val: '256-bit', label: 'SSL Şifreleme' },
                        { val: '7/24', label: 'Destek' },
                    ].map((s, i) => (_jsxs("div", { children: [_jsx("div", { style: { fontSize: 32, fontWeight: 800, color: '#2563eb', marginBottom: 4 }, children: s.val }), _jsx("div", { style: { fontSize: 14, color: '#64748b', fontWeight: 500 }, children: s.label })] }, i))) }) }), _jsxs("div", { style: { maxWidth: 1280, margin: '0 auto', padding: '80px 48px', textAlign: 'center' }, children: [_jsx("h2", { style: { fontSize: 36, fontWeight: 800, color: '#0f172a', marginBottom: 16 }, children: "Hemen ba\u015Flay\u0131n" }), _jsx("p", { style: { fontSize: 18, color: '#64748b', marginBottom: 36, maxWidth: 500, margin: '0 auto 36px' }, children: "7 g\u00FCn \u00FCcretsiz deneme. Kredi kart\u0131 gerekmez." }), _jsx("button", { onClick: onGetStarted, style: { padding: '16px 48px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }, children: "\u00DCcretsiz Hesap Olu\u015Ftur \u2192" })] }), _jsx("div", { style: { textAlign: 'center', padding: '32px 20px', borderTop: '1px solid #f1f5f9', color: '#94a3b8', fontSize: 13 }, children: "\u00A9 2026 OtoServis. T\u00FCm haklar\u0131 sakl\u0131d\u0131r." })] }));
}
// ============ ADMIN PANEL ============
// ============ PROFESSIONAL ADMIN PANEL ============
const AdminStyles = {
    container: { display: 'flex', minHeight: '100vh', background: '#f8fafc' },
    sidebar: { width: 260, background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', color: 'white', position: 'fixed', top: 0, bottom: 0, left: 0, display: 'flex', flexDirection: 'column', zIndex: 100 },
    sidebarHeader: { padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
    sidebarLogo: { fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 4 },
    sidebarSub: { fontSize: 12, color: '#94a3b8' },
    sidebarNav: { flex: 1, padding: '16px 12px' },
    navItem: (active) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: active ? '#2563eb' : 'transparent', color: active ? 'white' : '#94a3b8', fontSize: 14, fontWeight: active ? 600 : 500, cursor: 'pointer', marginBottom: 4, transition: 'all 0.2s', border: 'none', width: '100%', textAlign: 'left' }),
    main: { flex: 1, marginLeft: 260, padding: '24px 32px' },
    pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    pageTitle: { fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 },
    statCard: (color) => ({ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}` }),
    statLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 },
    statValue: { fontSize: 28, fontWeight: 700, color: '#0f172a' },
    card: { background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
    th: { textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    td: { padding: '14px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155' },
    badge: (status) => {
        const colors = {
            ACTIVE: { bg: '#dcfce7', text: '#16a34a' },
            AVAILABLE: { bg: '#dcfce7', text: '#16a34a' },
            COMPLETED: { bg: '#dcfce7', text: '#16a34a' },
            USED: { bg: '#fef3c7', text: '#ca8a04' },
            PENDING: { bg: '#fef3c7', text: '#ca8a04' },
            TRIAL: { bg: '#dbeafe', text: '#2563eb' },
            SUSPENDED: { bg: '#fee2e2', text: '#dc2626' },
            EXPIRED: { bg: '#fee2e2', text: '#dc2626' },
            CANCELLED: { bg: '#fee2e2', text: '#dc2626' },
            INACTIVE: { bg: '#fee2e2', text: '#dc2626' },
        };
        const c = colors[status] || { bg: '#f1f5f9', text: '#64748b' };
        return { display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: c.bg, color: c.text };
    },
    btnPrimary: { padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    btnSuccess: { padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    btnDanger: { padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    btnSecondary: { padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    input: { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    select: { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 },
    modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modalContent: { background: 'white', borderRadius: 16, padding: 32, width: 600, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' },
};
function AdminPanel({ onBack }) {
    const [stats, setStats] = useState(null);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [tenantData, setTenantData] = useState([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [showAddUser, setShowAddUser] = useState(false);
    const [newUser, setNewUser] = useState({ email: '', password: '', firstName: '', lastName: '' });
    const [addError, setAddError] = useState('');
    const [adminView, setAdminView] = useState('dashboard');
    const [licenseKeys, setLicenseKeys] = useState([]);
    const [licenses, setLicenses] = useState([]);
    const [showCreateKeys, setShowCreateKeys] = useState(false);
    const [keyForm, setKeyForm] = useState({ count: 5, planType: 'STANDARD', maxUsers: 3, duration: 365, note: '' });
    const [keysLoading, setKeysLoading] = useState(false);
    useEffect(() => {
        Promise.all([adminApi.getStats(), adminApi.getTenants()])
            .then(([s, t]) => { setStats(s); setTenants(t); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);
    const loadTenantData = async (tenantId, dataType) => {
        setDataLoading(true);
        try {
            const data = await adminApi.getTenantData(tenantId, dataType);
            setTenantData(data);
        }
        catch {
            setTenantData([]);
        }
        setDataLoading(false);
    };
    const handleStatusChange = async (id, status) => {
        await adminApi.updateTenantStatus(id, status);
        setTenants(tenants.map(t => t.id === id ? { ...t, status } : t));
        if (selectedTenant?.id === id)
            setSelectedTenant({ ...selectedTenant, status });
    };
    const handleViewDetail = async (id) => {
        const detail = await adminApi.getTenantDetail(id);
        setSelectedTenant(detail);
        setActiveTab('overview');
        setTenantData([]);
    };
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab !== 'overview' && selectedTenant) {
            const typeMap = { customers: 'customers', vehicles: 'vehicles', orders: 'service-orders', users: 'users' };
            loadTenantData(selectedTenant.id, typeMap[tab]);
        }
    };
    const handleDelete = async (dataType, id) => {
        if (!confirm('Silmek istediğinize emin misiniz?'))
            return;
        await adminApi.deleteTenantData(selectedTenant.id, dataType, id);
        const typeMap = { customers: 'customers', vehicles: 'vehicles', orders: 'service-orders', users: 'users' };
        const tabKey = Object.entries(typeMap).find(([, v]) => v === dataType)?.[0];
        if (tabKey)
            loadTenantData(selectedTenant.id, dataType);
    };
    const handleUpdate = async (dataType, id, data) => {
        await adminApi.updateTenantData(selectedTenant.id, dataType, id, data);
        setEditItem(null);
        const typeMap = { customers: 'customers', vehicles: 'vehicles', orders: 'service-orders', users: 'users' };
        const tabKey = Object.entries(typeMap).find(([, v]) => v === dataType)?.[0];
        if (tabKey)
            loadTenantData(selectedTenant.id, dataType);
    };
    const handleAddUser = async () => {
        setAddError('');
        if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
            setAddError('Tüm alanları doldurun.');
            return;
        }
        try {
            await adminApi.createTenantUser(selectedTenant.id, newUser);
            setShowAddUser(false);
            setNewUser({ email: '', password: '', firstName: '', lastName: '' });
            loadTenantData(selectedTenant.id, 'users');
        }
        catch (e) {
            setAddError(e.message);
        }
    };
    const loadLicenses = async () => {
        setKeysLoading(true);
        try {
            const [keys, lics] = await Promise.all([licenseApi.listKeys(), licenseApi.listLicenses()]);
            setLicenseKeys(keys);
            setLicenses(lics);
        }
        catch { }
        setKeysLoading(false);
    };
    const handleCreateKeys = async () => {
        try {
            await licenseApi.createKeys(keyForm.count, keyForm.planType, keyForm.maxUsers, keyForm.duration, keyForm.note || undefined);
            setShowCreateKeys(false);
            loadLicenses();
        }
        catch { }
    };
    if (loading)
        return _jsx("div", { style: { ...AdminStyles.container, alignItems: 'center', justifyContent: 'center', color: '#64748b' }, children: "Y\u00FCkleniyor..." });
    return (_jsxs("div", { style: AdminStyles.container, children: [_jsxs("div", { style: AdminStyles.sidebar, children: [_jsxs("div", { style: AdminStyles.sidebarHeader, children: [_jsx("div", { style: AdminStyles.sidebarLogo, children: "OtoServis" }), _jsx("div", { style: AdminStyles.sidebarSub, children: "S\u00FCper Admin Paneli" })] }), _jsxs("div", { style: AdminStyles.sidebarNav, children: [_jsxs("button", { style: AdminStyles.navItem(adminView === 'dashboard'), onClick: () => setAdminView('dashboard'), children: [_jsx("span", { children: "\uD83D\uDCCA" }), " Dashboard"] }), _jsxs("button", { style: AdminStyles.navItem(adminView === 'tenants'), onClick: () => setAdminView('tenants'), children: [_jsx("span", { children: "\uD83C\uDFE2" }), " Servisler"] }), _jsxs("button", { style: AdminStyles.navItem(adminView === 'licenses'), onClick: () => { setAdminView('licenses'); loadLicenses(); }, children: [_jsx("span", { children: "\uD83D\uDD11" }), " Lisanslar"] })] }), _jsx("div", { style: { padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }, children: _jsxs("button", { style: AdminStyles.navItem(false), onClick: onBack, children: [_jsx("span", { children: "\u2190" }), " Panele D\u00F6n"] }) })] }), _jsxs("div", { style: AdminStyles.main, children: [adminView === 'dashboard' && (_jsxs(_Fragment, { children: [_jsx("div", { style: AdminStyles.pageHeader, children: _jsx("h1", { style: AdminStyles.pageTitle, children: "Dashboard" }) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }, children: [_jsxs("div", { style: AdminStyles.statCard('#2563eb'), children: [_jsx("div", { style: AdminStyles.statLabel, children: "Toplam Servis" }), _jsx("div", { style: AdminStyles.statValue, children: stats?.tenantCount || 0 })] }), _jsxs("div", { style: AdminStyles.statCard('#16a34a'), children: [_jsx("div", { style: AdminStyles.statLabel, children: "Aktif Servis" }), _jsx("div", { style: { ...AdminStyles.statValue, color: '#16a34a' }, children: stats?.activeTenants || 0 })] }), _jsxs("div", { style: AdminStyles.statCard('#8b5cf6'), children: [_jsx("div", { style: AdminStyles.statLabel, children: "Toplam Kullan\u0131c\u0131" }), _jsx("div", { style: AdminStyles.statValue, children: stats?.userCount || 0 })] }), _jsxs("div", { style: AdminStyles.statCard('#f59e0b'), children: [_jsx("div", { style: AdminStyles.statLabel, children: "Toplam M\u00FC\u015Fteri" }), _jsx("div", { style: AdminStyles.statValue, children: stats?.customerCount || 0 })] }), _jsxs("div", { style: AdminStyles.statCard('#ec4899'), children: [_jsx("div", { style: AdminStyles.statLabel, children: "Toplam Ara\u00E7" }), _jsx("div", { style: AdminStyles.statValue, children: stats?.vehicleCount || 0 })] }), _jsxs("div", { style: AdminStyles.statCard('#06b6d4'), children: [_jsx("div", { style: AdminStyles.statLabel, children: "Toplam Sipari\u015F" }), _jsx("div", { style: AdminStyles.statValue, children: stats?.serviceOrderCount || 0 })] })] }), _jsxs("div", { style: AdminStyles.card, children: [_jsx("h3", { style: { margin: '0 0 16px', fontWeight: 600, color: '#0f172a' }, children: "Son Kay\u0131tl\u0131 Servisler" }), _jsxs("table", { style: AdminStyles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: AdminStyles.th, children: "Firma" }), _jsx("th", { style: AdminStyles.th, children: "Slug" }), _jsx("th", { style: AdminStyles.th, children: "Durum" }), _jsx("th", { style: AdminStyles.th, children: "Kay\u0131t Tarihi" })] }) }), _jsx("tbody", { children: tenants.slice(0, 5).map(t => (_jsxs("tr", { children: [_jsx("td", { style: AdminStyles.td, children: _jsx("strong", { children: t.name }) }), _jsx("td", { style: AdminStyles.td, children: t.slug }), _jsx("td", { style: AdminStyles.td, children: _jsx("span", { style: AdminStyles.badge(t.status), children: t.status }) }), _jsx("td", { style: AdminStyles.td, children: new Date(t.createdAt).toLocaleDateString('tr-TR') })] }, t.id))) })] })] })] })), adminView === 'tenants' && (_jsxs(_Fragment, { children: [_jsx("div", { style: AdminStyles.pageHeader, children: _jsx("h1", { style: AdminStyles.pageTitle, children: "Servisler" }) }), _jsx("div", { style: AdminStyles.card, children: _jsxs("table", { style: AdminStyles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: AdminStyles.th, children: "Firma" }), _jsx("th", { style: AdminStyles.th, children: "\u0130leti\u015Fim" }), _jsx("th", { style: AdminStyles.th, children: "Slug" }), _jsx("th", { style: AdminStyles.th, children: "Durum" }), _jsx("th", { style: AdminStyles.th, children: "Kullan\u0131c\u0131" }), _jsx("th", { style: AdminStyles.th, children: "M\u00FC\u015Fteri" }), _jsx("th", { style: AdminStyles.th, children: "\u0130\u015Flem" })] }) }), _jsx("tbody", { children: tenants.map(t => (_jsxs("tr", { children: [_jsx("td", { style: AdminStyles.td, children: _jsx("strong", { children: t.name }) }), _jsx("td", { style: AdminStyles.td, children: _jsxs("div", { style: { fontSize: 13 }, children: [t.phone && _jsxs("div", { children: ["\uD83D\uDCDE ", t.phone] }), t.email && _jsxs("div", { children: ["\u2709\uFE0F ", t.email] }), !t.phone && !t.email && _jsx("span", { style: { color: '#94a3b8' }, children: "-" })] }) }), _jsx("td", { style: AdminStyles.td, children: _jsx("code", { style: { background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 12 }, children: t.slug }) }), _jsx("td", { style: AdminStyles.td, children: _jsxs("select", { value: t.status, onChange: e => handleStatusChange(t.id, e.target.value), style: { ...AdminStyles.select, padding: '6px 10px', fontSize: 12 }, children: [_jsx("option", { value: "ACTIVE", children: "Aktif" }), _jsx("option", { value: "SUSPENDED", children: "Ask\u0131ya Al" }), _jsx("option", { value: "TRIAL", children: "Deneme" })] }) }), _jsx("td", { style: AdminStyles.td, children: t.stats.userCount }), _jsx("td", { style: AdminStyles.td, children: t.stats.customerCount }), _jsx("td", { style: AdminStyles.td, children: t.stats.vehicleCount }), _jsx("td", { style: AdminStyles.td, children: t.stats.serviceOrderCount }), _jsx("td", { style: AdminStyles.td, children: _jsx("button", { style: AdminStyles.btnPrimary, onClick: () => handleViewDetail(t.id), children: "Y\u00F6net" }) })] }, t.id))) })] }) })] })), adminView === 'licenses' && (_jsxs(_Fragment, { children: [_jsxs("div", { style: AdminStyles.pageHeader, children: [_jsx("h1", { style: AdminStyles.pageTitle, children: "Lisans Y\u00F6netimi" }), _jsx("button", { style: AdminStyles.btnSuccess, onClick: () => setShowCreateKeys(true), children: "+ Yeni Anahtar Olu\u015Ftur" })] }), showCreateKeys && (_jsxs("div", { style: { ...AdminStyles.card, background: '#f8fafc', border: '1px solid #e2e8f0' }, children: [_jsx("h4", { style: { margin: '0 0 16px', fontWeight: 600 }, children: "Yeni Lisans Anahtar\u0131 Olu\u015Ftur" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }, children: [_jsxs("div", { children: [_jsx("label", { style: AdminStyles.label, children: "Adet" }), _jsx("input", { style: AdminStyles.input, type: "number", value: keyForm.count, onChange: e => setKeyForm({ ...keyForm, count: parseInt(e.target.value) || 1 }) })] }), _jsxs("div", { children: [_jsx("label", { style: AdminStyles.label, children: "Plan" }), _jsxs("select", { style: { ...AdminStyles.select, width: '100%' }, value: keyForm.planType, onChange: e => setKeyForm({ ...keyForm, planType: e.target.value }), children: [_jsx("option", { value: "STANDARD", children: "Standard" }), _jsx("option", { value: "PROFESSIONAL", children: "Professional" }), _jsx("option", { value: "ENTERPRISE", children: "Enterprise" })] })] }), _jsxs("div", { children: [_jsx("label", { style: AdminStyles.label, children: "Max Kullan\u0131c\u0131" }), _jsx("input", { style: AdminStyles.input, type: "number", value: keyForm.maxUsers, onChange: e => setKeyForm({ ...keyForm, maxUsers: parseInt(e.target.value) || 1 }) })] }), _jsxs("div", { children: [_jsx("label", { style: AdminStyles.label, children: "S\u00FCre (g\u00FCn)" }), _jsx("input", { style: AdminStyles.input, type: "number", value: keyForm.duration, onChange: e => setKeyForm({ ...keyForm, duration: parseInt(e.target.value) || 365 }) })] })] }), _jsxs("div", { style: { marginTop: 12 }, children: [_jsx("label", { style: AdminStyles.label, children: "Not" }), _jsx("input", { style: AdminStyles.input, placeholder: "Opsiyonel not", value: keyForm.note, onChange: e => setKeyForm({ ...keyForm, note: e.target.value }) })] }), _jsxs("div", { style: { display: 'flex', gap: 8, marginTop: 16 }, children: [_jsx("button", { style: AdminStyles.btnPrimary, onClick: handleCreateKeys, children: "Olu\u015Ftur" }), _jsx("button", { style: AdminStyles.btnSecondary, onClick: () => setShowCreateKeys(false), children: "\u0130ptal" })] })] })), _jsxs("div", { style: AdminStyles.card, children: [_jsx("h3", { style: { margin: '0 0 16px', fontWeight: 600, color: '#0f172a' }, children: "Lisans Anahtarlar\u0131" }), keysLoading ? _jsx("div", { style: { textAlign: 'center', padding: 40, color: '#94a3b8' }, children: "Y\u00FCkleniyor..." }) : (_jsxs("table", { style: AdminStyles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: AdminStyles.th, children: "Anahtar" }), _jsx("th", { style: AdminStyles.th, children: "Plan" }), _jsx("th", { style: AdminStyles.th, children: "Max User" }), _jsx("th", { style: AdminStyles.th, children: "S\u00FCre" }), _jsx("th", { style: AdminStyles.th, children: "Durum" }), _jsx("th", { style: AdminStyles.th, children: "Firma" }), _jsx("th", { style: AdminStyles.th, children: "Tarih" })] }) }), _jsx("tbody", { children: licenseKeys.map((k) => (_jsxs("tr", { children: [_jsx("td", { style: { ...AdminStyles.td, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }, children: k.key }), _jsx("td", { style: AdminStyles.td, children: k.planType }), _jsx("td", { style: AdminStyles.td, children: k.maxUsers }), _jsxs("td", { style: AdminStyles.td, children: [k.duration, " g\u00FCn"] }), _jsx("td", { style: AdminStyles.td, children: _jsx("span", { style: AdminStyles.badge(k.status), children: k.status }) }), _jsx("td", { style: AdminStyles.td, children: k.tenant?.name || '-' }), _jsx("td", { style: AdminStyles.td, children: new Date(k.createdAt).toLocaleDateString('tr-TR') })] }, k.id))) })] }))] }), _jsxs("div", { style: AdminStyles.card, children: [_jsx("h3", { style: { margin: '0 0 16px', fontWeight: 600, color: '#0f172a' }, children: "Aktif Lisanslar" }), _jsxs("table", { style: AdminStyles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: AdminStyles.th, children: "Firma" }), _jsx("th", { style: AdminStyles.th, children: "Plan" }), _jsx("th", { style: AdminStyles.th, children: "Durum" }), _jsx("th", { style: AdminStyles.th, children: "Max User" }), _jsx("th", { style: AdminStyles.th, children: "Aktivasyon" }), _jsx("th", { style: AdminStyles.th, children: "Biti\u015F" }), _jsx("th", { style: AdminStyles.th, children: "\u0130\u015Flem" })] }) }), _jsx("tbody", { children: licenses.map((l) => (_jsxs("tr", { children: [_jsx("td", { style: AdminStyles.td, children: _jsx("strong", { children: l.tenant?.name || '-' }) }), _jsx("td", { style: AdminStyles.td, children: l.planType }), _jsx("td", { style: AdminStyles.td, children: _jsx("span", { style: AdminStyles.badge(l.status), children: l.status }) }), _jsx("td", { style: AdminStyles.td, children: l.maxUsers }), _jsx("td", { style: AdminStyles.td, children: l.activatedAt ? new Date(l.activatedAt).toLocaleDateString('tr-TR') : '-' }), _jsx("td", { style: AdminStyles.td, children: l.expiresAt ? new Date(l.expiresAt).toLocaleDateString('tr-TR') : 'Süresiz' }), _jsx("td", { style: AdminStyles.td, children: _jsxs("select", { value: l.status, onChange: async (e) => { await licenseApi.updateStatus(l.id, e.target.value); loadLicenses(); }, style: { ...AdminStyles.select, padding: '6px 10px', fontSize: 12 }, children: [_jsx("option", { value: "ACTIVE", children: "Aktif" }), _jsx("option", { value: "SUSPENDED", children: "Ask\u0131ya Al" }), _jsx("option", { value: "EXPIRED", children: "S\u00FCresi Doldu" })] }) })] }, l.id))) })] })] })] }))] }), selectedTenant && (_jsx("div", { style: AdminStyles.modal, onClick: () => setSelectedTenant(null), children: _jsxs("div", { style: { ...AdminStyles.modalContent, width: 900 }, onClick: e => e.stopPropagation(), children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }, children: [_jsx("h2", { style: { margin: 0, fontSize: 20, fontWeight: 700 }, children: selectedTenant.name }), _jsx("button", { style: AdminStyles.btnSecondary, onClick: () => setSelectedTenant(null), children: "\u2715" })] }), _jsxs("div", { style: { display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }, children: [_jsx("button", { style: { ...AdminStyles.btnSecondary, background: activeTab === 'overview' ? '#2563eb' : 'transparent', color: activeTab === 'overview' ? 'white' : '#475569', border: 'none' }, onClick: () => handleTabChange('overview'), children: "Genel Bak\u0131\u015F" }), _jsx("button", { style: { ...AdminStyles.btnSecondary, background: activeTab === 'customers' ? '#2563eb' : 'transparent', color: activeTab === 'customers' ? 'white' : '#475569', border: 'none' }, onClick: () => handleTabChange('customers'), children: "M\u00FC\u015Fteriler" }), _jsx("button", { style: { ...AdminStyles.btnSecondary, background: activeTab === 'vehicles' ? '#2563eb' : 'transparent', color: activeTab === 'vehicles' ? 'white' : '#475569', border: 'none' }, onClick: () => handleTabChange('vehicles'), children: "Ara\u00E7lar" }), _jsx("button", { style: { ...AdminStyles.btnSecondary, background: activeTab === 'orders' ? '#2563eb' : 'transparent', color: activeTab === 'orders' ? 'white' : '#475569', border: 'none' }, onClick: () => handleTabChange('orders'), children: "Sipari\u015Fler" }), _jsx("button", { style: { ...AdminStyles.btnSecondary, background: activeTab === 'users' ? '#2563eb' : 'transparent', color: activeTab === 'users' ? 'white' : '#475569', border: 'none' }, onClick: () => handleTabChange('users'), children: "Kullan\u0131c\u0131lar" })] }), activeTab === 'overview' && (_jsxs("div", { children: [_jsxs("div", { style: { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 16, marginBottom: 20 }, children: [_jsx("h4", { style: { margin: '0 0 12px', color: '#0369a1', fontSize: 14 }, children: "\uD83D\uDCDE \u0130leti\u015Fim Bilgileri" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, color: '#64748b', marginBottom: 4 }, children: "Telefon" }), _jsx("div", { style: { fontSize: 14, fontWeight: 600 }, children: selectedTenant.phone || _jsx("span", { style: { color: '#94a3b8', fontWeight: 400 }, children: "Belirtilmemi\u015F" }) })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, color: '#64748b', marginBottom: 4 }, children: "E-posta" }), _jsx("div", { style: { fontSize: 14, fontWeight: 600 }, children: selectedTenant.email || _jsx("span", { style: { color: '#94a3b8', fontWeight: 400 }, children: "Belirtilmemi\u015F" }) })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, color: '#64748b', marginBottom: 4 }, children: "Web Sitesi" }), _jsx("div", { style: { fontSize: 14, fontWeight: 600 }, children: selectedTenant.website || _jsx("span", { style: { color: '#94a3b8', fontWeight: 400 }, children: "Belirtilmemi\u015F" }) })] }), _jsxs("div", { style: { gridColumn: 'span 3' }, children: [_jsx("div", { style: { fontSize: 12, color: '#64748b', marginBottom: 4 }, children: "Adres" }), _jsx("div", { style: { fontSize: 14, fontWeight: 600 }, children: selectedTenant.address || _jsx("span", { style: { color: '#94a3b8', fontWeight: 400 }, children: "Belirtilmemi\u015F" }) })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, color: '#64748b', marginBottom: 4 }, children: "\u015Eehir" }), _jsx("div", { style: { fontSize: 14, fontWeight: 600 }, children: selectedTenant.city || _jsx("span", { style: { color: '#94a3b8', fontWeight: 400 }, children: "Belirtilmemi\u015F" }) })] }), _jsxs("div", { children: [_jsx("div", { style: { fontSize: 12, color: '#64748b', marginBottom: 4 }, children: "Vergi No" }), _jsx("div", { style: { fontSize: 14, fontWeight: 600 }, children: selectedTenant.taxNumber || _jsx("span", { style: { color: '#94a3b8', fontWeight: 400 }, children: "Belirtilmemi\u015F" }) })] })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }, children: [_jsxs("div", { style: { padding: 16, background: '#f8fafc', borderRadius: 8 }, children: [_jsx("strong", { children: "Slug:" }), " ", selectedTenant.slug] }), _jsxs("div", { style: { padding: 16, background: '#f8fafc', borderRadius: 8 }, children: [_jsx("strong", { children: "Durum:" }), ' ', _jsxs("select", { value: selectedTenant.status, onChange: e => handleStatusChange(selectedTenant.id, e.target.value), style: { ...AdminStyles.select, padding: '4px 8px', fontSize: 13 }, children: [_jsx("option", { value: "ACTIVE", children: "Aktif" }), _jsx("option", { value: "SUSPENDED", children: "Ask\u0131ya Al" }), _jsx("option", { value: "TRIAL", children: "Deneme" })] })] }), _jsxs("div", { style: { padding: 16, background: '#f8fafc', borderRadius: 8 }, children: [_jsx("strong", { children: "Kay\u0131t:" }), " ", new Date(selectedTenant.createdAt).toLocaleDateString('tr-TR')] }), _jsxs("div", { style: { padding: 16, background: '#f8fafc', borderRadius: 8 }, children: [_jsx("strong", { children: "ID:" }), " ", _jsx("span", { style: { fontSize: 11, fontFamily: 'monospace' }, children: selectedTenant.id })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }, children: [_jsxs("div", { style: AdminStyles.statCard('#8b5cf6'), children: [_jsx("div", { style: AdminStyles.statLabel, children: "Kullan\u0131c\u0131" }), _jsx("div", { style: { ...AdminStyles.statValue, fontSize: 24 }, children: selectedTenant.stats?.userCount || 0 })] }), _jsxs("div", { style: AdminStyles.statCard('#f59e0b'), children: [_jsx("div", { style: AdminStyles.statLabel, children: "M\u00FC\u015Fteri" }), _jsx("div", { style: { ...AdminStyles.statValue, fontSize: 24 }, children: selectedTenant.stats?.customerCount || 0 })] }), _jsxs("div", { style: AdminStyles.statCard('#ec4899'), children: [_jsx("div", { style: AdminStyles.statLabel, children: "Ara\u00E7" }), _jsx("div", { style: { ...AdminStyles.statValue, fontSize: 24 }, children: selectedTenant.stats?.vehicleCount || 0 })] }), _jsxs("div", { style: AdminStyles.statCard('#06b6d4'), children: [_jsx("div", { style: AdminStyles.statLabel, children: "Sipari\u015F" }), _jsx("div", { style: { ...AdminStyles.statValue, fontSize: 24 }, children: selectedTenant.stats?.serviceOrderCount || 0 })] })] })] })), activeTab === 'customers' && (_jsx("div", { children: dataLoading ? _jsx("div", { style: { textAlign: 'center', padding: 40, color: '#94a3b8' }, children: "Y\u00FCkleniyor..." }) : tenantData.length === 0 ? _jsx("div", { style: { textAlign: 'center', padding: 40, color: '#94a3b8' }, children: "M\u00FC\u015Fteri bulunamad\u0131." }) : (_jsxs("table", { style: AdminStyles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: AdminStyles.th, children: "Ad Soyad" }), _jsx("th", { style: AdminStyles.th, children: "Telefon" }), _jsx("th", { style: AdminStyles.th, children: "E-posta" }), _jsx("th", { style: AdminStyles.th, children: "Plaka" }), _jsx("th", { style: AdminStyles.th, children: "\u0130\u015Flem" })] }) }), _jsx("tbody", { children: tenantData.map((c) => (_jsxs("tr", { children: [_jsxs("td", { style: AdminStyles.td, children: [c.firstName, " ", c.lastName] }), _jsx("td", { style: AdminStyles.td, children: c.phone || '-' }), _jsx("td", { style: AdminStyles.td, children: c.email || '-' }), _jsx("td", { style: AdminStyles.td, children: c.licensePlate || '-' }), _jsx("td", { style: AdminStyles.td, children: _jsxs("div", { style: { display: 'flex', gap: 6 }, children: [_jsx("button", { style: AdminStyles.btnSecondary, onClick: () => setEditItem({ ...c, _type: 'customers' }), children: "D\u00FCzenle" }), _jsx("button", { style: AdminStyles.btnDanger, onClick: () => handleDelete('customers', c.id), children: "Sil" })] }) })] }, c.id))) })] })) })), activeTab === 'vehicles' && (_jsx("div", { children: dataLoading ? _jsx("div", { style: { textAlign: 'center', padding: 40, color: '#94a3b8' }, children: "Y\u00FCkleniyor..." }) : tenantData.length === 0 ? _jsx("div", { style: { textAlign: 'center', padding: 40, color: '#94a3b8' }, children: "Ara\u00E7 bulunamad\u0131." }) : (_jsxs("table", { style: AdminStyles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: AdminStyles.th, children: "Plaka" }), _jsx("th", { style: AdminStyles.th, children: "Marka" }), _jsx("th", { style: AdminStyles.th, children: "Model" }), _jsx("th", { style: AdminStyles.th, children: "Y\u0131l" }), _jsx("th", { style: AdminStyles.th, children: "\u0130\u015Flem" })] }) }), _jsx("tbody", { children: tenantData.map((v) => (_jsxs("tr", { children: [_jsx("td", { style: AdminStyles.td, children: _jsx("strong", { children: v.licensePlate }) }), _jsx("td", { style: AdminStyles.td, children: v.brand || '-' }), _jsx("td", { style: AdminStyles.td, children: v.model || '-' }), _jsx("td", { style: AdminStyles.td, children: v.year || '-' }), _jsx("td", { style: AdminStyles.td, children: _jsxs("div", { style: { display: 'flex', gap: 6 }, children: [_jsx("button", { style: AdminStyles.btnSecondary, onClick: () => setEditItem({ ...v, _type: 'vehicles' }), children: "D\u00FCzenle" }), _jsx("button", { style: AdminStyles.btnDanger, onClick: () => handleDelete('vehicles', v.id), children: "Sil" })] }) })] }, v.id))) })] })) })), activeTab === 'orders' && (_jsx("div", { children: dataLoading ? _jsx("div", { style: { textAlign: 'center', padding: 40, color: '#94a3b8' }, children: "Y\u00FCkleniyor..." }) : tenantData.length === 0 ? _jsx("div", { style: { textAlign: 'center', padding: 40, color: '#94a3b8' }, children: "Sipari\u015F bulunamad\u0131." }) : (_jsxs("table", { style: AdminStyles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: AdminStyles.th, children: "No" }), _jsx("th", { style: AdminStyles.th, children: "M\u00FC\u015Fteri" }), _jsx("th", { style: AdminStyles.th, children: "Ara\u00E7" }), _jsx("th", { style: AdminStyles.th, children: "Durum" }), _jsx("th", { style: AdminStyles.th, children: "Tutar" }), _jsx("th", { style: AdminStyles.th, children: "Tarih" }), _jsx("th", { style: AdminStyles.th, children: "\u0130\u015Flem" })] }) }), _jsx("tbody", { children: tenantData.map((o) => (_jsxs("tr", { children: [_jsx("td", { style: AdminStyles.td, children: _jsxs("strong", { children: ["#", o.orderNumber || o.id.slice(0, 6)] }) }), _jsx("td", { style: AdminStyles.td, children: o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : '-' }), _jsx("td", { style: AdminStyles.td, children: o.vehicle?.licensePlate || '-' }), _jsx("td", { style: AdminStyles.td, children: _jsx("span", { style: AdminStyles.badge(o.status), children: o.status }) }), _jsx("td", { style: AdminStyles.td, children: o.totalAmount ? `${o.totalAmount} ₺` : '-' }), _jsx("td", { style: AdminStyles.td, children: new Date(o.createdAt).toLocaleDateString('tr-TR') }), _jsx("td", { style: AdminStyles.td, children: _jsxs("div", { style: { display: 'flex', gap: 6 }, children: [_jsx("button", { style: AdminStyles.btnSecondary, onClick: () => setEditItem({ ...o, _type: 'service-orders' }), children: "D\u00FCzenle" }), _jsx("button", { style: AdminStyles.btnDanger, onClick: () => handleDelete('service-orders', o.id), children: "Sil" })] }) })] }, o.id))) })] })) })), activeTab === 'users' && (_jsxs("div", { children: [_jsx("div", { style: { marginBottom: 16 }, children: _jsx("button", { style: AdminStyles.btnSuccess, onClick: () => { setShowAddUser(true); setAddError(''); }, children: "+ Yeni Kullan\u0131c\u0131 Ekle" }) }), showAddUser && (_jsxs("div", { style: { background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }, children: [_jsx("h4", { style: { margin: '0 0 12px' }, children: "Yeni Kullan\u0131c\u0131" }), addError && _jsx("div", { style: { background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 13 }, children: addError }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }, children: [_jsx("input", { style: AdminStyles.input, placeholder: "Ad", value: newUser.firstName, onChange: e => setNewUser({ ...newUser, firstName: e.target.value }) }), _jsx("input", { style: AdminStyles.input, placeholder: "Soyad", value: newUser.lastName, onChange: e => setNewUser({ ...newUser, lastName: e.target.value }) }), _jsx("input", { style: AdminStyles.input, placeholder: "E-posta", type: "email", value: newUser.email, onChange: e => setNewUser({ ...newUser, email: e.target.value }) }), _jsx("input", { style: AdminStyles.input, placeholder: "\u015Eifre", type: "password", value: newUser.password, onChange: e => setNewUser({ ...newUser, password: e.target.value }) })] }), _jsxs("div", { style: { display: 'flex', gap: 8, marginTop: 12 }, children: [_jsx("button", { style: AdminStyles.btnPrimary, onClick: handleAddUser, children: "Ekle" }), _jsx("button", { style: AdminStyles.btnSecondary, onClick: () => setShowAddUser(false), children: "\u0130ptal" })] })] })), dataLoading ? _jsx("div", { style: { textAlign: 'center', padding: 40, color: '#94a3b8' }, children: "Y\u00FCkleniyor..." }) : tenantData.length === 0 ? _jsx("div", { style: { textAlign: 'center', padding: 40, color: '#94a3b8' }, children: "Kullan\u0131c\u0131 bulunamad\u0131." }) : (_jsxs("table", { style: AdminStyles.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: AdminStyles.th, children: "Ad Soyad" }), _jsx("th", { style: AdminStyles.th, children: "E-posta" }), _jsx("th", { style: AdminStyles.th, children: "Durum" }), _jsx("th", { style: AdminStyles.th, children: "Kay\u0131t" }), _jsx("th", { style: AdminStyles.th, children: "\u0130\u015Flem" })] }) }), _jsx("tbody", { children: tenantData.map((u) => (_jsxs("tr", { children: [_jsxs("td", { style: AdminStyles.td, children: [u.firstName, " ", u.lastName] }), _jsx("td", { style: AdminStyles.td, children: u.email }), _jsx("td", { style: AdminStyles.td, children: _jsx("span", { style: AdminStyles.badge(u.status), children: u.status }) }), _jsx("td", { style: AdminStyles.td, children: new Date(u.createdAt).toLocaleDateString('tr-TR') }), _jsx("td", { style: AdminStyles.td, children: _jsxs("div", { style: { display: 'flex', gap: 6 }, children: [_jsx("button", { style: AdminStyles.btnSecondary, onClick: () => setEditItem({ ...u, _type: 'users' }), children: "D\u00FCzenle" }), _jsx("button", { style: AdminStyles.btnDanger, onClick: () => handleDelete('users', u.id), children: "Sil" })] }) })] }, u.id))) })] }))] })), editItem && (_jsx(EditRecordModal, { item: editItem, onSave: (data) => handleUpdate(editItem._type, editItem.id, data), onClose: () => setEditItem(null) }))] }) }))] }));
}
// ============ EDIT RECORD MODAL ============
function EditRecordModal({ item, onSave, onClose }) {
    const [form, setForm] = useState({});
    const type = item._type;
    const fieldMap = {
        customers: [
            { label: 'Ad', key: 'firstName' },
            { label: 'Soyad', key: 'lastName' },
            { label: 'Telefon', key: 'phone' },
            { label: 'E-posta', key: 'email' },
            { label: 'Plaka', key: 'licensePlate' },
            { label: 'Adres', key: 'address' },
        ],
        vehicles: [
            { label: 'Plaka', key: 'licensePlate' },
            { label: 'Marka', key: 'brand' },
            { label: 'Model', key: 'model' },
            { label: 'Yıl', key: 'year' },
            { label: 'Renk', key: 'color' },
            { label: 'VIN', key: 'vin' },
        ],
        'service-orders': [
            { label: 'Durum', key: 'status' },
            { label: 'Toplam Tutar', key: 'totalAmount', type: 'number' },
            { label: 'İndirim', key: 'discount', type: 'number' },
            { label: 'KDV', key: 'tax', type: 'number' },
            { label: 'Notlar', key: 'notes' },
        ],
        users: [
            { label: 'Ad', key: 'firstName' },
            { label: 'Soyad', key: 'lastName' },
            { label: 'E-posta', key: 'email' },
            { label: 'Durum', key: 'status' },
        ],
    };
    const fields = fieldMap[type] || [];
    return (_jsx("div", { style: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }, onClick: onClose, children: _jsxs("div", { style: { ...S.modalContent, width: 450 }, onClick: e => e.stopPropagation(), children: [_jsx("div", { style: S.modalTitle, children: "D\u00FCzenle" }), fields.map(f => (_jsxs("div", { style: S.formGroup, children: [_jsx("label", { style: S.label, children: f.label }), f.key === 'status' ? (_jsx("select", { style: S.select, value: form[f.key] ?? item[f.key] ?? '', onChange: e => setForm({ ...form, [f.key]: e.target.value }), children: type === 'users' ? (_jsxs(_Fragment, { children: [_jsx("option", { value: "ACTIVE", children: "Aktif" }), _jsx("option", { value: "INACTIVE", children: "Pasif" })] })) : (_jsxs(_Fragment, { children: [_jsx("option", { value: "PENDING", children: "Bekliyor" }), _jsx("option", { value: "IN_PROGRESS", children: "Devam Ediyor" }), _jsx("option", { value: "COMPLETED", children: "Tamamland\u0131" }), _jsx("option", { value: "CANCELLED", children: "\u0130ptal" })] })) })) : f.key === 'notes' || f.key === 'address' ? (_jsx("textarea", { style: { ...S.input, minHeight: 60, resize: 'vertical' }, value: form[f.key] ?? item[f.key] ?? '', onChange: e => setForm({ ...form, [f.key]: e.target.value }) })) : (_jsx("input", { style: S.input, type: f.type || 'text', value: form[f.key] ?? item[f.key] ?? '', onChange: e => setForm({ ...form, [f.key]: e.target.value }) }))] }, f.key))), _jsxs("div", { style: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }, children: [_jsx("button", { style: S.btnSecondary, onClick: onClose, children: "\u0130ptal" }), _jsx("button", { style: S.btnPrimary, onClick: () => onSave(form), children: "Kaydet" })] })] }) }));
}
// ============ MAIN APP ============
export function App() {
    return (_jsx(ToastProvider, { children: _jsx(AppInner, {}) }));
}
function AppInner() {
    const { user, loading, login, register, logout } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [showLanding, setShowLanding] = useState(true);
    const [showAdmin, setShowAdmin] = useState(false);
    // Admin panel - URL'den erişim: #admin veya /admin
    const isAdminUrl = window.location.hash === '#admin' || window.location.pathname === '/admin';
    if (isAdminUrl && user) {
        return _jsx(AdminPanel, { onBack: () => { window.location.hash = ''; window.location.pathname = '/'; } });
    }
    // Admin panel - buton ile erişim
    if (showAdmin && user) {
        return _jsx(AdminPanel, { onBack: () => setShowAdmin(false) });
    }
    if (loading)
        return _jsx("div", { style: { ...S.loginWrap, color: 'white' }, children: "Y\u00FCkleniyor..." });
    // Landing page
    if (showLanding && !user) {
        return (_jsx(LandingPage, { onGetStarted: () => { setIsLogin(false); setShowLanding(false); }, onLogin: () => { setIsLogin(true); setShowLanding(false); } }));
    }
    if (!user) {
        return isLogin ? (_jsxs("div", { children: [_jsx(LoginPage, { onLogin: login, onSwitch: () => setIsLogin(false) }), _jsx("div", { style: { position: 'fixed', bottom: 20, right: 20 }, children: _jsx("button", { onClick: () => setShowLanding(true), style: { ...S.btnSecondary, opacity: 0.7 }, children: "\u2190 Ana Sayfa" }) })] })) : (_jsxs("div", { children: [_jsx(RegisterPage, { onRegister: register, onSwitch: () => setIsLogin(true) }), _jsx("div", { style: { position: 'fixed', bottom: 20, right: 20 }, children: _jsx("button", { onClick: () => setShowLanding(true), style: { ...S.btnSecondary, opacity: 0.7 }, children: "\u2190 Ana Sayfa" }) })] }));
    }
    return (_jsx(BrowserRouter, { children: _jsx(Layout, { user: user, onLogout: logout, children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(DashboardPage, { tenantId: user.tenantId }) }), _jsx(Route, { path: "/customers", element: _jsx(CustomersPage, { tenantId: user.tenantId }) }), _jsx(Route, { path: "/vehicles", element: _jsx(VehiclesPage, { tenantId: user.tenantId }) }), _jsx(Route, { path: "/service-orders", element: _jsx(ServiceOrdersPage, { tenantId: user.tenantId }) }), _jsx(Route, { path: "/receivables", element: _jsx(ReceivablesPage, { tenantId: user.tenantId }) }), _jsx(Route, { path: "/financial", element: _jsx(FinancialPage, { tenantId: user.tenantId }) }), _jsx(Route, { path: "/settings", element: _jsx(SettingsPage, { user: user }) })] }) }) }));
}
