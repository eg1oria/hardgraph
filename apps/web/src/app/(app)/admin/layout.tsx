'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, BookTemplate, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/graphs', label: 'Graphs', icon: BarChart3 },
  { href: '/admin/templates', label: 'Templates', icon: BookTemplate },
  { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full">
      <div className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-6 h-12 overflow-x-auto scrollbar-none">
            {adminNav.map((item) => {
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-2 text-sm font-medium whitespace-nowrap py-3 transition-colors ${
                    isActive ? 'text-primary-400' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="admin-tab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400 rounded-full"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
