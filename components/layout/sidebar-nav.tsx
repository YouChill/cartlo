'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Users, Settings, LayoutTemplate } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_LINKS } from './nav-links';

const ICON_MAP = {
  ShoppingCart,
  Users,
  Settings,
  LayoutTemplate,
} as const;

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:border-r lg:border-border lg:bg-surface">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <span className="text-xl font-bold text-mint-500">Cartlo</span>
      </div>

      {/* Nav links */}
      <nav
        role="navigation"
        aria-label="Nawigacja glowna"
        className="flex flex-1 flex-col gap-1 px-3 py-2"
      >
        {NAV_LINKS.map((link) => {
          const isActive =
            link.href === '/'
              ? pathname === '/'
              : pathname.startsWith(link.href);
          const Icon = ICON_MAP[link.icon];

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-mint-50 text-mint-600'
                  : 'text-text-secondary hover:bg-surface-raised hover:text-text-primary',
              )}
            >
              <Icon size={20} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
