import { LoginForm } from './login-form';

export const metadata = {
  title: 'Zaloguj sie — Cartlo',
};

type Props = {
  searchParams: Promise<{ join?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { join } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-mint-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-mint-500"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Cartlo</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Rodzinna lista zakupow
          </p>
        </div>
        <LoginForm joinCode={join} />
      </div>
    </div>
  );
}
