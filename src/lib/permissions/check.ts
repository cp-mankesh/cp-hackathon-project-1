import type { Prisma } from "@prisma/client";

type Op = "c" | "r" | "u" | "d";

export function canCrud(
  permissions: Prisma.JsonValue | null | undefined,
  module: string,
  op: Op,
): boolean {
  if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
    return false;
  }
  const mod = (permissions as Record<string, Record<string, boolean>>)[module];
  if (!mod) return false;
  return Boolean(mod[op]);
}
