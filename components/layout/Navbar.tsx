'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  Folder,
  ChevronDown,
} from 'lucide-react';
import { ActiveStudentSelector } from '@/components/collaboration/ActiveStudentSelector';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = session?.user?.role || 'student';
  const isCounselor = role !== 'student';
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedUserMenu = menuRef.current?.contains(target);
      const clickedNavMenu = navMenuRef.current?.contains(target);
      if (!clickedUserMenu) setUserMenuOpen(false);
      if (!clickedNavMenu) setNavMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
        setNavMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    setUserMenuOpen(false);
    setNavMenuOpen(false);
  }, [pathname]);

  const initials = useMemo(() => {
    const name = session?.user?.name || session?.user?.email || 'AF';
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [session?.user?.email, session?.user?.name]);

  const studentLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/essays', label: 'Essays', icon: FileText },
    { href: '/dashboard/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/dashboard/documents', label: 'Documents', icon: Folder },
    { href: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
    { href: '/dashboard/collaboration', label: 'Collaboration', icon: Users },
  ];

  const counselorLinks = [
    { href: '/dashboard/counselor', label: 'Students', icon: Users },
    { href: '/dashboard/tasks', label: 'Tasks', icon: ListTodo },
    { href: '/dashboard/essays', label: 'Essays', icon: FileText },
    { href: '/dashboard/documents', label: 'Documents', icon: Folder },
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
    <nav className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link
              href={isCounselor ? '/dashboard/counselor' : '/dashboard'}
              className="flex items-center gap-3 group"
            >
              <div className="h-9 w-9 rounded-xl border border-primary-100 bg-primary-50 text-primary-700 flex items-center justify-center font-semibold">
                AF
              </div>
              <div className="leading-tight">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Admissions</p>
                <p className="text-base font-semibold text-gray-900 group-hover:text-primary-700">
                  Forge
                </p>
              </div>
            </Link>
            {session && (
              <div className="relative" ref={navMenuRef}>
                <button
                  type="button"
                  onClick={() => setNavMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-primary-200 hover:text-primary-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-primary-600" />
                    <span className="text-sm font-semibold text-gray-900">Workspace</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      navMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {navMenuOpen && (
                  <div className="absolute left-0 mt-3 w-72 rounded-2xl border border-gray-100 bg-white shadow-xl p-2 space-y-1">
                    {navLinks.map((nav) => (
                      <Link
                        key={nav.href}
                        href={nav.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                          isActive(nav.href)
                            ? 'bg-primary-50 text-primary-800 ring-1 ring-primary-100'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <nav.icon
                          className={`w-4 h-4 ${
                            isActive(nav.href) ? 'text-primary-600' : 'text-gray-500'
                          }`}
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="font-medium">{nav.label}</span>
                          {isActive(nav.href) && (
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                              Active
                            </span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {session && (
            <div className="flex items-center gap-3">
              <div>
                <ActiveStudentSelector />
              </div>
              {!isCounselor && (
                <Link href="/dashboard/share">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </Link>
              )}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-primary-200 hover:text-primary-700 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center font-semibold">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {session.user?.name || 'Account'}
                    </p>
                    <p className="text-xs text-gray-500">{session.user?.email || 'Profile'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-gray-100 bg-white shadow-xl p-2">
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {session.user?.name || 'Profile'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {session.user?.email || 'Signed in'}
                      </p>
                    </div>
                    <div className="h-px bg-gray-100 my-1" />
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
