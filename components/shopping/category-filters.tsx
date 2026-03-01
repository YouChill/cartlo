'use client';

type CategoryChip = {
  id: string | null; // null = uncategorized
  name: string;
  count: number;
};

type CategoryFiltersProps = {
  categories: CategoryChip[];
  activeFilter: string | null | 'all';
  onFilterChange: (filter: string | null | 'all') => void;
  uncategorizedCount: number;
};

export function CategoryFilters({
  categories,
  activeFilter,
  onFilterChange,
  uncategorizedCount,
}: CategoryFiltersProps) {
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0) + uncategorizedCount;

  return (
    <div className="px-4 pb-3 pt-2">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {/* "Wszystko" chip */}
        <FilterChip
          label="Wszystko"
          count={totalCount}
          isActive={activeFilter === 'all'}
          variant="default"
          onClick={() => onFilterChange('all')}
        />

        {/* Category chips — only those with items */}
        {categories.map((cat) => (
          <FilterChip
            key={cat.id}
            label={cat.name}
            count={cat.count}
            isActive={activeFilter === cat.id}
            variant="default"
            onClick={() => onFilterChange(cat.id)}
          />
        ))}

        {/* "Do sklasyfikowania" chip — only if there are uncategorized items */}
        {uncategorizedCount > 0 && (
          <FilterChip
            label="Do sklasyfikowania"
            count={uncategorizedCount}
            isActive={activeFilter === null}
            variant="warning"
            onClick={() => onFilterChange(null)}
          />
        )}
      </div>
    </div>
  );
}

function FilterChip({
  label,
  count,
  isActive,
  variant,
  onClick,
}: {
  label: string;
  count: number;
  isActive: boolean;
  variant: 'default' | 'warning';
  onClick: () => void;
}) {
  let className =
    'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold leading-none transition-colors duration-150 cursor-pointer select-none';

  if (variant === 'warning' && (isActive || !isActive)) {
    // Warning chip always uses warning palette (active or not)
    className += ' bg-warning-bg border-warning-border text-warning-text';
  } else if (isActive) {
    className += ' bg-mint-100 border-mint-300 text-mint-600';
  } else {
    className += ' bg-surface border-border text-text-secondary shadow-sm';
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      <span>{label}</span>
      <span className="tabular-nums">({count})</span>
    </button>
  );
}
