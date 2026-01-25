'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  GraduationCap,
  LayoutDashboard,
  Calendar,
  Users,
  BarChart3,
  Gamepad2,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Avatar } from '@/components/ui';

const navItems = [
  { href: '/coach', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/coach/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/coach/team', icon: Users, label: 'Team' },
  { href: '/coach/games', icon: Gamepad2, label: 'Games' },
  { href: '/coach/analytics', icon: BarChart3, label: 'Analytics' },
];

export function CoachNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, team, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-ink-800 text-white min-h-screen fixed left-0 top-0">
        {/* Logo */}
        <div className="p-6 border-b border-ink-700">
          <button
            onClick={() => router.push('/coach')}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gold-500 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-ink-800" />
            </div>
            <div>
              <span className="font-display text-lg font-semibold">WSC Games</span>
              <span className="block text-xs text-ink-400">Coach Dashboard</span>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/coach' && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <button
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-gold-500 text-ink-800'
                        : 'text-ink-300 hover:bg-ink-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-ink-700">
          {team && (
            <div className="mb-4 px-4 py-3 bg-ink-700 rounded-xl">
              <span className="text-xs text-ink-400 block">Team</span>
              <span className="font-medium text-cream-100">{team.name}</span>
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-2">
            <Avatar name={user?.display_name || ''} color={user?.avatar_color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.display_name}</p>
              <p className="text-xs text-ink-400 truncate">Coach</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 mt-2 text-ink-400 hover:text-coral-400 hover:bg-ink-700 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-ink-800 text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/coach')}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 bg-gold-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-ink-800" />
            </div>
            <span className="font-display font-semibold">WSC Games</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-ink-700 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={mobileMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <nav className="px-4 pb-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/coach' && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => {
                        router.push(item.href);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        isActive
                          ? 'bg-gold-500 text-ink-800'
                          : 'text-ink-300 hover:bg-ink-700 hover:text-white'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 pt-4 border-t border-ink-700">
              <div className="flex items-center gap-3 px-4 py-2">
                <Avatar name={user?.display_name || ''} color={user?.avatar_color} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{user?.display_name}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-ink-400 hover:text-coral-400 rounded-lg"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </nav>
        </motion.div>
      </header>
    </>
  );
}
