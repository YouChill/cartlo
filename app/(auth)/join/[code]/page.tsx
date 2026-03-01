import { createClient } from '@/lib/supabase/server';
import { JoinForm } from './join-form';

export const metadata = {
  title: 'Dolacz do rodziny — Cartlo',
};

type Props = {
  params: Promise<{ code: string }>;
};

export default async function JoinPage({ params }: Props) {
  const { code } = await params;

  // Validate invite code server-side
  const supabase = await createClient();
  const { data: family } = await supabase
    .from('families')
    .select('name')
    .eq('invite_code', code)
    .single();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">Cartlo</h1>
        </div>

        {family ? (
          <JoinForm code={code} familyName={family.name} />
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-md">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-error-bg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-error-text"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-text-primary">
                Nieprawidlowy link
              </h2>
              <p className="mt-2 text-sm text-text-secondary">
                Ten kod zaproszeniowy jest nieprawidlowy lub wygasl.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
