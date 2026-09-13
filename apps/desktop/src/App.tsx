import React, { useState, useEffect, useCallback } from 'react';
import {
  HashRouter, Routes, Route, Link, useNavigate, Navigate, useParams, useLocation, useSearchParams,
} from 'react-router-dom';

// ============================================================================
// Electron bridge typing
// ============================================================================
interface OtoservisBridge {
  info: () => Promise<any>;
  getConfig: () => Promise<{ serverUrl: string | null; deviceKey: string | null }>;
  setConfig: (cfg: { serverUrl: string }) => Promise<{ success: boolean }>;
  login: (email: string, password: string) => Promise<{ user: User; offline: boolean }>;
  logout: () => Promise<{ success: boolean }>;
  currentUser: () => Promise<User | null>;
  list: (entity: string, opts?: { q?: string; page?: number; limit?: number }) => Promise<{ data: any[]; total: number }>;
  get: (entity: string, id: string) => Promise<any>;
  create: (entity: string, data: any) => Promise<any>;
  update: (entity: string, id: string, data: any) => Promise<any>;
  remove: (entity: string, id: string) => Promise<{ success: boolean }>;
  stats: () => Promise<DashboardStats>;
  syncStatus: () => Promise<SyncStatus>;
  syncNow: () => Promise<SyncStatus>;
  onSyncStatus: (cb: (s: SyncStatus) => void) => () => void;
  getZoomFactor: () => number;
  setZoomFactor: (factor: number) => void;
  // Service order sub-entities
  listParts: (serviceOrderId: string) => Promise<any[]>;
  addPart: (serviceOrderId: string, data: any) => Promise<any>;
  removePart: (partId: string) => Promise<{ success: boolean }>;
  listLabor: (serviceOrderId: string) => Promise<any[]>;
  addLabor: (serviceOrderId: string, data: any) => Promise<any>;
  removeLabor: (laborId: string) => Promise<{ success: boolean }>;
  listNotes: (serviceOrderId: string) => Promise<any[]>;
  addNote: (serviceOrderId: string, content: string) => Promise<any>;
  // Plate search
  searchPlate: (plate: string) => Promise<{ vehicles: any[]; serviceOrders: any[] }>;
  // Maintenance records
  maintList: () => Promise<any[]>;
  maintGet: (id: string) => Promise<any>;
  maintCreate: (data: any) => Promise<any>;
  maintUpdate: (id: string, data: any) => Promise<any>;
  maintDelete: (id: string) => Promise<{ success: boolean }>;
  maintListItems: (recordId: string) => Promise<any[]>;
  maintAddItem: (recordId: string, data: any) => Promise<any>;
  maintRemoveItem: (itemId: string) => Promise<{ success: boolean }>;
  maintSchedule: (vehicleId: string) => Promise<any[]>;
  maintUpdateInterval: (vehicleId: string, maintenanceTypeId: string, data: { intervalKm?: number | null; intervalDays?: number | null; lastKm?: number | null; lastPerformedAt?: string | null }) => Promise<any>;
  maintLogInterval: (vehicleId: string, maintenanceTypeId: string, km: number, performedAt: string) => Promise<any>;
  // Vehicle full history by plate
  vehicleHistory: (plate: string) => Promise<any>;
  // Dashboard widgets
  todayAppointments: () => Promise<any[]>;
  activeOrders: () => Promise<any[]>;
  recentMaintenance: () => Promise<any[]>;
  revenue: () => Promise<{ today: number; week: number; month: number }>;
  // Service orders with vehicle info
  allOrdersWithVehicle: () => Promise<any[]>;
  print: (htmlContent: string) => Promise<{ success: boolean }>;
}

interface User { id: string; email: string; firstName: string; lastName: string; tenantId: string; }
interface SyncStatus { online: boolean; syncing: boolean; lastSyncAt: string | null; lastError: string | null; pending: number; }
interface DashboardStats {
  totalCustomers: number; totalVehicles: number; activeOrders: number; completedOrders: number;
  pendingAppointments: number; lowStockProducts: number; pendingSync: number;
}

declare global {
  interface Window { otoservis?: OtoservisBridge; }
}

const bridge = typeof window !== 'undefined' ? window.otoservis : undefined;

// ============================================================================
// Shared styles
// ============================================================================
const S = {
  input: { width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' } as React.CSSProperties,
  label: { display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: 500 } as React.CSSProperties,
  btnPrimary: { padding: '0.6rem 1.2rem', background: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
  btnSecondary: { padding: '0.5rem 1rem', background: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' } as React.CSSProperties,
  btnDanger: { padding: '0.4rem 0.8rem', background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' } as React.CSSProperties,
  card: { background: 'white', padding: '1.25rem', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } as React.CSSProperties,
  th: { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.85rem' } as React.CSSProperties,
  td: { padding: '0.75rem 1rem', fontSize: '0.9rem', borderTop: '1px solid #e2e8f0' } as React.CSSProperties,
};

// ============================================================================
// Auth Context
// ============================================================================
const AuthContext = React.createContext<{ user: User | null; setUser: (u: User | null) => void }>({
  user: null, setUser: () => {},
});

// ============================================================================
// Sync status bar
// ============================================================================
function SyncBar() {
  const [status, setStatus] = useState<SyncStatus>({ online: false, syncing: false, lastSyncAt: null, lastError: null, pending: 0 });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!bridge) return;
    bridge.syncStatus().then(setStatus).catch(() => {});
    const unsub = bridge.onSyncStatus(setStatus);
    return unsub;
  }, []);

  const doSync = async () => {
    if (!bridge) return;
    setBusy(true);
    try { setStatus(await bridge.syncNow()); } catch { /* offline */ }
    setBusy(false);
  };

  const last = status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem' }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
        padding: '0.3rem 0.7rem', borderRadius: '999px',
        background: status.online ? '#dcfce7' : '#fee2e2',
        color: status.online ? '#166534' : '#991b1b', fontWeight: 600,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: status.online ? '#16a34a' : '#dc2626' }} />
        {status.online ? 'Çevrimiçi' : 'Çevrimdışı'}
      </span>
      {(status.pending > 0 || !status.online) && (
        <span style={{ color: '#b45309', fontWeight: 600 }}>
          {status.pending} bekleyen değişiklik
        </span>
      )}
      {status.online && status.pending === 0 && last && (
        <span style={{ color: '#64748b' }}>Son senkron: {last}</span>
      )}
      {status.lastError && status.pending > 0 && (
        <span style={{ color: '#dc2626', fontSize: '0.78rem' }} title={status.lastError}>⚠ {status.lastError.slice(0, 40)}</span>
      )}
      <button onClick={doSync} disabled={busy || status.syncing}
        style={{ ...S.btnSecondary, padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}>
        {status.syncing || busy ? 'Senkronize ediliyor...' : '↻ Senkronize Et'}
      </button>
    </div>
  );
}

// ============================================================================
// Zoom controls (work on every keyboard layout, incl. Turkish and numpad)
// ============================================================================
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2;

function clampZoom(f: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(f * 10) / 10));
}

function currentZoomFactor(): number {
  const f = typeof bridge?.getZoomFactor === 'function' ? bridge.getZoomFactor() : undefined;
  return typeof f === 'number' && f > 0 ? f : 1;
}

function applyZoom(target: number): number {
  const f = clampZoom(target);
  try { bridge?.setZoomFactor?.(f); } catch { /* not in Electron */ }
  return f;
}

function ZoomControls() {
  const [factor, setFactor] = useState(1);

  // Keep in sync with the real frame zoom (menu shortcuts change it outside React)
  useEffect(() => {
    const read = () => {
      const f = clampZoom(currentZoomFactor());
      setFactor((prev) => (Math.abs(prev - f) > 0.001 ? f : prev));
    };
    read();
    const timer = setInterval(read, 1500);
    return () => clearInterval(timer);
  }, []);

  // Persist the preferred zoom level across restarts
  useEffect(() => {
    try { localStorage.setItem('otoservis:zoomFactor', String(factor)); } catch { /* ignore */ }
  }, [factor]);

  const change = (delta: number) => setFactor(applyZoom(currentZoomFactor() + delta));

  const btn = { ...S.btnSecondary, padding: '0.3rem 0.65rem', fontSize: '0.95rem', fontWeight: 700, lineHeight: 1 } as React.CSSProperties;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
      <button onClick={() => change(-0.1)} disabled={factor <= ZOOM_MIN} title="Küçült (Ctrl -)" style={btn}>−</button>
      <button onClick={() => setFactor(applyZoom(1))} title="Normal boyut (Ctrl 0)"
        style={{ ...S.btnSecondary, padding: '0.3rem 0.5rem', fontSize: '0.8rem', lineHeight: 1, minWidth: '3.4rem' }}>
        %{Math.round(factor * 100)}
      </button>
      <button onClick={() => change(0.1)} disabled={factor >= ZOOM_MAX} title="Büyüt (Ctrl +)" style={btn}>+</button>
    </div>
  );
}

// ============================================================================
// Setup screen (first run: server address)
// ============================================================================
function SetupScreen({ onDone }: { onDone: () => void }) {
  const [serverUrl, setServerUrl] = useState('http://localhost:3002');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!bridge) return;
    setSaving(true);
    await bridge.setConfig({ serverUrl: serverUrl.trim().replace(/\/+$/, '') });
    setSaving(false);
    onDone();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '440px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>OtoServisApp</h1>
        <h2 style={{ fontSize: '1.05rem', color: '#4b5563', textAlign: 'center', marginBottom: '1.5rem' }}>Sunucu Kurulumu</h2>
        <p style={{ fontSize: '0.88rem', color: '#6b7280', marginBottom: '1rem' }}>
          Uygulamayı ilk kez kullanıyorsanız sunucu adresini girin. Bu adres, verilerinizin bulutta tutulduğu merkezi sunucudur.
        </p>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={S.label}>Sunucu Adresi</label>
          <input style={S.input} value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="https://api.otoservisapp.com" />
        </div>
        <button onClick={handleSave} disabled={saving || !serverUrl.trim()} style={{ ...S.btnPrimary, width: '100%' }}>
          {saving ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Login page
// ============================================================================
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = React.useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bridge) return;
    setLoading(true);
    setError('');
    try {
      const res = await bridge.login(email, password);
      setUser(res.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '400px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem', textAlign: 'center' }}>OtoServisApp</h1>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center', marginBottom: '1.5rem' }}>
          Çevrimdışı çalışan servis yönetim sistemi
        </p>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>E-posta</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={S.input} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={S.label}>Şifre</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={S.input} />
          </div>
          <button type="submit" disabled={loading} style={{ ...S.btnPrimary, width: '100%' }}>
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        <p style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '1rem', textAlign: 'center' }}>
          İnternet yoksa son giriş bilgilerinizle çevrimdışı giriş yapabilirsiniz.
        </p>
        <div style={{ marginTop: '1rem', textAlign: 'center', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>Hesabınız yok mu?</p>
          <button
            onClick={() => navigate('/register')}
            style={{ ...S.btnSecondary, width: '100%', background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
          >
            Tamir Firması Kaydı Oluştur
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Registration Page - Desktop
// ============================================================================
function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    tenantName: '',
    tenantSlug: '',
    phone: '',
    address: '',
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
  });

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleTenantNameChange = (value: string) => {
    const autoSlug = generateSlug(value);
    setFormData({ ...formData, tenantName: value, tenantSlug: autoSlug });
  };

  const handleSlugChange = (value: string) => {
    setFormData({ ...formData, tenantSlug: value });
  };

  const handleSubmit = async () => {
    setError('');
    if (!formData.tenantName.trim()) { setError('Firma adı zorunludur.'); return; }
    if (!formData.tenantSlug.trim()) { setError('URL adı zorunludur.'); return; }
    if (!formData.adminEmail.trim()) { setError('E-posta zorunludur.'); return; }
    if (!formData.adminPassword) { setError('Şifre zorunludur.'); return; }
    if (formData.adminPassword.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return; }
    if (!/[A-Z]/.test(formData.adminPassword)) { setError('Şifre en az bir büyük harf içermelidir.'); return; }
    if (!/[a-z]/.test(formData.adminPassword)) { setError('Şifre en az bir küçük harf içermelidir.'); return; }
    if (!/[0-9]/.test(formData.adminPassword)) { setError('Şifre en az bir rakam içermelidir.'); return; }
    if (formData.adminPassword !== formData.adminPasswordConfirm) { setError('Şifreler eşleşmiyor.'); return; }
    if (!formData.adminFirstName.trim()) { setError('Ad zorunludur.'); return; }
    if (!formData.adminLastName.trim()) { setError('Soyad zorunludur.'); return; }

    setLoading(true);
    try {
      const serverUrl = (await bridge?.getConfig())?.serverUrl || 'http://localhost:3002/api/v1';
      const res = await fetch(`${serverUrl.replace('/api/v1', '')}/api/v1/tenants/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantName: formData.tenantName,
          tenantSlug: formData.tenantSlug,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          adminFirstName: formData.adminFirstName,
          adminLastName: formData.adminLastName,
          adminPhone: formData.phone || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.message || (errData.errors ? errData.errors.join(', ') : 'Kayıt işlemi başarısız oldu.');
        throw new Error(errorMsg);
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div style={{ background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '450px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>Kayıt Başarılı!</h2>
          <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            <strong>{formData.tenantName}</strong> firması başarıyla oluşturuldu.<br />
            Şimdi giriş yapabilirsiniz.
          </p>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '0.25rem' }}>Portal Adresiniz:</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d' }}>
              otoservisapp.com/{formData.tenantSlug}
            </div>
          </div>
          <button onClick={() => navigate('/login')} style={{ ...S.btnPrimary, width: '100%' }}>
            Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '500px', maxHeight: '90vh', overflow: 'auto' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem', textAlign: 'center' }}>OtoServisApp</h1>
        <p style={{ fontSize: '0.85rem', color: '#6b7280', textAlign: 'center', marginBottom: '1.5rem' }}>
          Tamir Firması Kaydı
        </p>

        {/* Progress Steps */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          {[{ n: 1, label: 'Firma' }, { n: 2, label: 'Yönetici' }, { n: 3, label: 'Onay' }].map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step >= s.n ? '#2563eb' : '#e2e8f0',
                color: step >= s.n ? 'white' : '#64748b',
                fontWeight: 700, fontSize: '0.8rem',
              }}>{s.n}</div>
              <span style={{ fontSize: '0.8rem', fontWeight: step === s.n ? 600 : 400, color: step >= s.n ? '#1e293b' : '#94a3b8' }}>{s.label}</span>
              {i < 2 && <div style={{ width: '30px', height: '2px', background: step > s.n ? '#2563eb' : '#e2e8f0' }} />}
            </div>
          ))}
        </div>

        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.7rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

        {/* Step 1: Firma Bilgileri */}
        {step === 1 && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>Firma Adı *</label>
              <input style={S.input} value={formData.tenantName} onChange={(e) => handleTenantNameChange(e.target.value)} placeholder="örn. OtoFix Servis" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>Servis URL Adı *</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>otoservisapp.com/</span>
                <input style={{ ...S.input, fontWeight: 600 }} value={formData.tenantSlug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="oto-fix" />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>Telefon</label>
              <input style={S.input} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="0555 123 45 67" />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={S.label}>Adres</label>
              <textarea style={{ ...S.input, minHeight: '60px', resize: 'vertical' }} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Servis adresi..." />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => navigate('/login')} style={{ ...S.btnSecondary, flex: 1 }}>← Geri</button>
              <button onClick={() => {
                if (!formData.tenantName.trim()) { setError('Firma adı zorunludur.'); return; }
                if (!formData.tenantSlug.trim()) { setError('URL adı zorunludur.'); return; }
                setError(''); setStep(2);
              }} style={{ ...S.btnPrimary, flex: 2 }}>Devam →</button>
            </div>
          </div>
        )}

        {/* Step 2: Yönetici Bilgileri */}
        {step === 2 && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div><label style={S.label}>Ad *</label><input style={S.input} value={formData.adminFirstName} onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })} placeholder="Ahmet" /></div>
              <div><label style={S.label}>Soyad *</label><input style={S.input} value={formData.adminLastName} onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })} placeholder="Yılmaz" /></div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>E-posta *</label>
              <input style={S.input} type="email" value={formData.adminEmail} onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })} placeholder="ahmet@otofix.com" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={S.label}>Şifre *</label>
              <input style={S.input} type="password" value={formData.adminPassword} onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })} placeholder="••••••••" />
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>En az 8 karakter, büyük-küçük harf ve rakam</div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={S.label}>Şifre Tekrar *</label>
              <input style={S.input} type="password" value={formData.adminPasswordConfirm} onChange={(e) => setFormData({ ...formData, adminPasswordConfirm: e.target.value })} placeholder="••••••••" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { setError(''); setStep(1); }} style={{ ...S.btnSecondary, flex: 1 }}>← Geri</button>
              <button onClick={() => {
                if (!formData.adminFirstName.trim()) { setError('Ad zorunludur.'); return; }
                if (!formData.adminLastName.trim()) { setError('Soyad zorunludur.'); return; }
                if (!formData.adminEmail.trim()) { setError('E-posta zorunludur.'); return; }
                if (!formData.adminPassword) { setError('Şifre zorunludur.'); return; }
                if (formData.adminPassword.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return; }
                if (formData.adminPassword !== formData.adminPasswordConfirm) { setError('Şifreler eşleşmiyor.'); return; }
                setError(''); setStep(3);
              }} style={{ ...S.btnPrimary, flex: 2 }}>Devam →</button>
            </div>
          </div>
        )}

        {/* Step 3: Onay */}
        {step === 3 && (
          <div>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Firma Bilgileri</div>
              <div style={{ fontSize: '0.9rem' }}>
                <div><span style={{ color: '#64748b' }}>Firma:</span> <strong>{formData.tenantName}</strong></div>
                <div><span style={{ color: '#64748b' }}>URL:</span> <strong>otoservisapp.com/{formData.tenantSlug}</strong></div>
              </div>
            </div>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>Yönetici Hesabı</div>
              <div style={{ fontSize: '0.9rem' }}>
                <div><span style={{ color: '#64748b' }}>Ad Soyad:</span> <strong>{formData.adminFirstName} {formData.adminLastName}</strong></div>
                <div><span style={{ color: '#64748b' }}>E-posta:</span> <strong>{formData.adminEmail}</strong></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => { setError(''); setStep(2); }} style={{ ...S.btnSecondary, flex: 1 }}>← Geri</button>
              <button onClick={handleSubmit} disabled={loading} style={{ ...S.btnPrimary, flex: 2, background: '#16a34a' }}>
                {loading ? 'Oluşturuluyor...' : '✓ Kaydı Tamamla'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Plate quick-search (sidebar)
// ============================================================================
function PlateSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ vehicles: any[]; serviceOrders: any[] } | null>(null);
  const [open, setOpen] = useState(false);

  const doSearch = async (val: string) => {
    if (!bridge || !val.trim()) { setResults(null); return; }
    const res = await bridge.searchPlate(val.trim());
    setResults(res);
    setOpen(true);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) doSearch(query);
    if (e.key === 'Escape') { setOpen(false); setResults(null); }
  };

  const goVehicle = (id: string) => { setOpen(false); setResults(null); setQuery(''); navigate('/vehicles'); };
  const goOrder = (id: string) => { setOpen(false); setResults(null); setQuery(''); navigate(`/service-orders/${id}`); };

  return (
    <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
      <input
        style={{ ...S.input, background: '#334155', border: '1px solid #475569', color: '#e2e8f0', fontSize: '0.85rem', padding: '0.45rem 0.6rem' }}
        placeholder="🔍 Plaka ile ara..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); doSearch(e.target.value); }}
        onKeyDown={handleKey}
        onFocus={() => { if (results) setOpen(true); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
      />
      {open && results && (results.vehicles.length > 0 || results.serviceOrders.length > 0) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'white', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          maxHeight: '320px', overflow: 'auto', marginTop: '4px',
        }}>
          {results.vehicles.length > 0 && (
            <div>
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>ARAÇLAR</div>
              {results.vehicles.map((v: any) => (
                <div key={v.id} onClick={() => goVehicle(v.id)}
                  style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}>
                  <strong style={{ color: '#1e293b' }}>{v.plate}</strong>
                  <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>{v.brand} {v.model}</span>
                  {v.customerName && <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{v.customerName}</div>}
                </div>
              ))}
            </div>
          )}
          {results.serviceOrders.length > 0 && (
            <div>
              <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>İŞ EMİRLERİ</div>
              {results.serviceOrders.map((so: any) => (
                <div key={so.id} onClick={() => goOrder(so.id)}
                  style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}>
                  <strong style={{ color: '#2563eb' }}>{so.orderNumber}</strong>
                  <span style={{ color: '#64748b', marginLeft: '0.5rem' }}>{so.vehiclePlate}</span>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    {so.customerName} · <span style={{ color: so.status === 'DELIVERED' ? '#16a34a' : '#ea580c' }}>{so.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {open && results && results.vehicles.length === 0 && results.serviceOrders.length === 0 && query.trim() && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: 'white', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px',
        }}>
          "{query}" ile eşleşen araç bulunamadı.
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Layout
// ============================================================================
function Layout({ children, title }: { children: React.ReactNode; title: string }) {
  const { user, setUser } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const navGroups = [
    {
      label: 'Ana Sayfa',
      items: [
        { path: '/', label: 'Gösterge Paneli', icon: '📊' },
      ],
    },
    {
      label: 'Servis',
      items: [
        { path: '/service-orders', label: 'Servis Kayıtları', icon: '🔧' },
        { path: '/appointments', label: 'Randevular', icon: '📅' },
      ],
    },
    {
      label: 'Müşteriler & Araçlar',
      items: [
        { path: '/customers', label: 'Müşteriler', icon: '👥' },
        { path: '/vehicles', label: 'Araçlar', icon: '🚘' },
      ],
    },
    {
      label: 'Finans',
      items: [
        { path: '/estimates', label: 'Teklifler', icon: '📝' },
        { path: '/invoices', label: 'Faturalar', icon: '🧾' },
        { path: '/receivables', label: 'Cari Hesaplar', icon: '💳' },
        { path: '/financial-dashboard', label: 'Ön Muhasebe', icon: '💰' },
      ],
    },
    {
      label: 'Depo & Stok',
      items: [
        { path: '/inventory', label: 'Stok Yönetimi', icon: '📦' },
        { path: '/suppliers', label: 'Tedarikçiler', icon: '🏭' },
      ],
    },
    {
      label: 'Sistem',
      items: [
        { path: '/settings', label: 'Ayarlar', icon: '⚙️' },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '240px', background: '#0f172a', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #1e293b' }}>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>
            <span style={{ color: '#3b82f6' }}>Oto</span>Servis<span style={{ color: '#3b82f6', fontSize: '0.9rem' }}>App</span>
          </h1>
        </div>

        {/* Plate Search */}
        <div style={{ padding: '0.75rem 0.75rem 0' }}>
          <PlateSearch />
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflow: 'auto', padding: '0.5rem 0' }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: '0.5rem' }}>
              <div style={{ padding: '0.5rem 1rem 0.25rem', fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {group.label}
              </div>
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      padding: '0.55rem 1rem', margin: '1px 0.5rem',
                      borderRadius: '6px', textDecoration: 'none', fontSize: '0.88rem',
                      color: active ? '#ffffff' : '#94a3b8',
                      background: active ? '#1e40af' : 'transparent',
                      fontWeight: active ? 600 : 400,
                      borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#e2e8f0'; } }}
                    onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}>
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User section */}
        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #1e293b', background: '#0f172a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>{user?.firstName} {user?.lastName}</div>
            </div>
          </div>
          <button onClick={() => { if (bridge) bridge.logout(); setUser(null); navigate('/login'); }}
            style={{ width: '100%', padding: '0.45rem', background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>
            Çıkış Yap
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, background: '#f1f5f9', overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <header style={{ padding: '0.75rem 1.5rem', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ZoomControls />
            <SyncBar />
          </div>
        </header>
        <div style={{ padding: '1.25rem 1.5rem', flex: 1 }}>{children}</div>
      </main>
    </div>
  );
}

// ============================================================================
// Dashboard
// ============================================================================
// Status badge helper
const STATUS_BADGES: Record<string, { bg: string; color: string; label: string }> = {
  WAITING: { bg: '#fef3c7', color: '#92400e', label: 'Bekliyor' },
  IN_PROGRESS: { bg: '#dbeafe', color: '#1e40af', label: 'Devam Ediyor' },
  WAITING_PARTS: { bg: '#fce7f3', color: '#9d174d', label: 'Parça Bekleniyor' },
  READY: { bg: '#d1fae5', color: '#065f46', label: 'Hazır' },
  DELIVERED: { bg: '#dcfce7', color: '#166534', label: 'Teslim Edildi' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'İptal' },
};

function StatusBadge({ status }: { status: string }) {
  const badge = STATUS_BADGES[status] || { bg: '#f1f5f9', color: '#475569', label: status };
  return (
    <span style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, background: badge.bg, color: badge.color }}>
      {badge.label}
    </span>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{icon}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#64748b' }}>{title}</div>
      {subtitle && <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{subtitle}</div>}
    </div>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [recentMaint, setRecentMaint] = useState<any[]>([]);
  const [revenue, setRevenue] = useState({ today: 0, week: 0, month: 0 });
  const [plateSearch, setPlateSearch] = useState('');

  useEffect(() => {
    if (!bridge) return;
    bridge.stats().then(setStats).catch(() => {});
    bridge.todayAppointments().then(setAppointments).catch(() => {});
    bridge.activeOrders().then(setActiveOrders).catch(() => {});
    bridge.recentMaintenance().then(setRecentMaint).catch(() => {});
    bridge.revenue().then(setRevenue).catch(() => {});
    const t = setInterval(() => {
      bridge.stats().then(setStats).catch(() => {});
      bridge.activeOrders().then(setActiveOrders).catch(() => {});
    }, 30000); // 30 seconds instead of 10
    return () => clearInterval(t);
  }, []);

  const handlePlateSearch = () => {
    if (plateSearch.trim()) {
      navigate(`/service-orders/new?plate=${encodeURIComponent(plateSearch.trim())}`);
    }
  };

  if (!stats) return <Layout title="Dashboard">Yükleniyor...</Layout>;

  return (
    <Layout title="Dashboard">
      {/* Quick plate search */}
      <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.25rem', color: 'white', boxShadow: '0 4px 12px rgba(37,99,235,0.25)' }}>
        <div style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.75rem', opacity: 0.9 }}>Hızlı Araç Sorgulama</div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', fontSize: '1.1rem', fontWeight: 600, letterSpacing: '1px', background: 'rgba(255,255,255,0.95)', color: '#1e293b' }}
            placeholder="PLAKA YAZIN (örn: 34 ABC 123)"
            value={plateSearch}
            onChange={(e) => setPlateSearch(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handlePlateSearch()}
          />
          <button onClick={handlePlateSearch} style={{ padding: '0.75rem 1.5rem', background: 'white', color: '#1e40af', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
            🔍 Sorgula
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Müşteriler', value: stats.totalCustomers, icon: '👥', color: '#2563eb' },
          { label: 'Araçlar', value: stats.totalVehicles, icon: '🚗', color: '#7c3aed' },
          { label: 'Aktif İşler', value: stats.activeOrders, icon: '🔧', color: '#ea580c' },
          { label: 'Teslim', value: stats.completedOrders, icon: '✅', color: '#16a34a' },
          { label: 'Randevular', value: stats.pendingAppointments, icon: '📅', color: '#0891b2' },
        ].map((item) => (
          <div key={item.label} style={{ background: 'white', borderRadius: '10px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Bugün', value: revenue.today, color: '#16a34a' },
          { label: 'Bu Hafta', value: revenue.week, color: '#2563eb' },
          { label: 'Bu Ay', value: revenue.month, color: '#7c3aed' },
        ].map((r) => (
          <div key={r.label} style={{ background: 'white', borderRadius: '10px', padding: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.25rem' }}>{r.label} Gelir</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: r.color }}>₺{r.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
          </div>
        ))}
      </div>

      {/* Two columns: Today's appointments + Active orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* Today's appointments */}
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>📅 Bugünün Randevuları</h3>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date().toLocaleDateString('tr-TR')}</span>
          </div>
          <div style={{ maxHeight: '280px', overflow: 'auto' }}>
            {appointments.length === 0 ? (
              <EmptyState icon="📅" title="Bugün randevu yok" />
            ) : (
              appointments.map((apt) => (
                <div key={apt.id} style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ background: '#eff6ff', borderRadius: '6px', padding: '0.3rem 0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#1e40af', minWidth: '50px', textAlign: 'center' }}>
                    {apt.time ? apt.time.slice(0, 5) : '--:--'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>{apt.vehiclePlate || apt.plate || '-'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{apt.service || '-'}</div>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{apt.phone || ''}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active service orders */}
        <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>🔧 Aktif İş Emirleri</h3>
            <Link to="/service-orders" style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Tümü →</Link>
          </div>
          <div style={{ maxHeight: '280px', overflow: 'auto' }}>
            {activeOrders.length === 0 ? (
              <EmptyState icon="🔧" title="Aktif iş emri yok" />
            ) : (
              activeOrders.slice(0, 8).map((order) => (
                <div key={order.id} onClick={() => navigate(`/service-orders/${order.id}`)}
                  style={{ padding: '0.6rem 1rem', borderBottom: '1px solid #f8fafc', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>{order.vehiclePlate || '-'}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{order.customerName || '-'}</div>
                  </div>
                  <StatusBadge status={order.status} />
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b', minWidth: '70px', textAlign: 'right' }}>
                    ₺{Number(order.totalAmount || 0).toFixed(0)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent maintenance */}
      <div style={{ background: 'white', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>🛠️ Son Bakım İşlemleri</h3>
          <Link to="/maintenance" style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Tümü →</Link>
        </div>
        {recentMaint.length === 0 ? (
          <EmptyState icon="🛠️" title="Henüz bakım kaydı yok" subtitle="Bakım kayıtları buradan görüntülenebilir." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {recentMaint.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '0.6rem 1rem', fontSize: '0.88rem', fontWeight: 600, color: '#1e293b' }}>{rec.vehiclePlate || '-'}</td>
                  <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.88rem', color: '#64748b' }}>{rec.maintenanceTypeName || '-'}</td>
                  <td style={{ padding: '0.6rem 0.5rem', fontSize: '0.85rem', color: '#64748b' }}>{rec.performedAt ? new Date(rec.performedAt).toLocaleDateString('tr-TR') : '-'}</td>
                  <td style={{ padding: '0.6rem 1rem', fontSize: '0.88rem', fontWeight: 600, color: '#1e293b', textAlign: 'right' }}>₺{Number(rec.totalAmount || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {stats.pendingSync > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', padding: '0.75rem 1rem', borderRadius: '8px', marginTop: '1rem', fontSize: '0.85rem' }}>
          ⏳ {stats.pendingSync} değişiklik internet gelince otomatik gönderilecek.
        </div>
      )}
    </Layout>
  );
}

// ============================================================================
// Service Orders Kanban Page
// ============================================================================
const KANBAN_COLUMNS = [
  { status: 'WAITING', label: 'Bekliyor', color: '#f59e0b', icon: '⏳' },
  { status: 'IN_PROGRESS', label: 'Devam Ediyor', color: '#3b82f6', icon: '🔧' },
  { status: 'WAITING_PARTS', label: 'Parça Bekleniyor', color: '#ec4899', icon: '📦' },
  { status: 'READY', label: 'Hazır', color: '#10b981', icon: '✅' },
  { status: 'DELIVERED', label: 'Teslim Edildi', color: '#6b7280', icon: '🎉' },
];

function ServiceOrdersKanbanPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  const load = useCallback(async () => {
    if (!bridge) return;
    setLoading(true);
    try {
      const res = await bridge.allOrdersWithVehicle();
      setOrders(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!bridge) return;
    await bridge.update('service_orders', orderId, { status: newStatus });
    load();
  };

  const getColumnOrders = (status: string) => orders.filter((o) => o.status === status);

  if (loading) return <Layout title="Servis Kayıtları">Yükleniyor...</Layout>;

  return (
    <Layout title="Servis Kayıtları">
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setViewMode('kanban')}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #d1d5db', background: viewMode === 'kanban' ? '#2563eb' : 'white', color: viewMode === 'kanban' ? 'white' : '#374151', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
            📋 Kanban
          </button>
          <button onClick={() => setViewMode('list')}
            style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', border: '1px solid #d1d5db', background: viewMode === 'list' ? '#2563eb' : 'white', color: viewMode === 'list' ? 'white' : '#374151', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}>
            📄 Liste
          </button>
        </div>
        <button onClick={() => navigate('/service-orders/new')} style={{ ...S.btnPrimary, padding: '0.5rem 1rem', fontSize: '0.88rem' }}>
          + Yeni Servis Kaydı
        </button>
      </div>

      {viewMode === 'kanban' ? (
        <div style={{ display: 'flex', gap: '0.75rem', overflow: 'auto', paddingBottom: '1rem', minHeight: 'calc(100vh - 200px)' }}>
          {KANBAN_COLUMNS.map((col) => {
            const colOrders = getColumnOrders(col.status);
            return (
              <div key={col.status} style={{ flex: '1 1 0', minWidth: '220px', maxWidth: '300px', background: '#f8fafc', borderRadius: '10px', display: 'flex', flexDirection: 'column' }}>
                {/* Column header */}
                <div style={{ padding: '0.75rem', borderBottom: `3px solid ${col.color}`, borderRadius: '10px 10px 0 0', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>{col.icon} {col.label}</span>
                    <span style={{ background: col.color, color: 'white', borderRadius: '999px', padding: '0.15rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                      {colOrders.length}
                    </span>
                  </div>
                </div>
                {/* Cards */}
                <div style={{ flex: 1, padding: '0.5rem', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {colOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: '#94a3b8', fontSize: '0.82rem' }}>Boş</div>
                  ) : (
                    colOrders.map((order) => (
                      <div key={order.id}
                        onClick={() => navigate(`/service-orders/${order.id}`)}
                        style={{ background: 'white', borderRadius: '8px', padding: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer', borderLeft: `3px solid ${col.color}` }}
                        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)')}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b', letterSpacing: '0.5px' }}>{order.vehiclePlate || '—'}</span>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>{order.orderNumber}</span>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.3rem' }}>{order.customerName || '-'}</div>
                        {order.diagnosis && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.diagnosis}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>₺{Number(order.totalAmount || 0).toFixed(0)}</span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR') : ''}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={S.th}>İşlem No</th>
                <th style={S.th}>Plaka</th>
                <th style={S.th}>Müşteri</th>
                <th style={S.th}>Durum</th>
                <th style={{ ...S.th, textAlign: 'right' }}>Tutar</th>
                <th style={S.th}>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                  onClick={() => navigate(`/service-orders/${order.id}`)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}>
                  <td style={S.td}><strong>{order.orderNumber}</strong></td>
                  <td style={S.td}><strong style={{ letterSpacing: '0.5px' }}>{order.vehiclePlate || '—'}</strong></td>
                  <td style={S.td}>{order.customerName || '-'}</td>
                  <td style={S.td}><StatusBadge status={order.status} /></td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: 600 }}>₺{Number(order.totalAmount || 0).toFixed(2)}</td>
                  <td style={S.td}>{order.createdAt ? new Date(order.createdAt).toLocaleDateString('tr-TR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}

// ============================================================================
// Generic entity page (list + create/edit/delete forms)
// ============================================================================
interface FieldDef {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'time' | 'select' | 'textarea';
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  uppercase?: boolean;
}

const ENTITY_DEFS: Record<string, { title: string; entity: string; fields: FieldDef[] }> = {
  customers: {
    title: 'Müşteriler', entity: 'customers',
    fields: [
      { key: 'firstName', label: 'Ad', required: true },
      { key: 'lastName', label: 'Soyad', required: true },
      { key: 'phone', label: 'Telefon' },
      { key: 'email', label: 'E-posta' },
      { key: 'tcNo', label: 'TC Kimlik No' },
      { key: 'notes', label: 'Notlar', type: 'textarea' },
    ],
  },
  vehicles: {
    title: 'Araçlar', entity: 'vehicles',
    fields: [
      { key: 'customerId', label: 'Müşteri', type: 'select', options: [] },
      { key: 'plate', label: 'Plaka', required: true, uppercase: true },
      { key: 'brand', label: 'Marka' },
      { key: 'model', label: 'Model' },
      { key: 'year', label: 'Yıl', type: 'number' },
      { key: 'km', label: 'KM', type: 'number' },
      { key: 'fuelType', label: 'Yakıt', type: 'select', options: [
        { value: 'GASOLINE', label: 'Benzin' }, { value: 'DIESEL', label: 'Dizel' },
        { value: 'LPG', label: 'LPG' }, { value: 'ELECTRIC', label: 'Elektrik' }, { value: 'HYBRID', label: 'Hibrit' },
      ] },
      { key: 'color', label: 'Renk' },
      { key: 'vin', label: 'Şasi No' },
    ],
  },
  appointments: {
    title: 'Randevular', entity: 'appointments',
    fields: [
      { key: 'plate', label: 'Plaka', uppercase: true },
      { key: 'phone', label: 'Telefon' },
      { key: 'service', label: 'Servis (örn. Yağ Değişimi)' },
      { key: 'date', label: 'Tarih', type: 'date', required: true },
      { key: 'time', label: 'Saat', type: 'time', required: true },
      { key: 'duration', label: 'Süre (dk)', type: 'number', defaultValue: 60 },
      { key: 'notes', label: 'Notlar', type: 'textarea' },
    ],
  },
  products: {
    title: 'Stok', entity: 'products',
    fields: [
      { key: 'name', label: 'Ürün Adı', required: true },
      { key: 'code', label: 'Kod' },
      { key: 'brand', label: 'Marka' },
      { key: 'purchasePrice', label: 'Alış Fiyatı (₺)', type: 'number', defaultValue: 0 },
      { key: 'salePrice', label: 'Satış Fiyatı (₺)', type: 'number', defaultValue: 0 },
      { key: 'stock', label: 'Stok', type: 'number', defaultValue: 0 },
      { key: 'minStock', label: 'Min. Stok', type: 'number', defaultValue: 0 },
    ],
  },
  service_orders: {
    title: 'İş Emirleri', entity: 'service_orders',
    fields: [
      { key: 'customerId', label: 'Müşteri', type: 'select', required: true, options: [] },
      { key: 'vehicleId', label: 'Araç', type: 'select', required: true, options: [] },
      { key: 'km', label: 'KM', type: 'number' },
      { key: 'customerComplaint', label: 'Müşteri Şikayeti', type: 'textarea' },
      { key: 'status', label: 'Durum', type: 'select', defaultValue: 'VEHICLE_ARRIVED', options: [
        { value: 'APPOINTMENT', label: 'Randevu' }, { value: 'VEHICLE_ARRIVED', label: 'Araç Geldi' },
        { value: 'INSPECTION', label: 'Kontrol' }, { value: 'PREPARING_QUOTE', label: 'Teklif Hazırlanıyor' },
        { value: 'AWAITING_APPROVAL', label: 'Onay Bekliyor' }, { value: 'APPROVED', label: 'Onaylandı' },
        { value: 'IN_PROGRESS', label: 'Çalışılıyor' }, { value: 'READY', label: 'Hazır' },
        { value: 'DELIVERED', label: 'Teslim Edildi' }, { value: 'CANCELLED', label: 'İptal' },
      ] },
    ],
  },
};

function EntityPage({ defKey }: { defKey: string }) {
  const def = ENTITY_DEFS[defKey];
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; row?: any } | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!bridge) return;
    setLoading(true);
    try {
      const res = await bridge.list(def.entity, { q, page, limit: 20 });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [def.entity, q, page]);

  useEffect(() => { load(); }, [load]);

  // For service orders & vehicles: load customer options (and vehicle options for service orders)
  useEffect(() => {
    if (!bridge) return;
    if (def.entity === 'service_orders' || def.entity === 'vehicles') {
      bridge.list('customers', { limit: 100 }).then((r) => setCustomers(r.data)).catch(() => {});
    }
    if (def.entity === 'service_orders') {
      bridge.list('vehicles', { limit: 100 }).then((r) => setVehicles(r.data)).catch(() => {});
    }
  }, [def.entity, modal]);

  const handleDelete = async (id: string) => {
    if (!bridge) return;
    if (!window.confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;
    await bridge.remove(def.entity, id);
    load();
  };

  const columns = getColumnsFor(defKey);

  return (
    <Layout title={def.title}>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <input
          style={{ ...S.input, maxWidth: '320px' }}
          placeholder="Ara..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
        />
        <button onClick={() => setModal({ mode: 'create' })} style={S.btnPrimary}>+ Yeni</button>
      </div>

      <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f1f5f9' }}>
            {columns.map((col) => <th key={col.key} style={S.th}>{col.label}</th>)}
            <th style={{ ...S.th, width: '140px' }}>İşlemler</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + 1} style={{ ...S.td, textAlign: 'center', padding: '2rem' }}>Yükleniyor...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={columns.length + 1} style={{ ...S.td, textAlign: 'center', color: '#64748b', padding: '2rem' }}>Kayıt bulunamadı.</td></tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} style={{ background: row.dirty ? '#fffbeb' : 'transparent' }}>
                  {columns.map((col) => (
                    <td key={col.key} style={S.td}>{col.render ? col.render(row) : (row[col.key] ?? '-')}</td>
                  ))}
                  <td style={S.td}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={() => setModal({ mode: 'edit', row })} style={{ ...S.btnSecondary, padding: '0.35rem 0.7rem', fontSize: '0.8rem' }}>Düzenle</button>
                      <button onClick={() => handleDelete(row.id)} style={S.btnDanger}>Sil</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Toplam: {total} kayıt {data.some((r) => r.dirty) && <span style={{ color: '#b45309' }}>· sarı satırlar henüz senkronize edilmedi</span>}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={S.btnSecondary}>Önceki</button>
          <span style={{ fontSize: '0.9rem' }}>Sayfa {page}</span>
          <button disabled={data.length < 20} onClick={() => setPage(page + 1)} style={S.btnSecondary}>Sonraki</button>
        </div>
      </div>

      {modal && (
        <EntityFormModal
          defKey={defKey}
          mode={modal.mode}
          row={modal.row}
          customers={customers}
          vehicles={vehicles}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </Layout>
  );
}

function getColumnsFor(defKey: string): { key: string; label: string; render?: (row: any) => React.ReactNode }[] {
  switch (defKey) {
    case 'customers':
      return [
        { key: 'firstName', label: 'Ad' }, { key: 'lastName', label: 'Soyad' },
        { key: 'phone', label: 'Telefon' }, { key: 'email', label: 'E-posta' },
      ];
    case 'vehicles':
      return [
        { key: 'plate', label: 'Plaka', render: (r) => <Link to={`/vehicles/${r.id}`} style={{ fontWeight: 700, color: '#2563eb' }}>{r.plate}</Link> },
        { key: 'customerName', label: 'Müşteri' },
        { key: 'brand', label: 'Marka' }, { key: 'model', label: 'Model' },
        { key: 'year', label: 'Yıl' }, { key: 'km', label: 'KM' },
      ];
    case 'appointments':
      return [
        { key: 'date', label: 'Tarih', render: (r) => r.date ? new Date(r.date).toLocaleDateString('tr-TR') : '-' },
        { key: 'time', label: 'Saat' },
        { key: 'plate', label: 'Plaka' }, { key: 'phone', label: 'Telefon' },
        { key: 'service', label: 'Servis' },
        { key: 'status', label: 'Durum', render: (r) => <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#dbeafe', fontSize: '0.8rem' }}>{r.status}</span> },
      ];
    case 'products':
      return [
        { key: 'name', label: 'Ürün' }, { key: 'code', label: 'Kod' }, { key: 'brand', label: 'Marka' },
        { key: 'stock', label: 'Stok', render: (r) => <span style={{ color: Number(r.stock) <= Number(r.minStock || 0) ? '#dc2626' : '#16a34a', fontWeight: 600 }}>{String(r.stock)}</span> },
        { key: 'salePrice', label: 'Satış Fiyatı', render: (r) => `₺${Number(r.salePrice || 0).toFixed(2)}` },
      ];
    case 'service_orders':
      return [
        { key: 'orderNumber', label: 'No', render: (r) => <strong>{r.orderNumber}</strong> },
        { key: 'customerName', label: 'Müşteri' },
        { key: 'vehiclePlate', label: 'Araç', render: (r) => `${r.vehiclePlate || '-'} ${r.vehicleBrand || ''} ${r.vehicleModel || ''}` },
        { key: 'status', label: 'Durum', render: (r) => <span style={{ padding: '2px 8px', borderRadius: '4px', background: '#e0e7ff', color: '#3730a3', fontSize: '0.8rem' }}>{r.status}</span> },
        { key: 'totalAmount', label: 'Tutar', render: (r) => <strong>₺{Number(r.totalAmount || 0).toFixed(2)}</strong> },
        { key: '_detail', label: '', render: (r) => <a href={`#/service-orders/${r.id}`} style={{ color: '#2563eb', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>Detay →</a> },
      ];
    default:
      return [];
  }
}

// ============================================================================
// Entity form modal
// ============================================================================
function EntityFormModal({
  defKey, mode, row, customers, vehicles, onClose, onSaved,
}: {
  defKey: string; mode: 'create' | 'edit'; row?: any;
  customers: any[]; vehicles: any[];
  onClose: () => void; onSaved: () => void;
}) {
  const def = ENTITY_DEFS[defKey];
  const [values, setValues] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    for (const f of def.fields) {
      initial[f.key] = mode === 'edit' && row ? (row[f.key] ?? '') : (f.defaultValue ?? '');
    }
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (key: string, value: any) => setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bridge) return;
    setSaving(true);
    setError('');
    try {
      // Build payload: numbers as numbers, empty strings as undefined
      const payload: Record<string, any> = {};
      for (const f of def.fields) {
        const raw = values[f.key];
        if (raw === '' || raw === undefined) continue;
        payload[f.key] = f.type === 'number' ? Number(raw) : raw;
      }
      if (mode === 'create') {
        await bridge.create(def.entity, payload);
      } else {
        await bridge.update(def.entity, row.id, payload);
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', width: '520px', maxHeight: '85vh', overflow: 'auto' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '1.25rem' }}>
          {mode === 'create' ? `Yeni ${def.title.slice(0, -1)}` : `${def.title.slice(0, -1)} Düzenle`}
        </h3>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.7rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.9rem' }}>
            {def.fields.map((f) => {
              const options = f.key === 'customerId'
                ? customers.map((c) => ({ value: c.id, label: `${c.firstName} ${c.lastName}` }))
                : f.key === 'vehicleId'
                  // When a customer is selected, show their vehicles first (orphans always visible)
                  ? vehicles
                      .filter((v) => !values.customerId || !v.customerId || v.customerId === values.customerId)
                      .map((v) => ({ value: v.id, label: `${v.plate} (${v.brand || ''} ${v.model || ''})`.trim() }))
                  : (f.options || []);
              return (
                <div key={f.key} style={{ gridColumn: f.type === 'textarea' ? '1 / -1' : 'span 1' }}>
                  <label style={S.label}>{f.label}{f.required && ' *'}</label>
                  {f.type === 'select' ? (
                    <select style={S.input} value={values[f.key]} onChange={(e) => setField(f.key, e.target.value)} required={f.required}>
                      <option value="">Seçin...</option>
                      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea style={{ ...S.input, minHeight: '70px' }} value={values[f.key]} onChange={(e) => setField(f.key, e.target.value)} />
                  ) : (
                    <input
                      style={S.input}
                      type={f.type || 'text'}
                      value={values[f.key]}
                      onChange={(e) => setField(f.key, f.uppercase ? e.target.value.toUpperCase() : e.target.value)}
                      required={f.required}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} style={S.btnSecondary}>İptal</button>
            <button type="submit" disabled={saving} style={S.btnPrimary}>
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// New Service Order Page (complete workflow)
// ============================================================================
function NewServiceOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [plateInput, setPlateInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundVehicle, setFoundVehicle] = useState<any>(null);
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [vehicleServices, setVehicleServices] = useState<any[]>([]);
  const [vehicleSchedule, setVehicleSchedule] = useState<any[]>([]);
  const [editingInfo, setEditingInfo] = useState(false);
  const [editVehicleForm, setEditVehicleForm] = useState({ brand: '', model: '', year: '', km: '', color: '' });
  const [editCustomerForm, setEditCustomerForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  // For new customer/vehicle creation
  const [customerForm, setCustomerForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });
  const [vehicleForm, setVehicleForm] = useState({ plate: '', brand: '', model: '', year: '', km: '', color: '' });
  const [complaint, setComplaint] = useState('');
  const [diagnosis, setDiagnosis] = useState('');

  // Auto-search from URL params
  useEffect(() => {
    const plateFromUrl = searchParams.get('plate');
    if (plateFromUrl && bridge) {
      setPlateInput(plateFromUrl);
      // Trigger search after setting plate
      setTimeout(() => {
        handlePlateSearchWithPlate(plateFromUrl);
      }, 100);
    }
  }, [searchParams]);

  const handlePlateSearchWithPlate = async (plate: string) => {
    const cleanPlate = plate.replace(/\s+/g, '').toUpperCase();
    if (!cleanPlate) return;
    setSearching(true);
    setError('');
    try {
      const res = await bridge!.list('vehicles', { q: cleanPlate, page: 1, limit: 1 });
      if (res.data.length > 0) {
        const v = res.data[0];
        setFoundVehicle(v);
        setVehicleForm({ plate: v.plate, brand: v.brand || '', model: v.model || '', year: v.year || '', km: v.km || '', color: v.color || '' });
        const custRes = await bridge!.get('customers', v.customerId);
        setFoundCustomer(custRes);
        const ordersRes = await bridge!.list('service_orders', { q: '', page: 1, limit: 10 });
        const vehicleOrders = (ordersRes.data || []).filter((o: any) => o.vehicleId === v.id);
        setVehicleServices(vehicleOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        const sched = await bridge!.maintSchedule(v.id);
        setVehicleSchedule(sched || []);
        setStep(2);
      } else {
        setVehicleForm({ ...vehicleForm, plate: cleanPlate });
        setStep(3);
      }
    } catch (err: any) {
      setError(err.message || 'Arama hatası');
    } finally {
      setSearching(false);
    }
  };

  // Step 1: Search plate
  const handlePlateSearch = async () => {
    const plate = plateInput.replace(/\s+/g, '').toUpperCase();
    if (!plate) { setError('Plaka giriniz'); return; }
    setSearching(true);
    setError('');
    try {
      const res = await bridge!.list('vehicles', { q: plate, page: 1, limit: 1 });
      if (res.data.length > 0) {
        const v = res.data[0];
        setFoundVehicle(v);
        setVehicleForm({ plate: v.plate, brand: v.brand || '', model: v.model || '', year: v.year || '', km: v.km || '', color: v.color || '' });
        // Load customer
        const custRes = await bridge!.get('customers', v.customerId);
        setFoundCustomer(custRes);
        // Load service history
        const ordersRes = await bridge!.list('service_orders', { q: '', page: 1, limit: 10 });
        const vehicleOrders = (ordersRes.data || []).filter((o: any) => o.vehicleId === v.id);
        setVehicleServices(vehicleOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        // Load maintenance schedule
        const sched = await bridge!.maintSchedule(v.id);
        setVehicleSchedule(sched || []);
        // Go to summary view
        setStep(2);
      } else {
        // Plate not found - go to creation form
        setVehicleForm({ ...vehicleForm, plate: plate });
        setStep(3); // Show creation form
      }
    } catch (err: any) {
      setError(err.message || 'Arama hatası');
    } finally {
      setSearching(false);
    }
  };

  const handleStartEdit = () => {
    setEditVehicleForm({
      brand: foundVehicle?.brand || '',
      model: foundVehicle?.model || '',
      year: foundVehicle?.year || '',
      km: foundVehicle?.km || '',
      color: foundVehicle?.color || '',
    });
    setEditCustomerForm({
      firstName: foundCustomer?.firstName || '',
      lastName: foundCustomer?.lastName || '',
      phone: foundCustomer?.phone || '',
      email: foundCustomer?.email || '',
    });
    setEditingInfo(true);
  };

  const handleSaveEdit = async () => {
    if (!bridge || !foundVehicle || !foundCustomer) return;
    setSaving(true);
    setError('');
    try {
      // Update vehicle
      await bridge.update('vehicles', foundVehicle.id, {
        brand: editVehicleForm.brand || null,
        model: editVehicleForm.model || null,
        year: editVehicleForm.year ? Number(editVehicleForm.year) : null,
        km: editVehicleForm.km ? Number(editVehicleForm.km) : null,
        color: editVehicleForm.color || null,
      });
      // Update customer
      await bridge.update('customers', foundCustomer.id, {
        firstName: editCustomerForm.firstName,
        lastName: editCustomerForm.lastName,
        phone: editCustomerForm.phone,
        email: editCustomerForm.email || null,
      });
      // Refresh data
      const v = await bridge.get('vehicles', foundVehicle.id);
      setFoundVehicle(v);
      const c = await bridge.get('customers', foundCustomer.id);
      setFoundCustomer(c);
      setEditingInfo(false);
    } catch (err: any) {
      setError(err.message || 'Kaydetme hatası');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!customerForm.firstName || !customerForm.phone) {
      setError('Ad ve telefon zorunludur');
      return;
    }
    const res = await bridge!.create('customers', {
      firstName: customerForm.firstName,
      lastName: customerForm.lastName,
      phone: customerForm.phone,
      email: customerForm.email,
    });
    setFoundCustomer(res);
    setError('');
  };

  const handleSubmit = async () => {
    if (!vehicleForm.plate) { setError('Plaka zorunludur'); return; }
    setSaving(true);
    setError('');
    try {
      let vehicleId = foundVehicle?.id;
      let customerId = foundCustomer?.id;

      // Create customer if needed
      if (!customerId) {
        if (!customerForm.firstName || !customerForm.phone) {
          setError('Müşteri bilgileri zorunludur');
          setSaving(false);
          return;
        }
        const custRes = await bridge!.create('customers', {
          firstName: customerForm.firstName,
          lastName: customerForm.lastName,
          phone: customerForm.phone,
          email: customerForm.email,
        });
        customerId = custRes.id;
      }

      // Create vehicle if needed
      if (!vehicleId) {
        const vRes = await bridge!.create('vehicles', {
          customerId,
          plate: vehicleForm.plate.replace(/\s+/g, '').toUpperCase(),
          brand: vehicleForm.brand || null,
          model: vehicleForm.model || null,
          year: vehicleForm.year ? Number(vehicleForm.year) : null,
          km: vehicleForm.km ? Number(vehicleForm.km) : null,
          color: vehicleForm.color || null,
        });
        vehicleId = vRes.id;
      }

      // Create service order
      const orderRes = await bridge!.create('service_orders', {
        customerId,
        vehicleId,
        km: vehicleForm.km ? Number(vehicleForm.km) : null,
        customerComplaint: complaint,
        diagnosis: diagnosis,
        status: 'RECEIVED',
      });
      navigate(`/service-orders/${orderRes.id}`);
    } catch (err: any) {
      setError(err.message || 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Yeni Servis Kaydı">
      <button onClick={() => navigate('/service-orders')} style={{ ...S.btnSecondary, marginBottom: '1rem' }}>← Geri</button>

      {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.7rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

      {/* Step 1: Plate Search */}
      {step === 1 && (
        <div style={{ ...S.card, textAlign: 'center', maxWidth: '500px', margin: '2rem auto' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>Plaka ile Başla</h3>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Kayıtlı araçsa direkt işleme geç, değilse yeni kayıt oluştur
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              style={{ ...S.input, fontSize: '1.3rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', flex: 1, textAlign: 'center' }}
              value={plateInput}
              onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handlePlateSearch()}
              placeholder="34 ABC 123"
              autoFocus
            />
            <button onClick={handlePlateSearch} disabled={searching} style={{ ...S.btnPrimary, padding: '0.5rem 1.5rem', fontSize: '1rem' }}>
              {searching ? '...' : 'Ara'}
            </button>
          </div>
          <div style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#94a3b8' }}>
            Enter tuşu ile hızlıca arayabilirsiniz
          </div>
        </div>
      )}

      {/* Step 2: Vehicle Summary (for existing vehicles) */}
      {step === 2 && foundVehicle && (
        <div>
          {/* Vehicle & Customer Info */}
          <div style={{ ...S.card, marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Araç & Müşteri Bilgileri</h3>
              {!editingInfo ? (
                <button onClick={handleStartEdit} style={{ ...S.btnSecondary, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                  ✏️ Düzenle
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => setEditingInfo(false)} style={{ ...S.btnSecondary, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>İptal</button>
                  <button onClick={handleSaveEdit} disabled={saving} style={{ ...S.btnPrimary, padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                    {saving ? 'Kaydediliyor...' : '✓ Kaydet'}
                  </button>
                </div>
              )}
            </div>

            {!editingInfo ? (
              /* Display Mode */
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Plaka</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '2px', color: '#1e293b' }}>{foundVehicle.plate}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Araç</div>
                  <div style={{ fontWeight: 600 }}>{foundVehicle.brand} {foundVehicle.model}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{foundVehicle.year || '-'} • {foundVehicle.km ? Number(foundVehicle.km).toLocaleString('tr-TR') + ' km' : '-'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Müşteri</div>
                  <div style={{ fontWeight: 600 }}>{foundCustomer?.firstName} {foundCustomer?.lastName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{foundCustomer?.phone}</div>
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e40af' }}>Araç Bilgileri</div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={S.label}>Marka</label>
                    <input style={S.input} value={editVehicleForm.brand} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, brand: e.target.value })} placeholder="Toyota" />
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={S.label}>Model</label>
                    <input style={S.input} value={editVehicleForm.model} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, model: e.target.value })} placeholder="Corolla" />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>Yıl</label>
                      <input style={S.input} type="number" value={editVehicleForm.year} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, year: e.target.value })} placeholder="2020" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>KM</label>
                      <input style={S.input} type="number" value={editVehicleForm.km} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, km: e.target.value })} placeholder="85000" />
                    </div>
                  </div>
                  <div>
                    <label style={S.label}>Renk</label>
                    <input style={S.input} value={editVehicleForm.color} onChange={(e) => setEditVehicleForm({ ...editVehicleForm, color: e.target.value })} placeholder="Beyaz" />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e40af' }}>Müşteri Bilgileri</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>Ad *</label>
                      <input style={S.input} value={editCustomerForm.firstName} onChange={(e) => setEditCustomerForm({ ...editCustomerForm, firstName: e.target.value })} placeholder="Ahmet" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>Soyad</label>
                      <input style={S.input} value={editCustomerForm.lastName} onChange={(e) => setEditCustomerForm({ ...editCustomerForm, lastName: e.target.value })} placeholder="Yılmaz" />
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={S.label}>Telefon *</label>
                    <input style={S.input} value={editCustomerForm.phone} onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })} placeholder="555-123-4567" />
                  </div>
                  <div>
                    <label style={S.label}>E-posta</label>
                    <input style={S.input} type="email" value={editCustomerForm.email} onChange={(e) => setEditCustomerForm({ ...editCustomerForm, email: e.target.value })} placeholder="ahmet@email.com" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
            <button onClick={() => setStep(4)} style={{ ...S.btnPrimary, flex: 1, padding: '0.75rem', fontSize: '0.95rem' }}>
              🔧 Yeni Servis Kaydı Aç
            </button>
            <button onClick={() => navigate(`/vehicles/${foundVehicle.id}`)} style={{ ...S.btnSecondary, flex: 1, padding: '0.75rem', fontSize: '0.95rem' }}>
              🛠️ Bakım Planını Gör
            </button>
          </div>

          {/* Service History */}
          <div style={{ ...S.card, marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              📋 Servis Geçmişi <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>({vehicleServices.length} kayıt)</span>
            </h3>
            {vehicleServices.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
                Henüz servis kaydı yok
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {vehicleServices.slice(0, 5).map((order) => (
                  <Link key={order.id} to={`/service-orders/${order.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{order.orderNumber}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {new Date(order.createdAt).toLocaleDateString('tr-TR')} • {order.status === 'RECEIVED' ? '📥 Alındı' : order.status === 'IN_PROGRESS' ? '🔧 Tamir' : order.status === 'TESTING' ? '🧪 Test' : order.status === 'COMPLETED' ? '✅ Teslim' : order.status}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#16a34a' }}>₺{Number(order.totalAmount || 0).toFixed(2)}</div>
                    </div>
                  </Link>
                ))}
                {vehicleServices.length > 5 && (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>
                    ve {vehicleServices.length - 5} kayıt daha...
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Maintenance Schedule */}
          {vehicleSchedule.length > 0 && (
            <div style={{ ...S.card }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                🛠️ Bakım Planı <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>({vehicleSchedule.length} tip)</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {vehicleSchedule.map((s: any) => (
                  <div key={s.maintenanceTypeId} style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{s.maintenanceTypeName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Sonraki: <strong style={{ color: '#2563eb' }}>{s.nextDueKm?.toLocaleString('tr-TR') || '-'} km</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => { setStep(1); setFoundVehicle(null); setFoundCustomer(null); setPlateInput(''); setVehicleServices([]); setVehicleSchedule([]); }} style={{ ...S.btnSecondary, marginTop: '1rem' }}>← Farklı Plaka Ara</button>
        </div>
      )}

      {/* Step 4: New Service for existing vehicle */}
      {step === 4 && foundVehicle && (
        <div style={{ ...S.card }}>
          <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: '#1e40af' }}>
              <strong>{foundVehicle.plate}</strong> • {foundCustomer?.firstName} {foundCustomer?.lastName}
            </div>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Yeni Servis Kaydı</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Müşteri Şikayeti</label>
            <textarea style={{ ...S.input, minHeight: '100px' }} value={complaint} onChange={(e) => setComplaint(e.target.value)}
              placeholder="Müşterinin aracıyla ilgili belirttiği sorun..."
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Ön Tanı / Not</label>
            <textarea style={{ ...S.input, minHeight: '80px' }} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Yapılan ön kontrol ve tespitler..."
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Güncel KM</label>
            <input style={{ ...S.input, maxWidth: '200px' }} type="number" value={vehicleForm.km} onChange={(e) => setVehicleForm({ ...vehicleForm, km: e.target.value })} placeholder="85000" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button onClick={() => setStep(2)} style={S.btnSecondary}>← Geri</button>
            <button onClick={handleSubmit} disabled={saving} style={S.btnPrimary}>
              {saving ? 'Oluşturuluyor...' : '✓ Servis Kaydı Oluştur'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: New Customer + Vehicle Creation (for unknown plates) */}
      {step === 3 && !foundVehicle && (
        <div style={{ ...S.card }}>
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#92400e' }}>
              🆕 Yeni Kayıt: <strong style={{ letterSpacing: '1px' }}>{vehicleForm.plate}</strong>
            </div>
            <div style={{ fontSize: '0.85rem', color: '#78350f' }}>Bu plaka kayıtlı değil. Müşteri ve araç bilgilerini giriniz.</div>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Müşteri Bilgileri</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div><label style={S.label}>Ad *</label><input style={S.input} value={customerForm.firstName} onChange={(e) => setCustomerForm({ ...customerForm, firstName: e.target.value })} /></div>
            <div><label style={S.label}>Soyad</label><input style={S.input} value={customerForm.lastName} onChange={(e) => setCustomerForm({ ...customerForm, lastName: e.target.value })} /></div>
            <div><label style={S.label}>Telefon *</label><input style={S.input} value={customerForm.phone} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="5551234567" /></div>
            <div><label style={S.label}>E-posta</label><input style={S.input} value={customerForm.email} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} /></div>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Araç Bilgileri</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={S.label}>Plaka *</label>
              <input style={{ ...S.input, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}
                value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value.toUpperCase() })} />
            </div>
            <div><label style={S.label}>Marka</label><input style={S.input} value={vehicleForm.brand} onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })} placeholder="Toyota" /></div>
            <div><label style={S.label}>Model</label><input style={S.input} value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} placeholder="Corolla" /></div>
            <div><label style={S.label}>Yıl</label><input style={S.input} type="number" value={vehicleForm.year} onChange={(e) => setVehicleForm({ ...vehicleForm, year: e.target.value })} placeholder="2020" /></div>
            <div><label style={S.label}>KM</label><input style={S.input} type="number" value={vehicleForm.km} onChange={(e) => setVehicleForm({ ...vehicleForm, km: e.target.value })} placeholder="85000" /></div>
            <div><label style={S.label}>Renk</label><input style={S.input} value={vehicleForm.color} onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })} placeholder="Beyaz" /></div>
          </div>

          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Şikayet & Tanı</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Müşteri Şikayeti</label>
            <textarea style={{ ...S.input, minHeight: '80px' }} value={complaint} onChange={(e) => setComplaint(e.target.value)} placeholder="Müşterinin şikayeti..." />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={S.label}>Ön Tanı / Not</label>
            <textarea style={{ ...S.input, minHeight: '60px' }} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Yapılan ön kontrol..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            <button onClick={() => { setStep(1); setPlateInput(''); }} style={S.btnSecondary}>← Farklı Plaka</button>
            <button onClick={handleSubmit} disabled={saving} style={S.btnPrimary}>
              {saving ? 'Oluşturuluyor...' : '✓ Servis Kaydı Oluştur'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ============================================================================
// Service Order Detail Page (parts, labor, notes)
// ============================================================================
function ServiceOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const orderId = id || '';
  const [order, setOrder] = useState<any>(null);
  const [parts, setParts] = useState<any[]>([]);
  const [labors, setLabors] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [showPartForm, setShowPartForm] = useState(false);
  const [showLaborForm, setShowLaborForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [partData, setPartData] = useState({ name: '', quantity: '', unitPrice: '', notes: '' });
  const [laborData, setLaborData] = useState({ description: '', hours: '', hourlyRate: '' });
  const [noteContent, setNoteContent] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'UNPAID' | 'CREDIT'>('PAID');
  const [paidAmount, setPaidAmount] = useState('');

  const load = useCallback(async () => {
    if (!bridge || !orderId) return;
    const res = await bridge.list('service_orders', { q: '', page: 1, limit: 100 });
    const found = res.data.find((r: any) => r.id === orderId);
    setOrder(found || null);
    setParts(await bridge.listParts(orderId));
    setLabors(await bridge.listLabor(orderId));
    setNotes(await bridge.listNotes(orderId));
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  const handleAddPart = async () => {
    if (!bridge || !partData.name) return;
    await bridge.addPart(orderId, { name: partData.name, quantity: Number(partData.quantity) || 1, unitPrice: Number(partData.unitPrice) || 0, notes: partData.notes });
    setPartData({ name: '', quantity: '', unitPrice: '', notes: '' });
    setShowPartForm(false);
    load();
  };
  const handleRemovePart = async (partId: string) => {
    if (!bridge) return;
    await bridge.removePart(partId);
    load();
  };
  const handleAddLabor = async () => {
    if (!bridge || !laborData.description) return;
    await bridge.addLabor(orderId, { description: laborData.description, hours: Number(laborData.hours) || 1, hourlyRate: Number(laborData.hourlyRate) || 0 });
    setLaborData({ description: '', hours: '', hourlyRate: '' });
    setShowLaborForm(false);
    load();
  };
  const handleRemoveLabor = async (laborId: string) => {
    if (!bridge) return;
    await bridge.removeLabor(laborId);
    load();
  };
  const handleAddNote = async () => {
    if (!bridge || !noteContent.trim()) return;
    await bridge.addNote(orderId, noteContent.trim());
    setNoteContent('');
    setShowNoteForm(false);
    load();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!bridge) return;
    await bridge.update('service_orders', orderId, { status: newStatus });
    load();
  };

  const handleCompleteService = async () => {
    if (!bridge) return;
    // Calculate paid amount based on payment status
    let finalPaidAmount = 0;
    if (paymentStatus === 'PAID') {
      finalPaidAmount = grandTotal;
    } else if (paymentStatus === 'PARTIAL') {
      finalPaidAmount = Number(paidAmount) || 0;
    } else if (paymentStatus === 'UNPAID' || paymentStatus === 'CREDIT') {
      finalPaidAmount = 0;
    }
    // Update total amount, status, and payment info
    await bridge.update('service_orders', orderId, { 
      status: 'COMPLETED',
      totalAmount: grandTotal,
      paidAmount: finalPaidAmount,
      paymentStatus: paymentStatus,
    });
    load();
    setShowCompletion(false);
  };

  const handlePrintReceipt = async () => {
    const printContent = `
      <html>
      <head>
        <title>Servis Fişi - ${order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
          h1 { font-size: 18px; text-align: center; margin-bottom: 5px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .info { margin-bottom: 15px; font-size: 13px; }
          .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
          th { background: #f0f0f0; padding: 6px; text-align: left; border-bottom: 1px solid #333; }
          td { padding: 5px 6px; border-bottom: 1px solid #ddd; }
          .total { font-weight: bold; font-size: 16px; text-align: right; margin-top: 10px; }
          .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #333; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔧 OTO SERVIS</h1>
          <div style="font-size: 12px;">Servis Fişi</div>
        </div>
        <div class="info">
          <div class="info-row"><span><strong>Fiş No:</strong></span><span>${order.orderNumber}</span></div>
          <div class="info-row"><span><strong>Tarih:</strong></span><span>${new Date(order.createdAt).toLocaleDateString('tr-TR')}</span></div>
          <div class="info-row"><span><strong>Müşteri:</strong></span><span>${order.customerName || '-'}</span></div>
          <div class="info-row"><span><strong>Telefon:</strong></span><span>${order.customerPhone || '-'}</span></div>
          <div class="info-row"><span><strong>Plaka:</strong></span><span style="font-weight: bold;">${order.vehiclePlate || '-'}</span></div>
          <div class="info-row"><span><strong>Araç:</strong></span><span>${order.vehicleBrand || ''} ${order.vehicleModel || ''} ${order.vehicleYear || ''}</span></div>
          ${order.km ? `<div class="info-row"><span><strong>KM:</strong></span><span>${Number(order.km).toLocaleString('tr-TR')}</span></div>` : ''}
        </div>
        ${order.customerComplaint ? `<div style="margin-bottom: 15px; padding: 8px; background: #fff3cd; border-radius: 4px;"><strong>Şikayet:</strong><br>${order.customerComplaint}</div>` : ''}
        ${order.diagnosis ? `<div style="margin-bottom: 15px; padding: 8px; background: #d1ecf1; border-radius: 4px;"><strong>Tanı:</strong><br>${order.diagnosis}</div>` : ''}
        ${parts.length > 0 ? `
          <div style="margin-bottom: 10px;"><strong>Parça:</strong></div>
          <table>
            <tr><th>Parça</th><th>Adet</th><th style="text-align: right;">Tutar</th></tr>
            ${parts.map(p => `<tr><td>${p.name}</td><td>${p.quantity}</td><td style="text-align: right;">₺${Number(p.total || 0).toFixed(2)}</td></tr>`).join('')}
            <tr style="background: #f0f0f0;"><td colspan="2" style="text-align: right;"><strong>Parça Toplam:</strong></td><td style="text-align: right;"><strong>₺${partsTotal.toFixed(2)}</strong></td></tr>
          </table>
        ` : ''}
        ${labors.length > 0 ? `
          <div style="margin-bottom: 10px; margin-top: 15px;"><strong>İşçilik:</strong></div>
          <table>
            <tr><th>İşlem</th><th>Saat</th><th style="text-align: right;">Tutar</th></tr>
            ${labors.map(l => `<tr><td>${l.description}</td><td>${l.hours} sa</td><td style="text-align: right;">₺${Number(l.total || 0).toFixed(2)}</td></tr>`).join('')}
            <tr style="background: #f0f0f0;"><td colspan="2" style="text-align: right;"><strong>İşçilik Toplam:</strong></td><td style="text-align: right;"><strong>₺${laborTotal.toFixed(2)}</strong></td></tr>
          </table>
        ` : ''}
        <div class="total">TOPLAM: ₺${grandTotal.toFixed(2)}</div>
        <div class="footer">
          <div>Bizi tercih ettiğiniz için teşekkür ederiz!</div>
          <div style="margin-top: 5px;">Yazdırma: ${new Date().toLocaleString('tr-TR')}</div>
        </div>
      </body>
      </html>
    `;
    
    // Use Electron's direct print
    if (bridge) {
      await bridge.print(printContent);
    } else {
      // Fallback for browser
      const printWindow = window.open('', '_blank', 'width=500,height=700');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 250);
      }
    }
  };

  if (!order) return <Layout title="Servis Kaydı">Yükleniyor...</Layout>;

  const partsTotal = parts.reduce((s, p) => s + Number(p.total || 0), 0);
  const laborTotal = labors.reduce((s, l) => s + Number(l.total || 0), 0);
  const grandTotal = partsTotal + laborTotal;

  return (
    <Layout title={`Servis Kaydı: ${order.orderNumber}`}>
      <button onClick={() => navigate('/service-orders')} style={{ ...S.btnSecondary, marginBottom: '1rem' }}>← Geri</button>

      {/* Order info + Quick status */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Müşteri</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{order.customerName || '-'}</div>
            {order.customerPhone && <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{order.customerPhone}</div>}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Araç</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', letterSpacing: '1px' }}>{order.vehiclePlate || '-'}</div>
            {order.vehicleBrand && <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{order.vehicleBrand} {order.vehicleModel}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Toplam Tutar</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>₺{Number(order.totalAmount || 0).toFixed(2)}</div>
            {order.km && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{Number(order.km).toLocaleString('tr-TR')} km</div>}
          </div>
        </div>

        {/* Customer Complaint */}
        {order.customerComplaint && (
          <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#92400e', marginBottom: '0.25rem' }}>📝 MÜŞTERİ ŞİKAYETİ</div>
            <div style={{ fontSize: '0.9rem', color: '#78350f', lineHeight: 1.5 }}>{order.customerComplaint}</div>
          </div>
        )}

        {/* Diagnosis */}
        {order.diagnosis && (
          <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '8px', padding: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e40af', marginBottom: '0.25rem' }}>🔍 ÖN TANI</div>
            <div style={{ fontSize: '0.9rem', color: '#1e3a8a', lineHeight: 1.5 }}>{order.diagnosis}</div>
          </div>
        )}

        {/* Quick status buttons */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.5rem' }}>Hızlı Durum Değiştir:</div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {KANBAN_COLUMNS.map((col) => (
              <button key={col.status}
                onClick={() => handleStatusChange(col.status)}
                disabled={order.status === col.status}
                style={{
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  border: order.status === col.status ? `2px solid ${col.color}` : '1px solid #d1d5db',
                  background: order.status === col.status ? `${col.color}15` : 'white',
                  color: order.status === col.status ? col.color : '#64748b',
                  cursor: order.status === col.status ? 'default' : 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: order.status === col.status ? 700 : 500,
                  opacity: order.status === col.status ? 1 : 0.8,
                }}>
                {col.icon} {col.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Parts Section */}
      <div style={{ ...S.card, marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>🔩 Parçalar <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>(₺{partsTotal.toFixed(2)})</span></h3>
          <button onClick={() => setShowPartForm(!showPartForm)} style={{ ...S.btnPrimary, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>+ Parça Ekle</button>
        </div>
        {showPartForm && (
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
            <div><label style={S.label}>Parça Adı *</label><input style={S.input} value={partData.name} onChange={(e) => setPartData({ ...partData, name: e.target.value })} placeholder="örn. Fren Balatası" /></div>
            <div><label style={S.label}>Miktar</label><input style={S.input} type="number" value={partData.quantity} onChange={(e) => setPartData({ ...partData, quantity: e.target.value })} placeholder="1" min="0" step="0.01" /></div>
            <div><label style={S.label}>Birim Fiyat (₺)</label><input style={S.input} type="number" value={partData.unitPrice} onChange={(e) => setPartData({ ...partData, unitPrice: e.target.value })} placeholder="0.00" min="0" step="0.01" /></div>
            <button onClick={handleAddPart} style={{ ...S.btnPrimary, padding: '0.5rem 1rem' }}>Ekle</button>
          </div>
        )}
        {parts.length === 0 ? <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Henüz parça eklenmemiş.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f1f5f9' }}><th style={S.th}>Parça</th><th style={S.th}>Miktar</th><th style={S.th}>Birim Fiyat</th><th style={S.th}>Toplam</th><th style={S.th}></th></tr></thead>
            <tbody>{parts.map((p) => (
              <tr key={p.id}><td style={S.td}>{p.name}</td><td style={S.td}>{p.quantity}</td><td style={S.td}>₺{Number(p.unitPrice || 0).toFixed(2)}</td><td style={S.td}><strong>₺{Number(p.total || 0).toFixed(2)}</strong></td>
                <td style={S.td}><button onClick={() => handleRemovePart(p.id)} style={S.btnDanger}>Sil</button></td></tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {/* Labor Section */}
      <div style={{ ...S.card, marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>👷 İşçilik <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>(₺{laborTotal.toFixed(2)})</span></h3>
          <button onClick={() => setShowLaborForm(!showLaborForm)} style={{ ...S.btnPrimary, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>+ İşçilik Ekle</button>
        </div>
        {showLaborForm && (
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
            <div><label style={S.label}>İşlem Açıklaması *</label><input style={S.input} value={laborData.description} onChange={(e) => setLaborData({ ...laborData, description: e.target.value })} placeholder="örn. Fren Sistemi Tamiri" /></div>
            <div><label style={S.label}>Saat</label><input style={S.input} type="number" value={laborData.hours} onChange={(e) => setLaborData({ ...laborData, hours: e.target.value })} placeholder="1" min="0" step="0.25" /></div>
            <div><label style={S.label}>Saatlik Ücret (₺)</label><input style={S.input} type="number" value={laborData.hourlyRate} onChange={(e) => setLaborData({ ...laborData, hourlyRate: e.target.value })} placeholder="0.00" min="0" step="0.01" /></div>
            <button onClick={handleAddLabor} style={{ ...S.btnPrimary, padding: '0.5rem 1rem' }}>Ekle</button>
          </div>
        )}
        {labors.length === 0 ? <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Henüz işçilik eklenmemiş.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f1f5f9' }}><th style={S.th}>İşlem</th><th style={S.th}>Saat</th><th style={S.th}>Saatlik Ücret</th><th style={S.th}>Toplam</th><th style={S.th}></th></tr></thead>
            <tbody>{labors.map((l) => (
              <tr key={l.id}><td style={S.td}>{l.description}</td><td style={S.td}>{l.hours} saat</td><td style={S.td}>₺{Number(l.hourlyRate || 0).toFixed(2)}</td><td style={S.td}><strong>₺{Number(l.total || 0).toFixed(2)}</strong></td>
                <td style={S.td}><button onClick={() => handleRemoveLabor(l.id)} style={S.btnDanger}>Sil</button></td></tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {/* Notes Section */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>📝 Notlar</h3>
          <button onClick={() => setShowNoteForm(!showNoteForm)} style={{ ...S.btnPrimary, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>+ Not Ekle</button>
        </div>
        {showNoteForm && (
          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '0.75rem' }}>
            <textarea style={{ ...S.input, minHeight: '60px' }} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Not içeriği..." />
            <button onClick={handleAddNote} style={{ ...S.btnPrimary, marginTop: '0.5rem' }}>Kaydet</button>
          </div>
        )}
        {notes.length === 0 ? <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Henüz not eklenmemiş.</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notes.map((n) => (
              <div key={n.id} style={{ background: '#fffbeb', padding: '0.75rem', borderRadius: '6px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '0.9rem' }}>{n.content}</div>
                <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.25rem' }}>{n.createdAt ? new Date(n.createdAt).toLocaleString('tr-TR') : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completion Section */}
      <div style={{ ...S.card, marginTop: '1rem', background: order.status === 'COMPLETED' ? '#f0fdf4' : '#fefce8', border: order.status === 'COMPLETED' ? '1px solid #86efac' : '1px solid #fde047' }}>
        {order.status === 'COMPLETED' ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#166534', marginBottom: '0.5rem' }}>Servis Tamamlandı</div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Toplam: <strong style={{ color: '#16a34a', fontSize: '1.2rem' }}>₺{grandTotal.toFixed(2)}</strong></div>
            {order.paymentStatus && (
              <div style={{ marginBottom: '1rem' }}>
                {order.paymentStatus === 'PAID' && <span style={{ background: '#dcfce7', color: '#166534', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>✅ Tamamı Ödendi</span>}
                {order.paymentStatus === 'PARTIAL' && <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>💵 Kısmi Ödeme (₺{Number(order.paidAmount || 0).toFixed(2)})</span>}
                {order.paymentStatus === 'UNPAID' && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>❌ Ödenmedi</span>}
                {order.paymentStatus === 'CREDIT' && <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>📒 Cari (Veresiye)</span>}
              </div>
            )}
            <button onClick={handlePrintReceipt} style={{ ...S.btnPrimary, padding: '0.6rem 1.5rem' }}>
              🖨️ Fiş Yazdır
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>🏁 Servisi Tamamla</h3>
              <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#16a34a' }}>₺{grandTotal.toFixed(2)}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowCompletion(true)} style={{ ...S.btnPrimary, flex: 1, padding: '0.75rem', fontSize: '0.95rem', background: '#16a34a' }}>
                ✓ Servisi Tamamla & Teslim Et
              </button>
              <button onClick={handlePrintReceipt} style={{ ...S.btnSecondary, padding: '0.75rem 1rem', fontSize: '0.95rem' }}>
                🖨️ Önizleme
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Completion Modal */}
      {showCompletion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', maxWidth: '500px', width: '90%', maxHeight: '80vh', overflow: 'auto' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', textAlign: 'center' }}>🧾 Servis Özeti</h3>
            
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div><span style={{ color: '#64748b' }}>Fiş No:</span><br /><strong>{order.orderNumber}</strong></div>
                <div><span style={{ color: '#64748b' }}>Tarih:</span><br /><strong>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</strong></div>
                <div><span style={{ color: '#64748b' }}>Müşteri:</span><br /><strong>{order.customerName || '-'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Telefon:</span><br /><strong>{order.customerPhone || '-'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Plaka:</span><br /><strong style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>{order.vehiclePlate || '-'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Araç:</span><br /><strong>{order.vehicleBrand} {order.vehicleModel}</strong></div>
              </div>
            </div>

            {parts.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e40af' }}>Parçalar</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead><tr style={{ background: '#f1f5f9' }}><th style={{ ...S.th, padding: '0.5rem' }}>Parça</th><th style={{ ...S.th, padding: '0.5rem' }}>Adet</th><th style={{ ...S.th, padding: '0.5rem', textAlign: 'right' }}>Tutar</th></tr></thead>
                  <tbody>{parts.map(p => (
                    <tr key={p.id}><td style={{ ...S.td, padding: '0.5rem' }}>{p.name}</td><td style={{ ...S.td, padding: '0.5rem' }}>{p.quantity}</td><td style={{ ...S.td, padding: '0.5rem', textAlign: 'right' }}>₺{Number(p.total || 0).toFixed(2)}</td></tr>
                  ))}</tbody>
                  <tfoot><tr style={{ background: '#f1f5f9' }}><td colSpan={2} style={{ ...S.td, padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>Parça Toplam:</td><td style={{ ...S.td, padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>₺{partsTotal.toFixed(2)}</td></tr></tfoot>
                </table>
              </div>
            )}

            {labors.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e40af' }}>İşçilik</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead><tr style={{ background: '#f1f5f9' }}><th style={{ ...S.th, padding: '0.5rem' }}>İşlem</th><th style={{ ...S.th, padding: '0.5rem' }}>Saat</th><th style={{ ...S.th, padding: '0.5rem', textAlign: 'right' }}>Tutar</th></tr></thead>
                  <tbody>{labors.map(l => (
                    <tr key={l.id}><td style={{ ...S.td, padding: '0.5rem' }}>{l.description}</td><td style={{ ...S.td, padding: '0.5rem' }}>{l.hours} sa</td><td style={{ ...S.td, padding: '0.5rem', textAlign: 'right' }}>₺{Number(l.total || 0).toFixed(2)}</td></tr>
                  ))}</tbody>
                  <tfoot><tr style={{ background: '#f1f5f9' }}><td colSpan={2} style={{ ...S.td, padding: '0.5rem', textAlign: 'right', fontWeight: 600 }}>İşçilik Toplam:</td><td style={{ ...S.td, padding: '0.5rem', textAlign: 'right', fontWeight: 700 }}>₺{laborTotal.toFixed(2)}</td></tr></tfoot>
                </table>
              </div>
            )}

            <div style={{ background: '#16a34a', color: 'white', padding: '1rem', borderRadius: '8px', textAlign: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>GENEL TOPLAM</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>₺{grandTotal.toFixed(2)}</div>
            </div>

            {/* Payment Status Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>💰 Ödeme Durumu</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <button 
                  onClick={() => setPaymentStatus('PAID')} 
                  style={{ 
                    padding: '0.6rem', borderRadius: '6px', border: '2px solid', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    background: paymentStatus === 'PAID' ? '#dcfce7' : 'white',
                    borderColor: paymentStatus === 'PAID' ? '#16a34a' : '#e2e8f0',
                    color: paymentStatus === 'PAID' ? '#166534' : '#64748b',
                  }}>
                  ✅ Tamamı Ödendi
                </button>
                <button 
                  onClick={() => setPaymentStatus('PARTIAL')} 
                  style={{ 
                    padding: '0.6rem', borderRadius: '6px', border: '2px solid', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    background: paymentStatus === 'PARTIAL' ? '#fef3c7' : 'white',
                    borderColor: paymentStatus === 'PARTIAL' ? '#d97706' : '#e2e8f0',
                    color: paymentStatus === 'PARTIAL' ? '#92400e' : '#64748b',
                  }}>
                  💵 Kısmi Ödeme
                </button>
                <button 
                  onClick={() => setPaymentStatus('UNPAID')} 
                  style={{ 
                    padding: '0.6rem', borderRadius: '6px', border: '2px solid', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    background: paymentStatus === 'UNPAID' ? '#fee2e2' : 'white',
                    borderColor: paymentStatus === 'UNPAID' ? '#dc2626' : '#e2e8f0',
                    color: paymentStatus === 'UNPAID' ? '#991b1b' : '#64748b',
                  }}>
                  ❌ Ödenmedi
                </button>
                <button 
                  onClick={() => setPaymentStatus('CREDIT')} 
                  style={{ 
                    padding: '0.6rem', borderRadius: '6px', border: '2px solid', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                    background: paymentStatus === 'CREDIT' ? '#ede9fe' : 'white',
                    borderColor: paymentStatus === 'CREDIT' ? '#7c3aed' : '#e2e8f0',
                    color: paymentStatus === 'CREDIT' ? '#5b21b6' : '#64748b',
                  }}>
                  📒 Cari (Veresiye)
                </button>
              </div>
              {paymentStatus === 'PARTIAL' && (
                <div>
                  <label style={S.label}>Alınan Tutar (₺)</label>
                  <input 
                    style={S.input} 
                    type="number" 
                    value={paidAmount} 
                    onChange={(e) => setPaidAmount(e.target.value)} 
                    placeholder={`0.00 / ${grandTotal.toFixed(2)}`}
                    min="0"
                    max={grandTotal}
                    step="0.01"
                  />
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Kalan: ₺{(grandTotal - (Number(paidAmount) || 0)).toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowCompletion(false)} style={{ ...S.btnSecondary, flex: 1 }}>İptal</button>
              <button onClick={handleCompleteService} style={{ ...S.btnPrimary, flex: 1, background: '#16a34a' }}>✓ Onayla & Teslim Et</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ============================================================================
// Maintenance Records Page
// ============================================================================
function MaintenancePage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const today = new Date().toISOString().split('T')[0];
  const [newRec, setNewRec] = useState({ vehicleId: '', performedAt: today, km: '', notes: '' });

  const load = useCallback(async () => {
    if (!bridge) return;
    setLoading(true);
    try {
      const res = await bridge.maintList();
      setRecords(res || []);
    } catch (err) {
      console.error(err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (bridge) bridge.list('vehicles', { limit: 100 }).then((r) => setVehicles(r.data)).catch(() => {}); }, []);

  const handleCreate = async () => {
    if (!bridge || !newRec.vehicleId) return alert('Araç seçiniz');
    await bridge.maintCreate({
      vehicleId: newRec.vehicleId,
      performedAt: newRec.performedAt ? new Date(newRec.performedAt).toISOString() : new Date().toISOString(),
      km: newRec.km ? Number(newRec.km) : null,
      notes: newRec.notes || null,
    });
    setShowCreate(false);
    setNewRec({ vehicleId: '', performedAt: '', km: '', notes: '' });
    load();
  };

  const filtered = selectedVehicle ? records.filter((r) => r.vehicleId === selectedVehicle) : records;

  return (
    <Layout title="Bakım Kayıtları">
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <select style={{ ...S.input, maxWidth: '280px' }} value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)}>
          <option value="">Tüm Araçlar</option>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} ({v.brand || ''} {v.model || ''})</option>)}
        </select>
        <button onClick={() => setShowCreate(!showCreate)} style={{ ...S.btnPrimary, padding: '0.5rem 1rem' }}>
          {showCreate ? 'İptal' : '+ Yeni Bakım Kaydı'}
        </button>
      </div>

      {showCreate && (
        <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Yeni Bakım Kaydı</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={S.label}>Araç *</label>
              <select style={S.input} value={newRec.vehicleId} onChange={(e) => setNewRec({ ...newRec, vehicleId: e.target.value })}>
                <option value="">Seçiniz...</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Tarih (otomatik: bugün)</label>
              <input type="date" style={S.input} value={newRec.performedAt} onChange={(e) => setNewRec({ ...newRec, performedAt: e.target.value })} />
            </div>
            <div>
              <label style={S.label}>Kilometre</label>
              <input type="number" style={S.input} value={newRec.km} onChange={(e) => setNewRec({ ...newRec, km: e.target.value })} placeholder="km" />
            </div>
            <div>
              <label style={S.label}>Notlar</label>
              <input style={S.input} value={newRec.notes} onChange={(e) => setNewRec({ ...newRec, notes: e.target.value })} placeholder="Açıklama..." />
            </div>
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button onClick={handleCreate} style={{ ...S.btnPrimary, padding: '0.5rem 1.5rem' }}>Oluştur</button>
          </div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ background: '#f1f5f9' }}>
            <th style={S.th}>Araç</th><th style={S.th}>Tarih</th><th style={S.th}>KM</th><th style={S.th}>Notlar</th><th style={S.th}>Tutar</th><th style={S.th}></th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', padding: '2rem' }}>Yükleniyor...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: '#64748b', padding: '2rem' }}>Kayıt bulunamadı.</td></tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <td style={S.td}><strong>{row.vehiclePlate || row.vehicleId?.slice(0, 8) || '-'}</strong></td>
                  <td style={S.td}>{row.performedAt ? new Date(row.performedAt).toLocaleDateString('tr-TR') : '-'}</td>
                  <td style={S.td}>{row.km ? `${Number(row.km).toLocaleString('tr-TR')} km` : '-'}</td>
                  <td style={S.td}>{row.notes || '-'}</td>
                  <td style={S.td}><strong>₺{Number(row.totalAmount || 0).toFixed(2)}</strong></td>
                  <td style={S.td}>
                    <Link to={`/maintenance/${row.id}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}>
                      Detay →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
        Toplam: {filtered.length} kayıt
      </div>
    </Layout>
  );
}

// ============================================================================
// Maintenance Detail Page — add operations & costs
// ============================================================================
function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const recordId = id || '';
  const [record, setRecord] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddPart, setShowAddPart] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [newItem, setNewItem] = useState({ itemType: 'OPERATION', name: '', quantity: '1', unitPrice: '' });
  const [newPart, setNewPart] = useState({ name: '', quantity: '1', unitPrice: '' });
  const [noteContent, setNoteContent] = useState('');
  const [schedule, setSchedule] = useState<any[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [editingInterval, setEditingInterval] = useState<string | null>(null);
  const [intervalForm, setIntervalForm] = useState({ intervalKm: '', intervalDays: '', lastKm: '', lastPerformedAt: '' });

  const load = useCallback(async () => {
    if (!bridge || !recordId) return;
    setLoading(true);
    try {
      const rec = await bridge.maintGet(recordId);
      setRecord(rec);
      const itms = await bridge.maintListItems(recordId);
      setItems(itms || []);
      if (rec?.vehicleId) {
        const sched = await bridge.maintSchedule(rec.vehicleId);
        setSchedule(sched || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => { load(); }, [load]);

  const handleAddItem = async () => {
    if (!bridge || !newItem.name.trim()) return alert('İşlem adı giriniz');
    await bridge.maintAddItem(recordId, {
      itemType: newItem.itemType,
      name: newItem.name.trim(),
      quantity: Number(newItem.quantity) || 1,
      unitPrice: Number(newItem.unitPrice) || 0,
    });
    setNewItem({ itemType: 'OPERATION', name: '', quantity: '1', unitPrice: '' });
    setShowAddItem(false);
    load();
  };

  const handleAddPart = async () => {
    if (!bridge || !newPart.name.trim()) return alert('Parça adı giriniz');
    await bridge.maintAddItem(recordId, {
      itemType: 'PART',
      name: newPart.name.trim(),
      quantity: Number(newPart.quantity) || 1,
      unitPrice: Number(newPart.unitPrice) || 0,
    });
    setNewPart({ name: '', quantity: '1', unitPrice: '' });
    setShowAddPart(false);
    load();
  };

  const handleAddNote = async () => {
    if (!bridge || !noteContent.trim()) return;
    await bridge.maintAddItem(recordId, {
      itemType: 'NOTE',
      name: noteContent.trim(),
      quantity: 1,
      unitPrice: 0,
    });
    setNoteContent('');
    setShowNoteForm(false);
    load();
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!bridge || !confirm('Bu kalemi silmek istediğinize emin misiniz?')) return;
    await bridge.maintRemoveItem(itemId);
    load();
  };

  const handleUpdateInterval = async (maintenanceTypeId: string) => {
    if (!bridge || !record?.vehicleId) return;
    await bridge.maintUpdateInterval(record.vehicleId, maintenanceTypeId, {
      intervalKm: Number(intervalForm.intervalKm) || null,
      intervalDays: Number(intervalForm.intervalDays) || null,
      lastKm: Number(intervalForm.lastKm) || null,
      lastPerformedAt: intervalForm.lastPerformedAt || null,
    });
    setEditingInterval(null);
    setIntervalForm({ intervalKm: '', intervalDays: '', lastKm: '', lastPerformedAt: '' });
    load();
  };

  const handleLogInterval = async (maintenanceTypeId: string) => {
    if (!bridge || !record?.vehicleId) return;
    const km = Number(intervalForm.lastKm);
    const performedAt = intervalForm.lastPerformedAt || new Date().toISOString().split('T')[0];
    if (!km) return alert('Kilometre giriniz');
    await bridge.maintLogInterval(record.vehicleId, maintenanceTypeId, km, performedAt);
    setEditingInterval(null);
    setIntervalForm({ intervalKm: '', intervalDays: '', lastKm: '', lastPerformedAt: '' });
    load();
  };

  const operations = items.filter((i) => i.itemType === 'OPERATION');
  const parts = items.filter((i) => i.itemType === 'PART');
  const notes = items.filter((i) => i.itemType === 'NOTE');
  const operationsTotal = operations.reduce((s, i) => s + Number(i.total || 0), 0);
  const partsTotal = parts.reduce((s, i) => s + Number(i.total || 0), 0);
  const grandTotal = operationsTotal + partsTotal;

  const handlePrint = () => {
    const printContent = `
      <html>
      <head>
        <title>Bakım Kaydı - ${record.vehiclePlate || ''}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
          .info { margin-bottom: 1.5rem; }
          .info div { margin-bottom: 0.25rem; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          .total { font-weight: bold; font-size: 1.1rem; text-align: right; margin-top: 1rem; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>Bakım Kaydı</h1>
        <div class="info">
          <div><strong>Araç:</strong> ${record.vehiclePlate || ''} ${record.vehicleBrand || ''} ${record.vehicleModel || ''}</div>
          <div><strong>Tarih:</strong> ${record.performedAt ? new Date(record.performedAt).toLocaleDateString('tr-TR') : '-'}</div>
          <div><strong>Kilometre:</strong> ${record.km ? Number(record.km).toLocaleString('tr-TR') + ' km' : '-'}</div>
          ${record.notes ? `<div><strong>Not:</strong> ${record.notes}</div>` : ''}
        </div>
        ${operations.length > 0 ? `
          <h2>Yapılan İşlemler</h2>
          <table>
            <thead><tr><th>İşlem</th><th>Adet</th><th>Birim Fiyat</th><th>Toplam</th></tr></thead>
            <tbody>${operations.map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>₺${Number(i.unitPrice || 0).toFixed(2)}</td><td>₺${Number(i.total || 0).toFixed(2)}</td></tr>`).join('')}</tbody>
          </table>
          <div style="text-align: right; margin-bottom: 1rem;">İşlemler Toplamı: <strong>₺${operationsTotal.toFixed(2)}</strong></div>
        ` : ''}
        ${parts.length > 0 ? `
          <h2>Kullanılan Parçalar</h2>
          <table>
            <thead><tr><th>Parça</th><th>Adet</th><th>Birim Fiyat</th><th>Toplam</th></tr></thead>
            <tbody>${parts.map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>₺${Number(i.unitPrice || 0).toFixed(2)}</td><td>₺${Number(i.total || 0).toFixed(2)}</td></tr>`).join('')}</tbody>
          </table>
          <div style="text-align: right; margin-bottom: 1rem;">Parçalar Toplamı: <strong>₺${partsTotal.toFixed(2)}</strong></div>
        ` : ''}
        <div class="total">GENEL TOPLAM: ₺${grandTotal.toFixed(2)}</div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  if (loading) return <Layout title="Bakım Kaydı"><div>Yükleniyor...</div></Layout>;
  if (!record) return <Layout title="Bakım Kaydı"><div>Kayıt bulunamadı.</div></Layout>;

  return (
    <Layout title={`Bakım Kaydı — ${record.vehiclePlate || ''}`}>
      {/* Print button */}
      <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
        <button onClick={handlePrint} style={{ ...S.btnPrimary, padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
          🖨️ Yazdır / PDF İndir
        </button>
      </div>
      {/* Record info */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Araç</div>
            <div style={{ fontWeight: 600 }}>{record.vehiclePlate} {record.vehicleBrand} {record.vehicleModel}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Tarih</div>
            <div style={{ fontWeight: 600 }}>{record.performedAt ? new Date(record.performedAt).toLocaleDateString('tr-TR') : '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Kilometre</div>
            <div style={{ fontWeight: 600 }}>{record.km ? `${Number(record.km).toLocaleString('tr-TR')} km` : '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Toplam Tutar</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2563eb' }}>₺{Number(record.totalAmount || 0).toFixed(2)}</div>
          </div>
        </div>
        {record.notes && <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', color: '#475569' }}>{record.notes}</div>}
      </div>

      {/* Operations section */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>🔧 Yapılan İşlemler</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Toplam: <strong>₺{operationsTotal.toFixed(2)}</strong></span>
            <button onClick={() => setShowAddItem(!showAddItem)} style={{ ...S.btnPrimary, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              {showAddItem ? 'İptal' : '+ İşlem Ekle'}
            </button>
          </div>
        </div>
        {showAddItem && (
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
              <div>
                <label style={S.label}>İşlem Adı *</label>
                <input style={S.input} value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="Örn: Yağ değişimi, Fren balata..." />
              </div>
              <div>
                <label style={S.label}>Adet</label>
                <input type="number" style={S.input} value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} />
              </div>
              <div>
                <label style={S.label}>Birim Fiyat (₺)</label>
                <input type="number" style={S.input} value={newItem.unitPrice} onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })} placeholder="0.00" />
              </div>
              <button onClick={handleAddItem} style={{ ...S.btnPrimary, padding: '0.5rem 1rem' }}>Ekle</button>
            </div>
          </div>
        )}
        {operations.length === 0 ? <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Henüz işlem eklenmemiş.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f1f5f9' }}><th style={S.th}>İşlem</th><th style={S.th}>Adet</th><th style={S.th}>Birim Fiyat</th><th style={S.th}>Toplam</th><th style={S.th}></th></tr></thead>
            <tbody>{operations.map((i) => (
              <tr key={i.id}>
                <td style={S.td}>{i.name}</td>
                <td style={S.td}>{i.quantity}</td>
                <td style={S.td}>₺{Number(i.unitPrice || 0).toFixed(2)}</td>
                <td style={S.td}><strong>₺{Number(i.total || 0).toFixed(2)}</strong></td>
                <td style={S.td}><button onClick={() => handleRemoveItem(i.id)} style={S.btnDanger}>Sil</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {/* Parts section */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>📦 Kullanılan Parçalar</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Toplam: <strong>₺{partsTotal.toFixed(2)}</strong></span>
            <button onClick={() => setShowAddPart(!showAddPart)} style={{ ...S.btnPrimary, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              {showAddPart ? 'İptal' : '+ Parça Ekle'}
            </button>
          </div>
        </div>
        {showAddPart && (
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
              <div>
                <label style={S.label}>Parça Adı *</label>
                <input style={S.input} value={newPart.name} onChange={(e) => setNewPart({ ...newPart, name: e.target.value })} placeholder="Örn: Yağ filtresi, Fren balatası..." />
              </div>
              <div>
                <label style={S.label}>Adet</label>
                <input type="number" style={S.input} value={newPart.quantity} onChange={(e) => setNewPart({ ...newPart, quantity: e.target.value })} placeholder="1" />
              </div>
              <div>
                <label style={S.label}>Birim Fiyat (₺)</label>
                <input type="number" style={S.input} value={newPart.unitPrice} onChange={(e) => setNewPart({ ...newPart, unitPrice: e.target.value })} placeholder="0.00" />
              </div>
              <button onClick={handleAddPart} style={{ ...S.btnPrimary, padding: '0.5rem 1rem' }}>Ekle</button>
            </div>
          </div>
        )}
        {parts.length === 0 ? <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Henüz parça eklenmemiş.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: '#f1f5f9' }}><th style={S.th}>Parça</th><th style={S.th}>Adet</th><th style={S.th}>Birim Fiyat</th><th style={S.th}>Toplam</th><th style={S.th}></th></tr></thead>
            <tbody>{parts.map((i) => (
              <tr key={i.id}>
                <td style={S.td}>{i.name}</td>
                <td style={S.td}>{i.quantity}</td>
                <td style={S.td}>₺{Number(i.unitPrice || 0).toFixed(2)}</td>
                <td style={S.td}><strong>₺{Number(i.total || 0).toFixed(2)}</strong></td>
                <td style={S.td}><button onClick={() => handleRemoveItem(i.id)} style={S.btnDanger}>Sil</button></td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      {/* Notes section */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>📝 Notlar</h3>
          <button onClick={() => setShowNoteForm(!showNoteForm)} style={{ ...S.btnPrimary, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            {showNoteForm ? 'İptal' : '+ Not Ekle'}
          </button>
        </div>
        {showNoteForm && (
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={S.label}>Not İçeriği *</label>
              <textarea style={{ ...S.input, minHeight: '80px', resize: 'vertical' }} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Örn: Müşteriye fren sisteminin durumu anlatıldı..." />
            </div>
            <button onClick={handleAddNote} style={{ ...S.btnPrimary, padding: '0.5rem 1rem' }}>Ekle</button>
          </div>
        )}
        {notes.length === 0 ? <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Henüz not eklenmemiş.</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {notes.map((n) => (
              <div key={n.id} style={{ background: '#fef9c3', padding: '0.75rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ fontSize: '0.9rem', color: '#422006', whiteSpace: 'pre-wrap' }}>{n.name}</div>
                <button onClick={() => handleRemoveItem(n.id)} style={{ ...S.btnDanger, padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Sil</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Maintenance Schedule / Interval Tracking */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>📅 Bakım Takvimi</h3>
          <button onClick={() => setShowSchedule(!showSchedule)} style={{ ...S.btnPrimary, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            {showSchedule ? 'Gizle' : 'Göster'}
          </button>
        </div>
        {showSchedule && (
          <div>
            {schedule.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Bakım tipi tanımlanmamış.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {schedule.map((s) => {
                  const isOverdue = s.nextDueKm && record.km && Number(record.km) > s.nextDueKm;
                  const isDueSoon = s.nextDueKm && record.km && Number(record.km) >= s.nextDueKm - 1000;
                  return (
                    <div key={s.maintenanceTypeId} style={{
                      background: isOverdue ? '#fef2f2' : isDueSoon ? '#fef9c3' : '#f8fafc',
                      border: isOverdue ? '1px solid #fca5a5' : isDueSoon ? '1px solid #fcd34d' : '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '1rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.maintenanceTypeName}</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {editingInterval === s.maintenanceTypeId ? (
                            <>
                              <button onClick={() => { setEditingInterval(null); setIntervalForm({ intervalKm: '', intervalDays: '', lastKm: '', lastPerformedAt: '' }); }} style={{ ...S.btnSecondary, padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>İptal</button>
                              <button onClick={() => handleLogInterval(s.maintenanceTypeId)} style={{ ...S.btnPrimary, padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Kaydet</button>
                            </>
                          ) : (
                            <button onClick={() => {
                              setEditingInterval(s.maintenanceTypeId);
                              setIntervalForm({
                                intervalKm: String(s.intervalKm || ''),
                                intervalDays: String(s.intervalDays || ''),
                                lastKm: String(record.km || ''),
                                lastPerformedAt: new Date().toISOString().split('T')[0],
                              });
                            }} style={{ ...S.btnPrimary, padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>Bakım Yapıldı</button>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Aralık (km)</div>
                          <div style={{ fontWeight: 500 }}>{s.intervalKm?.toLocaleString('tr-TR') || '-'}</div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Son KM</div>
                          <div style={{ fontWeight: 500 }}>{s.lastKm?.toLocaleString('tr-TR') || '-'}</div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Sonraki KM</div>
                          <div style={{ fontWeight: 600, color: isOverdue ? '#dc2626' : isDueSoon ? '#d97706' : '#059669' }}>{s.nextDueKm?.toLocaleString('tr-TR') || '-'}</div>
                        </div>
                        <div>
                          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Sonraki Tarih</div>
                          <div style={{ fontWeight: 500 }}>{s.nextDueDate ? new Date(s.nextDueDate).toLocaleDateString('tr-TR') : '-'}</div>
                        </div>
                      </div>
                      {editingInterval === s.maintenanceTypeId && (
                        <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                          <div>
                            <label style={S.label}>Aralık (km)</label>
                            <input type="number" style={S.input} value={intervalForm.intervalKm} onChange={(e) => setIntervalForm({ ...intervalForm, intervalKm: e.target.value })} placeholder="10000" />
                          </div>
                          <div>
                            <label style={S.label}>Aralık (gün)</label>
                            <input type="number" style={S.input} value={intervalForm.intervalDays} onChange={(e) => setIntervalForm({ ...intervalForm, intervalDays: e.target.value })} placeholder="180" />
                          </div>
                          <div>
                            <label style={S.label}>Yapılan KM</label>
                            <input type="number" style={S.input} value={intervalForm.lastKm} onChange={(e) => setIntervalForm({ ...intervalForm, lastKm: e.target.value })} />
                          </div>
                          <div>
                            <label style={S.label}>Yapılan Tarih</label>
                            <input type="date" style={S.input} value={intervalForm.lastPerformedAt} onChange={(e) => setIntervalForm({ ...intervalForm, lastPerformedAt: e.target.value })} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grand total */}
      <div style={{ background: 'white', borderRadius: '10px', padding: '1rem 1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
          İşlemler: ₺{operationsTotal.toFixed(2)} + Parçalar: ₺{partsTotal.toFixed(2)}
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
          GENEL TOPLAM: ₺{grandTotal.toFixed(2)}
        </div>
      </div>
    </Layout>
  );
}

// ============================================================================
// Vehicle Detail Page - View & configure maintenance intervals
// ============================================================================
function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = id || '';
  const [vehicle, setVehicle] = useState<any>(null);
  const [schedule, setSchedule] = useState<any[]>([]);
  const [maintenanceTypes, setMaintenanceTypes] = useState<any[]>([]);
  const [serviceOrders, setServiceOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [intervalForm, setIntervalForm] = useState({ intervalKm: '', intervalDays: '' });
  const [showAddType, setShowAddType] = useState(false);
  const [newTypeForm, setNewTypeForm] = useState({ name: '', intervalKm: '', intervalDays: '' });

  const load = useCallback(async () => {
    if (!bridge || !vehicleId) return;
    setLoading(true);
    try {
      const v = await bridge.get('vehicles', vehicleId);
      setVehicle(v);
      const sched = await bridge.maintSchedule(vehicleId);
      setSchedule(sched || []);
      const typesRes = await bridge.list('maintenance_types', { limit: 1000 });
      setMaintenanceTypes(typesRes.data || []);
      // Load service orders for this vehicle
      const ordersRes = await bridge.list('service_orders', { q: '', page: 1, limit: 100 });
      const vehicleOrders = (ordersRes.data || []).filter((o: any) => o.vehicleId === vehicleId);
      setServiceOrders(vehicleOrders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveInterval = async (maintenanceTypeId: string) => {
    if (!bridge || !vehicleId) return;
    try {
      await bridge.maintUpdateInterval(vehicleId, maintenanceTypeId, {
        intervalKm: intervalForm.intervalKm ? Number(intervalForm.intervalKm) : null,
        intervalDays: intervalForm.intervalDays ? Number(intervalForm.intervalDays) : null,
      });
      setEditingType(null);
      load();
    } catch (err) {
      console.error(err);
      alert('Kaydetme hatası: ' + (err as Error).message);
    }
  };

  const handleAddMaintenanceType = async () => {
    if (!bridge || !vehicleId) return;
    if (!newTypeForm.name.trim()) {
      alert('Bakım tipi adı zorunludur.');
      return;
    }
    try {
      // Create new maintenance type
      const newType = await bridge.create('maintenance_types', {
        name: newTypeForm.name,
        description: null,
        defaultIntervalKm: newTypeForm.intervalKm ? Number(newTypeForm.intervalKm) : null,
        defaultIntervalDays: newTypeForm.intervalDays ? Number(newTypeForm.intervalDays) : null,
        isActive: true,
      });
      // Assign to vehicle with intervals
      await bridge.maintUpdateInterval(vehicleId, newType.id, {
        intervalKm: newTypeForm.intervalKm ? Number(newTypeForm.intervalKm) : null,
        intervalDays: newTypeForm.intervalDays ? Number(newTypeForm.intervalDays) : null,
      });
      setShowAddType(false);
      setNewTypeForm({ name: '', intervalKm: '', intervalDays: '' });
      load();
    } catch (err) {
      console.error(err);
      alert('Ekleme hatası: ' + (err as Error).message);
    }
  };

  const handleAssignExistingType = async (typeId: string) => {
    if (!bridge || !vehicleId) return;
    try {
      const type = maintenanceTypes.find(t => t.id === typeId);
      await bridge.maintUpdateInterval(vehicleId, typeId, {
        intervalKm: type?.defaultIntervalKm || null,
        intervalDays: type?.defaultIntervalDays || null,
      });
      load();
    } catch (err) {
      console.error(err);
      alert('Atama hatası: ' + (err as Error).message);
    }
  };

  if (loading) return <Layout title="Araç Detayı"><div>Yükleniyor...</div></Layout>;
  if (!vehicle) return <Layout title="Araç Detayı"><div>Araç bulunamadı.</div></Layout>;

  return (
    <Layout title={`Araç: ${vehicle.plate}`}>
      {/* Vehicle Info */}
      <div style={{ ...S.card, marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Plaka</div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{vehicle.plate}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Marka / Model</div>
            <div style={{ fontWeight: 600 }}>{vehicle.brand || '-'} {vehicle.model || ''}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Yıl</div>
            <div style={{ fontWeight: 600 }}>{vehicle.year || '-'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Kilometre</div>
            <div style={{ fontWeight: 700, color: '#2563eb' }}>{vehicle.km ? Number(vehicle.km).toLocaleString('tr-TR') + ' km' : '-'}</div>
          </div>
        </div>
        {vehicle.fuelType && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
            Yakıt: <strong>{vehicle.fuelType}</strong>
            {vehicle.color && <> • Renk: <strong>{vehicle.color}</strong></>}
          </div>
        )}
      </div>

      {/* Maintenance Configuration */}
      <div style={S.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
            🛠️ Bakım Planı <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>(Bu araca özel)</span>
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowAddType(!showAddType)} style={{ ...S.btnPrimary, padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
              {showAddType ? 'İptal' : '+ Yeni Bakım Tipi'}
            </button>
          </div>
        </div>

        {/* Add New Maintenance Type Form */}
        {showAddType && (
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: '#0369a1' }}>
              Yeni Bakım Tipi Ekle
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
              <div>
                <label style={S.label}>Bakım Tipi Adı *</label>
                <input style={S.input} value={newTypeForm.name} onChange={(e) => setNewTypeForm({ ...newTypeForm, name: e.target.value })} placeholder="örn. Triger Seti, Balata, Akü..." />
              </div>
              <div>
                <label style={S.label}>Aralık (km)</label>
                <input type="number" style={S.input} value={newTypeForm.intervalKm} onChange={(e) => setNewTypeForm({ ...newTypeForm, intervalKm: e.target.value })} placeholder="60000" />
              </div>
              <div>
                <label style={S.label}>Aralık (gün)</label>
                <input type="number" style={S.input} value={newTypeForm.intervalDays} onChange={(e) => setNewTypeForm({ ...newTypeForm, intervalDays: e.target.value })} placeholder="365" />
              </div>
              <button onClick={handleAddMaintenanceType} style={{ ...S.btnPrimary, padding: '0.5rem 1rem' }}>
                Ekle
              </button>
            </div>
          </div>
        )}
        
        {schedule.length === 0 && !showAddType ? (
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            <div style={{ color: '#64748b' }}>Bu araç için bakım planı tanımlanmamış.</div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Yukarıdaki "+ Yeni Bakım Tipi" butonunu kullanarak ekleyin.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {schedule.map((s) => (
              <div key={s.maintenanceTypeId} style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.maintenanceTypeName}</div>
                  <button
                    onClick={() => {
                      setEditingType(editingType === s.maintenanceTypeId ? null : s.maintenanceTypeId);
                      setIntervalForm({
                        intervalKm: String(s.intervalKm || s.defaultIntervalKm || ''),
                        intervalDays: String(s.intervalDays || s.defaultIntervalDays || ''),
                      });
                    }}
                    style={{ ...S.btnPrimary, padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    {editingType === s.maintenanceTypeId ? 'İptal' : 'Düzenle'}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Aralık (km)</div>
                    <div style={{ fontWeight: 500 }}>{s.intervalKm?.toLocaleString('tr-TR') || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Aralık (gün)</div>
                    <div style={{ fontWeight: 500 }}>{s.intervalDays || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Son KM</div>
                    <div style={{ fontWeight: 500 }}>{s.lastKm?.toLocaleString('tr-TR') || '-'}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Sonraki KM</div>
                    <div style={{ fontWeight: 600, color: '#2563eb' }}>{s.nextDueKm?.toLocaleString('tr-TR') || '-'}</div>
                  </div>
                </div>
                {editingType === s.maintenanceTypeId && (
                  <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                      Bu araç için bakım aralıklarını özelleştirin:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.5rem', alignItems: 'end' }}>
                      <div>
                        <label style={S.label}>Aralık (km)</label>
                        <input type="number" style={S.input} value={intervalForm.intervalKm} onChange={(e) => setIntervalForm({ ...intervalForm, intervalKm: e.target.value })} placeholder="10000" />
                      </div>
                      <div>
                        <label style={S.label}>Aralık (gün)</label>
                        <input type="number" style={S.input} value={intervalForm.intervalDays} onChange={(e) => setIntervalForm({ ...intervalForm, intervalDays: e.target.value })} placeholder="180" />
                      </div>
                      <button onClick={() => handleSaveInterval(s.maintenanceTypeId)} style={{ ...S.btnPrimary, padding: '0.5rem 1rem' }}>
                        Kaydet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Service History for this Vehicle */}
      <div style={{ ...S.card, marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>
            🔧 Servis Geçmişi <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 400 }}>({serviceOrders.length} kayıt)</span>
          </h3>
          <Link to={`/service-orders/new?plate=${encodeURIComponent(vehicle?.plate || '')}`} style={{ ...S.btnPrimary, padding: '0.4rem 0.8rem', fontSize: '0.85rem', textDecoration: 'none' }}>
            + Yeni Servis
          </Link>
        </div>
        
        {serviceOrders.length === 0 ? (
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            <div style={{ color: '#64748b' }}>Bu araç için henüz servis kaydı yok.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {serviceOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((order) => (
              <Link key={order.id} to={`/service-orders/${order.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{order.orderNumber}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        {new Date(order.createdAt).toLocaleDateString('tr-TR')} • {order.status === 'RECEIVED' ? '📥 Alındı' : order.status === 'IN_PROGRESS' ? '🔧 Tamir' : order.status === 'TESTING' ? '🧪 Test' : order.status === 'COMPLETED' ? '✅ Teslim' : order.status}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '1.1rem' }}>₺{Number(order.totalAmount || 0).toFixed(2)}</div>
                      {order.km && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{Number(order.km).toLocaleString('tr-TR')} km</div>}
                    </div>
                  </div>
                  {order.customerComplaint && (
                    <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.5rem', padding: '0.5rem', background: '#fef3c7', borderRadius: '4px' }}>
                      <strong>Şikayet:</strong> {order.customerComplaint.substring(0, 100)}{order.customerComplaint.length > 100 ? '...' : ''}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

// ============================================================================
// Vehicle History Page - Professional Report by Plate
// ============================================================================
function VehicleHistoryPage() {
  const [plate, setPlate] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!bridge || !plate.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const result = await bridge.vehicleHistory(plate.trim());
      setData(result);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!data) return;
    const { vehicle, maintenanceRecords, serviceOrders, summary } = data;
    
    const printContent = `
      <html>
      <head>
        <title>Arac Gecmis Raporu - ${vehicle.plate}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #1e293b; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #475569; margin-top: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
          .info-box { background: #f8fafc; border-radius: 8px; padding: 15px; margin: 1rem 0; }
          .info-box div { margin-bottom: 5px; }
          .summary { display: flex; gap: 20px; margin: 1.5rem 0; }
          .summary-card { background: #eff6ff; border-radius: 8px; padding: 15px; flex: 1; text-align: center; }
          .summary-card .value { font-size: 1.5rem; font-weight: bold; color: #2563eb; }
          .summary-card .label { font-size: 0.85rem; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; }
          .record-header { background: #f8fafc; font-weight: 600; }
          .item-row { background: #fafafa; }
          .total { font-weight: bold; text-align: right; font-size: 1.1rem; margin-top: 1rem; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>Arac Gecmis Raporu</h1>
        <div class="info-box">
          <div><strong>Plaka:</strong> ${vehicle.plate}</div>
          <div><strong>Marka/Model:</strong> ${vehicle.brand || '-'} ${vehicle.model || ''}</div>
          <div><strong>Yil:</strong> ${vehicle.year || '-'}</div>
          <div><strong>VIN:</strong> ${vehicle.vin || '-'}</div>
          <div><strong>Musteri:</strong> ${vehicle.customerName || '-'}</div>
          <div><strong>Telefon:</strong> ${vehicle.customerPhone || '-'}</div>
        </div>
        
        <div class="summary">
          <div class="summary-card">
            <div class="value">${summary.visitCount}</div>
            <div class="label">Toplam Ziyaret</div>
          </div>
          <div class="summary-card">
            <div class="value">₺${summary.totalSpent.toFixed(2)}</div>
            <div class="label">Toplam Harcama</div>
          </div>
          <div class="summary-card">
            <div class="value">${summary.lastVisit ? new Date(summary.lastVisit).toLocaleDateString('tr-TR') : '-'}</div>
            <div class="label">Son Ziyaret</div>
          </div>
        </div>
        
        ${maintenanceRecords.length > 0 ? `
          <h2>Bakim Kayitlari (${maintenanceRecords.length})</h2>
          <table>
            <thead>
              <tr><th>Tarih</th><th>Bakim Tipi</th><th>KM</th><th>Islemler</th><th>Tutar</th></tr>
            </thead>
            <tbody>
              ${maintenanceRecords.map((rec: any) => `
                <tr class="record-header">
                  <td>${rec.performedAt ? new Date(rec.performedAt).toLocaleDateString('tr-TR') : '-'}</td>
                  <td>${rec.maintenanceTypeName || '-'}</td>
                  <td>${rec.km ? Number(rec.km).toLocaleString('tr-TR') + ' km' : '-'}</td>
                  <td>${rec.items?.length || 0} kalem</td>
                  <td><strong>₺${Number(rec.totalAmount || 0).toFixed(2)}</strong></td>
                </tr>
                ${rec.items?.map((item: any) => `
                  <tr class="item-row">
                    <td colspan="3" style="padding-left: 30px;">${item.itemType === 'OPERATION' ? '🔧' : '📦'} ${item.name}</td>
                    <td>${item.quantity} x ₺${Number(item.unitPrice || 0).toFixed(2)}</td>
                    <td>₺${Number(item.total || 0).toFixed(2)}</td>
                  </tr>
                `).join('') || ''}
              `).join('')}
            </tbody>
          </table>
          <div class="total">Bakim Toplami: ₺${summary.totalMaintenance.toFixed(2)}</div>
        ` : ''}
        
        ${serviceOrders.length > 0 ? `
          <h2>Is Emirleri (${serviceOrders.length})</h2>
          <table>
            <thead>
              <tr><th>Tarih</th><th>Islem No</th><th>Durum</th><th>Parca</th><th>Iscilik</th><th>Toplam</th></tr>
            </thead>
            <tbody>
              ${serviceOrders.map((so: any) => `
                <tr>
                  <td>${so.createdAt ? new Date(so.createdAt).toLocaleDateString('tr-TR') : '-'}</td>
                  <td>${so.orderNumber || '-'}</td>
                  <td>${so.status}</td>
                  <td>₺${Number(so.partsTotal || 0).toFixed(2)}</td>
                  <td>₺${Number(so.laborTotal || 0).toFixed(2)}</td>
                  <td><strong>₺${Number(so.totalAmount || 0).toFixed(2)}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">Is Emri Toplami: ₺${summary.totalServiceOrders.toFixed(2)}</div>
        ` : ''}
        
        <div class="total" style="margin-top: 2rem; font-size: 1.3rem; border-top: 2px solid #2563eb; padding-top: 10px;">
          GENEL TOPLAM: ₺${summary.totalSpent.toFixed(2)}
        </div>
        
        <div style="margin-top: 3rem; font-size: 0.8rem; color: #94a3b8; text-align: center;">
          Bu rapor ${new Date().toLocaleDateString('tr-TR')} tarihinde olusturulmustur.
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  return (
    <Layout title="Arac Gecmis Raporu">
      {/* Search */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>Plaka ile Arac Gecmis Sorgula</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Plaka</label>
            <input
              style={{ ...S.input, fontSize: '1.1rem', padding: '0.75rem', fontWeight: 600 }}
              placeholder="Örn: 34 ABC 123"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} disabled={loading} style={{ ...S.btnPrimary, padding: '0.75rem 2rem', fontSize: '1rem' }}>
            {loading ? 'Aranıyor...' : '🔍 Geçmişi Sorgula'}
          </button>
        </div>
      </div>

      {/* Results */}
      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Yükleniyor...</div>}
      
      {searched && !loading && !data && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '3rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <div style={{ fontSize: '1.1rem', color: '#64748b' }}>"{plate}" plakalı araç bulunamadı.</div>
        </div>
      )}

      {data && (
        <>
          {/* Vehicle Info Header */}
          <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', color: 'white', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '2px' }}>{data.vehicle.plate}</div>
                <div style={{ fontSize: '1.1rem', marginTop: '0.5rem', opacity: 0.9 }}>
                  {data.vehicle.brand} {data.vehicle.model} {data.vehicle.year ? `(${data.vehicle.year})` : ''}
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.9rem', opacity: 0.8 }}>
                  Müşteri: {data.vehicle.customerName || '-'} {data.vehicle.customerPhone ? `· ${data.vehicle.customerPhone}` : ''}
                </div>
              </div>
              <button onClick={handlePrint} style={{ background: 'white', color: '#2563eb', border: 'none', borderRadius: '8px', padding: '0.75rem 1.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem' }}>
                🖨️ Raporu Yazdır
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#2563eb' }}>{data.summary.visitCount}</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>Toplam Ziyaret</div>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a' }}>₺{data.summary.totalSpent.toFixed(2)}</div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>Toplam Harcama</div>
            </div>
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ea580c' }}>
                {data.summary.lastVisit ? new Date(data.summary.lastVisit).toLocaleDateString('tr-TR') : '-'}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '0.25rem' }}>Son Ziyaret</div>
            </div>
          </div>

          {/* Maintenance Records */}
          {data.maintenanceRecords.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
                🔧 Bakım Kayıtları ({data.maintenanceRecords.length})
              </h3>
              {data.maintenanceRecords.map((rec: any) => (
                <div key={rec.id} style={{ marginBottom: '1.5rem', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                      <strong style={{ color: '#1e293b' }}>{rec.performedAt ? new Date(rec.performedAt).toLocaleDateString('tr-TR') : '-'}</strong>
                      {rec.maintenanceTypeName && <span style={{ marginLeft: '1rem', color: '#64748b' }}>{rec.maintenanceTypeName}</span>}
                      {rec.km && <span style={{ marginLeft: '1rem', color: '#64748b', fontSize: '0.9rem' }}>{Number(rec.km).toLocaleString('tr-TR')} km</span>}
                    </div>
                    <div style={{ fontWeight: 700, color: '#2563eb', fontSize: '1.1rem' }}>₺{Number(rec.totalAmount || 0).toFixed(2)}</div>
                  </div>
                  {rec.items && rec.items.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {rec.items.map((item: any) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                              {item.itemType === 'OPERATION' ? '🔧' : '📦'} {item.name}
                            </td>
                            <td style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', color: '#64748b', textAlign: 'right' }}>
                              {item.quantity} x ₺{Number(item.unitPrice || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', fontWeight: 600, textAlign: 'right', width: '100px' }}>
                              ₺{Number(item.total || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
              <div style={{ textAlign: 'right', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', paddingTop: '0.5rem', borderTop: '2px solid #e2e8f0' }}>
                Bakım Toplamı: <span style={{ color: '#2563eb' }}>₺{data.summary.totalMaintenance.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Service Orders */}
          {data.serviceOrders.length > 0 && (
            <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
                🔧 İş Emirleri ({data.serviceOrders.length})
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={S.th}>Tarih</th>
                    <th style={S.th}>İşlem No</th>
                    <th style={S.th}>Durum</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>Parça</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>İşçilik</th>
                    <th style={{ ...S.th, textAlign: 'right' }}>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {data.serviceOrders.map((so: any) => (
                    <tr key={so.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={S.td}>{so.createdAt ? new Date(so.createdAt).toLocaleDateString('tr-TR') : '-'}</td>
                      <td style={S.td}><strong>{so.orderNumber}</strong></td>
                      <td style={S.td}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem', 
                          fontWeight: 600,
                          background: so.status === 'DELIVERED' ? '#dcfce7' : '#fef3c7',
                          color: so.status === 'DELIVERED' ? '#166534' : '#92400e',
                        }}>
                          {so.status}
                        </span>
                      </td>
                      <td style={{ ...S.td, textAlign: 'right' }}>₺{Number(so.partsTotal || 0).toFixed(2)}</td>
                      <td style={{ ...S.td, textAlign: 'right' }}>₺{Number(so.laborTotal || 0).toFixed(2)}</td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: 700 }}>₺{Number(so.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ textAlign: 'right', fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', paddingTop: '0.5rem', marginTop: '0.5rem', borderTop: '2px solid #e2e8f0' }}>
                İş Emri Toplamı: <span style={{ color: '#2563eb' }}>₺{data.summary.totalServiceOrders.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Grand Total */}
          <div style={{ background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: 'white', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
            <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>GENEL TOPLAM</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>₺{data.summary.totalSpent.toFixed(2)}</div>
          </div>
        </>
      )}
    </Layout>
  );
}

// ============================================================================
// Settings page
// ============================================================================
function SettingsPage() {
  const [serverUrl, setServerUrl] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  const [appInfo, setAppInfo] = useState<any>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!bridge) return;
    bridge.getConfig().then((c) => { setServerUrl(c.serverUrl || ''); setDeviceKey(c.deviceKey || ''); });
    bridge.info().then(setAppInfo).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!bridge) return;
    await bridge.setConfig({ serverUrl: serverUrl.trim().replace(/\/+$/, '') });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout title="Ayarlar">
      <div style={{ maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={S.card}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Sunucu Bağlantısı</h3>
          <label style={S.label}>Sunucu Adresi</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input style={S.input} value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} placeholder="https://api.otoservisapp.com" />
            <button onClick={handleSave} style={S.btnPrimary}>Kaydet</button>
          </div>
          {saved && <div style={{ color: '#16a34a', fontSize: '0.85rem', marginTop: '0.5rem' }}>✓ Kaydedildi</div>}
          <p style={{ fontSize: '0.82rem', color: '#9ca3af', marginTop: '0.75rem' }}>
            Verilerinizin senkronize edildiği merkezi sunucu adresi.
          </p>
        </div>

        <div style={S.card}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>Cihaz Bilgisi</h3>
          <div style={{ fontSize: '0.9rem', color: '#374151', display: 'grid', gap: '0.4rem' }}>
            <div><strong>Cihaz Anahtarı:</strong> <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{deviceKey || 'Giriş yapınca otomatik oluşturulur'}</span></div>
            {appInfo && (
              <>
                <div><strong>Sürüm:</strong> {appInfo.version}</div>
                <div><strong>Platform:</strong> {appInfo.platform}</div>
                <div><strong>Veri Konumu:</strong> Bu bilgisayarda (SQLite) — internet olmadan da çalışır</div>
              </>
            )}
          </div>
        </div>

        <div style={S.card}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Senkronizasyon</h3>
          <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
            Değişiklikler her 30 saniyede bir otomatik olarak buluta gönderilir ve buluttaki güncellemeler
            indirilir. Üstteki durum çubuğundan bağlantı durumunu görebilir, "Senkronize Et" ile elle
            tetikleyebilirsiniz (Ctrl+S).
          </p>
        </div>
      </div>
    </Layout>
  );
}

// ============================================================================
// Fallback screen when not running inside Electron
// ============================================================================
function NotElectronScreen() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: '2rem' }}>
      <div style={{ ...S.card, maxWidth: '480px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.75rem' }}>OtoServisApp Masaüstü Uygulaması</h2>
        <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
          Bu uygulama Electron içinde çalışmak üzere tasarlandı. Geliştirme için:<br />
          <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>pnpm --filter @otoservis/desktop electron:dev</code>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Vehicle Check-in Page (Araç Kabul - Quick Intake)
// ============================================================================
function VehicleCheckInPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [vehicleData, setVehicleData] = useState({ plate: '', brand: '', model: '', year: '', km: '', color: '' });
  const [complaint, setComplaint] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bridge) bridge.list('customers', { q: '', page: 1, limit: 1000 }).then((r) => setCustomers(r.data));
  }, []);

  const filteredCustomers = searchQuery
    ? customers.filter((c) =>
        (c.phone || '').includes(searchQuery) ||
        (c.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.lastName || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSubmit = async () => {
    if (!selectedCustomer || !vehicleData.plate) return;
    setSaving(true);
    try {
      const plateNormalized = vehicleData.plate.replace(/\s+/g, '').toUpperCase();
      // Find or create vehicle
      let vehicleRes = await bridge!.list('vehicles', { q: plateNormalized, page: 1, limit: 1 });
      let vehicleId = vehicleRes.data[0]?.id;
      if (!vehicleId) {
        const v = await bridge!.create('vehicles', {
          customerId: selectedCustomer.id,
          plate: plateNormalized,
          brand: vehicleData.brand,
          model: vehicleData.model,
          year: vehicleData.year ? Number(vehicleData.year) : null,
          km: vehicleData.km ? Number(vehicleData.km) : null,
          color: vehicleData.color,
        });
        vehicleId = v.id;
      }
      // Create service order
      const order = await bridge!.create('service_orders', {
        customerId: selectedCustomer.id,
        vehicleId,
        km: vehicleData.km ? Number(vehicleData.km) : null,
        customerComplaint: complaint,
        status: 'RECEIVED',
      });
      navigate(`/service-orders/${order.id}`);
    } catch (err: any) {
      alert(err.message || 'Hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout title="Araç Kabul">
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', alignItems: 'center', justifyContent: 'center' }}>
          {[{ n: 1, label: 'Müşteri', icon: '👤' }, { n: 2, label: 'Araç', icon: '🚗' }, { n: 3, label: 'Şikayet', icon: '📝' }].map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', borderRadius: '8px',
                background: step >= s.n ? '#2563eb' : '#f1f5f9',
                color: step >= s.n ? 'white' : '#94a3b8',
                fontWeight: step === s.n ? 700 : 500, fontSize: '0.9rem',
              }}>
                <span>{s.icon}</span>
                <span>{s.label}</span>
              </div>
              {i < 2 && <div style={{ width: '30px', height: '2px', background: step > s.n ? '#2563eb' : '#e2e8f0' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Customer */}
        {step === 1 && (
          <div style={S.card}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Müşteri Seçimi</h3>
            <input style={{ ...S.input, marginBottom: '1rem', fontSize: '1.1rem' }}
              placeholder="Telefon veya isim ile ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {filteredCustomers.length > 0 && (
              <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '1rem' }}>
                {filteredCustomers.map((c) => (
                  <div key={c.id} onClick={() => { setSelectedCustomer(c); setStep(2); }}
                    style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{c.phone}</div>
                    </div>
                    <span style={{ color: '#2563eb', fontSize: '0.85rem' }}>Seç →</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '1rem' }}>
              veya yeni müşteri için <strong>Müşteriler</strong> sayfasından ekleyin
            </div>
          </div>
        )}

        {/* Step 2: Vehicle */}
        {step === 2 && (
          <div style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Araç Bilgileri</h3>
              <button onClick={() => setStep(1)} style={{ ...S.btnSecondary, fontSize: '0.8rem' }}>← Müşteri Değiştir</button>
            </div>
            <div style={{ background: '#f0fdf4', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#166534' }}>Müşteri:</span>
              <strong style={{ marginLeft: '0.5rem' }}>{selectedCustomer?.firstName} {selectedCustomer?.lastName}</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={S.label}>Plaka *</label>
                <input style={{ ...S.input, fontSize: '1.3rem', fontWeight: 700, letterSpacing: '2px', textAlign: 'center' }}
                  value={vehicleData.plate}
                  onChange={(e) => setVehicleData({ ...vehicleData, plate: e.target.value.toUpperCase() })}
                  placeholder="34ABC123"
                />
              </div>
              <div><label style={S.label}>Marka</label><input style={S.input} value={vehicleData.brand} onChange={(e) => setVehicleData({ ...vehicleData, brand: e.target.value })} placeholder="Toyota" /></div>
              <div><label style={S.label}>Model</label><input style={S.input} value={vehicleData.model} onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })} placeholder="Corolla" /></div>
              <div><label style={S.label}>Yıl</label><input style={S.input} type="number" value={vehicleData.year} onChange={(e) => setVehicleData({ ...vehicleData, year: e.target.value })} placeholder="2020" /></div>
              <div><label style={S.label}>KM</label><input style={S.input} type="number" value={vehicleData.km} onChange={(e) => setVehicleData({ ...vehicleData, km: e.target.value })} placeholder="85000" /></div>
              <div><label style={S.label}>Renk</label><input style={S.input} value={vehicleData.color} onChange={(e) => setVehicleData({ ...vehicleData, color: e.target.value })} placeholder="Beyaz" /></div>
            </div>
            <button onClick={() => { if (vehicleData.plate) setStep(3); }} style={{ ...S.btnPrimary, width: '100%', marginTop: '1rem' }}>
              Devam →
            </button>
          </div>
        )}

        {/* Step 3: Complaint */}
        {step === 3 && (
          <div style={S.card}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Müşteri Şikayeti</h3>
            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div><span style={{ color: '#64748b' }}>Müşteri:</span> <strong>{selectedCustomer?.firstName} {selectedCustomer?.lastName}</strong></div>
              <div><span style={{ color: '#64748b' }}>Araç:</span> <strong style={{ letterSpacing: '1px' }}>{vehicleData.plate}</strong> {vehicleData.brand} {vehicleData.model}</div>
            </div>
            <label style={S.label}>Müşterinin şikayeti / aracın sorunu *</label>
            <textarea style={{ ...S.input, minHeight: '120px', fontSize: '1rem', lineHeight: 1.6 }}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              placeholder="Müşteri ne dedi? Araçta ne sorun var?&#10;&#10;örn: Frenlerden ses geliyor, yüksek hızda titreme yapıyor..."
            />
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button onClick={() => setStep(2)} style={{ ...S.btnSecondary, flex: 1 }}>← Geri</button>
              <button onClick={handleSubmit} disabled={saving || !complaint.trim()}
                style={{ ...S.btnPrimary, flex: 2, background: '#16a34a', opacity: (saving || !complaint.trim()) ? 0.5 : 1 }}>
                {saving ? 'Oluşturuluyor...' : '✓ İş Emri Oluştur'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

// ============================================================================
// Estimates Page (Teklifler)
// ============================================================================
function EstimatesPage() {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load estimates from API/local DB
    setLoading(false);
  }, []);

  return (
    <Layout title="Teklifler">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Müşterilere verilen fiyat teklifleri</div>
        <button style={S.btnPrimary}>+ Yeni Teklif</button>
      </div>
      <div style={{ ...S.card, textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Teklif Yönetimi</h3>
        <p style={{ color: '#64748b', lineHeight: 1.6 }}>
          İş emirlerinden teklif oluşturabilirsiniz.<br />
          Müşteriye fiyat vermeden önce teklif hazırlayın.
        </p>
      </div>
    </Layout>
  );
}

// ============================================================================
// Invoices Page (Faturalar)
// ============================================================================
function InvoicesPage() {
  return (
    <Layout title="Faturalar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Kesilen faturalar ve ödeme takibi</div>
        <button style={S.btnPrimary}>+ Yeni Fatura</button>
      </div>
      <div style={{ ...S.card, textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧾</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Fatura Yönetimi</h3>
        <p style={{ color: '#64748b', lineHeight: 1.6 }}>
          Tamamlanan iş emirlerinden fatura oluşturun.<br />
          Ödeme durumu ve cari hesap takibi yapın.
        </p>
      </div>
    </Layout>
  );
}

// ============================================================================
// Receivables Page (Cari Hesaplar - Alacak Takibi)
// ============================================================================
function ReceivablesPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'debt' | 'credit' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  const loadData = useCallback(async () => {
    if (!bridge) return;
    try {
      // Load all customers
      const custRes = await bridge.list('customers', { q: '', page: 1, limit: 1000 });
      const customersList = custRes.data;
      
      // Load all service orders
      const ordersRes = await bridge.list('service_orders', { q: '', page: 1, limit: 1000 });
      const orders = ordersRes.data;
      
      // Group orders by customer and calculate balances
      const customerMap = new Map<string, any>();
      
      for (const c of customersList) {
        customerMap.set(c.id, {
          ...c,
          totalDebt: 0,
          totalPaid: 0,
          remainingBalance: 0,
          orderCount: 0,
          lastServiceDate: null,
        });
      }
      
      for (const order of orders) {
        const custId = order.customerId;
        if (!customerMap.has(custId)) continue;
        
        const cust = customerMap.get(custId);
        const totalAmount = Number(order.totalAmount || 0);
        const paidAmount = Number(order.paidAmount || 0);
        const remaining = totalAmount - paidAmount;
        
        cust.totalDebt += totalAmount;
        cust.totalPaid += paidAmount;
        cust.remainingBalance += remaining;
        cust.orderCount += 1;
        
        if (!cust.lastServiceDate || new Date(order.createdAt) > new Date(cust.lastServiceDate)) {
          cust.lastServiceDate = order.createdAt;
        }
      }
      
      setCustomers(Array.from(customerMap.values()));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleViewCustomer = async (customer: any) => {
    if (!bridge) return;
    setSelectedCustomer(customer);
    const ordersRes = await bridge.list('service_orders', { q: '', page: 1, limit: 100 });
    const custOrders = ordersRes.data
      .filter((o: any) => o.customerId === customer.id)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setCustomerOrders(custOrders);
  };

  const handleRecordPayment = async () => {
    if (!bridge || !selectedCustomer || !paymentAmount) return;
    const amount = Number(paymentAmount);
    
    // Find unpaid orders and apply payment
    const unpaidOrders = customerOrders.filter((o: any) => {
      const total = Number(o.totalAmount || 0);
      const paid = Number(o.paidAmount || 0);
      return total > paid;
    });
    
    let remaining = amount;
    for (const order of unpaidOrders) {
      if (remaining <= 0) break;
      const total = Number(order.totalAmount || 0);
      const paid = Number(order.paidAmount || 0);
      const orderRemaining = total - paid;
      const toPay = Math.min(remaining, orderRemaining);
      
      await bridge.update('service_orders', order.id, {
        paidAmount: paid + toPay,
        paymentStatus: (paid + toPay) >= total ? 'PAID' : 'PARTIAL',
      });
      remaining -= toPay;
    }
    
    setShowPayment(false);
    setPaymentAmount('');
    setPaymentNote('');
    
    // Reload data and refresh customer view
    await loadData();
    
    // Get updated customer data from the reloaded list
    const updatedCustomers = await bridge.list('customers', { q: '', page: 1, limit: 1000 });
    const updatedOrders = await bridge.list('service_orders', { q: '', page: 1, limit: 1000 });
    
    // Recalculate customer balance
    const custId = selectedCustomer.id;
    let totalDebt = 0;
    let totalPaid = 0;
    
    for (const order of updatedOrders.data) {
      if (order.customerId === custId) {
        totalDebt += Number(order.totalAmount || 0);
        totalPaid += Number(order.paidAmount || 0);
      }
    }
    
    const updatedCustomer = {
      ...selectedCustomer,
      totalDebt,
      totalPaid,
      remainingBalance: totalDebt - totalPaid,
    };
    
    setSelectedCustomer(updatedCustomer);
    
    // Refresh customer orders
    const custOrders = updatedOrders.data
      .filter((o: any) => o.customerId === custId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setCustomerOrders(custOrders);
  };

  const filteredCustomers = customers
    .filter((c) => {
      if (filter === 'debt') return c.remainingBalance > 0;
      if (filter === 'credit') return c.remainingBalance < 0;
      if (filter === 'paid') return c.remainingBalance === 0 && c.totalDebt > 0;
      return true;
    })
    .filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (c.firstName || '').toLowerCase().includes(q) ||
        (c.lastName || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q)
      );
    });

  const totalReceivable = customers.reduce((s, c) => s + (c.totalDebt || 0), 0);
  const totalPaid = customers.reduce((s, c) => s + (c.totalPaid || 0), 0);
  const totalRemaining = customers.reduce((s, c) => s + (c.remainingBalance || 0), 0);
  const debtCount = customers.filter((c) => c.remainingBalance > 0).length;

  return (
    <Layout title="Cari Hesaplar">
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ ...S.card, textAlign: 'center', borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Toplam Fatura</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#2563eb' }}>₺{totalReceivable.toLocaleString('tr-TR')}</div>
        </div>
        <div style={{ ...S.card, textAlign: 'center', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Toplam Tahsilat</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#16a34a' }}>₺{totalPaid.toLocaleString('tr-TR')}</div>
        </div>
        <div style={{ ...S.card, textAlign: 'center', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Kalan Alacak</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#dc2626' }}>₺{totalRemaining.toLocaleString('tr-TR')}</div>
          <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>{debtCount} müşteri</div>
        </div>
        <div style={{ ...S.card, textAlign: 'center', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Toplam Müşteri</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#7c3aed' }}>{customers.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { key: 'all', label: 'Tümü', count: customers.length },
            { key: 'debt', label: 'Borçlu', count: customers.filter(c => c.remainingBalance > 0).length },
            { key: 'paid', label: 'Ödendi', count: customers.filter(c => c.remainingBalance === 0 && c.totalDebt > 0).length },
          ].map((f) => (
            <button key={f.key}
              onClick={() => setFilter(f.key as any)}
              style={{
                padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer',
                border: filter === f.key ? '1px solid #2563eb' : '1px solid #d1d5db',
                background: filter === f.key ? '#eff6ff' : 'white',
                color: filter === f.key ? '#2563eb' : '#374151',
                fontWeight: filter === f.key ? 600 : 400,
              }}>
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        <input
          style={{ ...S.input, width: '250px' }}
          placeholder="Müşteri ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Customer List */}
      <div style={{ ...S.card, overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              <th style={{ ...S.th, fontSize: '0.8rem', fontWeight: 600 }}>Müşteri</th>
              <th style={{ ...S.th, fontSize: '0.8rem', fontWeight: 600 }}>Telefon</th>
              <th style={{ ...S.th, fontSize: '0.8rem', fontWeight: 600, textAlign: 'right' }}>Toplam Borç</th>
              <th style={{ ...S.th, fontSize: '0.8rem', fontWeight: 600, textAlign: 'right' }}>Ödenen</th>
              <th style={{ ...S.th, fontSize: '0.8rem', fontWeight: 600, textAlign: 'right' }}>Kalan</th>
              <th style={{ ...S.th, fontSize: '0.8rem', fontWeight: 600 }}>Son İşlem</th>
              <th style={{ ...S.th, fontSize: '0.8rem', fontWeight: 600, textAlign: 'center' }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length === 0 ? (
              <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Kayıt bulunamadı</td></tr>
            ) : (
              filteredCustomers.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => handleViewCustomer(c)}>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600 }}>{c.firstName} {c.lastName}</div>
                  </td>
                  <td style={S.td}>{c.phone || '-'}</td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>
                    ₺{c.totalDebt.toLocaleString('tr-TR')}
                  </td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                    ₺{c.totalPaid.toLocaleString('tr-TR')}
                  </td>
                  <td style={{ ...S.td, textAlign: 'right', fontWeight: 600, color: c.remainingBalance > 0 ? '#dc2626' : '#16a34a' }}>
                    ₺{c.remainingBalance.toLocaleString('tr-TR')}
                  </td>
                  <td style={S.td}>{c.lastServiceDate ? new Date(c.lastServiceDate).toLocaleDateString('tr-TR') : '-'}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    {c.remainingBalance > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleViewCustomer(c); setShowPayment(true); }}
                        style={{ ...S.btnPrimary, padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#16a34a' }}>
                        Ödeme Al
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedCustomer(null)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', maxWidth: '800px', width: '90%', maxHeight: '80vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{selectedCustomer.firstName} {selectedCustomer.lastName}</h3>
              <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Toplam Borç</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2563eb' }}>₺{selectedCustomer.totalDebt.toLocaleString('tr-TR')}</div>
              </div>
              <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Toplam Ödenen</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#16a34a' }}>₺{selectedCustomer.totalPaid.toLocaleString('tr-TR')}</div>
              </div>
              <div style={{ padding: '1rem', background: selectedCustomer.remainingBalance > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.25rem' }}>Kalan Borç</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: selectedCustomer.remainingBalance > 0 ? '#dc2626' : '#16a34a' }}>₺{selectedCustomer.remainingBalance.toLocaleString('tr-TR')}</div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Servis Kayıtları ({customerOrders.length})</div>
              {customerOrders.length === 0 ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8' }}>Servis kaydı bulunmuyor</div>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  {customerOrders.map((order, idx) => {
                    const total = Number(order.totalAmount || 0);
                    const paid = Number(order.paidAmount || 0);
                    const remaining = total - paid;
                    return (
                      <div key={order.id} style={{ padding: '0.75rem', borderBottom: idx < customerOrders.length - 1 ? '1px solid #e2e8f0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>#{order.orderNumber || order.id}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>₺{total.toLocaleString('tr-TR')}</div>
                          <div style={{ fontSize: '0.75rem', color: remaining > 0 ? '#dc2626' : '#16a34a' }}>
                            {remaining > 0 ? `Kalan: ₺${remaining.toLocaleString('tr-TR')}` : 'Ödendi'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedCustomer.remainingBalance > 0 && (
              <button onClick={() => setShowPayment(true)} style={{ ...S.btnPrimary, width: '100%' }}>
                Ödeme Kaydet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && selectedCustomer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001 }} onClick={() => setShowPayment(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', maxWidth: '400px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Ödeme Kaydet</h3>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Müşteri: {selectedCustomer.firstName} {selectedCustomer.lastName}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem' }}>Kalan Borç: <strong style={{ color: '#dc2626' }}>₺{selectedCustomer.remainingBalance.toLocaleString('tr-TR')}</strong></div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Ödeme Tutarı</label>
              <input type="number" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} style={S.input} placeholder="0.00" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Not (opsiyonel)</label>
              <input type="text" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} style={S.input} placeholder="Ödeme notu..." />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowPayment(false)} style={{ ...S.btnSecondary, flex: 1 }}>İptal</button>
              <button onClick={handleRecordPayment} style={{ ...S.btnPrimary, flex: 1 }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

// ============================================================================
// Financial Dashboard Page (Ön Muhasebe)
// ============================================================================
function FinancialDashboardPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [financialData, setFinancialData] = useState<any>({
    income: 0,
    expenses: 0,
    profit: 0,
    orders: [],
    paidOrders: 0,
    unpaidOrders: 0,
    totalPaid: 0,
    totalUnpaid: 0,
  });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Kira',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!bridge) return;
    loadFinancialData();
  }, [period, selectedDate, bridge]);

  const loadFinancialData = async () => {
    if (!bridge) return;
    try {
      const ordersRes = await bridge.list('service_orders', { q: '', page: 1, limit: 10000 });
      const orders = ordersRes.data;

      let expenses: any[] = [];
      try {
        const expensesRes = await bridge.list('expenses', { q: '', page: 1, limit: 10000 });
        expenses = expensesRes.data;
      } catch (err) {
        console.warn('Expenses table may not exist yet:', err);
      }

      // Filter orders by period
      const now = new Date(selectedDate);
      let startDate: Date;
      let endDate: Date;

      if (period === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      } else if (period === 'weekly') {
        const dayOfWeek = now.getDay();
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
      } else if (period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      } else {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
      }

      const filteredOrders = orders.filter((o: any) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= startDate && orderDate < endDate;
      });

      const filteredExpenses = expenses.filter((e: any) => {
        const expenseDate = new Date(e.expenseDate);
        return expenseDate >= startDate && expenseDate < endDate;
      });

      // Calculate totals
      let totalIncome = 0;
      let totalPaid = 0;
      let paidCount = 0;
      let unpaidCount = 0;

      for (const order of filteredOrders) {
        const totalAmount = Number(order.totalAmount || 0);
        const paidAmount = Number(order.paidAmount || 0);
        totalIncome += totalAmount;
        totalPaid += paidAmount;
        
        if (order.status === 'COMPLETED') {
          if (paidAmount >= totalAmount) paidCount++;
          else unpaidCount++;
        }
      }

      let totalExpenses = 0;
      for (const expense of filteredExpenses) {
        totalExpenses += Number(expense.amount || 0);
      }

      setFinancialData({
        income: totalIncome,
        expenses: totalExpenses,
        profit: totalIncome - totalExpenses,
        orders: filteredOrders,
        paidOrders: paidCount,
        unpaidOrders: unpaidCount,
        totalPaid: totalPaid,
        totalUnpaid: totalIncome - totalPaid,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddExpense = async () => {
    if (!bridge || !expenseForm.amount) return;
    try {
      await bridge.create('expenses', {
        category: expenseForm.category,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        expenseDate: expenseForm.expenseDate,
      });
      setShowExpenseForm(false);
      setExpenseForm({
        category: 'Kira',
        description: '',
        amount: '',
        expenseDate: new Date().toISOString().split('T')[0],
      });
      loadFinancialData();
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (date: Date) => {
    if (period === 'daily') return date.toLocaleDateString('tr-TR');
    if (period === 'weekly') return `${date.toLocaleDateString('tr-TR')}`;
    if (period === 'monthly') return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    return date.getFullYear().toString();
  };

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (period === 'daily') newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    else if (period === 'weekly') newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    else if (period === 'monthly') newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    else newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  return (
    <Layout title="Ön Muhasebe">
      {/* Period Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {[
            { key: 'daily', label: 'Günlük' },
            { key: 'weekly', label: 'Haftalık' },
            { key: 'monthly', label: 'Aylık' },
            { key: 'yearly', label: 'Yıllık' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key as any)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: period === p.key ? '2px solid #2563eb' : '1px solid #d1d5db',
                background: period === p.key ? '#eff6ff' : 'white',
                color: period === p.key ? '#2563eb' : '#374151',
                fontWeight: period === p.key ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigatePeriod('prev')} style={{ ...S.btnSecondary, padding: '0.4rem 0.8rem' }}>←</button>
          <div style={{ fontSize: '1rem', fontWeight: 600, minWidth: '200px', textAlign: 'center' }}>
            {formatDate(selectedDate)}
          </div>
          <button onClick={() => navigatePeriod('next')} style={{ ...S.btnSecondary, padding: '0.4rem 0.8rem' }}>→</button>
          <button onClick={() => setShowExpenseForm(true)} style={{ ...S.btnPrimary, padding: '0.5rem 1rem' }}>
            + Gider Ekle
          </button>
        </div>
      </div>

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowExpenseForm(false)}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', maxWidth: '500px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>Yeni Gider Ekle</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Kategori</label>
              <select 
                value={expenseForm.category} 
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                style={S.input}
              >
                <option value="Kira">Kira</option>
                <option value="Elektrik">Elektrik</option>
                <option value="Su">Su</option>
                <option value="Doğalgaz">Doğalgaz</option>
                <option value="Maaş">Maaş</option>
                <option value="Parça Alımı">Parça Alımı</option>
                <option value="Bakım/Onarım">Bakım/Onarım</option>
                <option value="Vergi">Vergi</option>
                <option value="Sigorta">Sigorta</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Açıklama</label>
              <input 
                type="text" 
                value={expenseForm.description} 
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                style={S.input}
                placeholder="Gider açıklaması..."
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tutar</label>
              <input 
                type="number" 
                step="0.01" 
                value={expenseForm.amount} 
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                style={S.input}
                placeholder="0.00"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tarih</label>
              <input 
                type="date" 
                value={expenseForm.expenseDate} 
                onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                style={S.input}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => setShowExpenseForm(false)} style={{ ...S.btnSecondary, flex: 1 }}>İptal</button>
              <button onClick={handleAddExpense} style={{ ...S.btnPrimary, flex: 1 }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ ...S.card, borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Toplam Gelir</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#16a34a' }}>₺{financialData.income.toLocaleString('tr-TR')}</div>
        </div>
        <div style={{ ...S.card, borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Toplam Gider</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#dc2626' }}>₺{financialData.expenses.toLocaleString('tr-TR')}</div>
        </div>
        <div style={{ ...S.card, borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Net Kâr</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#2563eb' }}>₺{financialData.profit.toLocaleString('tr-TR')}</div>
        </div>
        <div style={{ ...S.card, borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Servis Sayısı</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#7c3aed' }}>{financialData.orders.length}</div>
        </div>
      </div>

      {/* Payment Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ ...S.card }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', margin: '0 0 1rem 0' }}>Tahsilat Durumu</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: '#64748b' }}>Tahsil Edilen</span>
            <span style={{ fontWeight: 600, color: '#16a34a' }}>₺{financialData.totalPaid.toLocaleString('tr-TR')}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: '#64748b' }}>Kalan Alacak</span>
            <span style={{ fontWeight: 600, color: '#dc2626' }}>₺{financialData.totalUnpaid.toLocaleString('tr-TR')}</span>
          </div>
          <div style={{ marginTop: '1rem', background: '#f1f5f9', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
            <div style={{
              width: `${financialData.income > 0 ? (financialData.totalPaid / financialData.income) * 100 : 0}%`,
              height: '100%',
              background: '#16a34a',
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'center' }}>
            %{financialData.income > 0 ? Math.round((financialData.totalPaid / financialData.income) * 100) : 0} Tahsil Edildi
          </div>
        </div>

        <div style={{ ...S.card }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', margin: '0 0 1rem 0' }}>Ödeme Durumu</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: '#64748b' }}>Ödemesi Tamamlanan</span>
            <span style={{ fontWeight: 600, color: '#16a34a' }}>{financialData.paidOrders} servis</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ color: '#64748b' }}>Bekleyen Ödeme</span>
            <span style={{ fontWeight: 600, color: '#ea580c' }}>{financialData.unpaidOrders} servis</span>
          </div>
          <div style={{ marginTop: '1rem', background: '#f1f5f9', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
            <div style={{
              width: `${financialData.orders.length > 0 ? (financialData.paidOrders / financialData.orders.length) * 100 : 0}%`,
              height: '100%',
              background: '#16a34a',
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'center' }}>
            %{financialData.orders.length > 0 ? Math.round((financialData.paidOrders / financialData.orders.length) * 100) : 0} Tamamlandı
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Son Servis Kayıtları</h3>
        </div>
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          {financialData.orders.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
              Bu dönem için servis kaydı bulunmuyor
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ ...S.th, fontSize: '0.8rem' }}>Tarih</th>
                  <th style={{ ...S.th, fontSize: '0.8rem' }}>Servis No</th>
                  <th style={{ ...S.th, fontSize: '0.8rem', textAlign: 'right' }}>Tutar</th>
                  <th style={{ ...S.th, fontSize: '0.8rem', textAlign: 'right' }}>Ödenen</th>
                  <th style={{ ...S.th, fontSize: '0.8rem', textAlign: 'center' }}>Durum</th>
                </tr>
              </thead>
              <tbody>
                {financialData.orders.slice(0, 20).map((order: any) => {
                  const total = Number(order.totalAmount || 0);
                  const paid = Number(order.paidAmount || 0);
                  const remaining = total - paid;
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={S.td}>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</td>
                      <td style={S.td}>#{order.orderNumber || order.id}</td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: 600 }}>₺{total.toLocaleString('tr-TR')}</td>
                      <td style={{ ...S.td, textAlign: 'right', color: '#16a34a' }}>₺{paid.toLocaleString('tr-TR')}</td>
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '999px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: remaining === 0 ? '#f0fdf4' : '#fef2f2',
                          color: remaining === 0 ? '#16a34a' : '#dc2626',
                        }}>
                          {remaining === 0 ? 'Ödendi' : 'Bakiye Var'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}

// ============================================================================
// Suppliers Page (Tedarikçiler)
// ============================================================================
function SuppliersPage() {
  return (
    <Layout title="Tedarikçiler">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Parça ve malzeme tedarikçileri</div>
        <button style={S.btnPrimary}>+ Yeni Tedarikçi</button>
      </div>
      <div style={{ ...S.card, textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏭</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Tedarikçi Yönetimi</h3>
        <p style={{ color: '#64748b' }}>Parça tedarikçileri, iletişim bilgileri, sipariş geçmişi</p>
      </div>
    </Layout>
  );
}

// ============================================================================
// App root
// ============================================================================
export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [hasServer, setHasServer] = useState<boolean | null>(null);

  useEffect(() => {
    if (!bridge) { setBooting(false); return; }
    (async () => {
      const cfg = await bridge.getConfig().catch(() => ({ serverUrl: null, deviceKey: null }));
      setHasServer(!!cfg.serverUrl);
      if (cfg.serverUrl) {
        const u = await bridge.currentUser().catch(() => null);
        if (u) setUser(u);
      }
      setBooting(false);
    })();
  }, []);

  // Zoom shortcuts that work on every keyboard layout. The Electron menu's default
  // accelerators match physical key codes, which miss keys on e.g. the Turkish layout,
  // so zoom-out never fired. This handler matches the produced character instead,
  // and only receives keys the menu did not already consume.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || !(e.ctrlKey || e.metaKey)) return;
      const zoomIn = e.key === '+' || e.key === '=' || e.code === 'NumpadAdd';
      const zoomOut = e.key === '-' || e.key === '_' || e.code === 'NumpadSubtract';
      const reset = e.key === '0' || e.code === 'Numpad0';
      if (!zoomIn && !zoomOut && !reset) return;
      e.preventDefault();
      if (zoomIn) applyZoom(currentZoomFactor() + 0.1);
      else if (zoomOut) applyZoom(currentZoomFactor() - 0.1);
      else applyZoom(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Restore the user's preferred zoom level on startup
  useEffect(() => {
    try {
      const saved = parseFloat(localStorage.getItem('otoservis:zoomFactor') || '');
      if (saved >= ZOOM_MIN && saved <= ZOOM_MAX) applyZoom(saved);
    } catch { /* ignore */ }
  }, []);

  if (!bridge) return <NotElectronScreen />;
  if (booting) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280' }}>OtoServisApp başlatılıyor...</div>
      </div>
    );
  }
  if (hasServer === false) return <SetupScreen onDone={() => setHasServer(true)} />;

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
          <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
          <Route path="/" element={user ? <DashboardPage /> : <Navigate to="/login" replace />} />
          <Route path="/customers" element={user ? <EntityPage defKey="customers" /> : <Navigate to="/login" replace />} />
          <Route path="/vehicles" element={user ? <EntityPage defKey="vehicles" /> : <Navigate to="/login" replace />} />
          <Route path="/vehicles/:id" element={user ? <VehicleDetailPage /> : <Navigate to="/login" replace />} />
          <Route path="/vehicle-history" element={user ? <VehicleHistoryPage /> : <Navigate to="/login" replace />} />
          <Route path="/service-orders" element={user ? <ServiceOrdersKanbanPage /> : <Navigate to="/login" replace />} />
          <Route path="/service-orders/new" element={user ? <NewServiceOrderPage /> : <Navigate to="/login" replace />} />
          <Route path="/service-orders/:id" element={user ? <ServiceOrderDetailPage /> : <Navigate to="/login" replace />} />
          <Route path="/maintenance" element={user ? <MaintenancePage /> : <Navigate to="/login" replace />} />
          <Route path="/maintenance/:id" element={user ? <MaintenanceDetailPage /> : <Navigate to="/login" replace />} />
          <Route path="/appointments" element={user ? <EntityPage defKey="appointments" /> : <Navigate to="/login" replace />} />
          <Route path="/inventory" element={user ? <EntityPage defKey="products" /> : <Navigate to="/login" replace />} />
          <Route path="/check-in" element={user ? <VehicleCheckInPage /> : <Navigate to="/login" replace />} />
          <Route path="/estimates" element={user ? <EstimatesPage /> : <Navigate to="/login" replace />} />
          <Route path="/invoices" element={user ? <InvoicesPage /> : <Navigate to="/login" replace />} />
          <Route path="/receivables" element={user ? <ReceivablesPage /> : <Navigate to="/login" replace />} />
          <Route path="/financial-dashboard" element={user ? <FinancialDashboardPage /> : <Navigate to="/login" replace />} />
          <Route path="/suppliers" element={user ? <SuppliersPage /> : <Navigate to="/login" replace />} />
          <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
}
