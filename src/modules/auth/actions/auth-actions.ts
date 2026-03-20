"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { adminPermissions, memberPermissions } from "@/lib/auth/default-roles";
import { slugify } from "@/utils/slug";
import { routes } from "@/constants/routes";
import type { AuthActionState } from "./auth-action.types";

const registerSchema = z.object({
  organisationName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().max(80).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerCompanyAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    organisationName: formData.get("organisationName"),
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? "Invalid input" };
  }

  const { organisationName, email, password, name } = parsed.data;
  const slug = slugify(organisationName);
  if (!slug) {
    return { error: "Organisation name must include letters or numbers." };
  }

  const existingOrg = await prisma.organisation.findUnique({ where: { slug } });
  if (existingOrg) {
    return { error: "An organisation with a similar name already exists. Try a different name." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const org = await tx.organisation.create({
      data: { name: organisationName, slug },
    });

    const adminRole = await tx.role.create({
      data: {
        name: "Admin",
        organisationId: org.id,
        permissions: adminPermissions,
      },
    });

    await tx.role.create({
      data: {
        name: "Member",
        organisationId: org.id,
        permissions: memberPermissions,
      },
    });

    return tx.user.create({
      data: {
        email,
        passwordHash,
        name: name ?? null,
        organisationId: org.id,
        roleId: adminRole.id,
      },
    });
  });

  await createSession(user.id);
  redirect(routes.dashboard);
}

export async function loginAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect(routes.dashboard);
}

export async function logoutAction() {
  await destroySession();
  redirect(routes.login);
}
