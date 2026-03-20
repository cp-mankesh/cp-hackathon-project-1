import type { Prisma } from "@prisma/client";
import { fullAccess, noAccess, readOnly } from "@/constants/permissions";

/** Default Admin role — full CRUD on core modules (extend as features land). */
export const adminPermissions: Prisma.InputJsonValue = {
  users: fullAccess,
  calls: fullAccess,
  reports: fullAccess,
  settings: fullAccess,
};

/** Default Member — read dashboards & reports; no user admin. */
export const memberPermissions: Prisma.InputJsonValue = {
  users: noAccess,
  calls: { c: true, r: true, u: false, d: false },
  reports: readOnly,
  settings: noAccess,
};
