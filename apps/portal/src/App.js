import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
const API_BASE = 'http://localhost:3002/api/v1';
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
        textAlign: 'center',
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
        whiteSpace: 'nowrap',
    },
    error: {
        marginTop: '1rem',
        padding: '0.75rem',
        borderRadius: '8px',
        background: 'rgba(239,68,68,0.2)',
        border: '1px solid rgba(239,68,68,0.3)',
        color: '#fca5a5',
        textAlign: 'center',
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
        textAlign: 'center',
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
    const handleKeyDown = (e) => {
        if (e.key === 'Enter')
            handleSearch();
    };
    return (_jsxs("div", { style: styles.container, children: [_jsxs("header", { style: styles.header, children: [_jsxs("div", { style: styles.logo, children: [_jsx("span", { children: "\uD83D\uDD27" }), _jsx("span", { children: "OtoServisApp" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '1rem' }, children: [_jsx(Link, { to: "/register", style: { color: 'white', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, padding: '0.4rem 1rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }, children: "Tamir Firmas\u0131 Kay\u0131t" }), _jsx("div", { style: { color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }, children: "otoservisapp.com" })] })] }), _jsxs("main", { style: styles.main, children: [_jsxs("div", { style: styles.hero, children: [_jsx("h1", { style: styles.heroTitle, children: "Arac\u0131n\u0131z\u0131n Bak\u0131m Ge\u00E7mi\u015Fini Sorgulay\u0131n" }), _jsx("p", { style: styles.heroSubtitle, children: "Servisinizi se\u00E7in ve plaka girerek arac\u0131n\u0131z\u0131n t\u00FCm bak\u0131m ve onar\u0131m ge\u00E7mi\u015Fini g\u00F6r\u00FCnt\u00FCleyin." }), _jsxs("div", { style: styles.searchBox, children: [!window.location.hostname.split('.')[0]?.match(/^(localhost|www|portal)$/) && (_jsxs("div", { style: styles.tenantSelect, children: [_jsx("label", { style: styles.tenantLabel, children: "Servis Ad\u0131" }), _jsx("input", { style: styles.tenantInput, type: "text", placeholder: "\u00F6rn: otofix, mekanikustas\u0131", value: tenantSlug, onChange: (e) => setTenantSlug(e.target.value) })] })), _jsxs("div", { style: styles.inputGroup, children: [_jsx("input", { style: styles.input, type: "text", placeholder: "Plaka girin (\u00F6rn: 34ABC123)", value: plate, onChange: (e) => setPlate(e.target.value.toUpperCase()), onKeyDown: handleKeyDown, maxLength: 20 }), _jsx("button", { style: styles.button, onClick: handleSearch, children: "Sorgula" })] }), error && _jsx("div", { style: styles.error, children: error })] }), tenantSlug && (_jsx("div", { style: { marginTop: '1.5rem' }, children: _jsx(Link, { to: `/${tenantSlug}/appointment`, style: {
                                        display: 'inline-block',
                                        padding: '0.75rem 1.5rem',
                                        background: 'rgba(255,255,255,0.1)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        textDecoration: 'none',
                                        fontWeight: '600',
                                    }, children: "\uD83D\uDCC5 Online Randevu Al" }) }))] }), _jsxs("div", { style: styles.features, children: [_jsxs("div", { style: styles.featureCard, children: [_jsx("div", { style: styles.featureIcon, children: "\uD83D\uDCCB" }), _jsx("div", { style: styles.featureTitle, children: "Detayl\u0131 Bak\u0131m Ge\u00E7mi\u015Fi" }), _jsx("div", { style: styles.featureDesc, children: "Arac\u0131n\u0131z\u0131n t\u00FCm bak\u0131m ve onar\u0131m kay\u0131tlar\u0131n\u0131 tarih, i\u015Flem ve tutar detaylar\u0131yla g\u00F6r\u00FCnt\u00FCleyin." })] }), _jsxs("div", { style: styles.featureCard, children: [_jsx("div", { style: styles.featureIcon, children: "\uD83D\uDD14" }), _jsx("div", { style: styles.featureTitle, children: "Bak\u0131m Hat\u0131rlatmalar\u0131" }), _jsx("div", { style: styles.featureDesc, children: "Bir sonraki bak\u0131m\u0131n\u0131z\u0131n ne zaman gelmesi gerekti\u011Fini kilometre ve tarih baz\u0131nda \u00F6\u011Frenin." })] }), _jsxs("div", { style: styles.featureCard, children: [_jsx("div", { style: styles.featureIcon, children: "\uD83D\uDCB0" }), _jsx("div", { style: styles.featureTitle, children: "Maliyet \u00D6zeti" }), _jsx("div", { style: styles.featureDesc, children: "Arac\u0131n\u0131za yap\u0131lan toplam harcamay\u0131 ve her bak\u0131m\u0131n maliyetini \u015Feffaf \u015Fekilde g\u00F6r\u00FCn." })] })] })] }), _jsxs("footer", { style: {
                    textAlign: 'center',
                    padding: '2rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '0.85rem',
                }, children: [_jsxs("div", { style: { marginBottom: '0.5rem' }, children: [_jsx("span", { style: { fontWeight: 600, color: 'rgba(255,255,255,0.7)' }, children: "OtoServisApp" }), ' ', "\u2022 Ara\u00E7 Bak\u0131m & Onar\u0131m Y\u00F6netim Platformu"] }), _jsx("div", { children: "\u00A9 2026 otoservisapp.com \u2022 T\u00FCm haklar\u0131 sakl\u0131d\u0131r" })] })] }));
}
// ============================================================================
// Vehicle History Page
// ============================================================================
function VehicleHistoryPage() {
    const { tenantSlug, plate } = useParams();
    const [data, setData] = useState(null);
    const [tenantInfo, setTenantInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    useEffect(() => {
        const fetchData = async () => {
            if (!plate || !tenantSlug)
                return;
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
                    }
                    else {
                        setError('Bir hata oluştu.');
                    }
                    setLoading(false);
                    return;
                }
                const json = await historyRes.json();
                setData(json);
            }
            catch (err) {
                setError('Sunucuya bağlanılamadı. Lütfen daha sonra tekrar deneyin.');
            }
            finally {
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
        return (_jsxs("div", { style: styles.container, children: [_jsx("header", { style: styles.header, children: _jsxs(Link, { to: "/", style: { ...styles.logo, textDecoration: 'none' }, children: [_jsx("span", { children: "\uD83D\uDD27" }), _jsx("span", { children: tenantName })] }) }), _jsx("main", { style: { ...styles.main, textAlign: 'center', color: 'white' }, children: _jsx("div", { style: { fontSize: '1.25rem' }, children: "Y\u00FCkleniyor..." }) })] }));
    }
    if (error) {
        return (_jsxs("div", { style: styles.container, children: [_jsx("header", { style: styles.header, children: _jsxs(Link, { to: "/", style: { ...styles.logo, textDecoration: 'none' }, children: [_jsx("span", { children: "\uD83D\uDD27" }), _jsx("span", { children: tenantName })] }) }), _jsx("main", { style: { ...styles.main, textAlign: 'center' }, children: _jsxs("div", { style: { ...styles.searchBox, maxWidth: '500px', margin: '2rem auto' }, children: [_jsx("div", { style: { fontSize: '3rem', marginBottom: '1rem' }, children: "\uD83D\uDD0D" }), _jsx("div", { style: { color: '#fca5a5', fontSize: '1.1rem', marginBottom: '1rem' }, children: error }), _jsx(Link, { to: "/", style: { color: primaryColor, textDecoration: 'none' }, children: "\u2190 Ana sayfaya d\u00F6n" })] }) })] }));
    }
    if (!data)
        return null;
    const { vehicle, maintenanceRecords, serviceOrders, maintenanceSchedule, summary } = data;
    return (_jsxs("div", { style: { ...styles.container, background: '#f8fafc' }, children: [_jsxs("header", { style: { ...styles.header, background: 'white', borderBottom: '1px solid #e2e8f0' }, children: [_jsxs(Link, { to: "/", style: { ...styles.logo, textDecoration: 'none', color: '#1e293b' }, children: [_jsx("span", { children: "\uD83D\uDD27" }), _jsx("span", { children: tenantName })] }), _jsx("button", { onClick: handlePrint, style: { ...styles.button, padding: '0.5rem 1rem', fontSize: '0.9rem' }, children: "\uD83D\uDDA8\uFE0F Yazd\u0131r" })] }), _jsxs("main", { style: { ...styles.main, padding: '2rem' }, children: [_jsx("div", { style: { background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.85rem', color: '#64748b', marginBottom: '0.25rem' }, children: "Ara\u00E7 Bilgileri" }), _jsx("div", { style: { fontSize: '1.5rem', fontWeight: '700', color: '#1e293b' }, children: vehicle.plate }), _jsxs("div", { style: { color: '#475569', marginTop: '0.25rem' }, children: [vehicle.brand, " ", vehicle.model, " ", vehicle.year ? `• ${vehicle.year}` : ''] })] }), _jsxs("div", { style: { display: 'flex', gap: '2rem' }, children: [_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: '#64748b' }, children: "Kilometre" }), _jsx("div", { style: { fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }, children: vehicle.km ? `${Number(vehicle.km).toLocaleString('tr-TR')} km` : '-' })] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: '#64748b' }, children: "Yak\u0131t" }), _jsx("div", { style: { fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }, children: vehicle.fuelType || '-' })] })] })] }) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }, children: [_jsxs("div", { style: { background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }, children: "Toplam Bak\u0131m" }), _jsx("div", { style: { fontSize: '1.5rem', fontWeight: '700', color: primaryColor }, children: summary.maintenanceCount })] }), _jsxs("div", { style: { background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }, children: "Toplam \u0130\u015F Emri" }), _jsx("div", { style: { fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }, children: summary.serviceOrderCount })] }), _jsxs("div", { style: { background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }, children: "Toplam Harcama" }), _jsxs("div", { style: { fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }, children: ["\u20BA", summary.totalSpent.toLocaleString('tr-TR')] })] }), _jsxs("div", { style: { background: 'white', borderRadius: '12px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem' }, children: "Son KM" }), _jsx("div", { style: { fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }, children: summary.lastKm ? `${Number(summary.lastKm).toLocaleString('tr-TR')} km` : '-' })] })] }), maintenanceSchedule.length > 0 && (_jsxs("div", { style: { background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, children: [_jsx("h2", { style: { fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }, children: "\uD83D\uDCC5 Bak\u0131m Takvimi" }), _jsx("div", { style: { display: 'grid', gap: '0.75rem' }, children: maintenanceSchedule.map((item, idx) => {
                                    const currentKm = vehicle.km || summary.lastKm || 0;
                                    const isOverdue = item.nextDueKm && currentKm > item.nextDueKm;
                                    const isDueSoon = item.nextDueKm && currentKm >= item.nextDueKm - 1000;
                                    return (_jsxs("div", { style: {
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            background: isOverdue ? '#fef2f2' : isDueSoon ? '#fef9c3' : '#f8fafc',
                                            border: isOverdue ? '1px solid #fca5a5' : isDueSoon ? '1px solid #fcd34d' : '1px solid #e2e8f0',
                                        }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: '600', color: '#1e293b' }, children: item.typeName }), _jsxs("div", { style: { fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }, children: ["Son: ", item.lastKm ? `${Number(item.lastKm).toLocaleString('tr-TR')} km` : '-', item.lastPerformedAt && ` • ${new Date(item.lastPerformedAt).toLocaleDateString('tr-TR')}`] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("div", { style: { fontSize: '0.75rem', color: '#64748b' }, children: "Sonraki Bak\u0131m" }), _jsx("div", { style: { fontWeight: '600', color: isOverdue ? '#dc2626' : isDueSoon ? '#d97706' : '#059669' }, children: item.nextDueKm ? `${Number(item.nextDueKm).toLocaleString('tr-TR')} km` : '-' })] })] }, idx));
                                }) })] })), maintenanceRecords.length > 0 && (_jsxs("div", { style: { background: 'white', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, children: [_jsx("h2", { style: { fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }, children: "\uD83D\uDD27 Bak\u0131m Kay\u0131tlar\u0131" }), _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse' }, children: [_jsx("thead", { children: _jsxs("tr", { style: { borderBottom: '2px solid #e2e8f0' }, children: [_jsx("th", { style: { padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }, children: "Tarih" }), _jsx("th", { style: { padding: '0.75rem', textAlign: 'left', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }, children: "Bak\u0131m Tipi" }), _jsx("th", { style: { padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }, children: "KM" }), _jsx("th", { style: { padding: '0.75rem', textAlign: 'right', fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }, children: "Tutar" })] }) }), _jsx("tbody", { children: maintenanceRecords.map((record) => (_jsxs("tr", { style: { borderBottom: '1px solid #e2e8f0' }, children: [_jsx("td", { style: { padding: '0.75rem', color: '#1e293b' }, children: record.performedAt ? new Date(record.performedAt).toLocaleDateString('tr-TR') : '-' }), _jsx("td", { style: { padding: '0.75rem', color: '#1e293b' }, children: record.maintenanceType?.name || 'Genel Bakım' }), _jsx("td", { style: { padding: '0.75rem', textAlign: 'right', color: '#1e293b' }, children: record.km ? `${Number(record.km).toLocaleString('tr-TR')}` : '-' }), _jsxs("td", { style: { padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#1e293b' }, children: ["\u20BA", Number(record.totalAmount || 0).toLocaleString('tr-TR')] })] }, record.id))) })] }) })] })), serviceOrders.length > 0 && (_jsxs("div", { style: { background: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, children: [_jsx("h2", { style: { fontSize: '1.1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }, children: "\uD83D\uDCDD \u0130\u015F Emri Kay\u0131tlar\u0131" }), _jsx("div", { style: { display: 'grid', gap: '0.75rem' }, children: serviceOrders.map((order) => (_jsxs("div", { style: { padding: '1rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }, children: [_jsxs("div", { style: { fontWeight: '600', color: '#1e293b' }, children: ["#", order.orderNumber] }), _jsx("div", { style: { fontSize: '0.85rem', color: '#64748b' }, children: new Date(order.createdAt).toLocaleDateString('tr-TR') })] }), order.diagnosis && (_jsx("div", { style: { fontSize: '0.9rem', color: '#475569', marginBottom: '0.5rem' }, children: order.diagnosis })), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { style: {
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        background: order.status === 'DELIVERED' ? '#dcfce7' : '#fef3c7',
                                                        color: order.status === 'DELIVERED' ? '#166534' : '#92400e',
                                                    }, children: order.status === 'DELIVERED' ? 'Teslim Edildi' : order.status === 'IN_PROGRESS' ? 'Devam Ediyor' : order.status }), _jsxs("span", { style: { fontWeight: '600', color: '#1e293b' }, children: ["\u20BA", Number(order.totalAmount || 0).toLocaleString('tr-TR')] })] })] }, order.id))) })] })), maintenanceRecords.length === 0 && serviceOrders.length === 0 && (_jsxs("div", { style: { background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, children: [_jsx("div", { style: { fontSize: '3rem', marginBottom: '1rem' }, children: "\uD83D\uDCED" }), _jsx("div", { style: { fontSize: '1.1rem', color: '#64748b' }, children: "Bu ara\u00E7 i\u00E7in hen\u00FCz kay\u0131t bulunmamaktad\u0131r." })] }))] })] }));
}
// ============================================================================
// Appointment Page
// ============================================================================
function AppointmentPage() {
    const { tenantSlug } = useParams();
    const [tenantInfo, setTenantInfo] = useState(null);
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
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    useEffect(() => {
        if (tenantSlug) {
            fetch(`${API_BASE}/public/${tenantSlug}/info`)
                .then((res) => res.ok ? res.json() : null)
                .then((data) => setTenantInfo(data))
                .catch(() => { });
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
        }
        catch (err) {
            setError(err.message || 'Bir hata oluştu.');
        }
        finally {
            setLoading(false);
        }
    };
    const canProceed = () => {
        if (step === 1)
            return formData.customerName && formData.customerPhone;
        if (step === 2)
            return formData.plate && formData.date && formData.time;
        return true;
    };
    const primaryColor = tenantInfo?.primaryColor || '#3b82f6';
    const tenantName = tenantInfo?.name || tenantSlug || 'OtoServis';
    if (success) {
        return (_jsxs("div", { style: styles.container, children: [_jsx("header", { style: { ...styles.header, background: 'white', borderBottom: '1px solid #e2e8f0' }, children: _jsxs(Link, { to: `/${tenantSlug}`, style: { ...styles.logo, textDecoration: 'none', color: '#1e293b' }, children: [_jsx("span", { children: "\uD83D\uDD27" }), _jsx("span", { children: tenantName })] }) }), _jsx("main", { style: { ...styles.main, textAlign: 'center' }, children: _jsxs("div", { style: { background: 'white', borderRadius: '16px', padding: '3rem', maxWidth: '500px', margin: '0 auto', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, children: [_jsx("div", { style: { fontSize: '4rem', marginBottom: '1rem' }, children: "\u2705" }), _jsx("h2", { style: { fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }, children: "Randevunuz Olu\u015Fturuldu!" }), _jsx("p", { style: { color: '#64748b', marginBottom: '1.5rem' }, children: success.message }), _jsxs("div", { style: { background: '#f8fafc', borderRadius: '8px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }, children: [_jsx("span", { style: { color: '#64748b' }, children: "Tarih:" }), _jsx("span", { style: { fontWeight: '600' }, children: new Date(success.date).toLocaleDateString('tr-TR') })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }, children: [_jsx("span", { style: { color: '#64748b' }, children: "Saat:" }), _jsx("span", { style: { fontWeight: '600' }, children: success.time })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx("span", { style: { color: '#64748b' }, children: "Plaka:" }), _jsx("span", { style: { fontWeight: '600' }, children: success.plate })] })] }), _jsx(Link, { to: `/${tenantSlug}`, style: { color: primaryColor, textDecoration: 'none', fontWeight: '600' }, children: "\u2190 Ana sayfaya d\u00F6n" })] }) })] }));
    }
    return (_jsxs("div", { style: styles.container, children: [_jsx("header", { style: { ...styles.header, background: 'white', borderBottom: '1px solid #e2e8f0' }, children: _jsxs(Link, { to: `/${tenantSlug}`, style: { ...styles.logo, textDecoration: 'none', color: '#1e293b' }, children: [_jsx("span", { children: "\uD83D\uDD27" }), _jsx("span", { children: tenantName })] }) }), _jsx("main", { style: { ...styles.main, padding: '2rem' }, children: _jsxs("div", { style: { maxWidth: '600px', margin: '0 auto' }, children: [_jsx("h1", { style: { fontSize: '1.75rem', fontWeight: '700', color: 'white', marginBottom: '0.5rem', textAlign: 'center' }, children: "Online Randevu Al" }), _jsx("p", { style: { color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }, children: "Birka\u00E7 ad\u0131mda randevunuzu olu\u015Fturun" }), _jsx("div", { style: { display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }, children: [1, 2, 3].map((s) => (_jsx("div", { style: {
                                    width: '40px',
                                    height: '4px',
                                    borderRadius: '2px',
                                    background: step >= s ? primaryColor : 'rgba(255,255,255,0.2)',
                                } }, s))) }), _jsxs("div", { style: { background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }, children: [error && (_jsx("div", { style: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', color: '#dc2626', textAlign: 'center' }, children: error })), step === 1 && (_jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }, children: "\u0130leti\u015Fim Bilgileriniz" }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }, children: "Ad Soyad *" }), _jsx("input", { style: { ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }, value: formData.customerName, onChange: (e) => setFormData({ ...formData, customerName: e.target.value }), placeholder: "Ad\u0131n\u0131z Soyad\u0131n\u0131z" })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }, children: "Telefon *" }), _jsx("input", { style: { ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }, type: "tel", value: formData.customerPhone, onChange: (e) => setFormData({ ...formData, customerPhone: e.target.value }), placeholder: "05XX XXX XX XX" })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }, children: "E-posta (opsiyonel)" }), _jsx("input", { style: { ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }, type: "email", value: formData.customerEmail, onChange: (e) => setFormData({ ...formData, customerEmail: e.target.value }), placeholder: "ornek@email.com" })] })] })), step === 2 && (_jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }, children: "Ara\u00E7 ve Tarih Bilgileri" }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }, children: "Plaka *" }), _jsx("input", { style: { ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }, value: formData.plate, onChange: (e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() }), placeholder: "34ABC123" })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }, children: "Marka" }), _jsx("input", { style: { ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }, value: formData.vehicleBrand, onChange: (e) => setFormData({ ...formData, vehicleBrand: e.target.value }), placeholder: "\u00F6rn. Volkswagen" })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }, children: "Model" }), _jsx("input", { style: { ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }, value: formData.vehicleModel, onChange: (e) => setFormData({ ...formData, vehicleModel: e.target.value }), placeholder: "\u00F6rn. Golf" })] })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }, children: "Tarih *" }), _jsx("input", { style: { ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }, type: "date", min: new Date().toISOString().split('T')[0], value: formData.date, onChange: (e) => setFormData({ ...formData, date: e.target.value, time: '' }) })] }), formData.date && (_jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.5rem' }, children: "Saat *" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }, children: availableSlots.length === 0 ? (_jsx("div", { style: { gridColumn: '1 / -1', color: '#94a3b8', textAlign: 'center', padding: '1rem' }, children: "Bu tarih i\u00E7in uygun saat bulunmamaktad\u0131r." })) : (availableSlots.map((slot) => (_jsx("button", { onClick: () => setFormData({ ...formData, time: slot }), style: {
                                                            padding: '0.5rem',
                                                            borderRadius: '8px',
                                                            border: formData.time === slot ? `2px solid ${primaryColor}` : '1px solid #e2e8f0',
                                                            background: formData.time === slot ? `${primaryColor}20` : 'white',
                                                            color: formData.time === slot ? primaryColor : '#475569',
                                                            fontWeight: formData.time === slot ? '600' : '400',
                                                            cursor: 'pointer',
                                                        }, children: slot }, slot)))) })] }))] })), step === 3 && (_jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }, children: "Hizmet Detaylar\u0131" }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }, children: "Hizmet T\u00FCr\u00FC" }), _jsxs("select", { style: { ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%' }, value: formData.serviceType, onChange: (e) => setFormData({ ...formData, serviceType: e.target.value }), children: [_jsx("option", { value: "", children: "Se\u00E7iniz..." }), _jsx("option", { value: "PERIODIC_MAINTENANCE", children: "Periyodik Bak\u0131m" }), _jsx("option", { value: "OIL_CHANGE", children: "Ya\u011F De\u011Fi\u015Fimi" }), _jsx("option", { value: "BRAKE_SERVICE", children: "Fren Servisi" }), _jsx("option", { value: "TIRE_SERVICE", children: "Lastik Servisi" }), _jsx("option", { value: "AIR_CONDITIONING", children: "Klima Servisi" }), _jsx("option", { value: "ELECTRICAL", children: "Elektrik Servisi" }), _jsx("option", { value: "MECHANICAL_REPAIR", children: "Mekanik Tamir" }), _jsx("option", { value: "INSPECTION", children: "Muayene Haz\u0131rl\u0131k" }), _jsx("option", { value: "OTHER", children: "Di\u011Fer" })] })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem' }, children: "Notlar (opsiyonel)" }), _jsx("textarea", { style: { ...styles.input, background: 'white', color: '#1e293b', border: '1px solid #e2e8f0', width: '100%', minHeight: '100px', resize: 'vertical' }, value: formData.notes, onChange: (e) => setFormData({ ...formData, notes: e.target.value }), placeholder: "Arac\u0131n\u0131zla ilgili ek bilgiler..." })] }), _jsxs("div", { style: { background: '#f8fafc', borderRadius: '8px', padding: '1rem' }, children: [_jsx("h3", { style: { fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.5rem' }, children: "Randevu \u00D6zeti" }), _jsxs("div", { style: { fontSize: '0.85rem', color: '#475569' }, children: [_jsxs("div", { children: ["Ad Soyad: ", formData.customerName] }), _jsxs("div", { children: ["Telefon: ", formData.customerPhone] }), _jsxs("div", { children: ["Plaka: ", formData.plate] }), _jsxs("div", { children: ["Tarih: ", formData.date ? new Date(formData.date).toLocaleDateString('tr-TR') : '', " ", formData.time] }), formData.serviceType && _jsxs("div", { children: ["Hizmet: ", formData.serviceType] })] })] })] })), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }, children: [step > 1 && step < 4 && (_jsx("button", { onClick: () => setStep(step - 1), style: { padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', cursor: 'pointer' }, children: "\u2190 Geri" })), step < 3 && (_jsx("button", { onClick: () => canProceed() && setStep(step + 1), disabled: !canProceed(), style: {
                                                padding: '0.75rem 1.5rem',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: canProceed() ? primaryColor : '#e2e8f0',
                                                color: canProceed() ? 'white' : '#94a3b8',
                                                cursor: canProceed() ? 'pointer' : 'not-allowed',
                                                marginLeft: 'auto',
                                            }, children: "Devam \u2192" })), step === 3 && (_jsx("button", { onClick: handleSubmit, disabled: loading, style: {
                                                padding: '0.75rem 1.5rem',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: primaryColor,
                                                color: 'white',
                                                cursor: loading ? 'not-allowed' : 'pointer',
                                                marginLeft: 'auto',
                                                opacity: loading ? 0.7 : 1,
                                            }, children: loading ? 'Oluşturuluyor...' : 'Randevu Oluştur' }))] })] })] }) })] }));
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
    const validateSlug = (slug) => {
        return /^[a-z0-9-]+$/.test(slug);
    };
    const generateSlug = (value) => {
        return value
            .toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    };
    const handleSlugChange = (value) => {
        setFormData({ ...formData, tenantSlug: value });
    };
    const handleTenantNameChange = (value) => {
        const autoSlug = generateSlug(value);
        setFormData({ ...formData, tenantName: value, tenantSlug: autoSlug });
    };
    const handleSubmit = async () => {
        setError('');
        // Validation
        if (!formData.tenantName.trim()) {
            setError('Firma adı zorunludur.');
            return;
        }
        if (!formData.tenantSlug.trim()) {
            setError('Servis URL adı zorunludur.');
            return;
        }
        if (!validateSlug(formData.tenantSlug)) {
            setError('URL adı sadece küçük harf, rakam ve tire içerebilir.');
            return;
        }
        if (!formData.adminEmail.trim()) {
            setError('E-posta zorunludur.');
            return;
        }
        if (!formData.adminPassword) {
            setError('Şifre zorunludur.');
            return;
        }
        if (formData.adminPassword.length < 8) {
            setError('Şifre en az 8 karakter olmalıdır.');
            return;
        }
        if (!/[A-Z]/.test(formData.adminPassword)) {
            setError('Şifre en az bir büyük harf içermelidir.');
            return;
        }
        if (!/[a-z]/.test(formData.adminPassword)) {
            setError('Şifre en az bir küçük harf içermelidir.');
            return;
        }
        if (!/[0-9]/.test(formData.adminPassword)) {
            setError('Şifre en az bir rakam içermelidir.');
            return;
        }
        if (formData.adminPassword !== formData.adminPasswordConfirm) {
            setError('Şifreler eşleşmiyor.');
            return;
        }
        if (!formData.adminFirstName.trim()) {
            setError('Ad zorunludur.');
            return;
        }
        if (!formData.adminLastName.trim()) {
            setError('Soyad zorunludur.');
            return;
        }
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
        }
        catch (err) {
            setError(err.message || 'Bir hata oluştu.');
        }
        finally {
            setLoading(false);
        }
    };
    if (success) {
        return (_jsxs("div", { style: styles.container, children: [_jsx("header", { style: styles.header, children: _jsxs("div", { style: styles.logo, children: [_jsx("span", { children: "\uD83D\uDD27" }), _jsx("span", { children: "OtoServisApp" })] }) }), _jsx("main", { style: { ...styles.main, textAlign: 'center' }, children: _jsxs("div", { style: { background: 'white', borderRadius: '16px', padding: '3rem', maxWidth: '500px', margin: '0 auto', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }, children: [_jsx("div", { style: { fontSize: '4rem', marginBottom: '1rem' }, children: "\u2705" }), _jsx("h2", { style: { fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }, children: "Kay\u0131t Ba\u015Far\u0131l\u0131!" }), _jsxs("p", { style: { color: '#64748b', lineHeight: 1.6, marginBottom: '1.5rem' }, children: [_jsx("strong", { children: formData.tenantName }), " firmas\u0131 ba\u015Far\u0131yla olu\u015Fturuldu.", _jsx("br", {}), "Art\u0131k sistemizi kullanmaya ba\u015Flayabilirsiniz."] }), _jsxs("div", { style: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }, children: [_jsx("div", { style: { fontSize: '0.85rem', color: '#166534', marginBottom: '0.25rem' }, children: "Portal Adresiniz:" }), _jsxs("div", { style: { fontSize: '1.1rem', fontWeight: 700, color: '#15803d' }, children: ["otoservisapp.com/", formData.tenantSlug] })] }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem', justifyContent: 'center' }, children: [_jsx(Link, { to: `/${formData.tenantSlug}`, style: {
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '8px',
                                            background: '#2563eb',
                                            color: 'white',
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                        }, children: "Portal'a Git" }), _jsx(Link, { to: "/", style: {
                                            padding: '0.75rem 1.5rem',
                                            borderRadius: '8px',
                                            background: 'white',
                                            color: '#374151',
                                            textDecoration: 'none',
                                            fontWeight: 600,
                                            border: '1px solid #d1d5db',
                                        }, children: "Ana Sayfa" })] })] }) })] }));
    }
    return (_jsxs("div", { style: styles.container, children: [_jsxs("header", { style: styles.header, children: [_jsxs("div", { style: styles.logo, children: [_jsx("span", { children: "\uD83D\uDD27" }), _jsx("span", { children: "OtoServisApp" })] }), _jsx(Link, { to: "/", style: { color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }, children: "\u2190 Ana Sayfa" })] }), _jsx("main", { style: styles.main, children: _jsx("div", { style: { maxWidth: '600px', margin: '0 auto' }, children: _jsxs("div", { style: { background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }, children: [_jsx("h2", { style: { fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem', textAlign: 'center' }, children: "Tamir Firmas\u0131 Kayd\u0131" }), _jsx("p", { style: { color: '#64748b', textAlign: 'center', marginBottom: '1.5rem' }, children: "Sisteminizi hemen kullanmaya ba\u015Flay\u0131n" }), _jsx("div", { style: { display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem', alignItems: 'center' }, children: [{ n: 1, label: 'Firma' }, { n: 2, label: 'Yönetici' }, { n: 3, label: 'Onay' }].map((s, i) => (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.4rem' }, children: [_jsx("div", { style: {
                                                width: '28px', height: '28px', borderRadius: '50%',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: step >= s.n ? '#2563eb' : '#e2e8f0',
                                                color: step >= s.n ? 'white' : '#64748b',
                                                fontWeight: 700, fontSize: '0.8rem',
                                            }, children: s.n }), _jsx("span", { style: { fontSize: '0.8rem', fontWeight: step === s.n ? 600 : 400, color: step >= s.n ? '#1e293b' : '#94a3b8' }, children: s.label }), i < 2 && _jsx("div", { style: { width: '30px', height: '2px', background: step > s.n ? '#2563eb' : '#e2e8f0' } })] }, s.n))) }), error && (_jsx("div", { style: { background: '#fef2f2', color: '#dc2626', padding: '0.7rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }, children: error })), step === 1 && (_jsxs("div", { children: [_jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }, children: "Firma Ad\u0131 *" }), _jsx("input", { style: { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }, value: formData.tenantName, onChange: (e) => handleTenantNameChange(e.target.value), placeholder: "\u00F6rn. OtoFix Servis" })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsxs("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }, children: ["Servis URL Ad\u0131 * ", _jsx("span", { style: { color: '#94a3b8', fontWeight: 400 }, children: "(portal adresiniz)" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '0.5rem' }, children: [_jsx("span", { style: { color: '#64748b', fontSize: '0.9rem' }, children: "otoservisapp.com/" }), _jsx("input", { style: { flex: 1, padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem', fontWeight: 600 }, value: formData.tenantSlug, onChange: (e) => handleSlugChange(e.target.value), placeholder: "oto-fix" })] }), _jsx("div", { style: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }, children: "Sadece k\u00FC\u00E7\u00FCk harf, rakam ve tire kullanabilirsiniz" })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }, children: "Telefon" }), _jsx("input", { style: { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }, value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), placeholder: "0555 123 45 67" })] }), _jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }, children: "Adres" }), _jsx("textarea", { style: { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem', minHeight: '80px', resize: 'vertical' }, value: formData.address, onChange: (e) => setFormData({ ...formData, address: e.target.value }), placeholder: "Servis adresi..." })] }), _jsx("button", { onClick: () => {
                                            if (!formData.tenantName.trim()) {
                                                setError('Firma adı zorunludur.');
                                                return;
                                            }
                                            if (!formData.tenantSlug.trim()) {
                                                setError('URL adı zorunludur.');
                                                return;
                                            }
                                            setError('');
                                            setStep(2);
                                        }, style: { width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }, children: "Devam \u2192" })] })), step === 2 && (_jsxs("div", { children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }, children: "Ad *" }), _jsx("input", { style: { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }, value: formData.adminFirstName, onChange: (e) => setFormData({ ...formData, adminFirstName: e.target.value }), placeholder: "Ahmet" })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }, children: "Soyad *" }), _jsx("input", { style: { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }, value: formData.adminLastName, onChange: (e) => setFormData({ ...formData, adminLastName: e.target.value }), placeholder: "Y\u0131lmaz" })] })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }, children: "E-posta *" }), _jsx("input", { style: { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }, type: "email", value: formData.adminEmail, onChange: (e) => setFormData({ ...formData, adminEmail: e.target.value }), placeholder: "ahmet@otofix.com" }), _jsx("div", { style: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }, children: "Giri\u015F yapmak i\u00E7in kullanaca\u011F\u0131n\u0131z e-posta" })] }), _jsxs("div", { style: { marginBottom: '1rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }, children: "\u015Eifre *" }), _jsx("input", { style: { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }, type: "password", value: formData.adminPassword, onChange: (e) => setFormData({ ...formData, adminPassword: e.target.value }), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx("div", { style: { fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }, children: "En az 8 karakter, b\u00FCy\u00FCk-k\u00FC\u00E7\u00FCk harf ve rakam" })] }), _jsxs("div", { style: { marginBottom: '1.5rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.85rem', color: '#475569', marginBottom: '0.25rem', fontWeight: 500 }, children: "\u015Eifre Tekrar *" }), _jsx("input", { style: { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem' }, type: "password", value: formData.adminPasswordConfirm, onChange: (e) => setFormData({ ...formData, adminPasswordConfirm: e.target.value }), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem' }, children: [_jsx("button", { onClick: () => { setError(''); setStep(1); }, style: { flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', fontSize: '1rem', cursor: 'pointer' }, children: "\u2190 Geri" }), _jsx("button", { onClick: () => {
                                                    if (!formData.adminFirstName.trim()) {
                                                        setError('Ad zorunludur.');
                                                        return;
                                                    }
                                                    if (!formData.adminLastName.trim()) {
                                                        setError('Soyad zorunludur.');
                                                        return;
                                                    }
                                                    if (!formData.adminEmail.trim()) {
                                                        setError('E-posta zorunludur.');
                                                        return;
                                                    }
                                                    if (!formData.adminPassword) {
                                                        setError('Şifre zorunludur.');
                                                        return;
                                                    }
                                                    if (formData.adminPassword.length < 8) {
                                                        setError('Şifre en az 8 karakter olmalıdır.');
                                                        return;
                                                    }
                                                    if (formData.adminPassword !== formData.adminPasswordConfirm) {
                                                        setError('Şifreler eşleşmiyor.');
                                                        return;
                                                    }
                                                    setError('');
                                                    setStep(3);
                                                }, style: { flex: 2, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }, children: "Devam \u2192" })] })] })), step === 3 && (_jsxs("div", { children: [_jsxs("div", { style: { background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }, children: [_jsx("h4", { style: { fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }, children: "Firma Bilgileri" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }, children: [_jsxs("div", { children: [_jsx("span", { style: { color: '#64748b' }, children: "Firma:" }), " ", _jsx("strong", { children: formData.tenantName })] }), _jsxs("div", { children: [_jsx("span", { style: { color: '#64748b' }, children: "URL:" }), " ", _jsxs("strong", { children: ["otoservisapp.com/", formData.tenantSlug] })] }), formData.phone && _jsxs("div", { children: [_jsx("span", { style: { color: '#64748b' }, children: "Telefon:" }), " ", _jsx("strong", { children: formData.phone })] })] })] }), _jsxs("div", { style: { background: '#f8fafc', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }, children: [_jsx("h4", { style: { fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '0.75rem' }, children: "Y\u00F6netici Hesab\u0131" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.9rem' }, children: [_jsxs("div", { children: [_jsx("span", { style: { color: '#64748b' }, children: "Ad Soyad:" }), " ", _jsxs("strong", { children: [formData.adminFirstName, " ", formData.adminLastName] })] }), _jsxs("div", { children: [_jsx("span", { style: { color: '#64748b' }, children: "E-posta:" }), " ", _jsx("strong", { children: formData.adminEmail })] })] })] }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem' }, children: [_jsx("button", { onClick: () => { setError(''); setStep(2); }, style: { flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', color: '#374151', fontSize: '1rem', cursor: 'pointer' }, children: "\u2190 Geri" }), _jsx("button", { onClick: handleSubmit, disabled: loading, style: { flex: 2, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontSize: '1rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }, children: loading ? 'Oluşturuluyor...' : '✓ Kaydı Tamamla' })] })] }))] }) }) })] }));
}
// ============================================================================
// App
// ============================================================================
export function App() {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/register", element: _jsx(RegisterPage, {}) }), _jsx(Route, { path: "/:tenantSlug", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/:tenantSlug/vehicle/:plate", element: _jsx(VehicleHistoryPage, {}) }), _jsx(Route, { path: "/:tenantSlug/appointment", element: _jsx(AppointmentPage, {}) })] }) }));
}
