'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Home,
  Gamepad2,
  Trophy,
  User,
  LogOut,
  Menu,
  X,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Avatar } from '@/components/ui';

const navItems = [
  { href: '/team', icon: Home, label: 'Hub' },
  { href: '/team/games', icon: Gamepad2, label: 'Games' },
  { href: '/team/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/team/progress', icon: User, label: 'My Progress' },
];

export function PlayerNav() {
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
      {/* Desktop Bottom Nav */}
      <nav className="hidden md:flex fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-ink-200 shadow-lg">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/team' && pathname.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${
                  isActive
                    ? 'text-gold-600'
                    : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Top Header + Bottom Nav */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-ink-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ink-800 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <span className="font-display font-semibold text-ink-800">WSC Games</span>
              {team && (
                <span className="block text-xs text-ink-500">{team.name}</span>
              )}
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-ink-100 rounded-lg"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-ink-600" />
            ) : (
              <Avatar name={user?.display_name || ''} color={user?.avatar_color} size="sm" />
            )}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <motion.div
          initial={false}
          animate={mobileMenuOpen ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
          className="overflow-hidden bg-cream-50 border-t border-ink-100"
        >
          <div className="px-4 py-4">
            {/* User Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-ink-200">
              <Avatar name={user?.display_name || ''} color={user?.avatar_color} size="md" />
              <div className="flex-1">
                <p className="font-semibold text-ink-800">{user?.display_name}</p>
                <p className="text-sm text-ink-500">Scholar</p>
              </div>
            </div>

            {/* Team Info */}
            {team ? (
              <div className="py-4 border-b border-ink-200">
                <div className="flex items-center gap-2 text-ink-600">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{team.name}</span>
                </div>
                <p className="text-xs text-ink-400 mt-1">
                  Join code: <span className="font-mono">{team.join_code}</span>
                </p>
              </div>
            ) : (
              <div className="py-4 border-b border-ink-200">
                <p className="text-sm text-ink-500">No team yet</p>
                <button
                  onClick={() => {
                    router.push('/team/join');
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm text-gold-600 font-medium mt-1"
                >
                  Join a team
                </button>
              </div>
            )}

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-coral-600 hover:bg-coral-50 rounded-xl transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </motion.div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-ink-200 shadow-lg">
        <div className="flex items-center justify-around py-2 pb-safe">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/team' && pathname.startsWith(item.href));
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[64px] ${
                  isActive
                    ? 'text-gold-600'
                    : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
