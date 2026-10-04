import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ADMIN_EMAILS ortam değişkeninde listelenen e-postalar yönetici (süper admin)
// sayılır. Değişken tanımlı değilse/boşsa istekler reddedilir (fail-closed) —
// eksik yapılandırma yönetici uçlarını herkese açmamalı.
@Injectable()
export class AdminEmailGuard implements CanActivate {
  private readonly logger = new Logger(AdminEmailGuard.name);

  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const raw = this.configService.get<string>('ADMIN_EMAILS') || '';
    const allowed = raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    // Liste boşsa erişim kapatılır (fail-closed): yapılandırma hatası
    // sessizce yetki genişletmesine yol açmamalı.
    if (allowed.length === 0) {
      this.logger.error('ADMIN_EMAILS tanımlı değil veya boş — yönetici uçları reddediliyor.');
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }

    const request = context.switchToHttp().getRequest();
    const email =
      request.user && request.user.email
        ? String(request.user.email).toLowerCase()
        : '';

    if (!email || !allowed.includes(email)) {
      throw new ForbiddenException('Bu işlem için yetkiniz yok.');
    }
    return true;
  }
}
