import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/prisma";

export type UserListRow = {
  id: string;
  email: string;
  name: string | null;
  roleId: string;
  roleName: string;
  createdAt: Date;
};

export type RoleOption = {
  id: string;
  name: string;
};

export async function listUsersForOrganisation(organisationId: string): Promise<UserListRow[]> {
  noStore();
  const rows = await prisma.user.findMany({
    where: { organisationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      roleId: true,
      createdAt: true,
      assignedRole: { select: { name: true } },
    },
  });
  return rows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    roleId: u.roleId,
    roleName: u.assignedRole?.name ?? "—",
    createdAt: u.createdAt,
  }));
}

export async function listRolesForOrganisation(organisationId: string): Promise<RoleOption[]> {
  noStore();
  return prisma.role.findMany({
    where: { organisationId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
