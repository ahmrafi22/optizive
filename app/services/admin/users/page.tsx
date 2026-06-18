import { getAdminUsers } from "@/backend/admin/admin";
import UsersManagement from "../_components/UsersManagement";

export default async function AdminUsersPage() {
  const users = await getAdminUsers();
  return <UsersManagement users={users} />;
}
