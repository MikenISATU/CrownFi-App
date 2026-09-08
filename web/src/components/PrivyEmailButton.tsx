"use client";
import { ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSession } from "@/session/SessionProvider";

// The "Continue with Email" chooser item. Opens the Privy login modal; the actual
// session exchange is handled by the persistent <PrivyAutoLink /> after auth completes.
export function PrivyEmailButton({ children, onStart }: { children: ReactNode; onStart?: () => void }) {
  const { ready, authenticated, login } = usePrivy();
  return (
    <button
      onClick={() => { onStart?.(); if (!authenticated) login(); }}
      disabled={!ready}
      className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-[#f3f3fb] hover:ring-1 hover:ring-[#0000c8]/20 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function PrivySessionButton({ address }: { address: string }) {
  const { logout } = usePrivy();
  const { disconnect } = useSession();
  return (
    <button
      className="btn-ghost !min-h-[38px] !rounded-[11px] !px-3 font-mono text-xs"
      title="Sign out of Privy"
      onClick={async () => { await logout().catch(() => {}); disconnect(); }}
    >
      {`${address.slice(0, 6)}…${address.slice(-4)}`}
    </button>
  );
}
