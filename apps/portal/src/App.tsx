import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'https://otoservis-api.onrender.com/api/v1';

// ============================================================================
// Styles
// ============================================================================
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem 2rem',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  main: {
    padding: '3rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  hero: {
    textAlign: 'center' as const,
    color: 'white',
    marginBottom: '3rem',
  },
  heroTitle: {
    fontSize: '2.75rem',
    fontWeight: '800',
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    color: '#94a3b8',
    marginBottom: '2.5rem',
    maxWidth: '600px',
    margin: '0 auto 2.5rem',
  },
  searchBox: {
    maxWidth: '500px',
    margin: '0 auto',
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    borderRadius: '16px',
    padding: '2rem',
    border: '1px solid rgba(255,255,255,0.15)',
  },
  inputGroup: {
    display: 'flex',
    gap: '0.75rem',
  },
  input: {
    flex: 1,
    padding: '1rem 1.25rem',
    fontSize: '1.1rem',
    borderRadius: '12px',
    border: '2px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    outline: 'none',
    transition: 'all 0.2s',
  },
  button: {
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: 'white',
    cursor: 'pointer',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap' as const,
  },
  error: {
    marginTop: '1rem',
    padding: '0.75rem',
    borderRadius: '8px',
    background: 'rgba(239,68,68,0.2)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#fca5a5',
    textAlign: 'center' as const,
  },
  features: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginTop: '4rem',
  },
  featureCard: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '1.75rem',
    border: '1px solid rgba(255,255,255,0.1)',
    textAlign: 'center' as const,
  },
  featureIcon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  featureTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    color: 'white',
    marginBottom: '0.5rem',
  },
  featureDesc: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    lineHeight: '1.5',
  },
  tenantSelect: {
    marginBottom: '1rem',
  },
  tenantInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.05)',
    color: 'white',
    outline: 'none',
    marginBottom: '0.5rem',
  },
  tenantLabel: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginBottom: '0.25rem',
    display: 'block',
  },
};

// ============================================================================
// Home Page - Tenant + Plate Search
// ============================================================================
function HomePage() {
  const [tenantSlug, setTenantSlug] = useState('');
  const [plate, setPlate] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check if tenant is in subdomain
  useEffect(() => {
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length > 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
      setTenantSlug(parts[0]);
    }
  }, []);

  const handleSearch = () => {
    setError('');
    const trimmedPlate = plate.trim().toUpperCase().replace(/\s+/g, '');
    const trimmedTenant = tenantSlug.trim().toLowerCase();
    
    if (!trimmedTenant) {
      setError('Lütfen servis adı giriniz.');
      return;
    }
    if (!trimmedPlate) {
      setError('Lütfen plaka giriniz.');
      return;
    }
    if (trimmedPlate.length < 6) {
      setError('Geçerli bir plaka giriniz.');
      return;
    }
    navigate(`/${trimmedTenant}/vehicle/${encodeURIComponent(trimmedPlate)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span>🔧</span>
          <span>OtoServisApp</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/register" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, padding: '0.4rem 1rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
            Tamir Firması Kayıt
          </Link>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
            otoservisapp.com
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>Aracınızın Bakım Geçmişini Sorgulayın</h1>
          <p style={styles.heroSubtitle}>
            Servisinizi seçin ve plaka girerek aracınızın tüm bakım ve onarım geçmişini görüntüleyin.
          </p>

          <div style={styles.searchBox}>
            {!window.location.hostname.split('.')[0]?.match(/^(localhost|www|portal)$/) && (
              <div style={styles.tenantSelect}>
                <label style={styles.tenantLabel}>Servis Adı</label>
                <input
                  style={styles.tenantInput}
                  type="text"
                  placeholder="örn: otofix, mekanikustası"
                  value={tenantSlug}
                  onChange={(e) => setTenantSlug(e.target.value)}
                />
              </div>
            )}
            <div style={styles.inputGroup}>
              <input
                style={styles.input}
                type="text"
                placeholder="Plaka girin (örn: 34ABC123)"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                maxLength={20}
              />
              <button style={styles.button} onClick={handleSearch}>
                Sorgula
              </button>
            </div>
            {error && <div style={styles.error}>{error}</div>}
          </div>

          {tenantSlug && (
            <div style={{ marginTop: '1.5rem' }}>
              <Link
                to={`/${tenantSlug}/appointment`}
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: '600',
                }}
              >
                📅 Online Randevu Al
              </Link>
            </div>
          )}
        </div>

        <div style={styles.features}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📋</div>
            <div style={styles.featureTitle}>Detaylı Bakım Geçmişi</div>
            <div style={styles.featureDesc}>
              Aracınızın tüm bakım ve onarım kayıtlarını tarih, işlem ve tutar detaylarıyla görüntüleyin.
            </div>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🔔</div>
            <div style={styles.featureTitle}>Bakım Hatırlatmaları</div>
            <div style={styles.featureDesc}>
              Bir sonraki bakımınızın ne zaman gelmesi gerektiğini kilometre ve tarih bazında öğrenin.
            </div>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>💰</div>
            <div style={styles.featureTitle}>Maliyet Özeti</div>
            <div style={styles.featureDesc}>
              Aracınıza yapılan toplam harcamayı ve her bakımın maliyetini şeffaf şekilde görün.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.5)',
        fontSize: '0.85rem',
      }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>OtoServisApp</span>
          {' '}• Araç Bakım & Onarım Yönetim Platformu
        </div>
        <div>© 2026 otoservisapp.com • Tüm hakları saklıdır</div>
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
        // Fetch tenant info and vehicle history in parallel
        const [tenantRes, historyRes] = await Promise.all([
          fetch(`${API_BASE}/public/${tenantSlug}/info`),
          fetch(`${API_BASE}/public/${tenantSlug}/vehicle-history/${encodeURIComponent(plate)}`),
        ]);

        if (tenantRes.ok) {
          const tenantJson = await tenantRes.json();
          setTenantInfo(tenantJson);
        }

        if (!historyRes.ok) {
          if (historyRes.status === 404) {
            setError('Bu plakaya kayıtlı araç bulunamadı.');
          } else {
            setError('Bir hata oluştu.');
          }
          setLoading(false);
          return;
        }
        const json = await historyRes.json();
        setData(json);
      } catch (err) {
        setError('Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [plate, tenantSlug]);

  const handlePrint = () => {
    window.print();
  };

  const primaryColor = tenantInfo?.primaryColor || '#3b82f6';
  const tenantName = tenantInfo?.name || tenantSlug || 'OtoServis';

  if (loading) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <Link to="/" style={{ ...styles.logo, textDecoration: 'none' }}>
            <span>🔧</span>
            <span>{tenantName}</span>
          </Link>
        </header>
        <main style={{ ...styles.main, textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '1.25rem' }}>Yükleniyor...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <header style={styles.header}>
          <Link to="/" style={{ ...styles.logo, textDecoration: 'none' }}>
            <span>🔧</span>
            <span>{tenantName}</span>
          </Link>
        </header>
        <main style={{ ...styles.main, textAlign: 'center' }}>
          <div style={{ ...styles.searchBox, maxWidth: '500px', margin: '2rem auto' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <div style={{ color: '#fca5a5', fontSize: '1.1rem', marginBottom: '1rem' }}>{error}</div>
            <Link to="/" style={{ color: primaryColor, textDecoration: 'none' }}>
              ← Ana sayfaya dön
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!data) return null;

  const { vehicle, maintenanceRecords, serviceOrders, maintenanceSchedule, summary } = data;

  return (
    <div style={{ ...styles.container, background: '#f8fafc' }}>
      <header style={{ ...styles.header, background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <Link to="/" style={{ ...styles.logo, textDecoration: 'none', color: '#1e293b' }}>
          <span>🔧</span>
          <span>{tenantName}</span>
        </Link>
        <button onClick={handlePrint} style={{ ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
          🖨️ Yazdır
        </button>
      </header>

      <main style={{ ...styles.main, padding: '2rem' }}>
        {/* Vehicle Info */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }}>Araç Bilgileri</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }}>
                {vehicle.plate}
              </div>
              <div style={{ color: '#475569', marginTop: '0.25rem' }}>
                {vehicle.brand} {vehicle.model} {vehicle.year ? `• ${vehicle.year}` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Kilometre</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
                  {vehicle.km ? `${Number(vehicle.km).toLocaleString('tr-TR')} km` : '-'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Yakıt</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
                  {vehicle.fuelType || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Toplam Bakım</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: primaryColor }}>{summary.maintenanceCount}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Toplam İş Emri</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>{summary.serviceOrderCount}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Toplam Harcama</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>₺{summary.totalSpent.toLocaleString('tr-TR')}</div>
          </div>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }}>Son KM</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
              {summary.lastKm ? `${Number(summary.lastKm).toLocaleString('tr-TR')} km` : '-'}
            </div>
          </div>
        </div>

        {/* Maintenance Schedule */}
        {maintenanceSchedule.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
              📅 Bakım Takvimi
            </h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {maintenanceSchedule.map((item: any, idx: number) => {
                const currentKm = vehicle.km || summary.lastKm || 0;
                const isOverdue = item.nextDueKm && currentKm > item.nextDueKm;
                const isDueSoon = item.nextDueKm && currentKm >= item.nextDueKm - 1000;
                return (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    borderRadius: '8px',
                    background: isOverdue ? '#fef2f2' : isDueSoon ? '#fef9c3' : '#f8fafc',
                    border: isOverdue ? '1px solid #fca5a5' : isDueSoon ? '1px solid #fcd34d' : '1px solid #e2e8f0',
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{item.typeName}</div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Son: {item.lastKm ? `${Number(item.lastKm).toLocaleString('tr-TR')} km` : '-'}
                        {item.lastPerformedAt && ` • ${new Date(item.lastPerformedAt).toLocaleDateString('tr-TR')}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Sonraki Bakım</div>
                      <div style={{ fontWeight: '600', color: isOverdue ? '#dc2626' : isDueSoon ? '#d97706' : '#059669' }}>
                        {item.nextDueKm ? `${Number(item.nextDueKm).toLocaleString('tr-TR')} km` : '-'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Maintenance Records */}
        {maintenanceRecords.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
              🔧 Bakım Kayıtları
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Tarih</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Bakım Tipi</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>KM</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceRecords.map((record: any) => (
                    <tr key={record.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem', color: '#1e293b' }}>
                        {record.performedAt ? new Date(record.performedAt).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#1e293b' }}>
                        {record.maintenanceType?.name || 'Genel Bakım'}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#1e293b' }}>
                        {record.km ? `${Number(record.km).toLocaleString('tr-TR')}` : '-'}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                        ₺{Number(record.totalAmount || 0).toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Service Orders */}
        {serviceOrders.length > 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }}>
              📝 İş Emri Kayıtları
            </h2>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {serviceOrders.map((order: any) => (
                <div key={order.id} style={{ padding: '1rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>#{order.orderNumber}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {new Date(order.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                  {order.diagnosis && (
                    <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }}>
                      {order.diagnosis}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      background: order.status === 'DELIVERED' ? '#dcfce7' : '#fef3c7',
                      color: order.status === 'DELIVERED' ? '#166534' : '#92400e',
                    }}>
                      {order.status === 'DELIVERED' ? 'Teslim Edildi' : order.status === 'IN_PROGRESS' ? 'Devam Ediyor' : order.status}
                    </span>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                      ₺{Number(order.totalAmount || 0).toLocaleString('tr-TR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {maintenanceRecords.length === 0 && serviceOrders.length === 0 && (
          <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <div style={{ fontSize: '1.1rem', color: '#64748b' }}>
              Bu araç için henüz kayıt bulunmamaktadır.
            </div>
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
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    plate: '',
    vehicleBrand: '',
    vehicleModel: '',
    date: '',
    time: '',
    serviceType: '',
    notes: '',
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<any>(null);

  useEffect(() => {
    if (tenantSlug) {
      fetch(`${API_BASE}/public/${tenantSlug}/info`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => setTenantInfo(data))
        .catch(() => {});
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (formData.date && tenantSlug) {
      fetch(`${API_BASE}/public/${tenantSlug}/appointments/slots?date=${formData.date}`)
        .then((res) => res.ok ? res.json() : null)
        .then((data) => setAvailableSlots(data?.availableSlots || []))
        .catch(() => setAvailableSlots([]));
    }
  }, [formData.date, tenantSlug]);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/public/${tenantSlug}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Randevu oluşturulamadı.');
      }
      const result = await res.json();
      setSuccess(result);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.customerName && formData.customerPhone;
    if (step === 2) return formData.plate && formData.date && formData.time;
    return true;
  };

  const primaryColor = tenantInfo?.primaryColor || '#3b82f6';
  const tenantName = tenantInfo?.name || tenantSlug || 'OtoServis';

  if (success) {
    return (
      <div style={styles.container}>
        <header style={{ ...styles.header, background: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <Link to={`/${tenantSlug}`} style={{ ...styles.logo, textDecoration: 'none', color: '#1e293b' }}>
            <span>🔧</span>
            <span>{tenantName}</span>
          </Link>
        </header>
        <main style={{ ...styles.main, textAlign: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', maxWidth: '500px', margin: '0 auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>Randevunuz Oluşturuldu!</h2>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{success.message}</p>
            <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Tarih:</span>
                <span style={{ fontWeight: '600' }}>{new Date(success.date).toLocaleDateString('tr-TR')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Saat:</span>
                <span style={{ fontWeight: '600' }}>{success.time}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Plaka:</span>
                <span style={{ fontWeight: '600' }}>{success.plate}</span>
              </div>
            </div>
            <Link to={`/${tenantSlug}`} style={{ color: primaryColor, textDecoration: 'none', fontWeight: '600' }}>
              ← Ana sayfaya dön
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={{ ...styles.header, background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <Link to={`/${tenantSlug}`} style={{ ...styles.logo, textDecoration: 'none', color: '#1e293b' }}>
          <span>🔧</span>
          <span>{tenantName}</span>
        </Link>
      </header>
      <main style={{ ...styles.main, padding: '2rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem', textAlign: 'center' }}>
            Online Randevu Al
          </h1>
          <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>
            Birkaç adımda randevunuzu oluşturun
          </p>

          {/* Progress */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                width: '40px',
                height: '4px',
                borderRadius: '2px',
                background: step >= s ? primaryColor : 'rgba(255,255,255,0.2)',
              }} />
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', color: '#dc2626', textAlign: 'center' }}>
                {error}
              </div>
            )}

            {/* Step 1: Contact Info */}
            {step === 1 && (
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>İletişim Bilgileriniz</h2>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>Ad Soyad *</label>
                  <input
                    style={{ ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }}
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Adınız Soyadınız"
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>Telefon *</label>
                  <input
                    style={{ ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }}
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="05XX XXX XX XX"
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>E-posta (opsiyonel)</label>
                  <input
                    style={{ ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }}
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Vehicle & Date */}
            {step === 2 && (
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>Araç ve Tarih Bilgileri</h2>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>Plaka *</label>
                  <input
                    style={{ ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }}
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                    placeholder="34ABC123"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>Marka</label>
                    <input
                      style={{ ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }}
                      value={formData.vehicleBrand}
                      onChange={(e) => setFormData({ ...formData, vehicleBrand: e.target.value })}
                      placeholder="örn. Volkswagen"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>Model</label>
                    <input
                      style={{ ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }}
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                      placeholder="örn. Golf"
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>Tarih *</label>
                  <input
                    style={{ ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value, time: '' })}
                  />
                </div>
                {formData.date && (
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }}>Saat *</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                      {availableSlots.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', color: '#94a3b8', textAlign: 'center', padding: '1rem' }}>
                          Bu tarih için uygun saat bulunmamaktadır.
                        </div>
                      ) : (
                        availableSlots.map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setFormData({ ...formData, time: slot })}
                            style={{
                              padding: '0.5rem',
                              borderRadius: '8px',
                              border: formData.time === slot ? `2px solid ${primaryColor}` : '1px solid #e2e8f0',
                              background: formData.time === slot ? `${primaryColor}20` : 'white',
                              color: formData.time === slot ? primaryColor : '#475569',
                              fontWeight: formData.time === slot ? '600' : '400',
                              cursor: 'pointer',
                            }}
                          >
                            {slot}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Service Type & Notes */}
            {step === 3 && (
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>Hizmet Detayları</h2>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>Hizmet Türü</label>
                  <select
                    style={{ ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }}
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  >
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
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }}>Notlar (opsiyonel)</label>
                  <textarea
                    style={{ ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', minHeight: '100px', resize: 'vertical' }}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Aracınızla ilgili ek bilgiler..."
                  />
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '1rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }}>Randevu Özeti</h3>
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

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
              {step > 1 && step < 4 && (
                <button
                  onClick={() => setStep(step - 1)}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', cursor: 'pointer' }}
                >
                  ← Geri
                </button>
              )}
              {step < 3 && (
                <button
                  onClick={() => canProceed() && setStep(step + 1)}
                  disabled={!canProceed()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: canProceed() ? primaryColor : '#e2e8f0',
                    color: canProceed() ? 'white' : '#94a3b8',
                    cursor: canProceed() ? 'pointer' : 'not-allowed',
                    marginLeft: 'auto',
                  }}
                >
                  Devam →
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: primaryColor,
                    color: 'white',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginLeft: 'auto',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Oluşturuluyor...' : 'Randevu Oluştur'}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ============================================================================
// Registration Page - Tamir Firması Kayıt
// ============================================================================
function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    // Firma bilgileri
    tenantName: '',
    tenantSlug: '',
    phone: '',
    address: '',
    // Admin bilgileri
    adminFirstName: '',
    adminLastName: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
  });

  const validateSlug = (slug: string) => {
    return /^[a-z0-9-]+$/.test(slug);
  };

  const generateSlug = (value: string) => {
    return value
      .toLowerCase()
      .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
      .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSlugChange = (value: string) => {
    setFormData({ ...formData, tenantSlug: value });
  };

  const handleTenantNameChange = (value: string) => {
    const autoSlug = generateSlug(value);
    setFormData({ ...formData, tenantName: value, tenantSlug: autoSlug });
  };

  const handleSubmit = async () => {
    setError('');

    // Validation
    if (!formData.tenantName.trim()) { setError('Firma adı zorunludur.'); return; }
    if (!formData.tenantSlug.trim()) { setError('Servis URL adı zorunludur.'); return; }
    if (!validateSlug(formData.tenantSlug)) { setError('URL adı sadece küçük harf, rakam ve tire içerebilir.'); return; }
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
      const res = await fetch(`${API_BASE}/tenants/setup`, {
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
      <div style={styles.container}>
        <header style={styles.header}>
          <div style={styles.logo}>
            <span>🔧</span>
            <span>OtoServisApp</span>
          </div>
        </header>
        <main style={{ ...styles.main, textAlign: 'center' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', maxWidth: '500px', margin: '0 auto', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>Kayıt Başarılı!</h2>
            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              <strong>{formData.tenantName}</strong> firması başarıyla oluşturuldu.<br />
              Artık sistemizi kullanmaya başlayabilirsiniz.
            </p>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#166534', marginBottom: '0.25rem' }}>Portal Adresiniz:</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#15803d' }}>
                otoservisapp.com/{formData.tenantSlug}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <Link
                to={`/${formData.tenantSlug}`}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: 'white',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Portal'a Git
              </Link>
              <Link
                to="/"
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#374151',
                  textDecoration: 'none',
                  fontWeight: 600,
                  border: '1px solid #d1d5db',
                }}
              >
                Ana Sayfa
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logo}>
          <span>🔧</span>
          <span>OtoServisApp</span>
        </div>
        <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Ana Sayfa
        </Link>
      </header>

      <main style={styles.main}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem', textAlign: 'center' }}>
              Tamir Firması Kaydı
            </h2>
            <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '1.5rem' }}>
              Sisteminizi hemen kullanmaya başlayın
            </p>

            {/* Progress Steps */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem', alignItems: 'center' }}>
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

            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '0.7rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                {error}
              </div>
            )}

            {/* Step 1: Firma Bilgileri */}
            {step === 1 && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }}>Firma Adı *</label>
                  <input
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                    value={formData.tenantName}
                    onChange={(e) => handleTenantNameChange(e.target.value)}
                    placeholder="örn. OtoFix Servis"
                  />
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }}>
                    Servis URL Adı * <span style={{ color: '#94a3b8', fontWeight: 400 }}>(portal adresiniz)</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#64748b', fontSize: '0.9rem' }}>otoservisapp.com/</span>
                    <input
                      style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem', fontWeight: 600 }}
                      value={formData.tenantSlug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="oto-fix"
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    Sadece küçük harf, rakam ve tire kullanabilirsiniz
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }}>Telefon</label>
                  <input
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0555 123 45 67"
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }}>Adres</label>
                  <textarea
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem', minHeight: '80px', resize: 'vertical' }}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Servis adresi..."
                  />
                </div>
                <button
                  onClick={() => {
                    if (!formData.tenantName.trim()) { setError('Firma adı zorunludur.'); return; }
                    if (!formData.tenantSlug.trim()) { setError('URL adı zorunludur.'); return; }
                    setError('');
                    setStep(2);
                  }}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Devam →
                </button>
              </div>
            )}

            {/* Step 2: Yönetici Bilgileri */}
            {step === 2 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }}>Ad *</label>
                    <input
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                      value={formData.adminFirstName}
                      onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                      placeholder="Ahmet"
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }}>Soyad *</label>
                    <input
                      style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                      value={formData.adminLastName}
                      onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                      placeholder="Yılmaz"
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }}>E-posta *</label>
                  <input
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                    placeholder="ahmet@otofix.com"
                  />
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    Giriş yapmak için kullanacağınız e-posta
                  </div>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }}>Şifre *</label>
                  <input
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                    En az 8 karakter, büyük-küçük harf ve rakam
                  </div>
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }}>Şifre Tekrar *</label>
                  <input
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }}
                    type="password"
                    value={formData.adminPasswordConfirm}
                    onChange={(e) => setFormData({ ...formData, adminPasswordConfirm: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => { setError(''); setStep(1); }}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', fontSize: '1rem', cursor: 'pointer' }}
                  >
                    ← Geri
                  </button>
                  <button
                    onClick={() => {
                      if (!formData.adminFirstName.trim()) { setError('Ad zorunludur.'); return; }
                      if (!formData.adminLastName.trim()) { setError('Soyad zorunludur.'); return; }
                      if (!formData.adminEmail.trim()) { setError('E-posta zorunludur.'); return; }
                      if (!formData.adminPassword) { setError('Şifre zorunludur.'); return; }
                      if (formData.adminPassword.length < 8) { setError('Şifre en az 8 karakter olmalıdır.'); return; }
                      if (formData.adminPassword !== formData.adminPasswordConfirm) { setError('Şifreler eşleşmiyor.'); return; }
                      setError('');
                      setStep(3);
                    }}
                    style={{ flex: 2, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Devam →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Onay */}
            {step === 3 && (
              <div>
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>Firma Bilgileri</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div><span style={{ color: '#64748b' }}>Firma:</span> <strong>{formData.tenantName}</strong></div>
                    <div><span style={{ color: '#64748b' }}>URL:</span> <strong>otoservisapp.com/{formData.tenantSlug}</strong></div>
                    {formData.phone && <div><span style={{ color: '#64748b' }}>Telefon:</span> <strong>{formData.phone}</strong></div>}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }}>Yönetici Hesabı</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }}>
                    <div><span style={{ color: '#64748b' }}>Ad Soyad:</span> <strong>{formData.adminFirstName} {formData.adminLastName}</strong></div>
                    <div><span style={{ color: '#64748b' }}>E-posta:</span> <strong>{formData.adminEmail}</strong></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => { setError(''); setStep(2); }}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', fontSize: '1rem', cursor: 'pointer' }}
                  >
                    ← Geri
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ flex: 2, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Oluşturuluyor...' : '✓ Kaydı Tamamla'}
                  </button>
                </div>
              </div>
            )}
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
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/:tenantSlug" element={<HomePage />} />
        <Route path="/:tenantSlug/vehicle/:plate" element={<VehicleHistoryPage />} />
        <Route path="/:tenantSlug/appointment" element={<AppointmentPage />} />
      </Routes>
    </BrowserRouter>
  );
}
