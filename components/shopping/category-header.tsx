import { getCategoryIcon } from '@/lib/category-icons';

type CategoryHeaderProps = {
  name: string;
  icon: string;
  count: number;
  isUncategorized?: boolean;
};

export function CategoryHeader({
  name,
  icon,
  count,
  isUncategorized,
}: CategoryHeaderProps) {
  const Icon = getCategoryIcon(icon);

  return (
    <div
      className={`flex items-center gap-2 px-4 pb-2 pt-6 first:pt-2 ${
        isUncategorized ? 'text-warning-text' : 'text-text-secondary'
      }`}
    >
      <Icon size={16} />
      <span className="text-[15px] font-semibold">{name}</span>
      <span className="flex-1 border-t border-border-light" />
      <span className="text-xs text-text-tertiary">{count}</span>
    </div>
  );
}
