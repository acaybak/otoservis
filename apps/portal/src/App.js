import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_URL || 'https://otoservis-api.onrender.com/api/v1';
// ============================================================================
// Styles - Professional Clean Design
// ============================================================================
const S = {
    // Layout
    page: { minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },
    // Header
    header: (bg) => ({
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2rem',
        background: bg || 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }),
    logo: { fontSize: '1.25rem', fontWeight: '700', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' },
    logoImg: { height: '32px', width: 'auto' },
    logoBadge: { background: 'white', borderRadius: 8, padding: '2px 8px', display: 'flex', alignItems: 'center' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
    headerPhone: { color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' },
    // Hero
    hero: { padding: '4rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #3b82f6 100%)', color: 'white' },
    heroTitle: { fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.02em' },
    heroSub: { fontSize: '1.1rem', color: 'rgba(255,255,255,0.75)', marginBottom: '2.5rem', maxWidth: '500px', margin: '0 auto 2.5rem' },
    // Search
    searchCard: { maxWidth: '520px', margin: '0 auto', background: 'white', borderRadius: '16px', padding: '1.75rem', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' },
    searchLabel: { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' },
    searchInput: { width: '100%', padding: '0.85rem 1rem', fontSize: '1.1rem', borderRadius: '10px', border: '2px solid #e2e8f0', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
    searchBtn: { width: '100%', padding: '0.85rem', fontSize: '1rem', fontWeight: '600', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', cursor: 'pointer', marginTop: '1rem', transition: 'transform 0.1s' },
    error: { marginTop: '0.75rem', padding: '0.65rem', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', textAlign: 'center', fontSize: '0.9rem' },
    // Features
    features: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', padding: '3rem 2rem', maxWidth: '900px', margin: '0 auto' },
    featureCard: { background: 'white', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' },
    featureIcon: { fontSize: '2rem', marginBottom: '0.75rem' },
    featureTitle: { fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.35rem' },
    featureDesc: { fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' },
    // Footer
    footer: { textAlign: 'center', padding: '1.5rem 2rem', borderTop: '1px solid #e2e8f0', color: '#94a3b8', fontSize: '0.8rem' },
    // Content pages
    contentPage: { background: '#f8fafc', minHeight: '100vh' },
    contentHeader: (bg) => ({
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '1rem 2rem', background: bg || '#1e40af',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }),
    contentMain: { padding: '2rem', maxWidth: '960px', margin: '0 auto' },
    card: { background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' },
    statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' },
    statCard: (color) => ({ background: 'white', borderRadius: '10px', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', borderLeft: `3px solid ${color}` }),
    statLabel: { fontSize: '0.75rem', color: '#64748b', marginBottom: '0.35rem', fontWeight: '500' },
    statValue: (color) => ({ fontSize: '1.4rem', fontWeight: '700', color }),
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '0.65rem 0.75rem', textAlign: 'left', fontSize: '0.8rem', color: '#64748b', fontWeight: '600', borderBottom: '2px solid #e2e8f0' },
    td: { padding: '0.65rem 0.75rem', fontSize: '0.9rem', color: '#1e293b', borderBottom: '1px solid #f1f5f9' },
    printBtn: { padding: '0.5rem 1.25rem', fontSize: '0.85rem', fontWeight: '600', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white', cursor: 'pointer', backdropFilter: 'blur(4px)' },
};
// ============================================================================
// Home Page - Clean Plate Search
// ============================================================================
function HomePage() {
    const [tenantSlug, setTenantSlug] = useState('');
    const [plate, setPlate] = useState('');
    const [error, setError] = useState('');
    const [tenantInfo, setTenantInfo] = useState(null);
    const navigate = useNavigate();
    useEffect(() => {
        const host = window.location.hostname;
        const parts = host.split('.');
        let slug = '';
        if (parts.length > 2 && parts[0] !== 'localhost' && parts[0] !== 'www' && parts[0] !== 'portal' && parts[0] !== 'portal-dist-opal') {
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
                .then(data => { if (data)
                setTenantInfo(data); })
                .catch(() => { });
        }
    }, []);
    const handleSearch = () => {
        setError('');
        const trimmedPlate = plate.trim().toUpperCase().replace(/\s+/g, '');
        if (!tenantSlug) {
            setError('Servis bilgisi bulunamadı.');
            return;
        }
        if (!trimmedPlate || trimmedPlate.length < 6) {
            setError('Geçerli bir plaka giriniz (örn: 34ABC123).');
            return;
        }
        navigate(`/${tenantSlug}/vehicle/${encodeURIComponent(trimmedPlate)}`);
    };
    const handleKeyDown = (e) => { if (e.key === 'Enter')
        handleSearch(); };
    const shopName = tenantInfo?.name || tenantSlug || 'OtoServis';
    const shopPhone = tenantInfo?.phone || '';
    const primaryColor = tenantInfo?.primaryColor || '#2563eb';
    return (_jsxs("div", { style: S.page, children: [_jsxs("header", { style: S.header(primaryColor), children: [_jsxs(Link, { to: "/", style: S.logo, children: [_jsx("div", { style: S.logoBadge, children: _jsx("img", { src: "/logo.png", alt: shopName, style: S.logoImg }) }), _jsx("span", { children: shopName })] }), _jsxs("div", { style: S.headerRight, children: [tenantSlug && (_jsx(Link, { to: `/${tenantSlug}/appointment`, style: {
                                    padding: '0.4rem 1rem',
                                    background: 'rgba(255,255,255,0.15)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    textDecoration: 'none',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                }, children: "\uD83D\uDCC5 Randevu" })), shopPhone && (_jsxs("span", { style: S.headerPhone, children: ["\uD83D\uDCDE ", shopPhone] }))] })] }), _jsxs("div", { style: S.hero, children: [_jsx("h1", { style: S.heroTitle, children: "Arac\u0131n\u0131z\u0131n Bak\u0131m Ge\u00E7mi\u015Fini Sorgulay\u0131n" }), _jsx("p", { style: S.heroSub, children: "Plakan\u0131z\u0131 girerek t\u00FCm bak\u0131m, onar\u0131m ve servis ge\u00E7mi\u015Finizi g\u00F6r\u00FCnt\u00FCleyin." }), _jsxs("div", { style: S.searchCard, children: [_jsx("label", { style: S.searchLabel, children: "Plaka Numaras\u0131" }), _jsx("input", { style: S.searchInput, type: "text", placeholder: "34 ABC 123", value: plate, onChange: e => setPlate(e.target.value.toUpperCase()), onKeyDown: handleKeyDown, maxLength: 20, autoFocus: true }), _jsx("button", { style: S.searchBtn, onClick: handleSearch, onMouseDown: e => (e.currentTarget.style.transform = 'scale(0.98)'), onMouseUp: e => (e.currentTarget.style.transform = 'scale(1)'), children: "\uD83D\uDD0D Sorgula" }), error && _jsx("div", { style: S.error, children: error })] }), tenantSlug && (_jsx("div", { style: { marginTop: '1.5rem' }, children: _jsx(Link, { to: `/${tenantSlug}/appointment`, style: {
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.75rem',
                                background: 'rgba(255,255,255,0.15)',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderRadius: '12px',
                                color: 'white',
                                textDecoration: 'none',
                                fontWeight: '600',
                                fontSize: '1rem',
                                transition: 'all 0.2s',
                                backdropFilter: 'blur(4px)',
                            }, children: "\uD83D\uDCC5 Online Randevu Al" }) }))] }), _jsxs("div", { style: S.features, children: [_jsxs("div", { style: S.featureCard, children: [_jsx("div", { style: S.featureIcon, children: "\uD83D\uDCCB" }), _jsx("div", { style: S.featureTitle, children: "Detayl\u0131 Bak\u0131m Ge\u00E7mi\u015Fi" }), _jsx("div", { style: S.featureDesc, children: "Arac\u0131n\u0131z\u0131n t\u00FCm bak\u0131m ve onar\u0131m kay\u0131tlar\u0131n\u0131 tarih, i\u015Flem ve tutar detaylar\u0131yla g\u00F6r\u00FCnt\u00FCleyin." })] }), _jsxs("div", { style: S.featureCard, children: [_jsx("div", { style: S.featureIcon, children: "\uD83D\uDD14" }), _jsx("div", { style: S.featureTitle, children: "Bak\u0131m Hat\u0131rlatmalar\u0131" }), _jsx("div", { style: S.featureDesc, children: "Bir sonraki bak\u0131m\u0131n\u0131z\u0131n ne zaman gelmesi gerekti\u011Fini kilometre ve tarih baz\u0131nda \u00F6\u011Frenin." })] }), _jsxs("div", { style: S.featureCard, children: [_jsx("div", { style: S.featureIcon, children: "\uD83D\uDCB0" }), _jsx("div", { style: S.featureTitle, children: "Maliyet \u00D6zeti" }), _jsx("div", { style: S.featureDesc, children: "Arac\u0131n\u0131za yap\u0131lan toplam harcamay\u0131 ve her bak\u0131m\u0131n maliyetini \u015Feffaf \u015Fekilde g\u00F6r\u00FCn." })] })] }), _jsxs("footer", { style: S.footer, children: [_jsx("div", { style: { fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }, children: shopName }), _jsx("div", { children: "\u00A9 2026 \u2022 OtoServisApp ile g\u00FC\u00E7lendirilmi\u015Ftir" })] })] }));
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
                const [tenantRes, historyRes] = await Promise.all([
                    fetch(`${API_BASE}/public/${tenantSlug}/info`),
                    fetch(`${API_BASE}/public/${tenantSlug}/vehicle-history/${encodeURIComponent(plate)}`),
                ]);
                if (tenantRes.ok)
                    setTenantInfo(await tenantRes.json());
                if (!historyRes.ok) {
                    setError(historyRes.status === 404 ? 'Bu plakaya kayıtlı araç bulunamadı.' : 'Bir hata oluştu.');
                    setLoading(false);
                    return;
                }
                setData(await historyRes.json());
            }
            catch {
                setError('Sunucuya bağlanılamadı.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [plate, tenantSlug]);
    const primaryColor = tenantInfo?.primaryColor || '#2563eb';
    const shopName = tenantInfo?.name || tenantSlug || 'OtoServis';
    const shopPhone = tenantInfo?.phone || '';
    if (loading)
        return (_jsxs("div", { style: S.contentPage, children: [_jsx("header", { style: S.contentHeader(primaryColor), children: _jsxs(Link, { to: "/", style: { ...S.logo, color: 'white' }, children: [_jsx("div", { style: S.logoBadge, children: _jsx("img", { src: "/logo.png", alt: shopName, style: S.logoImg }) }), _jsx("span", { children: shopName })] }) }), _jsx("div", { style: { textAlign: 'center', padding: '4rem', color: '#64748b' }, children: "Y\u00FCkleniyor..." })] }));
    if (error)
        return (_jsxs("div", { style: S.contentPage, children: [_jsx("header", { style: S.contentHeader(primaryColor), children: _jsxs(Link, { to: "/", style: { ...S.logo, color: 'white' }, children: [_jsx("div", { style: S.logoBadge, children: _jsx("img", { src: "/logo.png", alt: shopName, style: S.logoImg }) }), _jsx("span", { children: shopName })] }) }), _jsx("div", { style: { ...S.contentMain, textAlign: 'center' }, children: _jsxs("div", { style: { ...S.card, maxWidth: '450px', margin: '3rem auto', padding: '2.5rem' }, children: [_jsx("div", { style: { fontSize: '3rem', marginBottom: '1rem' }, children: "\uD83D\uDD0D" }), _jsx("div", { style: { color: '#dc2626', fontSize: '1.1rem', marginBottom: '1rem' }, children: error }), _jsx(Link, { to: "/", style: { color: primaryColor, textDecoration: 'none', fontWeight: '600' }, children: "\u2190 Ana sayfaya d\u00F6n" })] }) })] }));
    if (!data)
        return null;
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
    return (_jsxs("div", { style: S.contentPage, children: [_jsxs("header", { style: S.contentHeader(primaryColor), children: [_jsxs(Link, { to: "/", style: { ...S.logo, color: 'white' }, children: [_jsx("div", { style: S.logoBadge, children: _jsx("img", { src: "/logo.png", alt: shopName, style: S.logoImg }) }), _jsx("span", { children: shopName })] }), _jsxs("div", { style: { display: 'flex', gap: '0.75rem', alignItems: 'center' }, children: [shopPhone && _jsxs("span", { style: S.headerPhone, children: ["\uD83D\uDCDE ", shopPhone] }), _jsx("button", { onClick: handlePrint, style: S.printBtn, children: "\uD83D\uDDA8\uFE0F Yazd\u0131r" })] })] }), _jsxs("main", { style: S.contentMain, children: [_jsx("div", { style: S.card, children: _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem', fontWeight: '500' }, children: "Ara\u00E7 Bilgileri" }), _jsx("div", { style: { fontSize: '1.4rem', fontWeight: '700', color: '#1e293b' }, children: vehicle.plate }), _jsxs("div", { style: { color: '#475569', marginTop: '0.15rem' }, children: [vehicle.brand, " ", vehicle.model, " ", vehicle.year ? `• ${vehicle.year}` : ''] })] }), _jsxs("div", { style: { display: 'flex', gap: '2rem' }, children: [_jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }, children: "Kilometre" }), _jsx("div", { style: { fontSize: '1.15rem', fontWeight: '600', color: '#1e293b' }, children: vehicle.km ? `${Number(vehicle.km).toLocaleString('tr-TR')} km` : '-' })] }), _jsxs("div", { style: { textAlign: 'center' }, children: [_jsx("div", { style: { fontSize: '0.7rem', color: '#64748b', fontWeight: '500' }, children: "Yak\u0131t" }), _jsx("div", { style: { fontSize: '1.15rem', fontWeight: '600', color: '#1e293b' }, children: vehicle.fuelType || '-' })] })] })] }) }), _jsxs("div", { style: S.statGrid, children: [_jsxs("div", { style: S.statCard(primaryColor), children: [_jsx("div", { style: S.statLabel, children: "Toplam Bak\u0131m" }), _jsx("div", { style: S.statValue(primaryColor), children: summary.maintenanceCount })] }), _jsxs("div", { style: S.statCard('#8b5cf6'), children: [_jsx("div", { style: S.statLabel, children: "\u0130\u015F Emri" }), _jsx("div", { style: S.statValue('#8b5cf6'), children: summary.serviceOrderCount })] }), _jsxs("div", { style: S.statCard('#10b981'), children: [_jsx("div", { style: S.statLabel, children: "Toplam Harcama" }), _jsxs("div", { style: S.statValue('#10b981'), children: ["\u20BA", summary.totalSpent.toLocaleString('tr-TR')] })] }), _jsxs("div", { style: S.statCard('#f59e0b'), children: [_jsx("div", { style: S.statLabel, children: "Son KM" }), _jsx("div", { style: S.statValue('#f59e0b'), children: summary.lastKm ? `${Number(summary.lastKm).toLocaleString('tr-TR')} km` : '-' })] })] }), maintenanceSchedule.length > 0 && (_jsxs("div", { style: S.card, children: [_jsx("h2", { style: { fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }, children: "\uD83D\uDCC5 Bak\u0131m Takvimi" }), _jsx("div", { style: { display: 'grid', gap: '0.5rem' }, children: maintenanceSchedule.map((item, idx) => {
                                    const currentKm = vehicle.km || summary.lastKm || 0;
                                    const isOverdue = item.nextDueKm && currentKm > item.nextDueKm;
                                    const isDueSoon = item.nextDueKm && currentKm >= item.nextDueKm - 1000;
                                    return (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', borderRadius: '8px', background: isOverdue ? '#fef2f2' : isDueSoon ? '#fefce8' : '#f8fafc', border: `1px solid ${isOverdue ? '#fecaca' : isDueSoon ? '#fef08a' : '#e2e8f0'}` }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }, children: item.typeName }), _jsxs("div", { style: { fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }, children: ["Son: ", item.lastKm ? `${Number(item.lastKm).toLocaleString('tr-TR')} km` : '-', item.lastPerformedAt && ` • ${new Date(item.lastPerformedAt).toLocaleDateString('tr-TR')}`] })] }), _jsxs("div", { style: { textAlign: 'right' }, children: [_jsx("div", { style: { fontSize: '0.7rem', color: '#64748b' }, children: "Sonraki" }), _jsx("div", { style: { fontWeight: '600', fontSize: '0.9rem', color: isOverdue ? '#dc2626' : isDueSoon ? '#d97706' : '#059669' }, children: item.nextDueKm ? `${Number(item.nextDueKm).toLocaleString('tr-TR')} km` : '-' })] })] }, idx));
                                }) })] })), maintenanceRecords.length > 0 && (_jsxs("div", { style: S.card, children: [_jsx("h2", { style: { fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }, children: "\uD83D\uDD27 Bak\u0131m Kay\u0131tlar\u0131" }), _jsx("div", { style: { overflowX: 'auto' }, children: _jsxs("table", { style: S.table, children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { style: S.th, children: "Tarih" }), _jsx("th", { style: S.th, children: "Bak\u0131m Tipi" }), _jsx("th", { style: { ...S.th, textAlign: 'right' }, children: "KM" }), _jsx("th", { style: { ...S.th, textAlign: 'right' }, children: "Tutar" })] }) }), _jsx("tbody", { children: maintenanceRecords.map((r) => (_jsxs("tr", { children: [_jsx("td", { style: S.td, children: r.performedAt ? new Date(r.performedAt).toLocaleDateString('tr-TR') : '-' }), _jsx("td", { style: S.td, children: r.maintenanceType?.name || 'Genel Bakım' }), _jsx("td", { style: { ...S.td, textAlign: 'right' }, children: r.km ? Number(r.km).toLocaleString('tr-TR') : '-' }), _jsxs("td", { style: { ...S.td, textAlign: 'right', fontWeight: '600' }, children: ["\u20BA", Number(r.totalAmount || 0).toLocaleString('tr-TR')] })] }, r.id))) })] }) })] })), serviceOrders.length > 0 && (_jsxs("div", { style: S.card, children: [_jsx("h2", { style: { fontSize: '1rem', fontWeight: '600', color: '#1e293b', marginBottom: '1rem' }, children: "\uD83D\uDCDD \u0130\u015F Emri Kay\u0131tlar\u0131" }), _jsx("div", { style: { display: 'grid', gap: '0.5rem' }, children: serviceOrders.map((o) => (_jsxs("div", { style: { padding: '0.85rem 1rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }, children: [_jsxs("span", { style: { fontWeight: '600', color: '#1e293b' }, children: ["#", o.orderNumber] }), _jsx("span", { style: { fontSize: '0.8rem', color: '#64748b' }, children: new Date(o.createdAt).toLocaleDateString('tr-TR') })] }), o.diagnosis && _jsx("div", { style: { fontSize: '0.85rem', color: '#475569', marginBottom: '0.35rem' }, children: o.diagnosis }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [_jsx("span", { style: { padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: o.status === 'DELIVERED' ? '#dcfce7' : '#fef3c7', color: o.status === 'DELIVERED' ? '#166534' : '#92400e' }, children: o.status === 'DELIVERED' ? 'Teslim Edildi' : o.status === 'IN_PROGRESS' ? 'Devam Ediyor' : o.status === 'PENDING' ? 'Bekliyor' : o.status }), _jsxs("span", { style: { fontWeight: '600', color: '#1e293b' }, children: ["\u20BA", Number(o.totalAmount || 0).toLocaleString('tr-TR')] })] })] }, o.id))) })] })), maintenanceRecords.length === 0 && serviceOrders.length === 0 && (_jsxs("div", { style: { ...S.card, textAlign: 'center', padding: '3rem' }, children: [_jsx("div", { style: { fontSize: '3rem', marginBottom: '0.75rem' }, children: "\uD83D\uDCED" }), _jsx("div", { style: { color: '#64748b' }, children: "Bu ara\u00E7 i\u00E7in hen\u00FCz kay\u0131t bulunmamaktad\u0131r." })] }))] })] }));
}
// ============================================================================
// Appointment Page
// ============================================================================
function AppointmentPage() {
    const { tenantSlug } = useParams();
    const [tenantInfo, setTenantInfo] = useState(null);
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ customerName: '', customerPhone: '', customerEmail: '', plate: '', vehicleBrand: '', vehicleModel: '', date: '', time: '', serviceType: '', notes: '' });
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);
    useEffect(() => {
        if (tenantSlug) {
            fetch(`${API_BASE}/public/${tenantSlug}/info`).then(r => r.ok ? r.json() : null).then(d => { if (d)
                setTenantInfo(d); }).catch(() => { });
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
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/public/${tenantSlug}/appointments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                throw new Error(e.message || 'Randevu oluşturulamadı.');
            }
            setSuccess(await res.json());
            setStep(4);
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setLoading(false);
        }
    };
    const canProceed = () => { if (step === 1)
        return formData.customerName && formData.customerPhone; if (step === 2)
        return formData.plate && formData.date && formData.time; return true; };
    if (success)
        return (_jsxs("div", { style: S.contentPage, children: [_jsx("header", { style: S.contentHeader(primaryColor), children: _jsxs(Link, { to: "/", style: { ...S.logo, color: 'white' }, children: [_jsx("div", { style: S.logoBadge, children: _jsx("img", { src: "/logo.png", alt: shopName, style: S.logoImg }) }), _jsx("span", { children: shopName })] }) }), _jsx("div", { style: { ...S.contentMain, textAlign: 'center' }, children: _jsxs("div", { style: { ...S.card, maxWidth: '450px', margin: '3rem auto', padding: '2.5rem' }, children: [_jsx("div", { style: { fontSize: '4rem', marginBottom: '1rem' }, children: "\u2705" }), _jsx("h2", { style: { fontSize: '1.4rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }, children: "Randevunuz Olu\u015Fturuldu!" }), _jsx("p", { style: { color: '#64748b', marginBottom: '1.5rem' }, children: success.message }), _jsxs("div", { style: { background: '#f8fafc', borderRadius: '8px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem' }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }, children: [_jsx("span", { style: { color: '#64748b' }, children: "Tarih:" }), _jsx("span", { style: { fontWeight: '600' }, children: new Date(success.date).toLocaleDateString('tr-TR') })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }, children: [_jsx("span", { style: { color: '#64748b' }, children: "Saat:" }), _jsx("span", { style: { fontWeight: '600' }, children: success.time })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx("span", { style: { color: '#64748b' }, children: "Plaka:" }), _jsx("span", { style: { fontWeight: '600' }, children: success.plate })] })] }), _jsx(Link, { to: "/", style: { color: primaryColor, textDecoration: 'none', fontWeight: '600' }, children: "\u2190 Ana sayfaya d\u00F6n" })] }) })] }));
    return (_jsxs("div", { style: S.contentPage, children: [_jsx("header", { style: S.contentHeader(primaryColor), children: _jsxs(Link, { to: "/", style: { ...S.logo, color: 'white' }, children: [_jsx("div", { style: S.logoBadge, children: _jsx("img", { src: "/logo.png", alt: shopName, style: S.logoImg }) }), _jsx("span", { children: shopName })] }) }), _jsx("main", { style: S.contentMain, children: _jsxs("div", { style: { maxWidth: '550px', margin: '0 auto' }, children: [_jsx("h1", { style: { fontSize: '1.5rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.35rem', textAlign: 'center' }, children: "Online Randevu Al" }), _jsx("p", { style: { color: '#64748b', textAlign: 'center', marginBottom: '1.5rem' }, children: "Birka\u00E7 ad\u0131mda randevunuzu olu\u015Fturun" }), _jsx("div", { style: { display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }, children: [1, 2, 3].map(s => _jsx("div", { style: { width: '50px', height: '4px', borderRadius: '2px', background: step >= s ? primaryColor : '#e2e8f0' } }, s)) }), _jsxs("div", { style: S.card, children: [error && _jsx("div", { style: { background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.65rem', marginBottom: '1rem', color: '#dc2626', textAlign: 'center', fontSize: '0.9rem' }, children: error }), step === 1 && (_jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1e293b' }, children: "\u0130leti\u015Fim Bilgileriniz" }), _jsxs("div", { style: { marginBottom: '0.85rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }, children: "Ad Soyad *" }), _jsx("input", { style: { ...S.searchInput, fontSize: '0.95rem' }, value: formData.customerName, onChange: e => setFormData({ ...formData, customerName: e.target.value }), placeholder: "Ad\u0131n\u0131z Soyad\u0131n\u0131z" })] }), _jsxs("div", { style: { marginBottom: '0.85rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }, children: "Telefon *" }), _jsx("input", { style: { ...S.searchInput, fontSize: '0.95rem' }, type: "tel", value: formData.customerPhone, onChange: e => setFormData({ ...formData, customerPhone: e.target.value }), placeholder: "0555 123 45 67" })] }), _jsxs("div", { style: { marginBottom: '0.85rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }, children: "E-posta (opsiyonel)" }), _jsx("input", { style: { ...S.searchInput, fontSize: '0.95rem' }, type: "email", value: formData.customerEmail, onChange: e => setFormData({ ...formData, customerEmail: e.target.value }), placeholder: "ornek@email.com" })] })] })), step === 2 && (_jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1e293b' }, children: "Ara\u00E7 ve Tarih" }), _jsxs("div", { style: { marginBottom: '0.85rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }, children: "Plaka *" }), _jsx("input", { style: { ...S.searchInput, fontSize: '0.95rem' }, value: formData.plate, onChange: e => setFormData({ ...formData, plate: e.target.value.toUpperCase() }), placeholder: "34ABC123" })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.85rem' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }, children: "Marka" }), _jsx("input", { style: { ...S.searchInput, fontSize: '0.95rem' }, value: formData.vehicleBrand, onChange: e => setFormData({ ...formData, vehicleBrand: e.target.value }), placeholder: "Volkswagen" })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }, children: "Model" }), _jsx("input", { style: { ...S.searchInput, fontSize: '0.95rem' }, value: formData.vehicleModel, onChange: e => setFormData({ ...formData, vehicleModel: e.target.value }), placeholder: "Golf" })] })] }), _jsxs("div", { style: { marginBottom: '0.85rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }, children: "Tarih *" }), _jsx("input", { style: { ...S.searchInput, fontSize: '0.95rem' }, type: "date", min: new Date().toISOString().split('T')[0], value: formData.date, onChange: e => setFormData({ ...formData, date: e.target.value, time: '' }) })] }), formData.date && (_jsxs("div", { style: { marginBottom: '0.85rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.4rem', fontWeight: '500' }, children: "Saat *" }), _jsx("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }, children: availableSlots.length === 0 ? (_jsx("div", { style: { gridColumn: '1/-1', color: '#94a3b8', textAlign: 'center', padding: '0.75rem', fontSize: '0.85rem' }, children: "Bu tarih i\u00E7in uygun saat yok." })) : availableSlots.map(slot => (_jsx("button", { onClick: () => setFormData({ ...formData, time: slot }), style: { padding: '0.45rem', borderRadius: '6px', border: formData.time === slot ? `2px solid ${primaryColor}` : '1px solid #e2e8f0', background: formData.time === slot ? `${primaryColor}15` : 'white', color: formData.time === slot ? primaryColor : '#475569', fontWeight: formData.time === slot ? '600' : '400', cursor: 'pointer', fontSize: '0.85rem' }, children: slot }, slot))) })] }))] })), step === 3 && (_jsxs("div", { children: [_jsx("h2", { style: { fontSize: '1rem', fontWeight: '600', marginBottom: '1.25rem', color: '#1e293b' }, children: "Hizmet Detaylar\u0131" }), _jsxs("div", { style: { marginBottom: '0.85rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }, children: "Hizmet T\u00FCr\u00FC" }), _jsxs("select", { style: { ...S.searchInput, fontSize: '0.95rem' }, value: formData.serviceType, onChange: e => setFormData({ ...formData, serviceType: e.target.value }), children: [_jsx("option", { value: "", children: "Se\u00E7iniz..." }), _jsx("option", { value: "PERIODIC_MAINTENANCE", children: "Periyodik Bak\u0131m" }), _jsx("option", { value: "OIL_CHANGE", children: "Ya\u011F De\u011Fi\u015Fimi" }), _jsx("option", { value: "BRAKE_SERVICE", children: "Fren Servisi" }), _jsx("option", { value: "TIRE_SERVICE", children: "Lastik Servisi" }), _jsx("option", { value: "AIR_CONDITIONING", children: "Klima Servisi" }), _jsx("option", { value: "ELECTRICAL", children: "Elektrik Servisi" }), _jsx("option", { value: "MECHANICAL_REPAIR", children: "Mekanik Tamir" }), _jsx("option", { value: "INSPECTION", children: "Muayene Haz\u0131rl\u0131k" }), _jsx("option", { value: "OTHER", children: "Di\u011Fer" })] })] }), _jsxs("div", { style: { marginBottom: '0.85rem' }, children: [_jsx("label", { style: { display: 'block', fontSize: '0.8rem', color: '#475569', marginBottom: '0.2rem', fontWeight: '500' }, children: "Notlar" }), _jsx("textarea", { style: { ...S.searchInput, fontSize: '0.95rem', minHeight: '80px', resize: 'vertical' }, value: formData.notes, onChange: e => setFormData({ ...formData, notes: e.target.value }), placeholder: "Arac\u0131n\u0131zla ilgili ek bilgiler..." })] }), _jsxs("div", { style: { background: '#f8fafc', borderRadius: '8px', padding: '1rem' }, children: [_jsx("h3", { style: { fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.5rem', color: '#475569' }, children: "Randevu \u00D6zeti" }), _jsxs("div", { style: { fontSize: '0.85rem', color: '#475569' }, children: [_jsxs("div", { children: ["Ad Soyad: ", formData.customerName] }), _jsxs("div", { children: ["Telefon: ", formData.customerPhone] }), _jsxs("div", { children: ["Plaka: ", formData.plate] }), _jsxs("div", { children: ["Tarih: ", formData.date ? new Date(formData.date).toLocaleDateString('tr-TR') : '', " ", formData.time] }), formData.serviceType && _jsxs("div", { children: ["Hizmet: ", formData.serviceType] })] })] })] })), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem' }, children: [step > 1 && step < 4 && _jsx("button", { onClick: () => setStep(step - 1), style: { padding: '0.65rem 1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#475569', cursor: 'pointer', fontSize: '0.9rem' }, children: "\u2190 Geri" }), step < 3 && _jsx("button", { onClick: () => canProceed() && setStep(step + 1), disabled: !canProceed(), style: { padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: canProceed() ? primaryColor : '#e2e8f0', color: canProceed() ? 'white' : '#94a3b8', cursor: canProceed() ? 'pointer' : 'not-allowed', marginLeft: 'auto', fontSize: '0.9rem' }, children: "Devam \u2192" }), step === 3 && _jsx("button", { onClick: handleSubmit, disabled: loading, style: { padding: '0.65rem 1.25rem', borderRadius: '8px', border: 'none', background: primaryColor, color: 'white', cursor: loading ? 'not-allowed' : 'pointer', marginLeft: 'auto', opacity: loading ? 0.7 : 1, fontSize: '0.9rem' }, children: loading ? 'Oluşturuluyor...' : 'Randevu Oluştur' })] })] })] }) })] }));
}
// ============================================================================
// App
// ============================================================================
export function App() {
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/:tenantSlug", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/:tenantSlug/vehicle/:plate", element: _jsx(VehicleHistoryPage, {}) }), _jsx(Route, { path: "/:tenantSlug/appointment", element: _jsx(AppointmentPage, {}) })] }) }));
}
