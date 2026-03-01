import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ShoppingList } from '@/components/shopping/shopping-list';

export default async function ListPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('family_id')
    .eq('id', user.id)
    .single();

  if (!profile?.family_id) redirect('/onboarding');

  // Fetch shopping items for the family
  const { data: items, error: itemsError } = await supabase
    .from('shopping_items')
    .select(
      'id, product_name, category_id, is_checked, added_by, checked_by, checked_at, created_at',
    )
    .eq('family_id', profile.family_id)
    .order('created_at', { ascending: true });

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon, sort_order')
    .or(`family_id.is.null,family_id.eq.${profile.family_id}`)
    .order('sort_order', { ascending: true });

  // Fetch family member names for meta info
  const { data: members } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('family_id', profile.family_id);

  if (itemsError) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm text-error-text">
          Nie udalo sie zaladowac listy. Sprobuj ponownie.
        </p>
      </div>
    );
  }

  // Build member name lookup
  const memberNames: Record<string, string> = {};
  members?.forEach((m) => {
    memberNames[m.id] = m.display_name;
  });

  return (
    <ShoppingList
      items={items ?? []}
      categories={categories ?? []}
      memberNames={memberNames}
    />
  );
}
