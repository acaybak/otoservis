import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Customer
  { name: 'customer.view', resource: 'customer', action: 'view', description: 'Müşteri görüntüleme' },
  { name: 'customer.manage', resource: 'customer', action: 'manage', description: 'Müşteri yönetimi (CRUD)' },

  // Vehicle
  { name: 'vehicle.view', resource: 'vehicle', action: 'view', description: 'Araç görüntüleme' },
  { name: 'vehicle.manage', resource: 'vehicle', action: 'manage', description: 'Araç yönetimi (CRUD)' },

  // Service Order
  { name: 'service_order.view', resource: 'service_order', action: 'view', description: 'İş emri görüntüleme' },
  { name: 'service_order.manage', resource: 'service_order', action: 'manage', description: 'İş emri yönetimi (CRUD)' },

  // Inventory
  { name: 'inventory.view', resource: 'inventory', action: 'view', description: 'Stok görüntüleme' },
  { name: 'inventory.manage', resource: 'inventory', action: 'manage', description: 'Stok yönetimi' },

  // Accounting
  { name: 'accounting.view', resource: 'accounting', action: 'view', description: 'Muhasebe görüntüleme' },
  { name: 'accounting.manage', resource: 'accounting', action: 'manage', description: 'Muhasebe yönetimi' },

  // Appointment
  { name: 'appointment.view', resource: 'appointment', action: 'view', description: 'Randevu görüntüleme' },
  { name: 'appointment.manage', resource: 'appointment', action: 'manage', description: 'Randevu yönetimi' },

  // Reporting
  { name: 'reporting.view', resource: 'reporting', action: 'view', description: 'Rapor/Dashboard görüntüleme' },

  // Settings
  { name: 'settings.manage', resource: 'settings', action: 'manage', description: 'Ayar yönetimi' },

  // Maintenance
  { name: 'maintenance.view', resource: 'maintenance', action: 'view', description: 'Bakım kayıtları görüntüleme' },
  { name: 'maintenance.manage', resource: 'maintenance', action: 'manage', description: 'Bakım kayıtları yönetimi' },

  // Audit
  { name: 'audit.view', resource: 'audit', action: 'view', description: 'Audit log görüntüleme' },

  // User & Permission Management
  { name: 'user.manage', resource: 'user', action: 'manage', description: 'Kullanıcı yönetimi' },
  { name: 'permission.manage', resource: 'permission', action: 'manage', description: 'Yetki yönetimi' },

  // Tenant
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

async function main() {
  console.log('Seeding permissions...');

  const permissionMap = new Map<string, string>();

  for (const perm of PERMISSIONS) {
    const created = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
      create: perm,
    });
    permissionMap.set(perm.name, created.id);
  }

  console.log(`Seeded ${PERMISSIONS.length} permissions.`);

  console.log('Seeding system roles...');

  for (const role of SYSTEM_ROLES) {
    const existingRole = await prisma.role.findFirst({
      where: { name: role.name, tenantId: null },
    });

    let roleId: string;

    if (existingRole) {
      await prisma.role.update({
        where: { id: existingRole.id },
        data: { description: role.description },
      });
      roleId = existingRole.id;

      await prisma.rolePermission.deleteMany({ where: { roleId } });
    } else {
      const created = await prisma.role.create({
        data: {
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
        },
      });
      roleId = created.id;
    }

    const rolePermissions = role.permissions.map((permName) => {
      const permissionId = permissionMap.get(permName);
      if (!permissionId) {
        throw new Error(`Permission not found: ${permName}`);
      }
      return {
        roleId,
        permissionId,
      };
    });

    await prisma.rolePermission.createMany({
      data: rolePermissions,
      skipDuplicates: true,
    });
  }

  console.log(`Seeded ${SYSTEM_ROLES.length} system roles with permissions.`);
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
