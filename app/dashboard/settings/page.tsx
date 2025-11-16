import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { SettingsClient } from './SettingsClient';

async function getUserData(userId: string) {
  await connectDB();
  const user = await User.findById(userId);
  return user;
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const user = await getUserData(session.user.id);

  return <SettingsClient user={user} />;
}

