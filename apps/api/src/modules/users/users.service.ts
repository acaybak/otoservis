import {
  Injectable,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { UserResponse } from '@otoservis/types';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    pagination: { skip: number; take: number },
  ): Promise<{ data: UserResponse[]; total: number }> {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId },
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
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { tenantId } }),
    ]);

    return {
      data: users.map((u) => this.toResponse(u)),
      total,
    };
  }

  async findOne(tenantId: string, id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
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

    return this.toResponse(user);
  }

  async create(
    tenantId: string,
    data: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      roleIds?: string[];
    },
  ): Promise<UserResponse> {
    const existing = await this.prisma.user.findFirst({
      where: { email: data.email.toLowerCase(), tenantId },
    });

    if (existing) {
      throw new ConflictException('Bu e-posta adresi zaten bu serviste kullanılıyor.');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          tenantId,
          email: data.email.toLowerCase(),
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || null,
          status: 'ACTIVE',
        },
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

      if (data.roleIds && data.roleIds.length > 0) {
        const roles = await tx.role.findMany({
          where: {
            id: { in: data.roleIds },
            OR: [{ tenantId }, { tenantId: null }],
          },
        });

        if (roles.length !== data.roleIds.length) {
          throw new NotFoundException('Belirtilen rollerden bazıları bulunamadı.');
        }

        await tx.userRole.createMany({
          data: data.roleIds.map((roleId) => ({
            userId: created.id,
            roleId,
          })),
        });
      }

      return tx.user.findUnique({
        where: { id: created.id },
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
    });

    if (!user) {
      throw new Error('Kullanıcı oluşturulamadı.');
    }

    this.logger.log(`User created: ${user.email} in tenant ${tenantId}`);

    return this.toResponse(user);
  }

  async update(
    tenantId: string,
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      status?: string;
    },
  ): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
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

    return this.toResponse(updated);
  }

  async assignRole(
    tenantId: string,
    userId: string,
    roleId: string,
  ): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const role = await this.prisma.role.findFirst({
      where: {
        id: roleId,
        OR: [{ tenantId }, { tenantId: null }],
      },
    });

    if (!role) {
      throw new NotFoundException('Rol bulunamadı.');
    }

    const existingAssignment = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });

    if (existingAssignment) {
      throw new ConflictException('Bu rol zaten bu kullanıcıya atanmış.');
    }

    await this.prisma.userRole.create({
      data: { userId, roleId },
    });

    return this.findOne(tenantId, userId);
  }

  async removeRole(
    tenantId: string,
    userId: string,
    roleId: string,
  ): Promise<UserResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const assignment = await this.prisma.userRole.findUnique({
      where: { userId_roleId: { userId, roleId } },
    });

    if (!assignment) {
      throw new NotFoundException('Bu rol bu kullanıcıya atanmamış.');
    }

    await this.prisma.userRole.delete({
      where: { userId_roleId: { userId, roleId } },
    });

    return this.findOne(tenantId, userId);
  }

  private toResponse(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    tenantId: string;
    status: string;
    userRoles: Array<{
      role: {
        id: string;
        name: string;
        rolePermissions: Array<{
          permission: {
            id: string;
            name: string;
            resource: string;
            action: string;
          };
        }>;
      };
    }>;
  }): UserResponse {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      tenantId: user.tenantId,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        permissions: ur.role.rolePermissions.map((rp) => ({
          id: rp.permission.id,
          name: rp.permission.name,
          resource: rp.permission.resource,
          action: rp.permission.action,
        })),
      })),
      status: user.status,
    };
  }
}
