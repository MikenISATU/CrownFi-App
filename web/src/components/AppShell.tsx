"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "@/session/SessionProvider";
import { Icons } from "./icons";
import { WalletConnect } from "./WalletConnect";
import { ThemeToggle } from "./ThemeToggle";

const USER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/vote", label: "Vote" },
  { href: "/predictions", label: "Predict" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/verify", label: "Verify" },
  { href: "/tickets", label: "Tickets" },
  { href: "/contestants", label: "Collect" },
  { href: "/loyalty", label: "Rewards" },
  { href: "/organizer", label: "Organizer" },
  { href: "/me", label: "Me" },
];

const TABS = [
  { href: "/vote", label: "Vote", Icon: Icons.Vote },
  { href: "/verify", label: "Verify", Icon: Icons.Verify },
  { href: "/tickets", label: "Tickets", Icon: Icons.Tickets },
  { href: "/contestants", label: "Collect", Icon: Icons.Collect },
  { href: "/me", label: "Me", Icon: Icons.Me },
];

/* Brand icons (lucide has no brand marks, so inline minimal SVGs). */
function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className={className} aria-hidden>
      <path d="M20.32 4.37A19.8 19.8 0 0 0 15.45 3l-.24.44c1.55.37 2.9 1 4.14 1.86A16.3 16.3 0 0 0 12 4.5c-2.5 0-4.86.42-7.35 1.8 1.24-.86 2.6-1.5 4.14-1.86L8.55 3A19.8 19.8 0 0 0 3.68 4.37 20.6 20.6 0 0 0 .5 18.4 19.9 19.9 0 0 0 6.6 21l.86-1.42a12.9 12.9 0 0 1-2.02-.97l.5-.36c3.86 1.78 8.26 1.78 12.12 0l.5.36c-.64.38-1.32.7-2.02.97L17.4 21a19.9 19.9 0 0 0 6.1-2.6 20.6 20.6 0 0 0-3.18-14.03ZM8.6 15.3c-.98 0-1.78-.9-1.78-2s.79-2 1.78-2c.99 0 1.79.9 1.78 2 0 1.1-.79 2-1.78 2Zm6.8 0c-.98 0-1.78-.9-1.78-2s.79-2 1.78-2c.99 0 1.79.9 1.78 2 0 1.1-.79 2-1.78 2Z" />
    </svg>
  );
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className={className} aria-hidden>
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.22-6.82-5.97 6.82H1.66l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
    </svg>
  );
}
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" className={className} aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

const SOCIALS = [
  { href: "https://discord.com/", label: "Discord", Icon: DiscordIcon },
  { href: "https://x.com/", label: "X", Icon: XIcon },
  { href: "https://www.linkedin.com/", label: "LinkedIn", Icon: LinkedInIcon },
];

const FOOTER_COLS: { title: string; links: [string, string][] }[] = [
  { title: "Explore", links: [["/", "Home"], ["/predictions", "Predict"], ["/vote", "Vote"], ["/leaderboard", "Leaderboard"]] },
  { title: "Experience", links: [["/tickets", "Tickets"], ["/contestants", "Collect"], ["/loyalty", "Rewards"], ["/verify", "Verify a vote"]] },
  { title: "Organizers", links: [["/organizer", "Host a pageant"], ["/faq", "FAQ"], ["/faq#legal", "Privacy"], ["/faq#legal", "Terms"]] },
];

function SiteFooter() {
  const [subscribed, setSubscribed] = useState(false);
  return (
    <footer className="mt-24 text-white" style={{ background: "linear-gradient(165deg, #e9c65e 0%, #d4af37 30%, #bd952f 66%, #9c7714 100%)" }}>
      {/* Top hairline for a crisper edge against the page. */}
      <div className="h-px w-full bg-white/25" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand + newsletter */}
          <div>
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.png" alt="CrownFi" className="h-9 w-9 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]" />
              <span className="font-display text-2xl font-semibold tracking-wide text-white">CrownFi</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/85">
              Blockchain-powered voting, ticketing, and prediction markets for pageants — built on Stellar.
            </p>
            <form className="mt-5 max-w-xs" onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }}>
              {subscribed ? (
                <div className="rounded-xl bg-white/20 px-3 py-2.5 text-sm text-white">Thanks — you’re subscribed. ✓</div>
              ) : (
                <div className="flex overflow-hidden rounded-xl bg-white shadow-sm">
                  <input type="email" required placeholder="Email for updates" aria-label="Email"
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-[#23252f] outline-none placeholder-[#9a968b]" />
                  <button type="submit" className="shrink-0 bg-[#9c7714] px-4 text-sm font-semibold text-white transition hover:bg-[#8a680f]">Join</button>
                </div>
              )}
            </form>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/40 bg-white/10 text-white transition hover:bg-white hover:text-[#9c7714]">
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">{col.title}</div>
              <ul className="space-y-2.5 text-sm text-white/90">
                {col.links.map(([h, l]) => (
                  <li key={h + l}><Link href={h} className="transition hover:text-white hover:underline underline-offset-4">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-3 border-t border-white/25 pt-6 text-xs text-white/80 sm:flex-row sm:items-center">
          <span>© 2026 CrownFi · Testnet demo — not for real-money use</span>
          <span className="text-white/70">Crown your queen, on-chain.</span>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const { isAdmin, error, needsInstall, clearError } = useSession();

  // Reflect the admin "Maintenance mode" switch with a site-wide banner.
  useEffect(() => {
    let on = true;
    fetch("/api/payment-method").then((r) => r.json()).then((d) => on && setMaintenance(!!d.maintenance)).catch(() => {});
    return () => { on = false; };
  }, [path]);

  const links = isAdmin ? [...USER_LINKS, { href: "/admin", label: "Admin" }] : USER_LINKS;

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <header className="sticky top-3 z-40 px-3 sm:top-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between rounded-2xl border border-[#efe4c2] bg-white/80 px-4 py-2.5 shadow-[0_18px_44px_-26px_rgba(120,100,40,0.55)] backdrop-blur-xl sm:px-6">
            <div className="flex items-center gap-2">
              <button className="btn-ghost h-9 w-9 !px-0 sm:hidden" onClick={() => setDrawer((v) => !v)} aria-label="Toggle menu" aria-expanded={drawer}>
                {drawer ? <Icons.X size={18} strokeWidth={1.75} /> : <Icons.Menu size={18} strokeWidth={1.75} />}
              </button>
              <Link href="/" className="flex items-center gap-2" onClick={() => setDrawer(false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo.png" alt="CrownFi" className="h-7 w-7 object-contain" />
                <span className="font-display text-xl font-semibold tracking-wide text-[#a97f16]">CrownFi</span>
              </Link>
            </div>

            <nav className="hidden items-center gap-1 text-sm sm:flex">
              {links.map((l) => (
                <Link key={l.href} href={l.href}
                  className={`rounded-full px-3.5 py-1.5 transition ${path === l.href ? "bg-gradient-to-b from-[#d4af37] to-[#b8912f] text-[#1a1f35]" : "text-[#5f6172] hover:bg-[#faf6ea] hover:text-[#23252f]"}`}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <ThemeToggle />
              <WalletConnect />
            </div>
          </div>

          {/* Mobile burger dropdown — drops down under the header bar. */}
          {drawer && (
            <>
              <div className="fixed inset-0 top-0 z-[-1] sm:hidden" onClick={() => setDrawer(false)} />
              <nav className="mt-2 grid gap-1 rounded-2xl border border-[#efe4c2] bg-white/95 p-3 shadow-[0_24px_50px_-24px_rgba(120,100,40,0.6)] backdrop-blur-xl sm:hidden">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setDrawer(false)}
                    className={`rounded-xl px-3 py-2.5 text-sm ${path === l.href ? "bg-gradient-to-b from-[#d4af37] to-[#b8912f] text-[#1a1f35]" : "text-[#3a3f52] hover:bg-[#faf6ea]"}`}>
                    {l.label}
                  </Link>
                ))}
              </nav>
            </>
          )}
        </div>
      </header>

      {/* Connection feedback — so a failed connect never looks like a dead button. */}
      {error && (
        <div className="mx-auto mt-3 max-w-6xl px-4 sm:px-6">
          <div className="flex items-start justify-between gap-3 rounded-xl border border-[#f0d9a0] bg-[#fff8e6] px-4 py-3 text-sm text-[#6b5410]">
            <div className="flex items-start gap-2">
              <Icons.Wallet size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
              <span>
                {error}
                {needsInstall && (
                  <>
                    {" "}
                    <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">
                      Get Freighter
                    </a>
                  </>
                )}
              </span>
            </div>
            <button onClick={clearError} aria-label="Dismiss" className="shrink-0 rounded-md px-1 text-[#6b5410]/70 hover:text-[#6b5410]"><Icons.X size={16} strokeWidth={2} /></button>
          </div>
        </div>
      )}

      {maintenance && (
        <div className="mx-auto mt-3 max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 rounded-xl border border-[#f0d9a0] bg-[#fff8e6] px-4 py-2.5 text-sm text-[#6b5410]">
            <Icons.Lock size={15} strokeWidth={2} className="shrink-0" />
            <span><b>Maintenance mode.</b> Buying tickets and collectibles is paused right now — browsing stays open. Please check back soon.</span>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>

      <SiteFooter />


      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#eee6d3] bg-white/90 backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {TABS.map(({ href, label, Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${active ? "text-[#b8912f]" : "text-[#8a8779]"}`}>
                <Icon size={20} strokeWidth={1.75} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
