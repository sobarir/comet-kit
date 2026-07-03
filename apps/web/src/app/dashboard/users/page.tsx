"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { UserRole } from "@cometkit/shared";
import { USER_ROLES } from "@cometkit/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe } from "@/hooks/use-auth";
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "@/hooks/use-users";
import { readApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function UsersPage() {
  const { data: me } = useMe();
  const [page, setPage] = useState(1);
  const { data, isPending } = useUsers(page);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [error, setError] = useState<string | null>(null);

  if (me && me.role !== "admin") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-6">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          admin required
        </span>
        <p className="text-sm text-muted-foreground">
          User management needs an admin account. You are signed in as a
          standard user.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </main>
    );
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const fields = new FormData(form);
    const name = String(fields.get("name") ?? "").trim();
    try {
      await createUser.mutateAsync({
        email: String(fields.get("email")),
        password: String(fields.get("password")),
        role: fields.get("role") as UserRole,
        ...(name ? { name } : {}),
      });
      form.reset();
    } catch (err) {
      setError(await readApiError(err));
    }
  }

  async function onRoleChange(id: string, role: UserRole) {
    setError(null);
    try {
      await updateUser.mutateAsync({ id, role });
    } catch (err) {
      setError(await readApiError(err));
    }
  }

  async function onDelete(id: string) {
    setError(null);
    try {
      await deleteUser.mutateAsync(id);
    } catch (err) {
      setError(await readApiError(err));
    }
  }

  const meta = data?.meta;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <header className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-[0.22em] text-muted-foreground">
          admin · users
        </span>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </header>

      <h1 className="font-display mt-10 text-3xl font-semibold tracking-tight">
        Users
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The worked CRUD example - see docs/FEATURE_PATTERN.md for the recipe
        this feature follows.
      </p>

      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Card className="mt-6">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                <th className="px-4 py-3 font-medium">user</th>
                <th className="px-4 py-3 font-medium">ulid</th>
                <th className="px-4 py-3 font-medium">role</th>
                <th className="px-4 py-3 font-medium sr-only">actions</th>
              </tr>
            </thead>
            <tbody>
              {isPending ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Loading users…
                  </td>
                </tr>
              ) : (
                data?.data.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{user.name ?? "—"}</div>
                      <div className="text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {user.id}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Role for ${user.email}`}
                        className="h-8 rounded-md border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={user.role}
                        disabled={user.id === me?.id}
                        onChange={(e) =>
                          onRoleChange(user.id, e.target.value as UserRole)
                        }
                      >
                        {USER_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "text-destructive hover:bg-destructive/10 hover:text-destructive",
                          user.id === me?.id && "invisible",
                        )}
                        onClick={() => onDelete(user.id)}
                        disabled={deleteUser.isPending}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {meta ? (
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">
            page {meta.page} of {meta.totalPages} · {meta.total} users
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Create user</CardTitle>
          <CardDescription>
            New accounts get the selected role immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2" noValidate>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input id="new-email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input
                id="new-password"
                name="password"
                type="password"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-name">Name (optional)</Label>
              <Input id="new-name" name="name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Role</Label>
              <select
                id="new-role"
                name="role"
                defaultValue="user"
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {USER_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={createUser.isPending}>
                {createUser.isPending ? "Creating…" : "Create user"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
