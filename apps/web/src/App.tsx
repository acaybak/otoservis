import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi, setToken, getToken, customerApi, vehicleApi, serviceOrderApi, accountingApi, reportingApi } from './services/api';

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

// ============ MAIN APP ============
export function App() {
  const { user, loading, login, register, logout } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  if (loading) return <div style={{ ...S.loginWrap, color: 'white' }}>Yükleniyor...</div>;

  if (!user) {
    return isLogin ? (
      <LoginPage onLogin={login} onSwitch={() => setIsLogin(false)} />
    ) : (
      <RegisterPage onRegister={register} onSwitch={() => setIsLogin(true)} />
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
