"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  inviteUserAction,
  removeUserAction,
  updateUserRoleAction,
} from "@/modules/users/actions/user-actions";
import type { UserActionState } from "@/modules/users/actions/user-action.types";
import type { RoleOption, UserListRow } from "@/modules/users/server/user.service";

const selectClassName = cn(
  "h-8 w-full min-w-[8rem] rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors",
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "dark:bg-input/30",
);

type Props = {
  organisationName: string;
  currentUserId: string;
  users: UserListRow[];
  roles: RoleOption[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

export function UsersManagement({
  organisationName,
  currentUserId,
  users,
  roles,
  canCreate,
  canUpdate,
  canDelete,
}: Props) {
  const router = useRouter();
  const inviteFormRef = useRef<HTMLFormElement>(null);
  const [inviteState, inviteFormAction, invitePending] = useActionState(
    inviteUserAction,
    undefined as UserActionState,
  );
  const prevSuccess = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (inviteState?.success && inviteState.success !== prevSuccess.current) {
      prevSuccess.current = inviteState.success;
      toast.success(inviteState.success);
      inviteFormRef.current?.reset();
      router.refresh();
    }
  }, [inviteState?.success, router]);

  useEffect(() => {
    if (inviteState?.error) {
      toast.error(inviteState.error);
    }
  }, [inviteState?.error]);

  return (
    <div className="space-y-8">
      {canCreate ? (
        <Card>
          <CardHeader>
            <CardTitle>Add team member</CardTitle>
            <CardDescription>
              Create an account for someone in {organisationName}. Share the password with them securely — no email is
              sent from this app.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={inviteFormRef} action={inviteFormAction} className="grid max-w-lg gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" name="email" type="email" autoComplete="off" required placeholder="name@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-name">Name (optional)</Label>
                <Input id="invite-name" name="name" type="text" autoComplete="off" placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <select id="invite-role" name="roleId" className={selectClassName} required defaultValue={roles[0]?.id}>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="invite-password">Initial password</Label>
                <Input
                  id="invite-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                />
                <p className="text-muted-foreground text-xs">They will use this to sign in at login until you add password reset.</p>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={invitePending}>
                  {invitePending ? "Adding…" : "Add user"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Team ({users.length})</CardTitle>
          <CardDescription>Members of your organisation and their roles.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                {canDelete ? <TableHead className="w-[100px] text-right">Actions</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  roles={roles}
                  currentUserId={currentUserId}
                  canUpdate={canUpdate}
                  canDelete={canDelete}
                  onAfterMutation={() => router.refresh()}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function UserRow({
  user,
  roles,
  currentUserId,
  canUpdate,
  canDelete,
  onAfterMutation,
}: {
  user: UserListRow;
  roles: RoleOption[];
  currentUserId: string;
  canUpdate: boolean;
  canDelete: boolean;
  onAfterMutation: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function onRoleChange(roleId: string) {
    if (roleId === user.roleId) return;
    startTransition(async () => {
      const res = await updateUserRoleAction(user.id, roleId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if (res?.success) toast.success(res.success);
      onAfterMutation();
    });
  }

  function onRemove() {
    if (!confirm(`Remove ${user.email} from the organisation? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await removeUserAction(user.id);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if (res?.success) toast.success(res.success);
      onAfterMutation();
    });
  }

  const isSelf = user.id === currentUserId;

  return (
    <TableRow>
      <TableCell className="font-medium">{user.email}</TableCell>
      <TableCell className="text-muted-foreground">{user.name ?? "—"}</TableCell>
      <TableCell>
        {canUpdate ? (
          <select
            className={selectClassName}
            disabled={pending}
            value={user.roleId}
            onChange={(e) => onRoleChange(e.target.value)}
            aria-label={`Role for ${user.email}`}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-sm">{user.roleName}</span>
        )}
      </TableCell>
      {canDelete ? (
        <TableCell className="text-right">
          <Button
            type="button"
            variant="destructive"
            size="xs"
            disabled={pending || isSelf}
            onClick={onRemove}
            title={isSelf ? "You cannot remove your own account" : undefined}
          >
            Remove
          </Button>
        </TableCell>
      ) : null}
    </TableRow>
  );
}
