'use client';

import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
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
  ChevronDown,
  Plus,
  Check,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Avatar } from '@/components/ui';

const navItems = [
  { href: '/coach', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/coach/schedule', icon: Calendar, label: 'Schedule' },
  { href: '/coach/team', icon: Users, label: 'Team' },
  { href: '/coach/games', icon: Gamepad2, label: 'Games' },
  { href: '/coach/analytics', icon: BarChart3, label: 'Analytics' },
];

function TeamSelector({ onCreateTeam }: { onCreateTeam: () => void }) {
  const { team, teams, switchTeam } = useAuth();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSwitch = async (teamId: number) => {
    if (teamId === team?.id) {
      setOpen(false);
      return;
    }
    setSwitching(teamId);
    try {
      await switchTeam(teamId);
      setOpen(false);
    } catch (err) {
      console.error('Failed to switch team:', err);
    } finally {
      setSwitching(null);
    }
  };

  if (teams.length === 0 && !team) return null;

  return (
    <div ref={ref} className="relative mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 bg-ink-700 hover:bg-ink-600 rounded-xl transition-colors flex items-center justify-between"
      >
        <div className="text-left min-w-0">
          <span className="text-xs text-ink-400 block">Team</span>
          <span className="font-medium text-cream-100 truncate block">
            {team?.name || 'Select team'}
          </span>
        </div>
        {teams.length > 1 && (
          <ChevronDown className={`w-4 h-4 text-ink-400 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      <AnimatePresence>
        {open && teams.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute left-0 right-0 mt-1 bg-ink-700 rounded-xl border border-ink-600 overflow-hidden z-50 shadow-lg"
          >
            <div className="max-h-48 overflow-y-auto py-1">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSwitch(t.id)}
                  disabled={switching !== null}
                  className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors ${
                    t.id === team?.id
                      ? 'bg-gold-500/20 text-gold-300'
                      : 'text-ink-200 hover:bg-ink-600'
                  }`}
                >
                  <span className="truncate text-sm font-medium">{t.name}</span>
                  {t.id === team?.id && <Check className="w-4 h-4 shrink-0 ml-2" />}
                  {switching === t.id && (
                    <div className="w-4 h-4 border-2 border-ink-400 border-t-cream-100 rounded-full animate-spin shrink-0 ml-2" />
                  )}
                </button>
              ))}
            </div>
            <div className="border-t border-ink-600">
              <button
                onClick={() => {
                  setOpen(false);
                  onCreateTeam();
                }}
                className="w-full px-4 py-2.5 flex items-center gap-2 text-sm text-gold-400 hover:bg-ink-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create New Team
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function CoachNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, team, teams, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileTeamOpen, setMobileTeamOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleCreateTeam = () => {
    router.push('/coach/team');
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
          <TeamSelector onCreateTeam={handleCreateTeam} />
          <div className="flex items-center gap-3 px-4 py-2">
            <Avatar name={user?.display_name || ''} animal={user?.avatar} color={user?.avatar_color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.display_name}</p>
              <p className="text-xs text-ink-400 truncate">
                Coach{teams.length > 1 ? ` · ${teams.length} teams` : ''}
              </p>
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

            {/* Mobile Team Selector */}
            {teams.length > 0 && (
              <div className="mt-3 pt-3 border-t border-ink-700">
                <button
                  onClick={() => setMobileTeamOpen(!mobileTeamOpen)}
                  className="w-full px-4 py-2.5 flex items-center justify-between text-ink-300"
                >
                  <span className="text-sm">
                    Team: <span className="text-cream-100 font-medium">{team?.name}</span>
                  </span>
                  {teams.length > 1 && (
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileTeamOpen ? 'rotate-180' : ''}`} />
                  )}
                </button>
                <MobileTeamList
                  open={mobileTeamOpen}
                  onClose={() => {
                    setMobileTeamOpen(false);
                    setMobileMenuOpen(false);
                  }}
                />
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-ink-700">
              <div className="flex items-center gap-3 px-4 py-2">
                <Avatar name={user?.display_name || ''} animal={user?.avatar} color={user?.avatar_color} size="sm" />
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

function MobileTeamList({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { team, teams, switchTeam } = useAuth();
  const router = useRouter();
  const [switching, setSwitching] = useState<number | null>(null);

  if (!open || teams.length <= 1) return null;

  const handleSwitch = async (teamId: number) => {
    if (teamId === team?.id) {
      onClose();
      return;
    }
    setSwitching(teamId);
    try {
      await switchTeam(teamId);
      onClose();
    } catch (err) {
      console.error('Failed to switch team:', err);
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="mt-1 space-y-1">
      {teams.map((t) => (
        <button
          key={t.id}
          onClick={() => handleSwitch(t.id)}
          disabled={switching !== null}
          className={`w-full px-6 py-2 flex items-center justify-between text-sm rounded-lg transition-colors ${
            t.id === team?.id
              ? 'text-gold-300 bg-ink-700'
              : 'text-ink-300 hover:bg-ink-700'
          }`}
        >
          <span>{t.name}</span>
          {t.id === team?.id && <Check className="w-4 h-4" />}
          {switching === t.id && (
            <div className="w-4 h-4 border-2 border-ink-400 border-t-cream-100 rounded-full animate-spin" />
          )}
        </button>
      ))}
      <button
        onClick={() => {
          router.push('/coach/team');
          onClose();
        }}
        className="w-full px-6 py-2 flex items-center gap-2 text-sm text-gold-400 hover:bg-ink-700 rounded-lg transition-colors"
      >
        <Plus className="w-4 h-4" />
        Create New Team
      </button>
    </div>
  );
}
