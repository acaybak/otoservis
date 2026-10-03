import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ADMIN_EMAILS ortam değişkeninde listelenen e-postalar yönetici (süper admin)
// sayılır. Değişken tanımlı değilse kısıtlama uygulanmaz — bu sayede yapılandırma
// eksikse mevcut erişim davranışı bozulmaz ve kilitlenme riski oluşmaz.
@Injectable()
export class AdminEmailGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const raw = this.configService.get<string>('ADMIN_EMAILS') || '';
    const allowed = raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    // Değişken tanımlı değilse kısıtlama uygulanmaz
    if (allowed.length === 0) return true;

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
