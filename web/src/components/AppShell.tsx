"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "@/session/SessionProvider";
import { Icons } from "./icons";
import { BaseWalletConnect } from "@/base";
// import { ThemeToggle } from "./ThemeToggle"; — night mode hidden for now

const CHAIN_LABEL = "Base";

// Prediction-first navigation. Other CrownFi products stay discoverable in the
// coming-soon section without presenting unfinished routes as active features.
const USER_LINKS = [
  { href: "/", label: "Home" },
  { href: "/predictions", label: "Prediction markets" },
  { href: "/#prediction-markets", label: "How it works" },
  { href: "/#coming-soon", label: "Coming soon" },
  { href: "/funds", label: "Testnet funds" },
  { href: "/me", label: "Me" },
];
const NAV_DIRECT = [
  { href: "/predictions", label: "Markets" },
  { href: "/#prediction-markets", label: "How it works" },
  { href: "/#coming-soon", label: "Coming soon" },
  { href: "/#roadmap", label: "Roadmap" },
];

const TABS = [
  { href: "/", label: "Home", Icon: Icons.Home },
  { href: "/predictions", label: "Markets", Icon: Icons.TrendingUp },
  { href: "/funds", label: "Funds", Icon: Icons.Wallet },
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
  { href: "https://x.com/CrownFi_app", label: "X", Icon: XIcon },
  { href: "https://www.linkedin.com/", label: "LinkedIn", Icon: LinkedInIcon },
];

const FOOTER_COLS: { title: string; links: [string, string][] }[] = [
  { title: "Markets", links: [["/predictions", "Explore markets"], ["/#prediction-markets", "How it works"], ["/funds", "Get test funds"]] },
  { title: "CrownFi", links: [["/#roadmap", "Roadmap"], ["/faq", "FAQ"], ["/faq#legal", "Privacy and terms"]] },
  { title: "Coming soon", links: [["/#coming-soon", "Fan voting"], ["/#coming-soon", "Rewards"], ["/#coming-soon", "Organizer tools"]] },
];

function SiteFooter() {
  const [subscribed, setSubscribed] = useState(false);
  return (
    <footer className="mt-24 border-t-4 border-[#050a4f] bg-[#050a4f] text-[#f3f3fb]">
      {/* Light gold separates the dark CrownFi surface from the page. */}
      <div className="h-px w-full bg-[#d4af37]" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* Brand + newsletter */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/crownfi-base-logo.png" alt="CrownFi" className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/20" />
              <span className="font-display text-2xl font-semibold tracking-wide text-[#e6c65a]">CrownFi</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[#b1b7c3]">
              Prediction markets and verifiable fan engagement for pageants — built on {CHAIN_LABEL}.
            </p>
            <form className="mt-5" onSubmit={(e) => { e.preventDefault(); setSubscribed(true); }}>
              {subscribed ? (
                <div className="rounded-xl bg-white/5 px-3.5 py-2.5 text-sm text-[#eadfca] ring-1 ring-[#d4af37]/25">Thanks — you’re subscribed. ✓</div>
              ) : (
                <div className="flex items-center gap-2">
                  <input type="email" required placeholder="Email for updates" aria-label="Email"
                    className="min-w-0 flex-1 rounded-xl bg-black/20 px-3.5 py-2.5 text-sm text-white outline-none ring-1 ring-[#d4af37]/25 transition placeholder-[#9f8f74] focus:ring-[#d4af37]/60" />
                  <button type="submit" className="btn-gold shrink-0 !min-h-[40px] !px-5 !py-2">Join</button>
                </div>
              )}
            </form>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-full text-[#b1b7c3] ring-1 ring-[#5b616e] transition hover:bg-[#0000c8] hover:text-white hover:ring-[#d4af37]">
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.title}>
              <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d6b95b]">{col.title}</div>
              <ul className="space-y-2.5 text-sm text-[#dee1e7]">
                {col.links.map(([h, l]) => (
                  <li key={h + l}><Link href={h} className="transition hover:text-[#f6d77a]">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[#d4af37]/25 pt-6 text-xs text-[#aab6e3]">
          <span className="inline-flex items-center gap-2">Settlement asset
            <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 font-semibold text-[#050a4f]">USDC</span>
          </span>
          <span className="rounded-full bg-[#0000c8] px-2.5 py-1 text-[11px] text-white ring-1 ring-[#d4af37]/50">Built on {CHAIN_LABEL}</span>
          <span className="ml-auto text-[#b1b7c3]">Crown your queen, on-chain.</span>
        </div>

        <div className="mt-4 flex flex-col items-start justify-between gap-2 text-xs text-[#b1b7c3] sm:flex-row sm:items-center">
          <span>© 2026 CrownFi · Testnet demo — not for real-money use.</span>
          <span className="flex gap-4">
            <Link href="/faq#legal" className="transition hover:text-[#f6d77a]">Privacy</Link>
            <Link href="/faq#legal" className="transition hover:text-[#f6d77a]">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [drawer, setDrawer] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const { isAdmin, error, clearError } = useSession();

  // Reflect the admin "Maintenance mode" switch with a site-wide banner.
  // Fetch ONCE per session — not per navigation (that cost a DB round-trip on every tab change).
  useEffect(() => {
    let on = true;
    fetch("/api/payment-method").then((r) => r.json()).then((d) => on && setMaintenance(!!d.maintenance)).catch(() => {});
    return () => { on = false; };
  }, []);

  // Scroll reveal: fade sections in as they enter the viewport, on every page. Skipped
  // entirely (content stays visible) under reduced-motion or in a hidden tab, where
  // IntersectionObserver is suspended and hiding content would strand it invisible.
  useEffect(() => {
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.visibilityState !== "visible"
    ) return;
    const els = Array.from(document.querySelectorAll("main section")).filter((el) => !el.classList.contains("reveal-in"));
    if (!els.length) return;
    els.forEach((el) => el.classList.add("reveal-init"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("reveal-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      // Never leave anything hidden behind when navigating away mid-reveal.
      els.forEach((el) => el.classList.add("reveal-in"));
    };
  }, [path]);

  const links = isAdmin ? [...USER_LINKS, { href: "/admin", label: "Admin" }] : USER_LINKS;

  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <header className="sticky top-3 z-40 px-3 sm:top-4 sm:px-6">
        <div className="mx-auto max-w-[1440px]">
          <div className="brand-header flex items-center justify-between rounded-2xl border border-[#e0e2f2] bg-white/95 px-2.5 py-2.5 shadow-[0_18px_42px_-24px_rgba(5,10,79,0.42)] backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <button className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#e0e2f2] text-[#050a4f] transition hover:bg-[#f3f3fb] sm:hidden" onClick={() => setDrawer((v) => !v)} aria-label="Toggle menu" aria-expanded={drawer}>
                {drawer ? <Icons.X size={18} strokeWidth={1.75} /> : <Icons.Menu size={18} strokeWidth={1.75} />}
              </button>
              <Link href="/" className="flex min-w-0 items-center gap-1.5 sm:gap-2" onClick={() => setDrawer(false)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/crownfi-base-logo.png" alt="CrownFi" className="h-8 w-8 rounded-[10px] object-cover ring-1 ring-[#e0e2f2]" />
                <span className="font-display text-base font-semibold tracking-wide text-[#050a4f] min-[480px]:text-xl">CrownFi</span>
              </Link>
            </div>

            <nav className="hidden items-center gap-1 text-sm sm:flex">
              {NAV_DIRECT.map((l) => (
                <Link key={l.href} href={l.href}
                  className={`rounded-full px-3.5 py-1.5 transition ${path === l.href ? "bg-[#050a4f] text-white" : "text-[#5e6075] hover:bg-[#f3f3fb] hover:text-[#050a4f]"}`}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {/* <ThemeToggle /> — night mode hidden for now (see the theme note in layout.tsx). */}
              <BaseWalletConnect />
            </div>
          </div>

          {/* Mobile burger dropdown — drops down under the header bar. */}
          {drawer && (
            <>
              <div className="fixed inset-0 top-0 z-[-1] sm:hidden" onClick={() => setDrawer(false)} />
              <nav className="mt-2 grid gap-1 rounded-2xl border border-[#e0e2f2] bg-white p-3 shadow-[0_24px_50px_-24px_rgba(5,10,79,0.42)] sm:hidden">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setDrawer(false)}
                    className={`rounded-xl px-3 py-2.5 text-sm ${path === l.href ? "bg-[#050a4f] font-semibold text-white shadow-[inset_3px_0_0_#d4af37]" : "text-[#5e6075] hover:bg-[#f3f3fb] hover:text-[#050a4f]"}`}>
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
        <div className="mx-auto mt-3 max-w-7xl px-4 sm:px-6">
          <div className="flex items-start justify-between gap-3 rounded-xl border border-[#f0d9a0] bg-[#fff8e6] px-4 py-3 text-sm text-[#6b5410]">
            <div className="flex items-start gap-2">
              <Icons.Wallet size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
              <span>
                {error}
              </span>
            </div>
            <button onClick={clearError} aria-label="Dismiss" className="shrink-0 rounded-md px-1 text-[#6b5410]/70 hover:text-[#6b5410]"><Icons.X size={16} strokeWidth={2} /></button>
          </div>
        </div>
      )}

      {maintenance && (
        <div className="mx-auto mt-3 max-w-7xl px-4 sm:px-6">
          <div className="flex items-center gap-2 rounded-xl border border-[#f0d9a0] bg-[#fff8e6] px-4 py-2.5 text-sm text-[#6b5410]">
            <Icons.Lock size={15} strokeWidth={2} className="shrink-0" />
            <span><b>Maintenance mode.</b> Some experiences are paused while the Base migration continues. Prediction-market browsing stays open.</span>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6">{children}</main>

      <SiteFooter />


      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[#f4e3a1] bg-[#050a4f]/95 backdrop-blur-xl sm:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
          {TABS.map(({ href, label, Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${active ? "text-[#ffd12f]" : "text-white/75"}`}>
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
