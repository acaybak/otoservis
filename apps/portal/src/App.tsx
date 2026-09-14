import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://otoservis-api.onrender.com/api/v1';

// ============================================================================
// Styles - Professional Clean Design
// ============================================================================
const S = {
  // Layout
  page: { minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' } as React.CSSProperties,
  
  // Header
  header: (bg?: string) => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem',
    background: bg || 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  }) as React.CSSProperties,
  logo: { fontSize: '1.25rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' } as React.CSSProperties,
  headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' } as React.CSSProperties,
  headerPhone: { color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' } as React.CSSProperties,
  
  // Hero
  hero: { padding: '4rem 2rem', textAlign: 'center' as const, background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #3b82f6 100%)', color: 'white' } as React.CSSProperties,
  heroTitle: { fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.02em' } as React.CSSProperties,
  heroSub: { fontSize: '1.1rem', color: 'rgba(255,255,255,0.75)', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' } as React.CSSProperties,
  
  // Search
  searchCard: { maxWidth: '520px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } as React.CSSProperties,
  searchLabel: { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' } as React.CSSProperties,
  searchInput: { width: '100%', padding: '0.85rem 1rem', fontSize: '1.1rem', borderRadius: '10px', border: '2px solid #e2e8f0', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' as const } as React.CSSProperties,
  searchBtn: { width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: '600', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', cursor: 'pointer', marginTop: '1rem', transition: 'transform 0.1s' } as React.CSSProperties,
  error: { marginTop: '0.75rem', padding: '0.65rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', textAlign: 'center' as const, fontSize: '0.9rem' } as React.CSSProperties,
  
  // Features
  features: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto' } as React.CSSProperties,
  featureCard: { background: 'white', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' as const, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' } as React.CSSProperties,
  featureIcon: { fontSize: '2rem', marginBottom: '0.75rem' } as React.CSSProperties,
  featureTitle: { fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.35rem' } as React.CSSProperties,
  featureDesc: { fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' } as React.CSSProperties,
  
  // Footer
  footer: { textAlign: 'center' as const, padding: '1.5rem 2rem', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '0.8rem' } as React.CSSProperties,
  
  // Content pages
  contentPage: { background: '#f8fafc', minHeight: '100vh' } as React.CSSProperties,
  contentHeader: (bg?: string) => ({
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1rem 2rem', background: bg || '#1e40af',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  }) as React.CSSProperties,
  contentMain: { padding: '2rem', maxWidth: '960px', margin: '0 auto' } as React.CSSProperties,
  card: { background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' } as React.CSSProperties,
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' } as React.CSSProperties,
  statCard: (color: string) => ({ background: 'white', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `3px solid ${color}` }) as React.CSSProperties,
  statLabel: { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '500' } as React.CSSProperties,
  statValue: (color: string) => ({ fontSize: '1.4rem', fontWeight: '700', color }) as React.CSSProperties,
  table: { width: '100%', borderCollapse: 'collapse' as const } as React.CSSProperties,
  th: { padding: '0.65rem 0.75rem', textAlign: 'left' as const, fontSize: '0.8rem', color: '#64748b', fontWeight: '600', borderBottom: '2px solid #e2e8f0' } as React.CSSProperties,
  td: { padding: '0.65rem 0.75rem', fontSize: '0.9rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9' } as React.CSSProperties,
  printBtn: { padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: '600', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)' } as React.CSSProperties,
};

// ============================================================================
// Home Page - Clean Plate Search
// ============================================================================
function HomePage() {
  const [tenantSlug, setTenantSlug] = useState('');
  const [plate, setPlate] = useState('');
  const [error, setError] = useState('');
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const host = window.location.hostname;
    const parts = host.split('.');
    let slug = '';
    if (parts.length > 2 && parts[0] !== 'localhost' && parts[0] !== 'www' && parts[0] !== 'portal-dist-opal') {
      slug = parts[0];
    }
    // Also check path-based slug
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 0 && pathParts[0] !== 'register') {
      slug = pathParts[0];
    }
    if (slug) {
      setTenantSlug(slug);
      fetch(`${API_BASE}/public/${slug}/info`)
        .then(res => res.ok ? res.json() : null)
        .then(data => { if (data) setTenantInfo(data); })
        .catch(() => {});
    }
  }, []);

  const handleSearch = () => {
    setError('');
    const trimmedPlate = plate.trim().toUpperCase().replace(/\s+/g, '');
    if (!tenantSlug) { setError('Servis bilgisi bulunamadı.'); return; }
    if (!trimmedPlate || trimmedPlate.length < 6) { setError('Geçerli bir plaka giriniz (örn: 34ABC123).'); return; }
    navigate(`/${tenantSlug}/vehicle/${encodeURIComponent(trimmedPlate)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const shopName = tenantInfo?.name || tenantSlug || 'OtoServis';
  const shopPhone = tenantInfo?.phone || '';
  const primaryColor = tenantInfo?.primaryColor || '#2563eb';

  return (
    <div style={S.page}>
      {/* Header */}
      <header style={S.header(primaryColor)}>
        <Link to="/" style={S.logo}>
          <span>🔧</span>
          <span>{shopName}</span>
        </Link>
        <div style={S.headerRight}>
          {shopPhone && (
            <span style={S.headerPhone}>📞 {shopPhone}</span>
          )}
        </div>
      </header>

      {/* Hero + Search */}
      <div style={S.hero}>
        <h1 style={S.heroTitle}>Aracınızın Bakım Geçmişini Sorgulayın</h1>
        <p style={S.heroSub}>Plakanızı girerek tüm bakım, onarım ve servis geçmişinizi görüntüleyin.</p>

        <div style={S.searchCard}>
          <label style={S.searchLabel}>Plaka Numarası</label>
          <input
            style={S.searchInput}
            type="text"
            placeholder="34 ABC 123"
            value={plate}
            onChange={e => setPlate(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            maxLength={20}
            autoFocus
          />
          <button
            style={S.searchBtn}
            onClick={handleSearch}
            onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.98)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🔍 Sorgula
          </button>
          {error && <div style={S.error}>{error}</div>}
        </div>
      </div>

      {/* Features */}
      <div style={S.features}>
        <div style={S.featureCard}>
          <div style={S.featureIcon}>📋</div>
          <div style={S.featureTitle}>Detaylı Bakım Geçmişi</div>
          <div style={S.featureDesc}>Aracınızın tüm bakım ve onarım kayıtlarını tarih, işlem ve tutar detaylarıyla görüntüleyin.</div>
        </div>
        <div style={S.featureCard}>
          <div style={S.featureIcon}>🔔</div>
          <div style={S.featureTitle}>Bakım Hatırlatmaları</div>
          <div style={S.featureDesc}>Bir sonraki bakımınızın ne zaman gelmesi gerektiğini kilometre ve tarih bazında öğrenin.</div>
        </div>
        <div style={S.featureCard}>
          <div style={S.featureIcon}>💰</div>
          <div style={S.featureTitle}>Maliyet Özeti</div>
          <div style={S.featureDesc}>Aracınıza yapılan toplam harcamayı ve her bakımın maliyetini şeffaf şekilde görün.</div>
        </div>
      </div>

      {/* Footer */}
      <footer style={S.footer}>
        <div style={{ fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>{shopName}</div>
        <div>© 2026 • OtoServisApp ile güçlendirilmiştir</div>
      </footer>
    </div>
  );
}

// ============================================================================
// Vehicle History Page
// ============================================================================
function VehicleHistoryPage() {
  const { tenantSlug, plate } = useParams<{ tenantSlug: string; plate: string }>();
  const [data, setData] = useState<any>(null);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!plate || !tenantSlug) return;
      setLoading(true);
      setError('');
      try {
        const [tenantRes, historyRes] = await Promise.all([
          fetch(`${API_BASE}/public/${tenantSlug}/info`),
          fetch(`${API_BASE}/public/${tenantSlug}/vehicle-history/${encodeURIComponent(plate)}`),
        ]);
        if (tenantRes.ok) setTenantInfo(await tenantRes.json());
        if (!historyRes.ok) {
          setError(historyRes.status === 404 ? 'Bu plakaya kayıtlı araç bulunamadı.' : 'Bir hata oluştu.');
          setLoading(false);
          return;
        }
        setData(await historyRes.json());
      } catch { setError('Sunucuya bağlanılamadı.'); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [plate, tenantSlug]);

  const primaryColor = tenantInfo?.primaryColor || '#2563eb';
  const shopName = tenantInfo?.name || tenantSlug || 'OtoServis';
  const shopPhone = tenantInfo?.phone || '';

  if (loading) return (
    <div style={S.contentPage}>
      <header style={S.contentHeader(primaryColor)}>
        <Link to="/" style={{ ...S.logo, color: 'white' }}><span>🔧</span><span>{shopName}</span></Link>
      </header>
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Yükleniyor...</div>
    </div>
  );

  if (error) return (
    <div style={S.contentPage}>
      <header style={S.contentHeader(primaryColor)}>
        <Link to="/" style={{ ...S.logo, color: 'white' }}><span>🔧</span><span>{shopName}</span></Link>
      </header>
      <div style={{ ...S.contentMain, textAlign: 'center' }}>
        <div style={{ ...S.card, maxWidth: '450px', margin: '3rem auto', padding: '2.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <div style={{ color: '#dc2626', fontSize: '1.1rem', marginBottom: '1rem' }}>{error}</div>
          <Link to="/" style={{ color: primaryColor, textDecoration: 'none', fontWeight: '600' }}>← Ana sayfaya dön</Link>
        </div>
      </div>
    </div>
  );

  if (!data) return null;
  const { vehicle, maintenanceRecords, serviceOrders, maintenanceSchedule, summary } = data;

  const handlePrint = () => {
    // Add print date to the page
    const printDate = new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    const printHeader = document.createElement('div');
    printHeader.className = 'print-date-header';
    printHeader.style.cssText = 'text-align: center; padding: 0.5rem; font-size: 10pt; color: #666; border-bottom: 1px solid #ddd; margin-bottom: 1rem;';
    printHeader.innerHTML = `Yazdırma Tarihi: ${printDate}`;
    document.body.insertBefore(printHeader, document.body.firstChild);
    
    // Print
    window.print();
    
    // Remove the header after printing
    setTimeout(() => {
      if (printHeader.parentNode) {
        printHeader.parentNode.removeChild(printHeader);
      }
    }, 1000);
  };

  return (
    <div style={S.contentPage}>
      <header style={S.contentHeader(primaryColor)}>
        <Link to="/" style={{ ...S.logo, color: 'white' }}><span>🔧</span><span>{shopName}</span></Link>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {shopPhone && <span style={S.headerPhone}>📞 {shopPhone}</span>}
          <button onClick={handlePrint} style={S.printBtn}>🖨️ Yazdır</button>
        </div>
      </header>

      <main style={S.contentMain}>
        {/* Vehicle Info */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', fontWeight: '500' }}>Araç Bilgileri</div>
              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b' }}>{vehicle.plate}</div>
              <div style={{ color: '#475569', marginTop: '0.15rem' }}>{vehicle.brand} {vehicle.model} {vehicle.year ? `• ${vehicle.year}` : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Kilometre</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '600', color: '#1e293b' }}>{vehicle.km ? `${Number(vehicle.km).toLocaleString('tr-TR')} km` : '-'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }}>Yakıt</div>
                <div style={{ fontSize: '1.15rem', fontWeight: '600', color: '#1e293b' }}>{vehicle.fuelType || '-'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={S.statGrid}>
          <div style={S.statCard(primaryColor)}>
            <div style={S.statLabel}>Toplam Bakım</div>
            <div style={S.statValue(primaryColor)}>{summary.maintenanceCount}</div>
          </div>
          <div style={S.statCard('#8b5cf6')}>
            <div style={S.statLabel}>İş Emri</div>
            <div style={S.statValue('#8b5cf6')}>{summary.serviceOrderCount}</div>
          </div>
          <div style={S.statCard('#10b981')}>
            <div style={S.statLabel}>Toplam Harcama</div>
            <div style={S.statValue('#10b981')}>₺{summary.totalSpent.toLocaleString('tr-TR')}</div>
          </div>
          <div style={S.statCard('#f59e0b')}>
            <div style={S.statLabel}>Son KM</div>
            <div style={S.statValue('#f59e0b')}>{summary.lastKm ? `${Number(summary.lastKm).toLocaleString('tr-TR')} km` : '-'}</div>
          </div>
        </div>

        {/* Maintenance Schedule */}
        {maintenanceSchedule.length > 0 && (
          <div style={S.card}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>📅 Bakım Takvimi</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {maintenanceSchedule.map((item: any, idx: number) => {
                const currentKm = vehicle.km || summary.lastKm || 0;
                const isOverdue = item.nextDueKm && currentKm > item.nextDueKm;
                const isDueSoon = item.nextDueKm && currentKm >= item.nextDueKm - 1000;
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', borderRadius: '8px', background: isOverdue ? '#fef2f2' : isDueSoon ? '#fefce8' : '#f8fafc', border: `1px solid ${isOverdue ? '#fecaca' : isDueSoon ? '#fef08a' : '#e2e8f0'}` }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{item.typeName}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Son: {item.lastKm ? `${Number(item.lastKm).toLocaleString('tr-TR')} km` : '-'}
                        {item.lastPerformedAt && ` • ${new Date(item.lastPerformedAt).toLocaleDateString('tr-TR')}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Sonraki</div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem', color: isOverdue ? '#dc2626' : isDueSoon ? '#d97706' : '#059669' }}>{item.nextDueKm ? `${Number(item.nextDueKm).toLocaleString('tr-TR')} km` : '-'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Maintenance Records */}
        {maintenanceRecords.length > 0 && (
          <div style={S.card}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>🔧 Bakım Kayıtları</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr><th style={S.th}>Tarih</th><th style={S.th}>Bakım Tipi</th><th style={{ ...S.th, textAlign: 'right' }}>KM</th><th style={{ ...S.th, textAlign: 'right' }}>Tutar</th></tr>
                </thead>
                <tbody>
                  {maintenanceRecords.map((r: any) => (
                    <tr key={r.id}>
                      <td style={S.td}>{r.performedAt ? new Date(r.performedAt).toLocaleDateString('tr-TR') : '-'}</td>
                      <td style={S.td}>{r.maintenanceType?.name || 'Genel Bakım'}</td>
                      <td style={{ ...S.td, textAlign: 'right' }}>{r.km ? Number(r.km).toLocaleString('tr-TR') : '-'}</td>
                      <td style={{ ...S.td, textAlign: 'right', fontWeight: '600' }}>₺{Number(r.totalAmount || 0).toLocaleString('tr-TR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Service Orders */}
        {serviceOrders.length > 0 && (
          <div style={S.card}>
            <h2 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>📝 İş Emri Kayıtları</h2>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {serviceOrders.map((o: any) => (
                <div key={o.id} style={{ padding: '0.85rem 1rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>#{o.orderNumber}</span>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(o.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                  {o.diagnosis && <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.35rem' }}>{o.diagnosis}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: o.status === 'DELIVERED' ? '#dcfce7' : '#fef3c7', color: o.status === 'DELIVERED' ? '#166534' : '#92400e' }}>
                      {o.status === 'DELIVERED' ? 'Teslim Edildi' : o.status === 'IN_PROGRESS' ? 'Devam Ediyor' : o.status === 'PENDING' ? 'Bekliyor' : o.status}
                    </span>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>₺{Number(o.totalAmount || 0).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty */}
        {maintenanceRecords.length === 0 && serviceOrders.length === 0 && (
          <div style={{ ...S.card, textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
            <div style={{ color: '#64748b' }}>Bu araç için henüz kayıt bulunmamaktadır.</div>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================================
// Appointment Page
// ============================================================================
function AppointmentPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ customerName: '', customerPhone: '', customerEmail: '', plate: '', vehicleBrand: '', vehicleModel: '', date: '', time: '', serviceType: '', notes: '' });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    if (tenantSlug) {
      fetch(`${API_BASE}/public/${tenantSlug}/info`).then(r => r.ok ? r.json() : null).then(d => { if (d) setTenantInfo(d); }).catch(() => {});
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (formData.date && tenantSlug) {
      fetch(`${API_BASE}/public/${tenantSlug}/appointments/slots?date=${formData.date}`).then(r => r.ok ? r.json() : null).then(d => setAvailableSlots(d?.availableSlots || [])).catch(() => setAvailableSlots([]));
    }
  }, [formData.date, tenantSlug]);

  const primaryColor = tenantInfo?.primaryColor || '#2563eb';
  const shopName = tenantInfo?.name || tenantSlug || 'OtoServis';

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/public/${tenantSlug}/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Randevu oluşturulamadı.'); }
      setSuccess(await res.json()); setStep(4);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  const canProceed = () => { if (step === 1) return formData.customerName && formData.customerPhone; if (step === 2) return formData.plate && formData.date && formData.time; return true; };

  if (success) return (
    <div style={S.contentPage}>
      <header style={S.contentHeader(primaryColor)}>
        <Link to="/" style={{ ...S.logo, color: 'white' }}><span>🔧</span><span>{shopName}</span></Link>
      </header>
      <div style={{ ...S.contentMain, textAlign: 'center' }}>
        <div style={{ ...S.card, maxWidth: '450px', margin: '3rem auto', padding: '2.5rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>Randevunuz Oluşturuldu!</h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{success.message}</p>
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}><span style={{ color: '#64748b' }}>Tarih:</span><span style={{ fontWeight: '600' }}>{new Date(success.date).toLocaleDateString('tr-TR')}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}><span style={{ color: '#64748b' }}>Saat:</span><span style={{ fontWeight: '600' }}>{success.time}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#64748b' }}>Plaka:</span><span style={{ fontWeight: '600' }}>{success.plate}</span></div>
          </div>
          <Link to="/" style={{ color: primaryColor, textDecoration: 'none', fontWeight: '600' }}>← Ana sayfaya dön</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.contentPage}>
      <header style={S.contentHeader(primaryColor)}>
        <Link to="/" style={{ ...S.logo, color: 'white' }}><span>🔧</span><span>{shopName}</span></Link>
      </header>
      <main style={S.contentMain}>
        <div style={{ maxWidth: '550px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.35rem', textAlign: 'center' }}>Online Randevu Al</h1>
          <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '1.5rem' }}>Birkaç adımda randevunuzu oluşturun</p>

          {/* Progress */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {[1, 2, 3].map(s => <div key={s} style={{ width: '50px', height: '4px', borderRadius: '2px', background: step >= s ? primaryColor : '#e2e8f0' }} />)}
          </div>

          <div style={S.card}>
            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.65rem', marginBottom: '1rem', color: '#dc2626', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1e293b' }}>İletişim Bilgileriniz</h2>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }}>Ad Soyad *</label>
                  <input style={{ ...S.searchInput, fontSize: '0.95rem' }} value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} placeholder="Adınız Soyadınız" />
                </div>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }}>Telefon *</label>
                  <input style={{ ...S.searchInput, fontSize: '0.95rem' }} type="tel" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} placeholder="0555 123 45 67" />
                </div>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }}>E-posta (opsiyonel)</label>
                  <input style={{ ...S.searchInput, fontSize: '0.95rem' }} type="email" value={formData.customerEmail} onChange={e => setFormData({ ...formData, customerEmail: e.target.value })} placeholder="ornek@email.com" />
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1e293b' }}>Araç ve Tarih</h2>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }}>Plaka *</label>
                  <input style={{ ...S.searchInput, fontSize: '0.95rem' }} value={formData.plate} onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })} placeholder="34ABC123" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }}>Marka</label>
                    <input style={{ ...S.searchInput, fontSize: '0.95rem' }} value={formData.vehicleBrand} onChange={e => setFormData({ ...formData, vehicleBrand: e.target.value })} placeholder="Volkswagen" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }}>Model</label>
                    <input style={{ ...S.searchInput, fontSize: '0.95rem' }} value={formData.vehicleModel} onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })} placeholder="Golf" />
                  </div>
                </div>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }}>Tarih *</label>
                  <input style={{ ...S.searchInput, fontSize: '0.95rem' }} type="date" min={new Date().toISOString().split('T')[0]} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value, time: '' })} />
                </div>
                {formData.date && (
                  <div style={{ marginBottom: '0.85rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.4rem', fontWeight: '500' }}>Saat *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                      {availableSlots.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', color: '#94a3b8', textAlign: 'center', padding: '0.75rem', fontSize: '0.85rem' }}>Bu tarih için uygun saat yok.</div>
                      ) : availableSlots.map(slot => (
                        <button key={slot} onClick={() => setFormData({ ...formData, time: slot })} style={{ padding: '0.45rem', borderRadius: '6px', border: formData.time === slot ? `2px solid ${primaryColor}` : '1px solid #e2e8f0', background: formData.time === slot ? `${primaryColor}15` : 'white', color: formData.time === slot ? primaryColor : '#475569', fontWeight: formData.time === slot ? '600' : '400', cursor: 'pointer', fontSize: '0.85rem' }}>{slot}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1e293b' }}>Hizmet Detayları</h2>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }}>Hizmet Türü</label>
                  <select style={{ ...S.searchInput, fontSize: '0.95rem' }} value={formData.serviceType} onChange={e => setFormData({ ...formData, serviceType: e.target.value })}>
                    <option value="">Seçiniz...</option>
                    <option value="PERIODIC_MAINTENANCE">Periyodik Bakım</option>
                    <option value="OIL_CHANGE">Yağ Değişimi</option>
                    <option value="BRAKE_SERVICE">Fren Servisi</option>
                    <option value="TIRE_SERVICE">Lastik Servisi</option>
                    <option value="AIR_CONDITIONING">Klima Servisi</option>
                    <option value="ELECTRICAL">Elektrik Servisi</option>
                    <option value="MECHANICAL_REPAIR">Mekanik Tamir</option>
                    <option value="INSPECTION">Muayene Hazırlık</option>
                    <option value="OTHER">Diğer</option>
                  </select>
                </div>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }}>Notlar</label>
                  <textarea style={{ ...S.searchInput, fontSize: '0.95rem', minHeight: '80px', resize: 'vertical' }} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Aracınızla ilgili ek bilgiler..." />
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#475569' }}>Randevu Özeti</h3>
                  <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                    <div>Ad Soyad: {formData.customerName}</div>
                    <div>Telefon: {formData.customerPhone}</div>
                    <div>Plaka: {formData.plate}</div>
                    <div>Tarih: {formData.date ? new Date(formData.date).toLocaleDateString('tr-TR') : ''} {formData.time}</div>
                    {formData.serviceType && <div>Hizmet: {formData.serviceType}</div>}
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }}>
              {step > 1 && step < 4 && <button onClick={() => setStep(step - 1)} style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', cursor: 'pointer', fontSize: '0.9rem' }}>← Geri</button>}
              {step < 3 && <button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()} style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: canProceed() ? primaryColor : '#e2e8f0', color: canProceed() ? 'white' : '#94a3b8', cursor: canProceed() ? 'pointer' : 'not-allowed', marginLeft: 'auto', fontSize: '0.9rem' }}>Devam →</button>}
              {step === 3 && <button onClick={handleSubmit} disabled={loading} style={{ padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: primaryColor, color: 'white', cursor: loading ? 'not-allowed' : 'pointer', marginLeft: 'auto', opacity: loading ? 0.7 : 1, fontSize: '0.9rem' }}>{loading ? 'Oluşturuluyor...' : 'Randevu Oluştur'}</button>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// App
// ============================================================================
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/:tenantSlug" element={<HomePage />} />
        <Route path="/:tenantSlug/vehicle/:plate" element={<VehicleHistoryPage />} />
        <Route path="/:tenantSlug/appointment" element={<AppointmentPage />} />
      </Routes>
    </BrowserRouter>
  );
}
