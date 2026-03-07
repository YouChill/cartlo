'use client';

import { useState, useTransition } from 'react';
import { Copy, Check, Share2, RefreshCw, Users, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { regenerateInviteCode } from './actions';

type Family = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

type Member = {
  id: string;
  display_name: string;
  created_at: string;
};

export function FamilyClient({
  family,
  members,
  currentUserId,
}: {
  family: Family;
  members: Member[];
  currentUserId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [canShare] = useState(
    typeof navigator !== 'undefined' && !!navigator.share,
  );
  const [isPending, startTransition] = useTransition();

  const inviteLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/join/${family.invite_code}`
      : `/join/${family.invite_code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback silently
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: `Dolacz do rodziny ${family.name} w Cartlo`,
        text: `Hej! Zaprasza Cie do wspolnej listy zakupow w aplikacji Cartlo. Kliknij link, aby dolaczyc:`,
        url: inviteLink,
      });
    } catch {
      // User cancelled or share not supported — silently ignore
    }
  };

  const handleRegenerate = () => {
    startTransition(async () => {
      await regenerateInviteCode();
      setShowConfirm(false);
    });
  };

  // First member (by created_at) is the admin/creator
  const adminId = members.length > 0 ? members[0].id : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">
        {family.name}
      </h1>

      {/* Members */}
      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-text-primary">
          <Users size={20} />
          Czlonkowie
          <span className="ml-auto text-sm font-normal text-text-tertiary">
            {members.length}{' '}
            {members.length === 1
              ? 'osoba'
              : members.length < 5
                ? 'osoby'
                : 'osob'}
          </span>
        </h2>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 border-b border-border-light px-4 py-3 last:border-b-0"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-100 text-sm font-bold text-mint-600">
                {member.display_name.charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <div className="flex-1">
                <span className="text-sm font-semibold text-text-primary">
                  {member.display_name}
                </span>
                {member.id === currentUserId && (
                  <span className="ml-1.5 text-xs text-text-tertiary">(Ty)</span>
                )}
              </div>

              {/* Role */}
              {member.id === adminId ? (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-500">
                  <Crown size={12} />
                  Admin
                </span>
              ) : (
                <span className="text-xs text-text-tertiary">Czlonek</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Invite section */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-text-primary">
          Zapros do rodziny
        </h2>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <p className="mb-4 text-sm text-text-secondary">
            Udostepnij link, aby zaprosic kolejnych czlonkow rodziny do wspolnej
            listy zakupow.
          </p>

          {/* Invite link box */}
          <div className="mb-4 rounded-xl border border-border bg-surface-raised px-3 py-2.5">
            <p className="mb-0.5 text-xs font-semibold text-text-tertiary">
              Link zaproszenia
            </p>
            <p className="truncate text-sm text-text-primary">{inviteLink}</p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border-border text-sm font-semibold"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-mint-500" />
                  Skopiowano!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Kopiuj link
                </>
              )}
            </Button>

            {canShare && (
              <Button
                onClick={handleShare}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-mint-400 text-sm font-semibold text-white hover:bg-mint-500 active:bg-mint-600"
              >
                <Share2 size={16} />
                Udostepnij
              </Button>
            )}
          </div>

          {/* Regenerate code */}
          <div className="mt-4 border-t border-border-light pt-4">
            {showConfirm ? (
              <div className="rounded-lg border border-warning-border bg-warning-bg p-3">
                <p className="mb-2 text-sm text-warning-text">
                  Stary link przestanie dzialac. Kontynuowac?
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRegenerate}
                    disabled={isPending}
                    size="sm"
                    className="rounded-lg bg-warning-text text-xs text-white hover:bg-warning-text/90"
                  >
                    {isPending ? 'Generowanie...' : 'Tak, generuj'}
                  </Button>
                  <Button
                    onClick={() => setShowConfirm(false)}
                    variant="ghost"
                    size="sm"
                    className="rounded-lg text-xs"
                  >
                    Anuluj
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary"
              >
                <RefreshCw size={13} />
                Generuj nowy link zaproszenia
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
