export interface Tenant {
  id: string;
  name: string;
  slug: string;
  status: string;
  settings: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  refreshTokenHash: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  tenantId: string | null;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string | null;
  createdAt: Date;
}
