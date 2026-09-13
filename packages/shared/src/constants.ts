export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const JWT_ACCESS_EXPIRATION = '15m';
export const JWT_REFRESH_EXPIRATION = '7d';

export const BCRYPT_SALT_ROUNDS = 12;

export const PLATE_REGEX = /^\d{2}\s?[A-Z]{1,3}\s?\d{2,4}$/i;

export function normalizePlate(plate: string): string {
  return plate
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .trim();
}
