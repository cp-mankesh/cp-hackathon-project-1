/** Module keys for JSON permission matrix on Role.permissions */
export const permissionModules = [
  "users",
  "calls",
  "reports",
  "settings",
] as const;

export type PermissionModule = (typeof permissionModules)[number];

export type CrudFlags = { c: boolean; r: boolean; u: boolean; d: boolean };

export const fullAccess: CrudFlags = { c: true, r: true, u: true, d: true };

export const readOnly: CrudFlags = { c: false, r: true, u: false, d: false };

export const noAccess: CrudFlags = { c: false, r: false, u: false, d: false };
