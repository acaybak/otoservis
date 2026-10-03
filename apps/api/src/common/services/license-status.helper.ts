// Deneme süresi ve lisans durumu hesaplaması — tenants/licenses servisleri ve
// deneme guard'ı ortak kullanır. Saf fonksiyonlardır (DI yoktur).

export interface TrialInfo {
  endsAt: string | null;
  daysLeft: number | null;
  expired: boolean;
}

export const TRIAL_DAYS = 7;

// Lisans aktif mi? (durum ACTIVE ve bitiş tarihi geçmemiş olmalı)
export function isLicenseActive(
  license: { status: string; expiresAt?: Date | string | null } | null | undefined,
): boolean {
  if (!license || license.status !== 'ACTIVE') return false;
  if (license.expiresAt && new Date(license.expiresAt) < new Date()) return false;
  return true;
}

// Deneme bilgisi: trialEndsAt yoksa (yönetici firmaları) null döner.
// "expired" yalnızca aktif lisans yoksa true olabilir; lisans varken deneme
// süresi dolmuş olsa bile kısıt uygulanmaz.
export function buildTrialInfo(
  trialEndsAt: Date | string | null | undefined,
  licenseActive: boolean,
): TrialInfo | null {
  if (!trialEndsAt) return null;
  const ends = new Date(trialEndsAt);
  const daysLeft = Math.max(0, Math.ceil((ends.getTime() - Date.now()) / 86400000));
  return {
    endsAt: ends.toISOString(),
    daysLeft,
    expired: !licenseActive && ends < new Date(),
  };
}
