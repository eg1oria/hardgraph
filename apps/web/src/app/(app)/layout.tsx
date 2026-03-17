'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Compass,
  BookTemplate,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Search,
  Shield,
  X,
  Network,
  Plus,
  Lock,
  Globe,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { useUIStore } from '@/stores/useUIStore';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { OnboardingProvider } from '@/components/onboarding';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/templates', label: 'Templates', icon: BookTemplate },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const adminNavItem = { href: '/admin', label: 'Admin', icon: Shield };

// Bottom nav items for mobile (subset)
const bottomNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/templates', label: 'Templates', icon: BookTemplate },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, user } = useAuthGuard();
  const logout = useAuthStore((s) => s.logout);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarGraphs, setSidebarGraphs] = useState<
    { id: string; title: string; isPublic: boolean; _count: { nodes: number } }[]
  >([]);
  const [graphsLoaded, setGraphsLoaded] = useState(false);

  const fetchSidebarGraphs = useCallback(() => {
    if (!user) return;
    api
      .get<{ id: string; title: string; isPublic: boolean; _count: { nodes: number } }[]>('/graphs')
      .then((data) => setSidebarGraphs(data.slice(0, 8)))
      .catch(() => {})
      .finally(() => setGraphsLoaded(true));
  }, [user]);

  useEffect(() => {
    if (!loading && user) fetchSidebarGraphs();
  }, [loading, user, fetchSidebarGraphs]);

  // Hide bottom nav on editor pages (full-screen experience)
  const isEditorPage = pathname.startsWith('/editor');

  // Redirect to email verification if not verified, then onboarding
  useEffect(() => {
    if (!loading && user) {
      if (!user.emailVerified) {
        router.replace('/verify-email');
      } else if (!user.onboardingCompleted) {
        router.replace('/onboarding');
      }
    }
  }, [loading, user, router]);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  return (
    <div className="h-dvh bg-background flex overflow-hidden">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        data-onboarding="sidebar"
        className={`border-r border-border flex flex-col transition-all duration-200 shrink-0 
        fixed md:relative z-50 h-full bg-surface
        ${mobileMenuOpen ? 'translate-x-0 w-72 slide-in-left' : '-translate-x-full md:translate-x-0'}
        ${!mobileMenuOpen ? (sidebarOpen ? 'md:w-64' : 'md:w-16') : ''}`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          {(sidebarOpen || mobileMenuOpen) && (
            <Link href="/dashboard" className="text-lg font-bold text-gradient">
              HardGraph
            </Link>
          )}
          {/* Close button for mobile */}
          <button
            onClick={() => {
              if (mobileMenuOpen) {
                setMobileMenuOpen(false);
              } else {
                toggleSidebar();
              }
            }}
            className="p-2.5 rounded-lg hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={
              mobileMenuOpen ? 'Close menu' : sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'
            }
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : sidebarOpen ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeft className="w-5 h-5" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen && !mobileMenuOpen ? item.label : undefined}
                aria-label={!sidebarOpen && !mobileMenuOpen ? item.label : undefined}
                data-onboarding={
                  item.href === '/explore'
                    ? 'explore'
                    : item.href === '/templates'
                      ? 'templates'
                      : undefined
                }
                className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-primary/10 text-primary-400'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-light active:bg-surface-light'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {(sidebarOpen || mobileMenuOpen) && item.label}
              </Link>
            );
          })}
          {user?.role === 'admin' &&
            (() => {
              const isActive = pathname.startsWith(adminNavItem.href);
              return (
                <Link
                  href={adminNavItem.href}
                  title={!sidebarOpen && !mobileMenuOpen ? adminNavItem.label : undefined}
                  aria-label={!sidebarOpen && !mobileMenuOpen ? adminNavItem.label : undefined}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface-light active:bg-surface-light'
                  }`}
                >
                  <adminNavItem.icon className="w-5 h-5 shrink-0" />
                  {(sidebarOpen || mobileMenuOpen) && adminNavItem.label}
                </Link>
              );
            })()}

          {/* Graphs section — like GitHub repos in sidebar */}
          {sidebarOpen || mobileMenuOpen ? (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Graphs
                </span>
                <Link
                  href="/dashboard"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  className="p-1 rounded-lg hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors"
                  title="Create graph"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Link>
              </div>
              {!graphsLoaded ? (
                <div className="space-y-1 px-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-8 rounded-lg bg-surface-light/50 animate-pulse" />
                  ))}
                </div>
              ) : sidebarGraphs.length === 0 ? (
                <p className="text-xs text-muted px-3 py-2">No graphs yet</p>
              ) : (
                <div className="space-y-0.5 px-1">
                  {sidebarGraphs.map((graph) => {
                    const isActive = pathname === `/editor/${graph.id}`;
                    return (
                      <Link
                        key={graph.id}
                        href={`/editor/${graph.id}`}
                        className={`group flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary-400'
                            : 'text-muted-foreground hover:text-foreground hover:bg-surface-light'
                        }`}
                        title={graph.title}
                      >
                        <Network className="w-4 h-4 shrink-0 opacity-60" />
                        <span className="truncate flex-1">{graph.title}</span>
                        {graph.isPublic ? (
                          <Globe className="w-3 h-3 shrink-0 opacity-40" />
                        ) : (
                          <Lock className="w-3 h-3 shrink-0 opacity-40" />
                        )}
                      </Link>
                    );
                  })}
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Show all graphs
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-border px-2">
              <Link
                href="/dashboard"
                title="Your Graphs"
                aria-label="Your Graphs"
                className="flex items-center justify-center p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-light transition-colors min-h-[44px]"
              >
                <Network className="w-5 h-5" />
              </Link>
            </div>
          )}
        </nav>

        {/* User section */}
        <div className="p-2 border-t border-border space-y-1">
          {(sidebarOpen || mobileMenuOpen) && user && (
            <div className="flex items-center gap-3 px-3 py-2.5">
              <Avatar fallback={user.displayName || user.username} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            title={!sidebarOpen && !mobileMenuOpen ? 'Sign out' : undefined}
            aria-label={!sidebarOpen && !mobileMenuOpen ? 'Sign out' : undefined}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-surface-light active:bg-surface-light transition-colors w-full min-h-[44px]"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(sidebarOpen || mobileMenuOpen) && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center px-3 sm:px-6 gap-2 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2.5 rounded-lg hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button
            data-onboarding="search"
            onClick={() => {
              // Trigger CMD+K
              window.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }),
              );
            }}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-muted hover:text-muted-foreground hover:border-border-light transition-colors min-h-[36px]"
          >
            <Search className="w-3.5 h-3.5" />
            Search...
            <kbd className="ml-2 text-[10px] bg-surface-light px-1.5 py-0.5 rounded border border-border">
              {typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent)
                ? '⌘K'
                : 'Ctrl+K'}
            </kbd>
          </button>
          {/* Mobile search button */}
          <button
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }),
              );
            }}
            className="sm:hidden p-2.5 rounded-lg hover:bg-surface-light text-muted-foreground hover:text-foreground transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <ThemeToggle />
        </header>

        <main
          className={`flex-1 ${isEditorPage ? 'overflow-hidden' : 'overflow-auto pb-16 md:pb-0'}`}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {!isEditorPage && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-surface/95 backdrop-blur-lg border-t border-border safe-bottom"
          aria-label="Mobile navigation"
        >
          <div className="flex items-center justify-around h-14">
            {bottomNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[48px] transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground'
                  }`}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                  <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : ''}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}

      <OnboardingProvider />
    </div>
  );
}
