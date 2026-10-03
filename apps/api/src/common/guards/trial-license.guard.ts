import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { isLicenseActive } from '../services/license-status.helper';

// Deneme süresi dolmuş ve aktif lisansı olmayan firmalar için yazma işlemlerini
// (yeni kayıt ekleme, düzenleme, bulut eşitleme) kilitler. Okuma işlemleri,
// kimlik doğrulama, lisans etkinleştirme ve firma profili yönetimi açıktır;
// kullanıcı lisansını girerek sistemi kendisi kurtarabilir.
@Injectable()
export class TrialLicenseGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = String(request.method || '').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;

    // Kurtarma yolları: giriş/lisans akışları, admin işlemleri ve kendi profilini
    // güncelleme (Ayarlar sayfası lisans etkinleştirme buradan çalışır)
    const path = String(request.path || request.url || '');
    const exemptPrefixes = ['/api/v1/auth', '/api/v1/licenses', '/api/v1/admin'];
    if (exemptPrefixes.some((p) => path === p || path.startsWith(p + '/'))) return true;
    if (path === '/api/v1/tenants/me') return true;

    // Genel (public) uçlarda kullanıcı yoktur; deneme kapsamı sorgulanamaz
    const user = request.user;
    if (!user || !user.tenantId) return true;

    const tenantId = String(user.tenantId);

    let tenant: { trialEndsAt: Date | null } | null = null;
    try {
      tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { trialEndsAt: true },
      });
    } catch {
      // Sorgu hatasında erişimi bozmamak için serbest bırak
      return true;
    }
    // Deneme kapsamı yok (yönetici firmaları) → kısıt uygulanmaz
    if (!tenant || !tenant.trialEndsAt) return true;

    // Lisans modeli eski şema istemcilerinde bulunmayabilir; çalışma zamanında
    // üretilmiş istemcide mevcuttur (Render buildCommand db:generate çalıştırır)
    let license: any = null;
    try {
      license = await (this.prisma as any).license.findUnique({ where: { tenantId } });
    } catch {
      license = null;
    }
    if (isLicenseActive(license)) return true;

    if (new Date(tenant.trialEndsAt) < new Date()) {
      throw new ForbiddenException({
        code: 'TRIAL_EXPIRED',
        message:
          'Deneme süreniz doldu. Devam etmek için lisansınızı etkinleştirin (Ayarlar → Lisans Durumu).',
      });
    }
    return true;
  }
}
