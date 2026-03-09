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

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Nawigacja glowna"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-light bg-surface/85 backdrop-blur-xl lg:hidden"
      style={{
        borderTopLeftRadius: 'var(--radius-xl, 24px)',
        borderTopRightRadius: 'var(--radius-xl, 24px)',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex h-16 items-center justify-around">
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
                'flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors',
                isActive ? 'text-mint-500' : 'text-text-tertiary',
              )}
            >
              <Icon size={24} />
              <span className="text-[11px] font-semibold">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
