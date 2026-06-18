import AdminUsersTable from "./AdminUsersTable";
import type { AdminDashboardUser } from "@/backend/admin/admin";

interface Props {
  users: AdminDashboardUser[];
}

export default function AdminUsersSection({ users }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">
          All Users ({users.length})
        </h2>
      </div>
      <AdminUsersTable users={users} />
    </div>
  );
}
