import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi, setToken, getToken, customerApi, vehicleApi, serviceOrderApi, accountingApi, reportingApi, adminApi, licenseApi } from './services/api';

// ============ STYLES ============
const S = {
  page: { minHeight: '100vh', background: '#f1f5f9' } as React.CSSProperties,
  loginWrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' } as React.CSSProperties,
  loginCard: { background: 'white', borderRadius: 16, padding: 40, width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' } as React.CSSProperties,
  loginTitle: { fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 8, textAlign: 'center' as const } as React.CSSProperties,
  loginSub: { color: '#64748b', textAlign: 'center' as const, marginBottom: 32 } as React.CSSProperties,
  input: { width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 15, marginBottom: 16, outline: 'none' } as React.CSSProperties,
  btnPrimary: { width: '100%', padding: '14px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer' } as React.CSSProperties,
  btnSecondary: { padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnDanger: { padding: '8px 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnSuccess: { padding: '8px 16px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  error: { background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 } as React.CSSProperties,
  link: { color: '#2563eb', cursor: 'pointer', fontSize: 14 } as React.CSSProperties,
  layout: { display: 'flex', minHeight: '100vh' } as React.CSSProperties,
  sidebar: { width: 240, background: '#0f172a', color: 'white', padding: '20px 0', position: 'fixed' as const, top: 0, bottom: 0, overflowY: 'auto' as const } as React.CSSProperties,
  sidebarLogo: { padding: '0 20px 20px', fontSize: 20, fontWeight: 800, borderBottom: '1px solid #1e293b', marginBottom: 16 } as React.CSSProperties,
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', color: '#94a3b8', textDecoration: 'none', fontSize: 14, fontWeight: 500, transition: 'all 0.2s', borderLeft: '3px solid transparent' } as React.CSSProperties,
  navItemActive: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600, background: '#1e293b', borderLeft: '3px solid #2563eb' } as React.CSSProperties,
  main: { flex: 1, marginLeft: 240, padding: 32 } as React.CSSProperties,
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 } as React.CSSProperties,
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#0f172a' } as React.CSSProperties,
  card: { background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 } as React.CSSProperties,
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 24 } as React.CSSProperties,
  statCard: { background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } as React.CSSProperties,
  statLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 } as React.CSSProperties,
  statValue: { fontSize: 28, fontWeight: 700, color: '#0f172a' } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 } as React.CSSProperties,
  th: { textAlign: 'left' as const, padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' as const } as React.CSSProperties,
  td: { padding: '12px 16px', borderBottom: '1px solid #f1f5f9' } as React.CSSProperties,
  badge: (color: string) => ({ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: color === 'green' ? '#f0fdf4' : color === 'red' ? '#fef2f2' : color === 'yellow' ? '#fefce8' : '#f0f9ff', color: color === 'green' ? '#16a34a' : color === 'red' ? '#dc2626' : color === 'yellow' ? '#ca8a04' : '#2563eb' }) as React.CSSProperties,
  modal: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 } as React.CSSProperties,
  modalContent: { background: 'white', borderRadius: 16, padding: 32, width: 500, maxHeight: '80vh', overflowY: 'auto' as const } as React.CSSProperties,
  modalTitle: { fontSize: 20, fontWeight: 700, marginBottom: 20 } as React.CSSProperties,
  formGroup: { marginBottom: 16 } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 } as React.CSSProperties,
  select: { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' } as React.CSSProperties,
  toolbar: { display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' as const } as React.CSSProperties,
  searchInput: { padding: '10px 16px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: 280, outline: 'none' } as React.CSSProperties,
  empty: { textAlign: 'center' as const, padding: 40, color: '#94a3b8' } as React.CSSProperties,
};

// ============ AUTH CONTEXT ============
interface User { id: string; email: string; firstName: string; lastName: string; tenantId: string; roles: any[]; status: string; }

function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      authApi.me().then((res: any) => {
        setUser({ id: res.id, email: res.email, firstName: res.firstName, lastName: res.lastName, tenantId: res.tenantId, roles: res.roles || [], status: res.status });
      }).catch(() => { setToken(null); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setToken(res.accessToken);
    const u = res.user;
    setUser({ id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, tenantId: u.tenantId, roles: u.roles || [], status: u.status });
    return res;
  };

  const register = async (data: { tenantName: string; tenantSlug: string; adminEmail: string; adminPassword: string; adminFirstName: string; adminLastName: string }) => {
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
function LoginPage({ onLogin, onSwitch }: { onLogin: (email: string, password: string) => Promise<void>; onSwitch: () => void; isRegister?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={S.loginTitle}>OtoServis</div>
        <div style={S.loginSub}>Servis Yönetim Sistemi</div>
        {error && <div style={S.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input style={S.input} placeholder="E-posta" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={S.input} placeholder="Şifre" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <span style={{ color: '#64748b', fontSize: 14 }}>Hesabınız yok mu? </span>
          <span style={S.link} onClick={onSwitch}>Kayıt Ol</span>
        </div>
      </div>
    </div>
  );
}

// ============ REGISTER PAGE ============
function RegisterPage({ onRegister, onSwitch }: { onRegister: (data: any) => Promise<void>; onSwitch: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const slug = tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      await onRegister({ tenantName, tenantSlug: slug, adminEmail: email, adminPassword: password, adminFirstName: firstName, adminLastName: lastName });
    } catch (err: any) {
      setError(err.message || 'Kayıt başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.loginWrap}>
      <div style={S.loginCard}>
        <div style={S.loginTitle}>Hesap Oluştur</div>
        <div style={S.loginSub}>Servisinizi buluta taşıyın</div>
        {error && <div style={S.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input style={S.input} placeholder="Firma Adı" value={tenantName} onChange={e => setTenantName(e.target.value)} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input style={S.input} placeholder="Ad" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            <input style={S.input} placeholder="Soyad" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>
          <input style={S.input} placeholder="E-posta" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input style={S.input} placeholder="Şifre (min 8, büyük+küçük+rakam)" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          <button type="submit" style={{ ...S.btnPrimary, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? 'Oluşturuluyor...' : 'Kayıt Ol'}
          </button>
        </form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <span style={{ color: '#64748b', fontSize: 14 }}>Zaten hesabınız var mı? </span>
          <span style={S.link} onClick={onSwitch}>Giriş Yap</span>
        </div>
      </div>
    </div>
  );
}

// ============ LAYOUT ============
function Layout({ user, onLogout, children }: { user: User; onLogout: () => void; children: React.ReactNode }) {
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

  return (
    <div style={S.layout}>
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}>OtoServis</div>
        <nav>
          {navItems.map(item => (
            <Link key={item.path} to={item.path} style={location.pathname === item.path ? S.navItemActive : S.navItem}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div style={{ padding: '20px', marginTop: 'auto', borderTop: '1px solid #1e293b', position: 'absolute', bottom: 0, width: 240 }}>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{user.firstName} {user.lastName}</div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>{user.email}</div>
          <button onClick={onLogout} style={{ ...S.btnDanger, width: '100%', fontSize: 13 }}>Çıkış Yap</button>
        </div>
      </aside>
      <main style={S.main}>{children}</main>
    </div>
  );
}

// ============ DASHBOARD ============
function DashboardPage({ tenantId }: { tenantId: string }) {
  const [stats, setStats] = useState<any>(null);
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
      const activeOrders = orders.filter((o: any) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED');
      const completedOrders = orders.filter((o: any) => o.status === 'COMPLETED');
      const totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);
      const totalPaid = completedOrders.reduce((sum: number, o: any) => sum + Number(o.paidAmount || 0), 0);

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

  if (loading) return <div style={S.empty}>Yükleniyor...</div>;

  return (
    <div>
      <div style={S.header}><h1 style={S.pageTitle}>Dashboard</h1></div>
      <div style={S.statGrid}>
        <div style={S.statCard}>
          <div style={S.statLabel}>Toplam Müşteri</div>
          <div style={S.statValue}>{stats?.customerCount || 0}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Toplam Araç</div>
          <div style={S.statValue}>{stats?.vehicleCount || 0}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Aktif Siparişler</div>
          <div style={{ ...S.statValue, color: '#2563eb' }}>{stats?.activeOrderCount || 0}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Tamamlanan</div>
          <div style={{ ...S.statValue, color: '#16a34a' }}>{stats?.completedOrderCount || 0}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Toplam Gelir</div>
          <div style={{ ...S.statValue, color: '#16a34a' }}>₺{(stats?.totalRevenue || 0).toLocaleString('tr-TR')}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Tahsil Edilen</div>
          <div style={{ ...S.statValue, color: '#16a34a' }}>₺{(stats?.totalPaid || 0).toLocaleString('tr-TR')}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Alacaklar</div>
          <div style={{ ...S.statValue, color: '#dc2626' }}>₺{(stats?.receivables || 0).toLocaleString('tr-TR')}</div>
        </div>
      </div>
    </div>
  );
}

// ============ CUSTOMERS PAGE ============
function CustomersPage({ tenantId }: { tenantId: string }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '', notes: '' });

  const load = useCallback(async () => {
    try {
      const res = await customerApi.list(tenantId, 'limit=1000');
      setCustomers(res?.data || res || []);
    } catch { setCustomers([]); }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    await customerApi.create(tenantId, form);
    setShowForm(false);
    setForm({ fullName: '', phone: '', email: '', address: '', notes: '' });
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    await customerApi.remove(tenantId, id);
    load();
  };

  const filtered = customers.filter(c =>
    (c.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  return (
    <div>
      <div style={S.header}>
        <h1 style={S.pageTitle}>Müşteriler</h1>
        <button style={S.btnPrimary as any} onClick={() => setShowForm(true)}>+ Yeni Müşteri</button>
      </div>
      <div style={S.card}>
        <div style={S.toolbar}>
          <input style={S.searchInput} placeholder="Müşteri ara..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? <div style={S.empty}>Yükleniyor...</div> : filtered.length === 0 ? <div style={S.empty}>Müşteri bulunamadı</div> : (
          <table style={S.table}>
            <thead><tr><th style={S.th}>Ad Soyad</th><th style={S.th}>Telefon</th><th style={S.th}>E-posta</th><th style={S.th}>İşlem</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={S.td}><strong>{c.fullName}</strong></td>
                  <td style={S.td}>{c.phone || '-'}</td>
                  <td style={S.td}>{c.email || '-'}</td>
                  <td style={S.td}><button style={S.btnDanger} onClick={() => handleDelete(c.id)}>Sil</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showForm && (
        <div style={S.modal} onClick={() => setShowForm(false)}>
          <div style={S.modalContent} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>Yeni Müşteri</div>
            <div style={S.formGroup}><label style={S.label}>Ad Soyad</label><input style={S.input} value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
            <div style={S.formGroup}><label style={S.label}>Telefon</label><input style={S.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div style={S.formGroup}><label style={S.label}>E-posta</label><input style={S.input} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div style={S.formGroup}><label style={S.label}>Adres</label><input style={S.input} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={S.btnSecondary} onClick={() => setShowForm(false)}>İptal</button>
              <button style={S.btnPrimary as any} onClick={handleCreate}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ VEHICLES PAGE ============
function VehiclesPage({ tenantId }: { tenantId: string }) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
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
    } catch { /* ignore */ }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    await vehicleApi.create(tenantId, { ...form, year: form.year ? Number(form.year) : null });
    setShowForm(false);
    setForm({ plate: '', brand: '', model: '', year: '', color: '', customerId: '' });
    load();
  };

  const filtered = vehicles.filter(v =>
    (v.plate || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.brand || '').toLowerCase().includes(search.toLowerCase())
  );

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.fullName || '-';

  return (
    <div>
      <div style={S.header}>
        <h1 style={S.pageTitle}>Araçlar</h1>
        <button style={S.btnPrimary as any} onClick={() => setShowForm(true)}>+ Yeni Araç</button>
      </div>
      <div style={S.card}>
        <div style={S.toolbar}>
          <input style={S.searchInput} placeholder="Plaka veya marka ara..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {loading ? <div style={S.empty}>Yükleniyor...</div> : filtered.length === 0 ? <div style={S.empty}>Araç bulunamadı</div> : (
          <table style={S.table}>
            <thead><tr><th style={S.th}>Plaka</th><th style={S.th}>Marka/Model</th><th style={S.th}>Yıl</th><th style={S.th}>Renk</th><th style={S.th}>Müşteri</th><th style={S.th}>İşlem</th></tr></thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td style={S.td}><strong>{v.plate}</strong></td>
                  <td style={S.td}>{v.brand} {v.model}</td>
                  <td style={S.td}>{v.year || '-'}</td>
                  <td style={S.td}>{v.color || '-'}</td>
                  <td style={S.td}>{getCustomerName(v.customerId)}</td>
                  <td style={S.td}><button style={S.btnDanger} onClick={() => { vehicleApi.remove(tenantId, v.id); load(); }}>Sil</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showForm && (
        <div style={S.modal} onClick={() => setShowForm(false)}>
          <div style={S.modalContent} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>Yeni Araç</div>
            <div style={S.formGroup}><label style={S.label}>Plaka</label><input style={S.input} value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={S.formGroup}><label style={S.label}>Marka</label><input style={S.input} value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
              <div style={S.formGroup}><label style={S.label}>Model</label><input style={S.input} value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={S.formGroup}><label style={S.label}>Yıl</label><input style={S.input} type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} /></div>
              <div style={S.formGroup}><label style={S.label}>Renk</label><input style={S.input} value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} /></div>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Müşteri</label>
              <select style={S.select} value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                <option value="">Seçiniz...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={S.btnSecondary} onClick={() => setShowForm(false)}>İptal</button>
              <button style={S.btnPrimary as any} onClick={handleCreate}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ SERVICE ORDERS PAGE ============
function ServiceOrdersPage({ tenantId }: { tenantId: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
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
    } catch { /* ignore */ }
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

  const getCustomerName = (id: string) => customers.find(c => c.id === id)?.fullName || '-';
  const getVehiclePlate = (id: string) => vehicles.find(v => v.id === id)?.plate || '-';

  const statusLabel: Record<string, { text: string; color: string }> = {
    PENDING: { text: 'Bekliyor', color: 'yellow' },
    IN_PROGRESS: { text: 'Devam Ediyor', color: 'blue' },
    WAITING_PARTS: { text: 'Parça Bekliyor', color: 'yellow' },
    COMPLETED: { text: 'Tamamlandı', color: 'green' },
    CANCELLED: { text: 'İptal', color: 'red' },
  };

  return (
    <div>
      <div style={S.header}>
        <h1 style={S.pageTitle}>Servis Siparişleri</h1>
        <button style={S.btnPrimary as any} onClick={() => setShowForm(true)}>+ Yeni Sipariş</button>
      </div>
      <div style={S.card}>
        {loading ? <div style={S.empty}>Yükleniyor...</div> : orders.length === 0 ? <div style={S.empty}>Sipariş bulunamadı</div> : (
          <table style={S.table}>
            <thead><tr><th style={S.th}>Müşteri</th><th style={S.th}>Araç</th><th style={S.th}>Açıklama</th><th style={S.th}>Tutar</th><th style={S.th}>Durum</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={S.td}>{getCustomerName(o.customerId)}</td>
                  <td style={S.td}>{getVehiclePlate(o.vehicleId)}</td>
                  <td style={S.td}>{o.description || '-'}</td>
                  <td style={S.td}><strong>₺{Number(o.totalAmount || 0).toLocaleString('tr-TR')}</strong></td>
                  <td style={S.td}><span style={S.badge(statusLabel[o.status]?.color || 'blue')}>{statusLabel[o.status]?.text || o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showForm && (
        <div style={S.modal} onClick={() => setShowForm(false)}>
          <div style={S.modalContent} onClick={e => e.stopPropagation()}>
            <div style={S.modalTitle}>Yeni Servis Siparişi</div>
            <div style={S.formGroup}>
              <label style={S.label}>Müşteri</label>
              <select style={S.select} value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })}>
                <option value="">Seçiniz...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
              </select>
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Araç</label>
              <select style={S.select} value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Seçiniz...</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>)}
              </select>
            </div>
            <div style={S.formGroup}><label style={S.label}>Açıklama</label><input style={S.input} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div style={S.formGroup}><label style={S.label}>Toplam Tutar</label><input style={S.input} type="number" value={form.totalAmount} onChange={e => setForm({ ...form, totalAmount: e.target.value })} /></div>
              <div style={S.formGroup}><label style={S.label}>İşçilik</label><input style={S.input} type="number" value={form.laborAmount} onChange={e => setForm({ ...form, laborAmount: e.target.value })} /></div>
              <div style={S.formGroup}><label style={S.label}>Parça</label><input style={S.input} type="number" value={form.partsAmount} onChange={e => setForm({ ...form, partsAmount: e.target.value })} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button style={S.btnSecondary} onClick={() => setShowForm(false)}>İptal</button>
              <button style={S.btnPrimary as any} onClick={handleCreate}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ RECEIVABLES PAGE ============
function ReceivablesPage({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      customerApi.list(tenantId, 'limit=1000'),
      serviceOrderApi.list(tenantId, 'limit=1000'),
    ]).then(([cRes, oRes]) => {
      const customers = cRes?.data || cRes || [];
      const orders = oRes?.data || oRes || [];
      const map = new Map<string, any>();
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

  return (
    <div>
      <div style={S.header}><h1 style={S.pageTitle}>Cari Hesaplar</h1></div>
      <div style={S.card}>
        {loading ? <div style={S.empty}>Yükleniyor...</div> : data.length === 0 ? <div style={S.empty}>Kayıt bulunamadı</div> : (
          <table style={S.table}>
            <thead><tr><th style={S.th}>Müşteri</th><th style={S.th}>Toplam Borç</th><th style={S.th}>Ödenen</th><th style={S.th}>Kalan</th><th style={S.th}>Durum</th></tr></thead>
            <tbody>
              {data.map(c => (
                <tr key={c.id}>
                  <td style={S.td}><strong>{c.fullName}</strong></td>
                  <td style={S.td}>₺{c.totalDebt.toLocaleString('tr-TR')}</td>
                  <td style={S.td}>₺{c.totalPaid.toLocaleString('tr-TR')}</td>
                  <td style={S.td}><strong style={{ color: c.remainingBalance > 0 ? '#dc2626' : '#16a34a' }}>₺{c.remainingBalance.toLocaleString('tr-TR')}</strong></td>
                  <td style={S.td}><span style={S.badge(c.remainingBalance > 0 ? 'red' : 'green')}>{c.remainingBalance > 0 ? 'Borçlu' : 'Temiz'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============ FINANCIAL PAGE ============
function FinancialPage({ tenantId }: { tenantId: string }) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [orders, setOrders] = useState<any[]>([]);
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
    if (period === 'daily') return d.toDateString() === now.toDateString();
    if (period === 'weekly') { const weekAgo = new Date(now.getTime() - 7 * 86400000); return d >= weekAgo; }
    if (period === 'monthly') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return d.getFullYear() === now.getFullYear();
  });

  const totalIncome = filteredOrders.reduce((s, o) => s + Number(o.paidAmount || 0), 0);
  const totalRevenue = filteredOrders.reduce((s, o) => s + Number(o.totalAmount || 0), 0);
  const totalUnpaid = totalRevenue - totalIncome;

  return (
    <div>
      <div style={S.header}>
        <h1 style={S.pageTitle}>Ön Muhasebe</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(p => (
            <button key={p} style={period === p ? { ...S.btnPrimary as any, width: 'auto' } : S.btnSecondary}
              onClick={() => setPeriod(p)}>
              {p === 'daily' ? 'Günlük' : p === 'weekly' ? 'Haftalık' : p === 'monthly' ? 'Aylık' : 'Yıllık'}
            </button>
          ))}
        </div>
      </div>
      <div style={S.statGrid}>
        <div style={S.statCard}>
          <div style={S.statLabel}>Toplam Gelir (Tahsil)</div>
          <div style={{ ...S.statValue, color: '#16a34a' }}>₺{totalIncome.toLocaleString('tr-TR')}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Toplam Sipariş Tutarı</div>
          <div style={S.statValue}>₺{totalRevenue.toLocaleString('tr-TR')}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Tahsil Edilmeyen</div>
          <div style={{ ...S.statValue, color: '#dc2626' }}>₺{totalUnpaid.toLocaleString('tr-TR')}</div>
        </div>
        <div style={S.statCard}>
          <div style={S.statLabel}>Sipariş Sayısı</div>
          <div style={S.statValue}>{filteredOrders.length}</div>
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Sipariş Detayları</h3>
        {loading ? <div style={S.empty}>Yükleniyor...</div> : filteredOrders.length === 0 ? <div style={S.empty}>Bu dönemde sipariş yok</div> : (
          <table style={S.table}>
            <thead><tr><th style={S.th}>Tarih</th><th style={S.th}>Tutar</th><th style={S.th}>Ödenen</th><th style={S.th}>Kalan</th><th style={S.th}>Durum</th></tr></thead>
            <tbody>
              {filteredOrders.map(o => (
                <tr key={o.id}>
                  <td style={S.td}>{new Date(o.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td style={S.td}>₺{Number(o.totalAmount || 0).toLocaleString('tr-TR')}</td>
                  <td style={S.td}>₺{Number(o.paidAmount || 0).toLocaleString('tr-TR')}</td>
                  <td style={S.td}><strong style={{ color: Number(o.totalAmount) - Number(o.paidAmount) > 0 ? '#dc2626' : '#16a34a' }}>₺{(Number(o.totalAmount) - Number(o.paidAmount)).toLocaleString('tr-TR')}</strong></td>
                  <td style={S.td}><span style={S.badge(o.paymentStatus === 'PAID' ? 'green' : o.paymentStatus === 'PARTIAL' ? 'yellow' : 'red')}>{o.paymentStatus === 'PAID' ? 'Ödendi' : o.paymentStatus === 'PARTIAL' ? 'Kısmi' : 'Ödenmedi'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============ SETTINGS PAGE ============
function SettingsPage({ user }: { user: User }) {
  return (
    <div>
      <div style={S.header}><h1 style={S.pageTitle}>Ayarlar</h1></div>
      <div style={S.card}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Firma Bilgileri</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div><strong>E-posta:</strong> {user.email}</div>
          <div><strong>Ad Soyad:</strong> {user.firstName} {user.lastName}</div>
          <div><strong>Rol:</strong> {user.roles?.map((r: any) => r.name).join(', ') || 'Admin'}</div>
          <div><strong>Tenant ID:</strong> {user.tenantId}</div>
        </div>
      </div>
    </div>
  );
}

// ============ DOWNLOAD PAGE ============
function DownloadPage({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'white', cursor: 'pointer' }} onClick={onBack}>OtoServis</div>
        <button onClick={onBack} style={{ padding: '10px 20px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>← Geri</button>
      </nav>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 40px', textAlign: 'center' as const }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🖥️</div>
        <h1 style={{ fontSize: 40, fontWeight: 800, color: 'white', marginBottom: 16 }}>OtoServis Desktop</h1>
        <p style={{ fontSize: 18, color: '#94a3b8', marginBottom: 40, lineHeight: 1.6 }}>Windows için masaüstü uygulamasını indirin.<br />Kurulum ile birlikte Program Files'e yüklenir.</p>

        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 40, marginBottom: 40, border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ fontSize: 40 }}>🪟</div>
            <div style={{ textAlign: 'left' as const }}>
              <div style={{ color: 'white', fontSize: 20, fontWeight: 700 }}>Windows 10/11 (64-bit)</div>
              <div style={{ color: '#94a3b8', fontSize: 14 }}>Installer (.exe) • ~81 MB</div>
            </div>
          </div>
          <a
            href="https://github.com/acaybak/otoservis/releases/latest/download/OtoServis.Setup.0.1.0.exe"
            download
            style={{ display: 'inline-block', padding: '16px 48px', background: '#2563eb', color: 'white', borderRadius: 12, fontSize: 18, fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}
          >
            📥 İndir
          </a>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 16 }}>v0.1.0 • Son güncelleme: Eylül 2026</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, textAlign: 'center' as const }}>
          {[
            { icon: '🔑', title: 'Lisans Sistemi', desc: 'Aktivasyon anahtarı ile güvenli kullanım' },
            { icon: '📡', title: 'Offline + Online', desc: 'İnternet olmadan da çalışır, bulut senkronizasyon' },
            { icon: '🔧', title: 'Kolay Kurulum', desc: 'Program Files\u0027e otomatik kurulum' },
          ].map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 20 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{f.icon}</div>
              <h3 style={{ color: 'white', fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{f.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: 13 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 40, background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, textAlign: 'left' as const }}>
          <h3 style={{ color: 'white', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>📋 Kurulum Adımları</h3>
          {[
            'OtoServis Setup dosyasını indirin',
            'Kurulum dosyasını çalıştırın',
            'Sunucu adresini girin: https://otoservis-api.onrender.com',
            'Lisans anahtarınızı girin',
            'Giriş yapın ve kullanmaya başlayın',
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
              <span style={{ color: '#cbd5e1', fontSize: 14 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center' as const, padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: 14 }}>
        © 2026 OtoServis. Tüm hakları saklıdır.
      </div>
    </div>
  );
}

// ============ LANDING PAGE ============
function LandingPage({ onGetStarted, onLogin }: { onGetStarted: () => void; onLogin: () => void }) {
  const [showDownload, setShowDownload] = useState(false);

  if (showDownload) {
    return <DownloadPage onBack={() => setShowDownload(false)} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>OtoServis</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button onClick={() => setShowDownload(true)} style={{ padding: '10px 20px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>📥 İndir</button>
          <button onClick={onLogin} style={{ padding: '10px 20px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Giriş Yap</button>
          <button onClick={onGetStarted} style={{ padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Ücretsiz Dene</button>
        </div>
      </nav>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 40px', textAlign: 'center' as const }}>
        <h1 style={{ fontSize: 56, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 24 }}>Servisinizi Buluta Taşıyın</h1>
        <p style={{ fontSize: 20, color: '#94a3b8', maxWidth: 600, margin: '0 auto 40px', lineHeight: 1.6 }}>Müşteri yönetimi, servis siparişleri, stok takibi ve ön muhasebe. Hepsi tek platformda.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 80 }}>
          <button onClick={onGetStarted} style={{ padding: '16px 32px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 18, fontWeight: 700, cursor: 'pointer' }}>Hemen Başla</button>
          <button onClick={onLogin} style={{ padding: '16px 32px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, fontSize: 18, fontWeight: 600, cursor: 'pointer' }}>Demo İzle</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 900, margin: '0 auto' }}>
          {[
            { icon: '👥', title: 'Müşteri Yönetimi', desc: 'Müşteri bilgileri, araç geçmişi, iletişim' },
            { icon: '🔧', title: 'Servis Siparişleri', desc: 'İş emirleri, parça takibi, işçilik' },
            { icon: '💰', title: 'Ön Muhasebe', desc: 'Faturalar, ödemeler, cari hesaplar' },
            { icon: '🚗', title: 'Araç Takibi', desc: 'Plaka bazlı tüm araç bilgileri' },
            { icon: '📊', title: 'Raporlama', desc: 'Gelir-gider, performans metrikleri' },
            { icon: '📱', title: 'Desktop & Web', desc: 'Her yerde erişim, offline destek' },
          ].map((f, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, textAlign: 'center' as const }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ color: 'white', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: 14 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <div style={{ textAlign: 'center' as const, padding: '40px 20px', borderTop: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: 14 }}>
        © 2026 OtoServis. Tüm hakları saklıdır.
      </div>
    </div>
  );
}

// ============ ADMIN PANEL ============
// ============ PROFESSIONAL ADMIN PANEL ============
const AdminStyles = {
  container: { display: 'flex', minHeight: '100vh', background: '#f8fafc' } as React.CSSProperties,
  sidebar: { width: 260, background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', color: 'white', position: 'fixed' as const, top: 0, bottom: 0, left: 0, display: 'flex', flexDirection: 'column' as const, zIndex: 100 } as React.CSSProperties,
  sidebarHeader: { padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' } as React.CSSProperties,
  sidebarLogo: { fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 4 } as React.CSSProperties,
  sidebarSub: { fontSize: 12, color: '#94a3b8' } as React.CSSProperties,
  sidebarNav: { flex: 1, padding: '16px 12px' } as React.CSSProperties,
  navItem: (active: boolean) => ({ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, background: active ? '#2563eb' : 'transparent', color: active ? 'white' : '#94a3b8', fontSize: 14, fontWeight: active ? 600 : 500, cursor: 'pointer', marginBottom: 4, transition: 'all 0.2s', border: 'none', width: '100%', textAlign: 'left' as const }),
  main: { flex: 1, marginLeft: 260, padding: '24px 32px' } as React.CSSProperties,
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 } as React.CSSProperties,
  pageTitle: { fontSize: 24, fontWeight: 700, color: '#0f172a', margin: 0 } as React.CSSProperties,
  statCard: (color: string) => ({ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}` } as React.CSSProperties),
  statLabel: { fontSize: 13, color: '#64748b', marginBottom: 4 } as React.CSSProperties,
  statValue: { fontSize: 28, fontWeight: 700, color: '#0f172a' } as React.CSSProperties,
  card: { background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 } as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 },
  th: { textAlign: 'left' as const, padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  td: { padding: '14px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155' } as React.CSSProperties,
  badge: (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
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
  btnPrimary: { padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnSuccess: { padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnDanger: { padding: '8px 16px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnSecondary: { padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  input: { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const } as React.CSSProperties,
  select: { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' } as React.CSSProperties,
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 } as React.CSSProperties,
  modal: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', borderRadius: 16, padding: 32, width: 600, maxWidth: '90vw', maxHeight: '85vh', overflowY: 'auto' as const, boxShadow: '0 25px 50px rgba(0,0,0,0.25)' } as React.CSSProperties,
};

function AdminPanel({ onBack }: { onBack: () => void }) {
  const [stats, setStats] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'customers' | 'vehicles' | 'orders' | 'users'>('overview');
  const [tenantData, setTenantData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [addError, setAddError] = useState('');
  const [adminView, setAdminView] = useState<'dashboard' | 'tenants' | 'licenses'>('dashboard');
  const [licenseKeys, setLicenseKeys] = useState<any[]>([]);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [showCreateKeys, setShowCreateKeys] = useState(false);
  const [keyForm, setKeyForm] = useState({ count: 5, planType: 'STANDARD', maxUsers: 3, duration: 365, note: '' });
  const [keysLoading, setKeysLoading] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getTenants()])
      .then(([s, t]) => { setStats(s); setTenants(t); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadTenantData = async (tenantId: string, dataType: string) => {
    setDataLoading(true);
    try {
      const data = await adminApi.getTenantData(tenantId, dataType);
      setTenantData(data);
    } catch { setTenantData([]); }
    setDataLoading(false);
  };

  const handleStatusChange = async (id: string, status: string) => {
    await adminApi.updateTenantStatus(id, status);
    setTenants(tenants.map(t => t.id === id ? { ...t, status } : t));
    if (selectedTenant?.id === id) setSelectedTenant({ ...selectedTenant, status });
  };

  const handleViewDetail = async (id: string) => {
    const detail = await adminApi.getTenantDetail(id);
    setSelectedTenant(detail);
    setActiveTab('overview');
    setTenantData([]);
  };

  const handleTabChange = (tab: 'overview' | 'customers' | 'vehicles' | 'orders' | 'users') => {
    setActiveTab(tab);
    if (tab !== 'overview' && selectedTenant) {
      const typeMap: Record<string, string> = { customers: 'customers', vehicles: 'vehicles', orders: 'service-orders', users: 'users' };
      loadTenantData(selectedTenant.id, typeMap[tab]);
    }
  };

  const handleDelete = async (dataType: string, id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    await adminApi.deleteTenantData(selectedTenant.id, dataType, id);
    const typeMap: Record<string, string> = { customers: 'customers', vehicles: 'vehicles', orders: 'service-orders', users: 'users' };
    const tabKey = Object.entries(typeMap).find(([, v]) => v === dataType)?.[0] as any;
    if (tabKey) loadTenantData(selectedTenant.id, dataType);
  };

  const handleUpdate = async (dataType: string, id: string, data: any) => {
    await adminApi.updateTenantData(selectedTenant.id, dataType, id, data);
    setEditItem(null);
    const typeMap: Record<string, string> = { customers: 'customers', vehicles: 'vehicles', orders: 'service-orders', users: 'users' };
    const tabKey = Object.entries(typeMap).find(([, v]) => v === dataType)?.[0] as any;
    if (tabKey) loadTenantData(selectedTenant.id, dataType);
  };

  const handleAddUser = async () => {
    setAddError('');
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      setAddError('Tüm alanları doldurun.'); return;
    }
    try {
      await adminApi.createTenantUser(selectedTenant.id, newUser);
      setShowAddUser(false);
      setNewUser({ email: '', password: '', firstName: '', lastName: '' });
      loadTenantData(selectedTenant.id, 'users');
    } catch (e: any) { setAddError(e.message); }
  };

  const loadLicenses = async () => {
    setKeysLoading(true);
    try {
      const [keys, lics] = await Promise.all([licenseApi.listKeys(), licenseApi.listLicenses()]);
      setLicenseKeys(keys);
      setLicenses(lics);
    } catch {}
    setKeysLoading(false);
  };

  const handleCreateKeys = async () => {
    try {
      await licenseApi.createKeys(keyForm.count, keyForm.planType, keyForm.maxUsers, keyForm.duration, keyForm.note || undefined);
      setShowCreateKeys(false);
      loadLicenses();
    } catch {}
  };

  if (loading) return <div style={{ ...AdminStyles.container, alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Yükleniyor...</div>;

  return (
    <div style={AdminStyles.container}>
      {/* Sidebar */}
      <div style={AdminStyles.sidebar}>
        <div style={AdminStyles.sidebarHeader}>
          <div style={AdminStyles.sidebarLogo}>OtoServis</div>
          <div style={AdminStyles.sidebarSub}>Süper Admin Paneli</div>
        </div>
        <div style={AdminStyles.sidebarNav}>
          <button style={AdminStyles.navItem(adminView === 'dashboard')} onClick={() => setAdminView('dashboard')}>
            <span>📊</span> Dashboard
          </button>
          <button style={AdminStyles.navItem(adminView === 'tenants')} onClick={() => setAdminView('tenants')}>
            <span>🏢</span> Servisler
          </button>
          <button style={AdminStyles.navItem(adminView === 'licenses')} onClick={() => { setAdminView('licenses'); loadLicenses(); }}>
            <span>🔑</span> Lisanslar
          </button>
        </div>
        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button style={AdminStyles.navItem(false)} onClick={onBack}>
            <span>←</span> Panele Dön
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={AdminStyles.main}>
        {/* Dashboard View */}
        {adminView === 'dashboard' && (
          <>
            <div style={AdminStyles.pageHeader}>
              <h1 style={AdminStyles.pageTitle}>Dashboard</h1>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={AdminStyles.statCard('#2563eb')}>
                <div style={AdminStyles.statLabel}>Toplam Servis</div>
                <div style={AdminStyles.statValue}>{stats?.tenantCount || 0}</div>
              </div>
              <div style={AdminStyles.statCard('#16a34a')}>
                <div style={AdminStyles.statLabel}>Aktif Servis</div>
                <div style={{ ...AdminStyles.statValue, color: '#16a34a' }}>{stats?.activeTenants || 0}</div>
              </div>
              <div style={AdminStyles.statCard('#8b5cf6')}>
                <div style={AdminStyles.statLabel}>Toplam Kullanıcı</div>
                <div style={AdminStyles.statValue}>{stats?.userCount || 0}</div>
              </div>
              <div style={AdminStyles.statCard('#f59e0b')}>
                <div style={AdminStyles.statLabel}>Toplam Müşteri</div>
                <div style={AdminStyles.statValue}>{stats?.customerCount || 0}</div>
              </div>
              <div style={AdminStyles.statCard('#ec4899')}>
                <div style={AdminStyles.statLabel}>Toplam Araç</div>
                <div style={AdminStyles.statValue}>{stats?.vehicleCount || 0}</div>
              </div>
              <div style={AdminStyles.statCard('#06b6d4')}>
                <div style={AdminStyles.statLabel}>Toplam Sipariş</div>
                <div style={AdminStyles.statValue}>{stats?.serviceOrderCount || 0}</div>
              </div>
            </div>
            <div style={AdminStyles.card}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 600, color: '#0f172a' }}>Son Kayıtlı Servisler</h3>
              <table style={AdminStyles.table}>
                <thead>
                  <tr>
                    <th style={AdminStyles.th}>Firma</th>
                    <th style={AdminStyles.th}>Slug</th>
                    <th style={AdminStyles.th}>Durum</th>
                    <th style={AdminStyles.th}>Kayıt Tarihi</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.slice(0, 5).map(t => (
                    <tr key={t.id}>
                      <td style={AdminStyles.td}><strong>{t.name}</strong></td>
                      <td style={AdminStyles.td}>{t.slug}</td>
                      <td style={AdminStyles.td}><span style={AdminStyles.badge(t.status)}>{t.status}</span></td>
                      <td style={AdminStyles.td}>{new Date(t.createdAt).toLocaleDateString('tr-TR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Tenants View */}
        {adminView === 'tenants' && (
          <>
            <div style={AdminStyles.pageHeader}>
              <h1 style={AdminStyles.pageTitle}>Servisler</h1>
            </div>
            <div style={AdminStyles.card}>
              <table style={AdminStyles.table}>
                <thead>
                  <tr>
                    <th style={AdminStyles.th}>Firma</th>
                    <th style={AdminStyles.th}>İletişim</th>
                    <th style={AdminStyles.th}>Slug</th>
                    <th style={AdminStyles.th}>Durum</th>
                    <th style={AdminStyles.th}>Kullanıcı</th>
                    <th style={AdminStyles.th}>Müşteri</th>
                    <th style={AdminStyles.th}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id}>
                      <td style={AdminStyles.td}><strong>{t.name}</strong></td>
                      <td style={AdminStyles.td}>
                        <div style={{ fontSize: 13 }}>
                          {t.phone && <div>📞 {t.phone}</div>}
                          {t.email && <div>✉️ {t.email}</div>}
                          {!t.phone && !t.email && <span style={{ color: '#94a3b8' }}>-</span>}
                        </div>
                      </td>
                      <td style={AdminStyles.td}><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>{t.slug}</code></td>
                      <td style={AdminStyles.td}>
                        <select value={t.status} onChange={e => handleStatusChange(t.id, e.target.value)} style={{ ...AdminStyles.select, padding: '6px 10px', fontSize: 12 }}>
                          <option value="ACTIVE">Aktif</option>
                          <option value="SUSPENDED">Askıya Al</option>
                          <option value="TRIAL">Deneme</option>
                        </select>
                      </td>
                      <td style={AdminStyles.td}>{t.stats.userCount}</td>
                      <td style={AdminStyles.td}>{t.stats.customerCount}</td>
                      <td style={AdminStyles.td}>{t.stats.vehicleCount}</td>
                      <td style={AdminStyles.td}>{t.stats.serviceOrderCount}</td>
                      <td style={AdminStyles.td}><button style={AdminStyles.btnPrimary} onClick={() => handleViewDetail(t.id)}>Yönet</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Licenses View */}
        {adminView === 'licenses' && (
          <>
            <div style={AdminStyles.pageHeader}>
              <h1 style={AdminStyles.pageTitle}>Lisans Yönetimi</h1>
              <button style={AdminStyles.btnSuccess} onClick={() => setShowCreateKeys(true)}>+ Yeni Anahtar Oluştur</button>
            </div>
            {showCreateKeys && (
              <div style={{ ...AdminStyles.card, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 16px', fontWeight: 600 }}>Yeni Lisans Anahtarı Oluştur</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                  <div><label style={AdminStyles.label}>Adet</label><input style={AdminStyles.input} type="number" value={keyForm.count} onChange={e => setKeyForm({ ...keyForm, count: parseInt(e.target.value) || 1 })} /></div>
                  <div><label style={AdminStyles.label}>Plan</label><select style={{ ...AdminStyles.select, width: '100%' }} value={keyForm.planType} onChange={e => setKeyForm({ ...keyForm, planType: e.target.value })}><option value="STANDARD">Standard</option><option value="PROFESSIONAL">Professional</option><option value="ENTERPRISE">Enterprise</option></select></div>
                  <div><label style={AdminStyles.label}>Max Kullanıcı</label><input style={AdminStyles.input} type="number" value={keyForm.maxUsers} onChange={e => setKeyForm({ ...keyForm, maxUsers: parseInt(e.target.value) || 1 })} /></div>
                  <div><label style={AdminStyles.label}>Süre (gün)</label><input style={AdminStyles.input} type="number" value={keyForm.duration} onChange={e => setKeyForm({ ...keyForm, duration: parseInt(e.target.value) || 365 })} /></div>
                </div>
                <div style={{ marginTop: 12 }}><label style={AdminStyles.label}>Not</label><input style={AdminStyles.input} placeholder="Opsiyonel not" value={keyForm.note} onChange={e => setKeyForm({ ...keyForm, note: e.target.value })} /></div>
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button style={AdminStyles.btnPrimary} onClick={handleCreateKeys}>Oluştur</button>
                  <button style={AdminStyles.btnSecondary} onClick={() => setShowCreateKeys(false)}>İptal</button>
                </div>
              </div>
            )}
            <div style={AdminStyles.card}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 600, color: '#0f172a' }}>Lisans Anahtarları</h3>
              {keysLoading ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Yükleniyor...</div> : (
                <table style={AdminStyles.table}>
                  <thead>
                    <tr>
                      <th style={AdminStyles.th}>Anahtar</th>
                      <th style={AdminStyles.th}>Plan</th>
                      <th style={AdminStyles.th}>Max User</th>
                      <th style={AdminStyles.th}>Süre</th>
                      <th style={AdminStyles.th}>Durum</th>
                      <th style={AdminStyles.th}>Firma</th>
                      <th style={AdminStyles.th}>Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {licenseKeys.map((k: any) => (
                      <tr key={k.id}>
                        <td style={{ ...AdminStyles.td, fontFamily: 'monospace', fontWeight: 700, letterSpacing: 1 }}>{k.key}</td>
                        <td style={AdminStyles.td}>{k.planType}</td>
                        <td style={AdminStyles.td}>{k.maxUsers}</td>
                        <td style={AdminStyles.td}>{k.duration} gün</td>
                        <td style={AdminStyles.td}><span style={AdminStyles.badge(k.status)}>{k.status}</span></td>
                        <td style={AdminStyles.td}>{k.tenant?.name || '-'}</td>
                        <td style={AdminStyles.td}>{new Date(k.createdAt).toLocaleDateString('tr-TR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={AdminStyles.card}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 600, color: '#0f172a' }}>Aktif Lisanslar</h3>
              <table style={AdminStyles.table}>
                <thead>
                  <tr>
                    <th style={AdminStyles.th}>Firma</th>
                    <th style={AdminStyles.th}>Plan</th>
                    <th style={AdminStyles.th}>Durum</th>
                    <th style={AdminStyles.th}>Max User</th>
                    <th style={AdminStyles.th}>Aktivasyon</th>
                    <th style={AdminStyles.th}>Bitiş</th>
                    <th style={AdminStyles.th}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((l: any) => (
                    <tr key={l.id}>
                      <td style={AdminStyles.td}><strong>{l.tenant?.name || '-'}</strong></td>
                      <td style={AdminStyles.td}>{l.planType}</td>
                      <td style={AdminStyles.td}><span style={AdminStyles.badge(l.status)}>{l.status}</span></td>
                      <td style={AdminStyles.td}>{l.maxUsers}</td>
                      <td style={AdminStyles.td}>{l.activatedAt ? new Date(l.activatedAt).toLocaleDateString('tr-TR') : '-'}</td>
                      <td style={AdminStyles.td}>{l.expiresAt ? new Date(l.expiresAt).toLocaleDateString('tr-TR') : 'Süresiz'}</td>
                      <td style={AdminStyles.td}>
                        <select value={l.status} onChange={async (e) => { await licenseApi.updateStatus(l.id, e.target.value); loadLicenses(); }} style={{ ...AdminStyles.select, padding: '6px 10px', fontSize: 12 }}>
                          <option value="ACTIVE">Aktif</option>
                          <option value="SUSPENDED">Askıya Al</option>
                          <option value="EXPIRED">Süresi Doldu</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <div style={AdminStyles.modal} onClick={() => setSelectedTenant(null)}>
          <div style={{ ...AdminStyles.modalContent, width: 900 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{selectedTenant.name}</h2>
              <button style={AdminStyles.btnSecondary} onClick={() => setSelectedTenant(null)}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
              <button style={{ ...AdminStyles.btnSecondary, background: activeTab === 'overview' ? '#2563eb' : 'transparent', color: activeTab === 'overview' ? 'white' : '#475569', border: 'none' }} onClick={() => handleTabChange('overview')}>Genel Bakış</button>
              <button style={{ ...AdminStyles.btnSecondary, background: activeTab === 'customers' ? '#2563eb' : 'transparent', color: activeTab === 'customers' ? 'white' : '#475569', border: 'none' }} onClick={() => handleTabChange('customers')}>Müşteriler</button>
              <button style={{ ...AdminStyles.btnSecondary, background: activeTab === 'vehicles' ? '#2563eb' : 'transparent', color: activeTab === 'vehicles' ? 'white' : '#475569', border: 'none' }} onClick={() => handleTabChange('vehicles')}>Araçlar</button>
              <button style={{ ...AdminStyles.btnSecondary, background: activeTab === 'orders' ? '#2563eb' : 'transparent', color: activeTab === 'orders' ? 'white' : '#475569', border: 'none' }} onClick={() => handleTabChange('orders')}>Siparişler</button>
              <button style={{ ...AdminStyles.btnSecondary, background: activeTab === 'users' ? '#2563eb' : 'transparent', color: activeTab === 'users' ? 'white' : '#475569', border: 'none' }} onClick={() => handleTabChange('users')}>Kullanıcılar</button>
            </div>

            {activeTab === 'overview' && (
              <div>
                {/* Contact Info Section */}
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                  <h4 style={{ margin: '0 0 12px', color: '#0369a1', fontSize: 14 }}>📞 İletişim Bilgileri</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Telefon</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedTenant.phone || <span style={{ color: '#94a3b8', fontWeight: 400 }}>Belirtilmemiş</span>}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>E-posta</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedTenant.email || <span style={{ color: '#94a3b8', fontWeight: 400 }}>Belirtilmemiş</span>}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Web Sitesi</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedTenant.website || <span style={{ color: '#94a3b8', fontWeight: 400 }}>Belirtilmemiş</span>}</div>
                    </div>
                    <div style={{ gridColumn: 'span 3' }}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Adres</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedTenant.address || <span style={{ color: '#94a3b8', fontWeight: 400 }}>Belirtilmemiş</span>}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Şehir</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedTenant.city || <span style={{ color: '#94a3b8', fontWeight: 400 }}>Belirtilmemiş</span>}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Vergi No</div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedTenant.taxNumber || <span style={{ color: '#94a3b8', fontWeight: 400 }}>Belirtilmemiş</span>}</div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8 }}><strong>Slug:</strong> {selectedTenant.slug}</div>
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                    <strong>Durum:</strong>{' '}
                    <select value={selectedTenant.status} onChange={e => handleStatusChange(selectedTenant.id, e.target.value)} style={{ ...AdminStyles.select, padding: '4px 8px', fontSize: 13 }}>
                      <option value="ACTIVE">Aktif</option>
                      <option value="SUSPENDED">Askıya Al</option>
                      <option value="TRIAL">Deneme</option>
                    </select>
                  </div>
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8 }}><strong>Kayıt:</strong> {new Date(selectedTenant.createdAt).toLocaleDateString('tr-TR')}</div>
                  <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8 }}><strong>ID:</strong> <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{selectedTenant.id}</span></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                  <div style={AdminStyles.statCard('#8b5cf6')}><div style={AdminStyles.statLabel}>Kullanıcı</div><div style={{ ...AdminStyles.statValue, fontSize: 24 }}>{selectedTenant.stats?.userCount || 0}</div></div>
                  <div style={AdminStyles.statCard('#f59e0b')}><div style={AdminStyles.statLabel}>Müşteri</div><div style={{ ...AdminStyles.statValue, fontSize: 24 }}>{selectedTenant.stats?.customerCount || 0}</div></div>
                  <div style={AdminStyles.statCard('#ec4899')}><div style={AdminStyles.statLabel}>Araç</div><div style={{ ...AdminStyles.statValue, fontSize: 24 }}>{selectedTenant.stats?.vehicleCount || 0}</div></div>
                  <div style={AdminStyles.statCard('#06b6d4')}><div style={AdminStyles.statLabel}>Sipariş</div><div style={{ ...AdminStyles.statValue, fontSize: 24 }}>{selectedTenant.stats?.serviceOrderCount || 0}</div></div>
                </div>
              </div>
            )}

            {activeTab === 'customers' && (
              <div>
                {dataLoading ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Yükleniyor...</div> : tenantData.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Müşteri bulunamadı.</div> : (
                  <table style={AdminStyles.table}>
                    <thead><tr><th style={AdminStyles.th}>Ad Soyad</th><th style={AdminStyles.th}>Telefon</th><th style={AdminStyles.th}>E-posta</th><th style={AdminStyles.th}>Plaka</th><th style={AdminStyles.th}>İşlem</th></tr></thead>
                    <tbody>
                      {tenantData.map((c: any) => (
                        <tr key={c.id}>
                          <td style={AdminStyles.td}>{c.firstName} {c.lastName}</td>
                          <td style={AdminStyles.td}>{c.phone || '-'}</td>
                          <td style={AdminStyles.td}>{c.email || '-'}</td>
                          <td style={AdminStyles.td}>{c.licensePlate || '-'}</td>
                          <td style={AdminStyles.td}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button style={AdminStyles.btnSecondary} onClick={() => setEditItem({ ...c, _type: 'customers' })}>Düzenle</button>
                              <button style={AdminStyles.btnDanger} onClick={() => handleDelete('customers', c.id)}>Sil</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'vehicles' && (
              <div>
                {dataLoading ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Yükleniyor...</div> : tenantData.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Araç bulunamadı.</div> : (
                  <table style={AdminStyles.table}>
                    <thead><tr><th style={AdminStyles.th}>Plaka</th><th style={AdminStyles.th}>Marka</th><th style={AdminStyles.th}>Model</th><th style={AdminStyles.th}>Yıl</th><th style={AdminStyles.th}>İşlem</th></tr></thead>
                    <tbody>
                      {tenantData.map((v: any) => (
                        <tr key={v.id}>
                          <td style={AdminStyles.td}><strong>{v.licensePlate}</strong></td>
                          <td style={AdminStyles.td}>{v.brand || '-'}</td>
                          <td style={AdminStyles.td}>{v.model || '-'}</td>
                          <td style={AdminStyles.td}>{v.year || '-'}</td>
                          <td style={AdminStyles.td}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button style={AdminStyles.btnSecondary} onClick={() => setEditItem({ ...v, _type: 'vehicles' })}>Düzenle</button>
                              <button style={AdminStyles.btnDanger} onClick={() => handleDelete('vehicles', v.id)}>Sil</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'orders' && (
              <div>
                {dataLoading ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Yükleniyor...</div> : tenantData.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Sipariş bulunamadı.</div> : (
                  <table style={AdminStyles.table}>
                    <thead><tr><th style={AdminStyles.th}>No</th><th style={AdminStyles.th}>Müşteri</th><th style={AdminStyles.th}>Araç</th><th style={AdminStyles.th}>Durum</th><th style={AdminStyles.th}>Tutar</th><th style={AdminStyles.th}>Tarih</th><th style={AdminStyles.th}>İşlem</th></tr></thead>
                    <tbody>
                      {tenantData.map((o: any) => (
                        <tr key={o.id}>
                          <td style={AdminStyles.td}><strong>#{o.orderNumber || o.id.slice(0, 6)}</strong></td>
                          <td style={AdminStyles.td}>{o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : '-'}</td>
                          <td style={AdminStyles.td}>{o.vehicle?.licensePlate || '-'}</td>
                          <td style={AdminStyles.td}><span style={AdminStyles.badge(o.status)}>{o.status}</span></td>
                          <td style={AdminStyles.td}>{o.totalAmount ? `${o.totalAmount} ₺` : '-'}</td>
                          <td style={AdminStyles.td}>{new Date(o.createdAt).toLocaleDateString('tr-TR')}</td>
                          <td style={AdminStyles.td}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button style={AdminStyles.btnSecondary} onClick={() => setEditItem({ ...o, _type: 'service-orders' })}>Düzenle</button>
                              <button style={AdminStyles.btnDanger} onClick={() => handleDelete('service-orders', o.id)}>Sil</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <button style={AdminStyles.btnSuccess} onClick={() => { setShowAddUser(true); setAddError(''); }}>+ Yeni Kullanıcı Ekle</button>
                </div>
                {showAddUser && (
                  <div style={{ background: '#f8fafc', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px' }}>Yeni Kullanıcı</h4>
                    {addError && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 12, fontSize: 13 }}>{addError}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <input style={AdminStyles.input} placeholder="Ad" value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} />
                      <input style={AdminStyles.input} placeholder="Soyad" value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} />
                      <input style={AdminStyles.input} placeholder="E-posta" type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                      <input style={AdminStyles.input} placeholder="Şifre" type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                      <button style={AdminStyles.btnPrimary} onClick={handleAddUser}>Ekle</button>
                      <button style={AdminStyles.btnSecondary} onClick={() => setShowAddUser(false)}>İptal</button>
                    </div>
                  </div>
                )}
                {dataLoading ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Yükleniyor...</div> : tenantData.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Kullanıcı bulunamadı.</div> : (
                  <table style={AdminStyles.table}>
                    <thead><tr><th style={AdminStyles.th}>Ad Soyad</th><th style={AdminStyles.th}>E-posta</th><th style={AdminStyles.th}>Durum</th><th style={AdminStyles.th}>Kayıt</th><th style={AdminStyles.th}>İşlem</th></tr></thead>
                    <tbody>
                      {tenantData.map((u: any) => (
                        <tr key={u.id}>
                          <td style={AdminStyles.td}>{u.firstName} {u.lastName}</td>
                          <td style={AdminStyles.td}>{u.email}</td>
                          <td style={AdminStyles.td}><span style={AdminStyles.badge(u.status)}>{u.status}</span></td>
                          <td style={AdminStyles.td}>{new Date(u.createdAt).toLocaleDateString('tr-TR')}</td>
                          <td style={AdminStyles.td}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button style={AdminStyles.btnSecondary} onClick={() => setEditItem({ ...u, _type: 'users' })}>Düzenle</button>
                              <button style={AdminStyles.btnDanger} onClick={() => handleDelete('users', u.id)}>Sil</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {editItem && (
              <EditRecordModal
                item={editItem}
                onSave={(data) => handleUpdate(editItem._type, editItem.id, data)}
                onClose={() => setEditItem(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ EDIT RECORD MODAL ============
function EditRecordModal({ item, onSave, onClose }: { item: any; onSave: (data: any) => void; onClose: () => void }) {
  const [form, setForm] = useState<any>({});
  const type = item._type;

  const fieldMap: Record<string, { label: string; key: string; type?: string }[]> = {
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={onClose}>
      <div style={{ ...S.modalContent, width: 450 }} onClick={e => e.stopPropagation()}>
        <div style={S.modalTitle}>Düzenle</div>
        {fields.map(f => (
          <div style={S.formGroup} key={f.key}>
            <label style={S.label}>{f.label}</label>
            {f.key === 'status' ? (
              <select style={S.select} value={form[f.key] ?? item[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })}>
                {type === 'users' ? (
                  <><option value="ACTIVE">Aktif</option><option value="INACTIVE">Pasif</option></>
                ) : (
                  <><option value="PENDING">Bekliyor</option><option value="IN_PROGRESS">Devam Ediyor</option><option value="COMPLETED">Tamamlandı</option><option value="CANCELLED">İptal</option></>
                )}
              </select>
            ) : f.key === 'notes' || f.key === 'address' ? (
              <textarea style={{ ...S.input, minHeight: 60, resize: 'vertical' as const }} value={form[f.key] ?? item[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
            ) : (
              <input style={S.input} type={f.type || 'text'} value={form[f.key] ?? item[f.key] ?? ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
            )}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button style={S.btnSecondary} onClick={onClose}>İptal</button>
          <button style={S.btnPrimary} onClick={() => onSave(form)}>Kaydet</button>
        </div>
      </div>
    </div>
  );
}

// ============ MAIN APP ============
export function App() {
  const { user, loading, login, register, logout } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showLanding, setShowLanding] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

  // Admin panel - URL'den erişim: #admin veya /admin
  const isAdminUrl = window.location.hash === '#admin' || window.location.pathname === '/admin';
  if (isAdminUrl && user) {
    return <AdminPanel onBack={() => { window.location.hash = ''; window.location.pathname = '/'; }} />;
  }

  // Admin panel - buton ile erişim
  if (showAdmin && user) {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

  if (loading) return <div style={{ ...S.loginWrap, color: 'white' }}>Yükleniyor...</div>;

  // Landing page
  if (showLanding && !user) {
    return (
      <LandingPage
        onGetStarted={() => { setIsLogin(false); setShowLanding(false); }}
        onLogin={() => { setIsLogin(true); setShowLanding(false); }}
      />
    );
  }

  if (!user) {
    return isLogin ? (
      <div>
        <LoginPage onLogin={login} onSwitch={() => setIsLogin(false)} />
        <div style={{ position: 'fixed', bottom: 20, right: 20 }}>
          <button onClick={() => setShowLanding(true)} style={{ ...S.btnSecondary, opacity: 0.7 }}>← Ana Sayfa</button>
        </div>
      </div>
    ) : (
      <div>
        <RegisterPage onRegister={register} onSwitch={() => setIsLogin(true)} />
        <div style={{ position: 'fixed', bottom: 20, right: 20 }}>
          <button onClick={() => setShowLanding(true)} style={{ ...S.btnSecondary, opacity: 0.7 }}>← Ana Sayfa</button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout user={user} onLogout={logout}>
        <Routes>
          <Route path="/" element={<DashboardPage tenantId={user.tenantId} />} />
          <Route path="/customers" element={<CustomersPage tenantId={user.tenantId} />} />
          <Route path="/vehicles" element={<VehiclesPage tenantId={user.tenantId} />} />
          <Route path="/service-orders" element={<ServiceOrdersPage tenantId={user.tenantId} />} />
          <Route path="/receivables" element={<ReceivablesPage tenantId={user.tenantId} />} />
          <Route path="/financial" element={<FinancialPage tenantId={user.tenantId} />} />
          <Route path="/settings" element={<SettingsPage user={user} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
