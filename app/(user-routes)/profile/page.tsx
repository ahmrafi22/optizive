import { auth } from '@/backend/auth/auth';
import { redirect } from 'next/navigation';
import { getProfile } from '@/backend/user/user';
import ProfileView from './_components/profile-view';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await getProfile();
  if (!user) {
    redirect('/login');
  }

  return <ProfileView user={user} />;
}
