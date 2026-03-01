'use client';

import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Lista zakupow',
  '/family': 'Rodzina',
  '/settings': 'Ustawienia',
};

export function AppHeader({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Cartlo';

  return (
    <header className="flex h-14 items-center justify-between border-b border-border-light px-4 lg:px-6">
      <h1 className="text-lg font-bold text-text-primary lg:text-2xl">
        {title}
      </h1>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-100 text-xs font-bold text-mint-600">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <span className="hidden text-sm font-semibold text-text-primary sm:inline">
          {displayName}
        </span>
      </div>
    </header>
  );
}
