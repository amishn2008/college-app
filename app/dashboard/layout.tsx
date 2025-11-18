import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Navbar } from '@/components/layout/Navbar';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/signin');
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email });

  // Check if user needs onboarding
  if (user && (!user.regions || user.regions.length === 0)) {
    user.regions = ['US'];
    user.intakeYear = user.intakeYear || new Date().getFullYear() + 1;
    await user.save();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
    </div>
  );
}
