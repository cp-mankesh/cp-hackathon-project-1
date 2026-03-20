import type { Role, User } from "@prisma/client";
import type { Organisation } from "@prisma/client";
import { canCrud } from "@/lib/permissions/check";

export type SessionUserWithRole = User & {
  organisation: Organisation;
  assignedRole: Role | null;
};

export function userCan(
  user: SessionUserWithRole,
  module: string,
  op: "c" | "r" | "u" | "d",
): boolean {
  return canCrud(user.assignedRole?.permissions, module, op);
}
