'use client';

import { useActionState, useState, useTransition } from 'react';
import { Sun, Moon, Monitor, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/hooks/use-theme';
import {
  signOut,
  updateDisplayName,
  changePassword,
  sendInviteEmail,
  type UpdateProfileState,
  type ChangePasswordState,
  type InviteEmailState,
} from './actions';

const profileInitial: UpdateProfileState = { error: null, success: false };
const passwordInitial: ChangePasswordState = { error: null, success: false };
const inviteInitial: InviteEmailState = { error: null, success: false };

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Jasny', Icon: Sun },
  { value: 'dark' as const, label: 'Ciemny', Icon: Moon },
  { value: 'system' as const, label: 'System', Icon: Monitor },
];

export function SettingsClient({
  displayName,
  email,
  inviteCode,
}: {
  displayName: string;
  email: string;
  inviteCode: string;
}) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoggingOut, startLogout] = useTransition();
  const { theme, setTheme } = useTheme();

  const [profileState, profileAction, isProfilePending] = useActionState(
    updateDisplayName,
    profileInitial,
  );

  const [passwordState, passwordAction, isPasswordPending] = useActionState(
    changePassword,
    passwordInitial,
  );

  const [inviteState, inviteAction, isInvitePending] = useActionState(
    sendInviteEmail,
    inviteInitial,
  );

  const handleSignOut = () => {
    startLogout(async () => {
      await signOut();
    });
  };

  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${inviteCode}`
      : `/join/${inviteCode}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Profile section */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-text-primary">Profil</h2>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          {/* Email (read-only) */}
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-semibold text-text-primary">
              Email
            </label>
            <div className="flex h-11 items-center rounded-xl border border-border bg-surface-raised px-3 text-sm text-text-secondary">
              {email}
            </div>
          </div>

          {/* Display name */}
          <form action={profileAction}>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="displayName"
                  className="mb-1.5 block text-sm font-semibold text-text-primary"
                >
                  Imie
                </label>
                <Input
                  id="displayName"
                  name="displayName"
                  type="text"
                  defaultValue={displayName}
                  placeholder="np. Kasia"
                  required
                  minLength={2}
                  maxLength={30}
                  className="h-11 rounded-xl border-border bg-surface text-base"
                />
              </div>

              {profileState.error && (
                <div className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">
                  {profileState.error}
                </div>
              )}

              {profileState.success && (
                <div className="rounded-lg bg-mint-50 px-3 py-2 text-sm text-mint-600">
                  Imie zostalo zmienione.
                </div>
              )}

              <Button
                type="submit"
                disabled={isProfilePending}
                className="h-11 w-full rounded-xl bg-mint-400 text-[15px] font-semibold text-white shadow-sm hover:bg-mint-500 active:bg-mint-600"
              >
                {isProfilePending ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Change password section */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-text-primary">
          Zmiana hasla
        </h2>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <form action={passwordAction}>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="mb-1.5 block text-sm font-semibold text-text-primary"
                >
                  Obecne haslo
                </label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                  className="h-11 rounded-xl border-border bg-surface text-base"
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-1.5 block text-sm font-semibold text-text-primary"
                >
                  Nowe haslo
                </label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={6}
                  className="h-11 rounded-xl border-border bg-surface text-base"
                />
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-1.5 block text-sm font-semibold text-text-primary"
                >
                  Powtorz nowe haslo
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  className="h-11 rounded-xl border-border bg-surface text-base"
                />
              </div>

              {passwordState.error && (
                <div className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">
                  {passwordState.error}
                </div>
              )}

              {passwordState.success && (
                <div className="rounded-lg bg-mint-50 px-3 py-2 text-sm text-mint-600">
                  Haslo zostalo zmienione.
                </div>
              )}

              <Button
                type="submit"
                disabled={isPasswordPending}
                className="h-11 w-full rounded-xl bg-mint-400 text-[15px] font-semibold text-white shadow-sm hover:bg-mint-500 active:bg-mint-600"
              >
                {isPasswordPending ? 'Zmieniam...' : 'Zmien haslo'}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Invite by email section */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-text-primary">
          Zapros przez email
        </h2>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <form action={inviteAction}>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="email-invite"
                  className="mb-1.5 block text-sm font-semibold text-text-primary"
                >
                  Adres email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                  />
                  <Input
                    id="email-invite"
                    name="email"
                    type="email"
                    placeholder="np. mama@email.com"
                    required
                    className="h-11 rounded-xl border-border bg-surface pl-10 text-base"
                  />
                </div>
              </div>

              <p className="text-xs text-text-tertiary">
                Wyslemy zaproszenie z linkiem do dolaczenia do Twojej rodziny.
              </p>

              {inviteState.error && (
                <div className="rounded-lg bg-error-bg px-3 py-2 text-sm text-error-text">
                  {inviteState.error}
                </div>
              )}

              {inviteState.success && (
                <div className="rounded-lg bg-mint-50 px-3 py-2 text-sm text-mint-600">
                  Zaproszenie zostalo wyslane!
                </div>
              )}

              <Button
                type="submit"
                disabled={isInvitePending}
                className="h-11 w-full rounded-xl bg-mint-400 text-[15px] font-semibold text-white shadow-sm hover:bg-mint-500 active:bg-mint-600"
              >
                {isInvitePending ? 'Wysylanie...' : 'Wyslij zaproszenie'}
              </Button>
            </div>
          </form>

          {/* Fallback: copy link */}
          <div className="mt-4 border-t border-border-light pt-3">
            <p className="mb-2 text-xs text-text-tertiary">
              Lub skopiuj link zaproszenia:
            </p>
            <CopyLinkButton inviteLink={inviteLink} />
          </div>
        </div>
      </section>

      {/* Theme section */}
      <section className="mb-8">
        <h2 className="mb-3 text-lg font-bold text-text-primary">Wyglad</h2>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex gap-2">
            {THEME_OPTIONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-semibold transition-colors ${
                  theme === value
                    ? 'bg-mint-50 text-mint-600'
                    : 'bg-surface-raised text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Sign out section */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">Konto</h2>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          {showLogoutConfirm ? (
            <div className="rounded-lg border border-warning-border bg-warning-bg p-3">
              <p className="mb-2 text-sm text-warning-text">
                Czy na pewno chcesz sie wylogowac?
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                  size="sm"
                  className="rounded-lg bg-error-text text-xs text-white hover:bg-error-text/90"
                >
                  {isLoggingOut ? 'Wylogowywanie...' : 'Tak, wyloguj'}
                </Button>
                <Button
                  onClick={() => setShowLogoutConfirm(false)}
                  variant="ghost"
                  size="sm"
                  className="rounded-lg text-xs"
                >
                  Anuluj
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowLogoutConfirm(true)}
              variant="outline"
              className="h-11 w-full rounded-xl border-border text-[15px] font-semibold text-error-text hover:bg-error-bg"
            >
              Wyloguj sie
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}

function CopyLinkButton({ inviteLink }: { inviteLink: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silently
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 truncate text-sm text-text-primary">
        {inviteLink}
      </span>
      <Button
        onClick={handleCopy}
        variant="outline"
        size="sm"
        className="shrink-0 rounded-lg text-xs"
      >
        {copied ? 'Skopiowano!' : 'Kopiuj'}
      </Button>
    </div>
  );
}
