import type { CategoryInfo, ShoppingItemRow } from '@/lib/shopping/service';

export type ApiShoppingItem = {
  id: string;
  product_name: string;
  category_id: string | null;
  category_name: string | null;
  category_icon: string | null;
  quantity: number;
  unit: string;
  is_checked: boolean;
  added_by_name: string | null;
  checked_by_name: string | null;
  created_at: string;
  checked_at: string | null;
};

export function toApiItem(
  item: ShoppingItemRow,
  categoryById: Record<string, CategoryInfo>,
  memberNames: Record<string, string>,
): ApiShoppingItem {
  const category = item.categoryId
    ? (categoryById[item.categoryId] ?? null)
    : null;
  return {
    id: item.id,
    product_name: item.productName,
    category_id: item.categoryId,
    category_name: category?.name ?? null,
    category_icon: category?.icon ?? null,
    quantity: parseFloat(item.quantity),
    unit: item.unit,
    is_checked: item.isChecked,
    added_by_name: memberNames[item.addedBy] ?? null,
    checked_by_name: item.checkedBy
      ? (memberNames[item.checkedBy] ?? null)
      : null,
    created_at: item.createdAt.toISOString(),
    checked_at: item.checkedAt?.toISOString() ?? null,
  };
}

export function buildCategoryById(
  cats: CategoryInfo[],
): Record<string, CategoryInfo> {
  const byId: Record<string, CategoryInfo> = {};
  cats.forEach((c) => {
    byId[c.id] = c;
  });
  return byId;
}
