'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  Settings,
  LogOut,
  Share2,
  LayoutDashboard,
  ListTodo,
  Calendar,
  FileText,
  Users,
  DollarSign,
  FolderOpen,
} from 'lucide-react';
import { ActiveStudentSelector } from '@/components/collaboration/ActiveStudentSelector';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role || 'student';
  const isCounselor = role !== 'student';

  const studentLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/essays', label: 'Essays', icon: FileText },
    { href: '/dashboard/documents', label: 'Documents', icon: FolderOpen },
    { href: '/dashboard/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
    { href: '/dashboard/collaboration', label: 'Collaboration', icon: Users },
  ];

  const counselorLinks = [
    { href: '/dashboard/counselor', label: 'Students', icon: Users },
    { href: '/dashboard/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/dashboard/essays', label: 'Essays', icon: FileText },
    { href: '/dashboard/documents', label: 'Documents', icon: FolderOpen },
    { href: '/dashboard/collaboration', label: 'Collaboration', icon: Users },
  ];

  const baseLinks = isCounselor ? counselorLinks : studentLinks;
  const navLinks = [
    ...baseLinks,
    {
      href: '/pricing',
      label: 'Pricing',
      icon: DollarSign,
    },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <Link
              href={isCounselor ? '/dashboard/counselor' : '/dashboard'}
              className="text-xl font-bold text-primary-600"
            >
              Admissions Forge
            </Link>
            {session && (
              <div className="flex items-center gap-2">
                {navLinks.map((nav) => (
                  <Link
                    key={nav.href}
                    href={nav.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(nav.href)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <nav.icon className="w-4 h-4 inline mr-2" />
                    {nav.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {session && (
            <div className="flex items-center gap-4">
              <ActiveStudentSelector />
              {!isCounselor && (
                <Link href="/dashboard/share">
                  <Button variant="ghost" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </Link>
              )}
              <Link href="/dashboard/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => signOut()}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
