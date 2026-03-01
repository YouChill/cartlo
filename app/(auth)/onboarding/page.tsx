import { OnboardingForm } from './onboarding-form';

export const metadata = {
  title: 'Witaj w Cartlo',
};

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-text-primary">
            Witaj w Cartlo!
          </h1>
          <p className="mt-2 text-sm text-text-secondary">Jak chcesz zaczac?</p>
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
