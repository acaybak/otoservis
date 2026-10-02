import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Bootstrap seed: production DB may lack permissions/roles (no shell access on free tier).
// Runs idempotently on every API boot. Also backfills TENANT_OWNER for tenants without an owner.

const PERMISSIONS = [
  { name: 'customer.view', resource: 'customer', action: 'view', description: 'Müşteri görüntüleme' },
  { name: 'customer.manage', resource: 'customer', action: 'manage', description: 'Müşteri yönetimi (CRUD)' },
  { name: 'vehicle.view', resource: 'vehicle', action: 'view', description: 'Araç görüntüleme' },
  { name: 'vehicle.manage', resource: 'vehicle', action: 'manage', description: 'Araç yönetimi (CRUD)' },
  { name: 'service_order.view', resource: 'service_order', action: 'view', description: 'İş emri görüntüleme' },
  { name: 'service_order.manage', resource: 'service_order', action: 'manage', description: 'İş emri yönetimi (CRUD)' },
  { name: 'inventory.view', resource: 'inventory', action: 'view', description: 'Stok görüntüleme' },
  { name: 'inventory.manage', resource: 'inventory', action: 'manage', description: 'Stok yönetimi' },
  { name: 'accounting.view', resource: 'accounting', action: 'view', description: 'Muhasebe görüntüleme' },
  { name: 'accounting.manage', resource: 'accounting', action: 'manage', description: 'Muhasebe yönetimi' },
  { name: 'appointment.view', resource: 'appointment', action: 'view', description: 'Randevu görüntüleme' },
  { name: 'appointment.manage', resource: 'appointment', action: 'manage', description: 'Randevu yönetimi' },
  { name: 'reporting.view', resource: 'reporting', action: 'view', description: 'Rapor/Dashboard görüntüleme' },
  { name: 'settings.manage', resource: 'settings', action: 'manage', description: 'Ayar yönetimi' },
  { name: 'maintenance.view', resource: 'maintenance', action: 'view', description: 'Bakım kayıtları görüntüleme' },
  { name: 'maintenance.manage', resource: 'maintenance', action: 'manage', description: 'Bakım kayıtları yönetimi' },
  { name: 'audit.view', resource: 'audit', action: 'view', description: 'Audit log görüntüleme' },
  { name: 'user.manage', resource: 'user', action: 'manage', description: 'Kullanıcı yönetimi' },
  { name: 'permission.manage', resource: 'permission', action: 'manage', description: 'Yetki yönetimi' },
  { name: 'tenant.manage', resource: 'tenant', action: 'manage', description: 'Tenant yönetimi' },
];

const SYSTEM_ROLES = [
  {
    name: 'SUPER_ADMIN',
    description: 'Tüm platformu yönetir',
    isSystem: true,
    permissions: PERMISSIONS.map((p) => p.name),
  },
  {
    name: 'TENANT_OWNER',
    description: 'Kendi servis işletmesini yönetir',
    isSystem: true,
    permissions: PERMISSIONS.filter((p) => p.name !== 'tenant.manage').map((p) => p.name),
  },
  {
    name: 'MANAGER',
    description: 'Servisi yönetir',
    isSystem: true,
    permissions: [
      'customer.view', 'customer.manage',
      'vehicle.view', 'vehicle.manage',
      'service_order.view', 'service_order.manage',
      'inventory.view', 'inventory.manage',
      'accounting.view', 'accounting.manage',
      'appointment.view', 'appointment.manage',
      'maintenance.view', 'maintenance.manage',
      'reporting.view',
      'user.manage',
    ],
  },
  {
    name: 'SERVICE_ADVISOR',
    description: 'Müşteri, araç, iş emri ve randevuları yönetir',
    isSystem: true,
    permissions: [
      'customer.view', 'customer.manage',
      'vehicle.view', 'vehicle.manage',
      'service_order.view', 'service_order.manage',
      'appointment.view', 'appointment.manage',
      'maintenance.view',
      'accounting.view',
      'inventory.view',
    ],
  },
  {
    name: 'TECHNICIAN',
    description: 'Kendisine atanan işleri görür ve işlem bilgisi girer',
    isSystem: true,
    permissions: [
      'customer.view',
      'vehicle.view',
      'service_order.view', 'service_order.manage',
      'maintenance.view', 'maintenance.manage',
      'inventory.view',
    ],
  },
  {
    name: 'ACCOUNTANT',
    description: 'Cari, ödeme ve finansal raporları yönetir',
    isSystem: true,
    permissions: [
      'customer.view',
      'accounting.view', 'accounting.manage',
      'reporting.view',
    ],
  },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(private prisma: PrismaService) {}

  async onApplicationBootstrap() {
    try {
      await this.seedPermissionsAndRoles();
      await this.backfillTenantOwners();
    } catch (e) {
      this.logger.error('Bootstrap seed failed', e as Error);
    }
  }

  private async seedPermissionsAndRoles() {
    const ownerRole = await this.prisma.role.findFirst({
      where: { name: 'TENANT_OWNER', tenantId: null },
    });
    const permCount = await this.prisma.permission.count();

    if (ownerRole && permCount >= PERMISSIONS.length) {
      this.logger.log('Seed data already present, skipping.');
      return;
    }

    const permissionMap = new Map<string, string>();
    for (const perm of PERMISSIONS) {
      const created = await this.prisma.permission.upsert({
        where: { name: perm.name },
        update: { resource: perm.resource, action: perm.action, description: perm.description },
        create: perm,
      });
      permissionMap.set(perm.name, created.id);
    }

    for (const role of SYSTEM_ROLES) {
      const existingRole = await this.prisma.role.findFirst({
        where: { name: role.name, tenantId: null },
      });

      let roleId: string;
      if (existingRole) {
        roleId = existingRole.id;
      } else {
        const created = await this.prisma.role.create({
          data: { name: role.name, description: role.description, isSystem: role.isSystem },
        });
        roleId = created.id;
      }

      const rolePermissions = role.permissions
        .map((permName) => {
          const permissionId = permissionMap.get(permName);
          return permissionId ? { roleId, permissionId } : null;
        })
        .filter((x): x is { roleId: string; permissionId: string } => x !== null);

      await this.prisma.rolePermission.createMany({
        data: rolePermissions,
        skipDuplicates: true,
      });
    }

    this.logger.log(`Seeded ${PERMISSIONS.length} permissions and ${SYSTEM_ROLES.length} system roles.`);
  }

  private async backfillTenantOwners() {
    const ownerRole = await this.prisma.role.findFirst({
      where: { name: 'TENANT_OWNER', tenantId: null },
    });
    if (!ownerRole) return;

    const tenants = await this.prisma.tenant.findMany({ select: { id: true } });
    let promoted = 0;

    for (const tenant of tenants) {
      const ownerExists = await this.prisma.userRole.findFirst({
        where: { roleId: ownerRole.id, user: { tenantId: tenant.id } },
      });
      if (ownerExists) continue;

      const candidate = await this.prisma.user.findFirst({
        where: { tenantId: tenant.id, userRoles: { none: {} } },
        orderBy: { createdAt: 'asc' },
        select: { id: true },
      });
      if (!candidate) continue;

      await this.prisma.userRole.createMany({
        data: [{ userId: candidate.id, roleId: ownerRole.id }],
        skipDuplicates: true,
      });
      promoted++;
    }

    if (promoted > 0) {
      this.logger.log(`Backfilled TENANT_OWNER role for ${promoted} tenant(s).`);
    }
  }
}
