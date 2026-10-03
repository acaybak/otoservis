import { BadRequestException } from '@nestjs/common';

// Randevu geçmiş-tarih kısıtı için ortak zaman yardımcıları. Sunucu (Render)
// UTC çalıştığından "şu an" hesabı mutlaka İstanbul saatine göre yapılır;
// aksi halde Türkiye'de 03:00'e kadar dünkü tarihler geçerli sayılır.

const TZ = 'Europe/Istanbul';

export interface NowParts {
  /** YYYY-MM-DD (İstanbul) */
  date: string;
  /** Geceyarısından beri geçen dakika (İstanbul) */
  minutes: number;
}

/** İstanbul saatine göre bugünün tarihi ve dakikası. */
export function istanbulNowParts(now: Date = new Date()): NowParts {
  const parts = new Intl.DateTimeFormat('tr-TR', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const hour = parseInt(get('hour'), 10);
  // hourCycle sorunlarında 24:xx "00"e düşebilir; değer zaten 0-23 aralığında
  const minute = parseInt(get('minute'), 10);
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0),
  };
}

/** "HH:MM" → dakika; geçersizse null. */
function parseMinutes(time: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(time || '').trim());
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Randevu tarihi+saatinin (İstanbul) gelecekte olduğunu doğrular.
 * Geçersiz tarih/saat biçimi veya geçmiş zaman → BadRequestException.
 */
export function assertFutureAppointmentSlot(date: string, time: string): void {
  const dateStr = String(date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new BadRequestException('Geçersiz tarih formatı. Beklenen biçim: YYYY-AA-GG.');
  }
  const timeMin = parseMinutes(time);
  if (timeMin === null) {
    throw new BadRequestException('Geçersiz saat formatı. Beklenen biçim: SS:DD.');
  }

  const now = istanbulNowParts();
  if (dateStr < now.date) {
    throw new BadRequestException('Geçmiş tarih için randevu alınamaz. Lütfen bugün veya ileri bir tarih seçin.');
  }
  if (dateStr === now.date && timeMin < now.minutes) {
    throw new BadRequestException('Geçmiş saat için randevu alınamaz. Lütfen ileri bir saat seçin.');
  }
}
