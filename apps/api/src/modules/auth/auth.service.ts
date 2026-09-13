import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload, LoginResponse, UserResponse } from '@otoservis/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    tenantId?: string;
  }): Promise<{ message: string }> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: data.email,
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    });

    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi zaten kullanılıyor.');
    }

    if (data.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: data.tenantId },
      });
      if (!tenant) {
        throw new NotFoundException('Belirtilen servis bulunamadı.');
      }
      if (tenant.status !== 'ACTIVE' && tenant.status !== 'TRIAL') {
        throw new ConflictException('Bu servis şu anda aktif değil.');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        tenantId: data.tenantId || '',
        status: 'ACTIVE',
      },
    });

    this.logger.log(`User registered: ${user.email} (${user.id})`);

    return { message: 'Kullanıcı başarıyla oluşturuldu.' };
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Hesabınız aktif değil. Yöneticinizle iletişime geçin.');
    }

    if (user.tenant.status !== 'ACTIVE' && user.tenant.status !== 'TRIAL') {
      throw new UnauthorizedException('Servis hesabı aktif değil.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('E-posta veya şifre hatalı.');
    }

    const roles = user.userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      permissions: ur.role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
    }));

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles: roles.map((r) => r.name),
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT yapılandırması eksik.');
    }

    const accessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: 900, // 15 minutes
    });

    const refreshToken = jwt.sign(
      { sub: user.id, tenantId: user.tenantId },
      jwtRefreshSecret,
      { expiresIn: 604800 }, // 7 days
    );

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash },
    });

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      tenantId: user.tenantId,
      roles,
      status: user.status,
    };

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: userResponse,
    };
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    const jwtRefreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!jwtRefreshSecret) {
      throw new Error('JWT yapılandırması eksik.');
    }

    let decoded: { sub: string; tenantId: string };
    try {
      decoded = jwt.verify(refreshToken, jwtRefreshSecret) as { sub: string; tenantId: string };
    } catch {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş refresh token.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Geçersiz refresh token.');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Hesabınız aktif değil.');
    }

    const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new UnauthorizedException('Geçersiz refresh token.');
    }

    const roles = user.userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      permissions: ur.role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
    }));

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT yapılandırması eksik.');
    }

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      email: user.email,
      roles: roles.map((r) => r.name),
    };

    const newAccessToken = jwt.sign(payload, jwtSecret, {
      expiresIn: 900, // 15 minutes
    });

    const newRefreshToken = jwt.sign(
      { sub: user.id, tenantId: user.tenantId },
      jwtRefreshSecret,
      { expiresIn: 604800 }, // 7 days
    );

    const newRefreshHash = await bcrypt.hash(newRefreshToken, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: newRefreshHash },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 900,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        tenantId: user.tenantId,
        roles,
        status: user.status,
      },
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });

    return { message: 'Çıkış yapıldı.' };
  }

  async getMe(userId: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const roles = user.userRoles.map((ur) => ({
      id: ur.role.id,
      name: ur.role.name,
      permissions: ur.role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
    }));

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      tenantId: user.tenantId,
      roles,
      status: user.status,
    };
  }
}
