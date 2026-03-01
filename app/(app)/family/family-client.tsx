'use client';

import { useState, useTransition } from 'react';
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
        <h2 className="mb-3 text-lg font-bold text-text-primary">Czlonkowie</h2>
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
                  <span className="ml-1.5 text-xs text-text-tertiary">
                    (Ty)
                  </span>
                )}
              </div>

              {/* Role */}
              <span className="text-xs text-text-tertiary">
                {member.id === adminId ? 'Admin' : 'Czlonek'}
              </span>
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
          <div className="mb-3 flex items-center gap-2">
            <span className="flex-1 truncate text-sm text-text-primary">
              {inviteLink}
            </span>
            <Button
              onClick={handleCopy}
              variant="outline"
              size="sm"
              className="shrink-0 rounded-lg text-xs"
            >
              {copied ? 'Skopiowano!' : 'Kopiuj link'}
            </Button>
          </div>

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
            <Button
              onClick={() => setShowConfirm(true)}
              variant="ghost"
              size="sm"
              className="text-xs text-text-secondary"
            >
              Generuj nowy link
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
