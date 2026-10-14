import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://otoservis-api-lsuv.onrender.com/api/v1';
const ADMIN_EMAILS = ['acaybak@gmail.com'];

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  trialEndsAt: string | null;
  createdAt: string;
}

interface License {
  id: string;
  tenantId: string;
  licenseKey: string;
  status: string;
  planType: string;
  maxUsers: number;
  activatedAt: string | null;
  expiresAt: string | null;
}

interface LicenseKey {
  id: string;
  licenseKey: string;
  planType: string;
  maxUsers: number;
  duration: number;
  isUsed: boolean;
  usedByTenantId: string | null;
  createdAt: string;
}

// API helper
const api = {
  getToken: () => localStorage.getItem('admin_token'),
  setToken: (token: string | null) => {
    if (token) localStorage.setItem('admin_token', token);
    else localStorage.removeItem('admin_token');
  },
  getUser: (): User | null => {
    const u = localStorage.getItem('admin_user');
    return u ? JSON.parse(u) : null;
  },
  setUser: (user: User | null) => {
    if (user) localStorage.setItem('admin_user', JSON.stringify(user));
    else localStorage.removeItem('admin_user');
  },
  headers: () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${api.getToken()}`,
  }),
};

// Login Screen
function LoginScreen({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Giriş başarısız');
      }

      const data = await res.json();
      
      if (!ADMIN_EMAILS.includes(email.toLowerCase())) {
        throw new Error('Bu kullanıcı admin yetkisine sahip değil');
      }

      api.setToken(data.accessToken);
      api.setUser(data.user);
      onLogin(data.user, data.accessToken);
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div style={{ background: 'white', padding: 40, borderRadius: 16, width: 400, maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>🔐 OtoServis Admin</h1>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 32, fontSize: 14 }}>Firma ve lisans yönetimi</p>
        
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{error}</div>}
        
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} required
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 15, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }} />
          <input type="password" placeholder="Şifre" value={password} onChange={e => setPassword(e.target.value)} required
            style={{ width: '100%', padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 15, marginBottom: 16, outline: 'none', boxSizing: 'border-box' }} />
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px 24px', background: loading ? '#94a3b8' : '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Dashboard
function Dashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tenants' | 'licenses' | 'keys'>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tenantsRes, licensesRes, keysRes] = await Promise.all([
        fetch(`${API_BASE}/admin/tenants`, { headers: api.headers() }),
        fetch(`${API_BASE}/licenses`, { headers: api.headers() }),
        fetch(`${API_BASE}/licenses/keys`, { headers: api.headers() }),
      ]);

      if (tenantsRes.ok) setTenants(await tenantsRes.json());
      if (licensesRes.ok) setLicenses(await licensesRes.json());
      if (keysRes.ok) setLicenseKeys(await keysRes.json());
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const createLicenseKey = async () => {
    const planType = prompt('Plan tipi (STANDARD/PROFESSIONAL/ENTERPRISE):', 'STANDARD');
    if (!planType) return;
    
    const maxUsers = parseInt(prompt('Maksimum kullanıcı sayısı:', '3') || '3');
    const duration = parseInt(prompt('Süre (gün):', '365') || '365');
    const note = prompt('Not (opsiyonel):', '') || undefined;

    try {
      const res = await fetch(`${API_BASE}/licenses/keys`, {
        method: 'POST',
        headers: api.headers(),
        body: JSON.stringify({ count: 1, planType, maxUsers, duration, note }),
      });

      if (res.ok) {
        alert('Lisans anahtarı oluşturuldu!');
        loadData();
      } else {
        alert('Lisans oluşturma hatası!');
      }
    } catch (err) {
      alert('Lisans oluşturma hatası!');
    }
  };

  const updateTenantStatus = async (tenantId: string, status: string) => {
    if (!confirm(`Firma durumunu ${status} olarak değiştirmek istediğinizden emin misiniz?`)) return;

    try {
      const res = await fetch(`${API_BASE}/admin/tenants/${tenantId}/status`, {
        method: 'PATCH',
        headers: api.headers(),
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        alert('Firma durumu güncellendi!');
        loadData();
      } else {
        alert('Güncelleme hatası!');
      }
    } catch (err) {
      alert('Güncelleme hatası!');
    }
  };

  const updateLicenseStatus = async (licenseId: string, status: string) => {
    if (!confirm(`Lisans durumunu ${status} olarak değiştirmek istediğinizden emin misiniz?`)) return;

    try {
      const res = await fetch(`${API_BASE}/licenses/${licenseId}/status`, {
        method: 'PATCH',
        headers: api.headers(),
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        alert('Lisans durumu güncellendi!');
        loadData();
      } else {
        alert('Güncelleme hatası!');
      }
    } catch (err) {
      alert('Güncelleme hatası!');
    }
  };

  const createLicenseForTenant = async (tenantId: string) => {
    const planType = prompt('Plan tipi (STANDARD/PROFESSIONAL/ENTERPRISE):', 'STANDARD');
    if (!planType) return;
    
    const maxUsers = parseInt(prompt('Maksimum kullanıcı sayısı:', '3') || '3');
    const duration = parseInt(prompt('Süre (gün):', '365') || '365');

    try {
      const res = await fetch(`${API_BASE}/licenses/create-for-tenant`, {
        method: 'POST',
        headers: api.headers(),
        body: JSON.stringify({ tenantId, planType, maxUsers, duration }),
      });

      if (res.ok) {
        alert('Firma için lisans oluşturuldu!');
        loadData();
      } else {
        const err = await res.json();
        alert(err.message || 'Lisans oluşturma hatası!');
      }
    } catch (err) {
      alert('Lisans oluşturma hatası!');
    }
  };

  const extendLicense = async (licenseId: string) => {
    const additionalDays = parseInt(prompt('Kaç gün uzatmak istiyorsunuz?', '30') || '30');
    if (!additionalDays || additionalDays <= 0) return;

    try {
      const res = await fetch(`${API_BASE}/licenses/${licenseId}/extend`, {
        method: 'PATCH',
        headers: api.headers(),
        body: JSON.stringify({ additionalDays }),
      });

      if (res.ok) {
        alert(`Lisans ${additionalDays} gün uzatıldı!`);
        loadData();
      } else {
        alert('Uzatma hatası!');
      }
    } catch (err) {
      alert('Uzatma hatası!');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: 18 }}>Yükleniyor...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f1f5f9' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: '#0f172a', color: 'white', padding: '20px 0' }}>
        <div style={{ padding: '0 20px 20px', fontSize: 20, fontWeight: 800, borderBottom: '1px solid #1e293b', marginBottom: 16 }}>
          🔐 Admin Panel
        </div>
        <div style={{ padding: '0 20px 16px', fontSize: 13, color: '#94a3b8' }}>
          {user.firstName} {user.lastName}
        </div>
        
        {[
          { id: 'dashboard', icon: '📊', label: 'Dashboard' },
          { id: 'tenants', icon: '🏢', label: 'Firmalar' },
          { id: 'licenses', icon: '🔑', label: 'Lisanslar' },
          { id: 'keys', icon: '🎫', label: 'Lisans Anahtarları' },
        ].map(item => (
          <div key={item.id} onClick={() => setActiveTab(item.id as any)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', background: activeTab === item.id ? '#1e293b' : 'transparent', borderLeft: activeTab === item.id ? '3px solid #2563eb' : '3px solid transparent', color: activeTab === item.id ? 'white' : '#94a3b8', fontSize: 14, fontWeight: activeTab === item.id ? 600 : 500 }}>
            <span>{item.icon}</span> {item.label}
          </div>
        ))}
        
        <div onClick={onLogout} style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', cursor: 'pointer', color: '#ef4444', fontSize: 14 }}>
          <span>🚪</span> Çıkış Yap
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: 32, overflowY: 'auto' }}>
        {activeTab === 'dashboard' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Dashboard</h1>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Toplam Firma</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{tenants.length}</div>
              </div>
              <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Aktif Lisanslar</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>{licenses.filter(l => l.status === 'ACTIVE').length}</div>
              </div>
              <div style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Kullanılmayan Anahtarlar</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>{licenseKeys.filter(k => !k.isUsed).length}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tenants' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Firmalar</h1>
            <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Firma Adı</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Slug</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Durum</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Deneme Bitişi</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => (
                    <tr key={t.id}>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>{t.name}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{t.slug}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: t.status === 'ACTIVE' ? '#f0fdf4' : '#fef2f2', color: t.status === 'ACTIVE' ? '#16a34a' : '#dc2626' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 13 }}>
                        {t.trialEndsAt ? new Date(t.trialEndsAt).toLocaleDateString('tr-TR') : '∞ Sınırsız'}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => updateTenantStatus(t.id, t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                            style={{ padding: '6px 12px', background: t.status === 'ACTIVE' ? '#fef2f2' : '#f0fdf4', color: t.status === 'ACTIVE' ? '#dc2626' : '#16a34a', border: '1px solid', borderColor: t.status === 'ACTIVE' ? '#fecaca' : '#bbf7d0', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            {t.status === 'ACTIVE' ? 'Askıya Al' : 'Aktif Et'}
                          </button>
                          <button onClick={() => createLicenseForTenant(t.id)}
                            style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            🔑 Lisans Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'licenses' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Lisanslar</h1>
            <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Lisans Anahtarı</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Plan</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Durum</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Bitiş</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map(l => (
                    <tr key={l.id}>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', fontSize: 13 }}>{l.licenseKey}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>{l.planType}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: l.status === 'ACTIVE' ? '#f0fdf4' : l.status === 'EXPIRED' ? '#fef2f2' : '#fefce8', color: l.status === 'ACTIVE' ? '#16a34a' : l.status === 'EXPIRED' ? '#dc2626' : '#ca8a04' }}>
                          {l.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: 13 }}>
                        {l.expiresAt ? new Date(l.expiresAt).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => updateLicenseStatus(l.id, l.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                            style={{ padding: '6px 12px', background: l.status === 'ACTIVE' ? '#fef2f2' : '#f0fdf4', color: l.status === 'ACTIVE' ? '#dc2626' : '#16a34a', border: '1px solid', borderColor: l.status === 'ACTIVE' ? '#fecaca' : '#bbf7d0', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            {l.status === 'ACTIVE' ? 'Askıya Al' : 'Aktif Et'}
                          </button>
                          <button onClick={() => extendLicense(l.id)}
                            style={{ padding: '6px 12px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                            ⏰ Uzat
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'keys' && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32 }}>Lisans Anahtarları</h1>
            <button onClick={createLicenseKey}
              style={{ padding: '12px 24px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 24 }}>
              + Yeni Lisans Anahtarı Oluştur
            </button>
            <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Anahtar</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Plan</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Kullanıcı</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Süre</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: 600, fontSize: 12 }}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {licenseKeys.map(k => (
                    <tr key={k.id}>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', fontSize: 13 }}>{k.licenseKey}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>{k.planType}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>{k.maxUsers}</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>{k.duration} gün</td>
                      <td style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: k.isUsed ? '#f1f5f9' : '#f0fdf4', color: k.isUsed ? '#64748b' : '#16a34a' }}>
                          {k.isUsed ? 'Kullanıldı' : 'Kullanılabilir'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [user, setUser] = useState<User | null>(api.getUser());
  const [token, setToken] = useState<string | null>(api.getToken());

  const handleLogin = (user: User, token: string) => {
    setUser(user);
    setToken(token);
  };

  const handleLogout = () => {
    api.setToken(null);
    api.setUser(null);
    setUser(null);
    setToken(null);
  };

  if (!user || !token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}
