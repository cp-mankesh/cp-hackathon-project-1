import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { canCrud } from "@/lib/permissions/check";
import { userCan } from "@/lib/permissions/user-can";
import { getSessionUser } from "@/lib/auth/session";
import { UsersManagement } from "@/modules/users";
import { listRolesForOrganisation, listUsersForOrganisation } from "@/modules/users/server/user.service";

export default async function UsersPage() {
  const user = await getSessionUser();
  if (!user) {
    notFound();
  }

  if (!canCrud(user.assignedRole?.permissions, "users", "r")) {
    notFound();
  }

  const [users, roles] = await Promise.all([
    listUsersForOrganisation(user.organisationId),
    listRolesForOrganisation(user.organisationId),
  ]);

  const canCreate = userCan(user, "users", "c");
  const canUpdate = userCan(user, "users", "u");
  const canDelete = userCan(user, "users", "d");

  return (
    <>
      <PageHeader
        title="Users"
        description="Invite teammates, assign roles, and remove members. Each role controls what people can see and do in the app."
      />
      <UsersManagement
        organisationName={user.organisation.name}
        currentUserId={user.id}
        users={users}
        roles={roles}
        canCreate={canCreate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />
    </>
  );
}
