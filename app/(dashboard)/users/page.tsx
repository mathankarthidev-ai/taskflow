import { UserManagementTable } from '@/features/users/UserManagementTable';

export const metadata = {
  title: 'User Management | Bizy Hub',
  description: 'Super Admin user management panel and role management.',
};

export default function UsersPage() {
  return <UserManagementTable />;
}
