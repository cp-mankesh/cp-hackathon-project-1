"use server";

import type { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { routes } from "@/constants/routes";
import { hashPassword } from "@/lib/auth/password";
import { getSessionUser } from "@/lib/auth/session";
import { canCrud } from "@/lib/permissions/check";
import { userCan } from "@/lib/permissions/user-can";
import { prisma } from "@/lib/prisma";
import type { UserActionState } from "./user-action.types";

/** At least one user with any users-module write/admin permission must remain to avoid locking the org. */
function roleCanAdministerUsers(role: Role | null): boolean {
  const p = role?.permissions;
  return canCrud(p, "users", "c") || canCrud(p, "users", "u") || canCrud(p, "users", "d");
}

const inviteSchema = z.object({
  email: z.string().email(),
  name: z.string().max(80).optional(),
  password: z.string().min(8).max(100),
  roleId: z.string().min(1),
});

export async function inviteUserAction(
  _prev: UserActionState,
  formData: FormData,
): Promise<UserActionState> {
  const actor = await getSessionUser();
  if (!actor || !userCan(actor, "users", "c")) {
    return { error: "You do not have permission to add users." };
  }

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    name: (formData.get("name") as string)?.trim() || undefined,
    password: formData.get("password"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { email, name, password, roleId } = parsed.data;

  const role = await prisma.role.findFirst({
    where: { id: roleId, organisationId: actor.organisationId },
  });
  if (!role) {
    return { error: "Invalid role." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      email,
      name: name ?? null,
      passwordHash,
      organisationId: actor.organisationId,
      roleId: role.id,
    },
  });

  revalidatePath(routes.users);
  return { success: `Invited ${email}. They can sign in with the password you set.` };
}

export async function updateUserRoleAction(targetUserId: string, newRoleId: string): Promise<UserActionState> {
  const actor = await getSessionUser();
  if (!actor || !userCan(actor, "users", "u")) {
    return { error: "You do not have permission to update roles." };
  }

  const newRole = await prisma.role.findFirst({
    where: { id: newRoleId, organisationId: actor.organisationId },
  });
  if (!newRole) {
    return { error: "Invalid role." };
  }

  const target = await prisma.user.findFirst({
    where: { id: targetUserId, organisationId: actor.organisationId },
    include: { assignedRole: true },
  });
  if (!target) {
    return { error: "User not found." };
  }

  const orgUsers = await prisma.user.findMany({
    where: { organisationId: actor.organisationId },
    include: { assignedRole: true },
  });

  let adminsAfter = 0;
  for (const u of orgUsers) {
    const effectiveRole = u.id === targetUserId ? newRole : u.assignedRole;
    if (effectiveRole && roleCanAdministerUsers(effectiveRole)) {
      adminsAfter += 1;
    }
  }
  if (adminsAfter < 1) {
    return {
      error: "Keep at least one user who can manage users (Admin or equivalent).",
    };
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { roleId: newRole.id },
  });

  revalidatePath(routes.users);
  return { success: "Role updated." };
}

export async function removeUserAction(targetUserId: string): Promise<UserActionState> {
  const actor = await getSessionUser();
  if (!actor || !userCan(actor, "users", "d")) {
    return { error: "You do not have permission to remove users." };
  }

  if (targetUserId === actor.id) {
    return { error: "You cannot remove your own account." };
  }

  const target = await prisma.user.findFirst({
    where: { id: targetUserId, organisationId: actor.organisationId },
    include: { assignedRole: true },
  });
  if (!target) {
    return { error: "User not found." };
  }

  const orgUsers = await prisma.user.findMany({
    where: { organisationId: actor.organisationId },
    include: { assignedRole: true },
  });

  if (orgUsers.length <= 1) {
    return { error: "Cannot remove the last user in the organisation." };
  }

  let adminsAfter = 0;
  for (const u of orgUsers) {
    if (u.id === targetUserId) continue;
    if (u.assignedRole && roleCanAdministerUsers(u.assignedRole)) {
      adminsAfter += 1;
    }
  }
  if (adminsAfter < 1) {
    return {
      error: "Cannot remove the last user who can manage users. Assign another admin first.",
    };
  }

  const uploads = await prisma.call.count({ where: { uploadedById: targetUserId } });
  if (uploads > 0) {
    return {
      error: "This user uploaded one or more calls. Remove or reassign those calls before removing the user.",
    };
  }

  await prisma.user.delete({ where: { id: targetUserId } });

  revalidatePath(routes.users);
  return { success: "User removed." };
}
