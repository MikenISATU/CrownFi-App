"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Slide } from "@/components/Carousel";
import { Filmstrip } from "@/components/Filmstrip";
import { CountUp } from "@/components/ui";
import type { MarketView } from "@/components/MarketCard";
import { getJson } from "@/lib/api";

type Stats = { votes: number; tickets: number; collectiblesSold: number; contestants: number; fans: number; predictions: number };

export default function Home() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [markets, setMarkets] = useState<MarketView[]>([]);

  useEffect(() => {
    getJson<any[]>("/api/contestants", [], { ttl: 60_000 }).then((cs) =>
      setSlides(cs.map((c: any) => ({ id: c.id, name: c.name, country: c.country, sash: c.sash, portraitUrl: c.portraitUrl }))));
    getJson<Stats | null>("/api/stats", null, { ttl: 30_000 }).then(setStats);
    getJson<MarketView[]>("/api/markets", [], { ttl: 30_000 }).then(setMarkets);
  }, []);

  // The home page only previews the markets — the numbers below, never the markets themselves.
  const liveMarkets = markets.filter((m) => m.live).length;
  const pooled = markets.reduce((sum, m) => sum + m.totalPool, 0);
  const predictors = markets.reduce((sum, m) => sum + m.participants, 0);

  return (
    <div className="space-y-14 sm:space-y-20">
      {/* ─── SASHES FOR LIFE BANNER ───────────────────────── */}
      <section className="group relative -mt-2 overflow-hidden rounded-[2rem] border border-[#e7d9a8] shadow-[0_30px_70px_-42px_rgba(184,145,47,0.85)]">
        <div className="sfl-band absolute inset-0" />
        <div className="relative flex h-60 items-center justify-center sm:h-[27rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/sfl.gif"
            alt="Sashes for Life"
            className="h-full w-auto max-w-full object-contain transition-transform duration-[900ms] ease-out group-hover:scale-[1.02]"
          />
        </div>
        {/* vignette + gold sheen sweep */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_75%_at_50%_50%,transparent_45%,rgba(35,37,47,0.14)_100%)]" />
        <div className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 animate-sheen bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
      </section>

      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="hero-band relative overflow-hidden rounded-[2rem] border border-[#e7d9a8] px-5 py-12 text-center sm:px-10 sm:py-24"
        style={{ background: "radial-gradient(120% 90% at 50% -10%, #fbf4dd 0%, #ffffff 45%, #faf7ef 100%)" }}>
        {/* Gold aura */}
        <div className="pointer-events-none absolute inset-0 opacity-90"
          style={{ background: "radial-gradient(45% 40% at 50% 8%, rgba(212,175,55,0.28), transparent 60%)" }} />
        {/* Crown coin */}
        <div className="relative mx-auto mb-6 h-28 w-28 sm:h-36 sm:w-36">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="CrownFi" className="h-full w-full object-contain drop-shadow-[0_10px_30px_rgba(184,145,47,0.45)]" />
        </div>
        <div className="relative">
          <div className="eyebrow mb-4">CrownFi Pageant Platform</div>
          <h1 className="font-display text-6xl font-semibold leading-[1.02] text-[#23252f] sm:text-8xl">
            CrownFi <span className="italic text-[#c8a233]">App</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl font-display text-lg uppercase tracking-[0.28em] text-[#a97f16] sm:text-xl">
            Blockchain-powered voting, tickets & predictions for pageants
          </p>
          <p className="mx-auto mt-6 max-w-xl text-[#5f6172]">
            Vote, reserve your seat, and collect your queen — all on Stellar.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tickets" className="btn-gold !px-8 !py-3 text-base">Buy Tickets</Link>
            <Link href="/vote" className="btn-ghost !px-7 !py-3 text-base">Cast your vote</Link>
          </div>
        </div>
      </section>

      {/* ─── PLATFORM IN NUMBERS ──────────────────────────── */}
      <section>
        <div className="mb-8 text-center">
          <div className="eyebrow mb-2">Platform pulse</div>
          <h2 className="font-display text-3xl font-semibold text-[#23252f] sm:text-4xl">CrownFi in numbers</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#5f6172]">Live from the platform — every figure below is a real record, not a projection.</p>
        </div>

        {/* One clean strip: dark digits, gold accent, plain labels. */}
        <div className="card-gold px-6 py-10 sm:px-10 sm:py-12">
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 text-center sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Users registered", value: stats?.fans ?? 0 },
              { label: "Votes cast", value: stats?.votes ?? 0 },
              { label: "Predictions made", value: stats?.predictions ?? 0 },
              { label: "NFTs collected", value: stats?.collectiblesSold ?? 0 },
              { label: "Tickets minted", value: stats?.tickets ?? 0 },
              { label: "Delegates", value: stats?.contestants ?? slides.length },
            ].map((s) => (
              <div key={s.label}>
                <div className="font-display text-5xl font-semibold tabular-nums text-[#23252f] sm:text-6xl">
                  <CountUp to={s.value} /><span className="text-[#c8a233]">+</span>
                </div>
                <div className="mt-2 text-sm text-[#7a7768]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PREDICTION MARKETS (preview only — full markets live on /predictions) ─── */}
      <section className="relative overflow-hidden rounded-[2rem] border border-[#efe4c2] bg-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#d4af37]/10 blur-3xl" />

        {/* Prediction market artwork — a wide banner, so it runs the full width of the card. */}
        <div className="relative border-b border-[#efe4c2]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/prediction-market.webp" alt="CrownFi prediction markets" className="h-full w-full object-cover" />
        </div>

        <div className="relative grid items-center gap-9 p-7 sm:p-10 lg:grid-cols-2">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#efe4c2] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#a97f16]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c0392b] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c0392b]" />
              </span>
              Prediction markets
            </div>
            <h2 className="font-display text-4xl font-semibold text-[#23252f] sm:text-5xl">Predict the crown</h2>
            <p className="mt-3 max-w-lg text-[#5f6172]">
              Call the swimsuit round, the long gown, the Q&amp;A — or the crown itself. Winnings settle in test USDC
              the moment a market resolves.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Stake on any outcome — cancel any time before the market locks.",
                "Odds move live with the crowd.",
                "Anyone can open a market. Official ones carry a star.",
              ].map((line) => (
                <li key={line} className="flex gap-2.5 text-sm text-[#5f6172]">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4af37]" />
                  {line}
                </li>
              ))}
            </ul>
            <Link href="/predictions" className="btn-gold mt-7 inline-flex !px-8 !py-3 text-base">Open prediction markets</Link>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Markets live", value: liveMarkets },
              { label: "USDC pooled", value: pooled },
              { label: "Predicting", value: predictors },
            ].map((s) => (
              <div key={s.label} className="card-gold p-5 text-center">
                <div className="font-display text-3xl font-semibold tabular-nums text-[#b8912f] sm:text-4xl"><CountUp to={s.value} /></div>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-[#7a7768]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── MEET THE DELEGATES ───────────────────────────── */}
      <section>
        <div className="mb-8 text-center">
          <div className="eyebrow mb-2">Delegate roster</div>
          <h2 className="font-display text-4xl font-semibold text-[#c8a233] sm:text-6xl">Meet the Delegates</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#5f6172]">
            Five delegates, one crown. Send your favorite to the next stage — one vote per wallet, per round.
          </p>
        </div>
        <Filmstrip slides={slides} />
        <div className="mt-8 text-center">
          <Link href="/vote" className="btn-gold !px-8 !py-3 text-base">Vote Now</Link>
        </div>
      </section>

      {/* ─── FEATURED NFT ─────────────────────────────────── */}
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <div className="eyebrow mb-3">Exclusive collectibles</div>
          <h2 className="font-display text-4xl font-semibold text-[#23252f] sm:text-5xl">Own a piece of the crown</h2>
          <p className="mt-4 max-w-lg text-[#5f6172]">
            Every official candidate portrait becomes a digital collectible on Stellar. Mint your favorite queen and
            support her directly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/contestants" className="btn-gold !px-8 !py-3 text-base">Explore collectibles</Link>
            <Link href="/leaderboard" className="btn-ghost !px-7 !py-3 text-base">View leaderboard</Link>
          </div>
        </div>
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/hero-nft.png" alt="CrownFi collectible" className="w-full max-w-md animate-float drop-shadow-[0_40px_70px_rgba(184,145,47,0.35)]" />
        </div>
      </section>

      {/* ─── BUY TICKETS (stage) ──────────────────────────── */}
      <section className="relative overflow-hidden rounded-[2rem] border border-[#e7d9a8]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/stadium/stage.png" alt="CrownFi arena" className="h-64 w-full object-cover sm:h-96" />
        {/* Full scrim, not just a bottom fade — the heading sits mid-frame over a bright stage. */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/45 to-black/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <h2
            className="font-display text-4xl font-semibold text-white sm:text-6xl"
            style={{ textShadow: "0 2px 4px rgba(0,0,0,0.55), 0 8px 28px rgba(0,0,0,0.65)" }}
          >
            Reserve your seat
          </h2>
          <p className="max-w-md text-sm text-white/85" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}>
            Every seat is a verified ticket on Stellar — scannable at the door, impossible to duplicate.
          </p>
          <Link href="/tickets" className="btn-gold !px-10 !py-3 text-lg shadow-2xl">Buy Tickets</Link>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────── */}
      <section>
        <div className="mb-6 text-center">
          <div className="eyebrow mb-2">Why it holds up</div>
          <h2 className="font-display text-3xl font-semibold text-[#23252f] sm:text-4xl">Fast to vote. Impossible to fake.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "1", title: "Vote in a heartbeat", body: "Voting is instant — intake runs off-chain, so the site never buckles on finale night.", tag: "off-chain" },
            { n: "2", title: "Anchored to Stellar", body: "When a round closes, the tally is sealed into a Merkle root on Stellar. Tamper-evident, forever.", tag: "on-chain" },
            { n: "3", title: "Verify your receipt", body: "A cryptographic receipt proves your vote is in the official count — no trust required.", tag: "on-chain" },
          ].map((s) => (
            <div key={s.n} className="card-gold p-6">
              <div className="flex items-center justify-between">
                <span className="num-gold">{s.n}</span>
                <span className={s.tag === "on-chain" ? "tag-on" : "tag-off"}>{s.tag}</span>
              </div>
              <h3 className="mt-3 font-display text-xl text-[#23252f]">{s.title}</h3>
              <p className="mt-2 text-sm text-[#5f6172]">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── ROADMAP ──────────────────────────────────────── */}
      <section>
        <div className="mb-10 text-center">
          <div className="eyebrow mb-2">Where this goes</div>
          <h2 className="font-display text-3xl font-semibold text-[#23252f] sm:text-4xl">Roadmap</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[#5f6172]">Shipped first, promises second — everything in phase one is live today.</p>
        </div>

        <div className="relative mx-auto max-w-4xl">
          {/* The timeline spine */}
          <div className="absolute left-4 top-1 h-full w-px bg-gradient-to-b from-[#d4af37] via-[#e4c358] to-transparent sm:left-1/2" />

          {ROADMAP.map((p, i) => {
            const leftSide = i % 2 === 0;
            return (
              <div key={p.title} className="relative pb-10 last:pb-0">
                <span className="num-gold absolute left-4 top-1 z-10 -translate-x-1/2 sm:left-1/2">{i + 1}</span>
                <div className={`ml-12 sm:ml-0 sm:w-1/2 ${leftSide ? "sm:pr-10" : "sm:ml-auto sm:pl-10"}`}>
                  <div className="card-gold p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#faf0d2] px-2.5 py-0.5 text-[11px] font-semibold text-[#8a6d1f]">{p.period}</span>
                      <span className={p.status === "Shipped" ? "tag-on" : "tag-off"}>{p.status}</span>
                    </div>
                    <h3 className="mt-2 font-display text-xl font-semibold text-[#23252f]">{p.title}</h3>
                    <ul className="mt-2.5 space-y-1.5">
                      {p.items.map((it) => (
                        <li key={it} className="flex gap-2 text-xs leading-relaxed text-[#5f6172]">
                          <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#d4af37]" />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────── */}
      <section id="faq">
        <div className="mb-6 text-center">
          <div className="eyebrow mb-2">Got questions?</div>
          <h2 className="font-display text-3xl font-semibold text-[#23252f] sm:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="mx-auto max-w-3xl space-y-3">
          {HOME_FAQ.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
        <div className="mt-6 text-center">
          <Link href="/faq" className="text-sm text-[#a97f16] hover:underline">See all FAQs →</Link>
        </div>
      </section>
    </div>
  );
}

const ROADMAP: { period: string; status: "Shipped" | "Next" | "Planned"; title: string; items: string[] }[] = [
  {
    period: "Now", status: "Shipped", title: "Testnet platform — live",
    items: [
      "Seven Soroban contracts deployed and verified",
      "Anchored, tamper-evident voting with fan receipts",
      "Prediction markets, candidate NFTs and on-chain ticketing",
      "Google/email onboarding with real self-custodial wallets",
    ],
  },
  {
    period: "Q3 2026", status: "Next", title: "First real pageant",
    items: [
      "Pilot regional pageant runs a live anchored round",
      "GCash payments go live via PayMongo",
      "External contract audit and multisig admin keys",
      "Stellar Community Fund application",
    ],
  },
  {
    period: "Q4 2026", status: "Planned", title: "Staged mainnet",
    items: [
      "Audit-anchor to mainnet first — it holds no funds",
      "Commerce contracts follow after the audit",
      "Sponsored reserves, so fans never need XLM",
      "Free-play predictions with loyalty points (license-free)",
    ],
  },
  {
    period: "2027", status: "Planned", title: "Beyond pageants",
    items: [
      "Licensed real-money markets with a PAGCOR-compliant partner",
      "Talent shows, esports and fan awards on the same rails",
      "Self-serve organizer platform",
    ],
  },
];

const HOME_FAQ = [
  { q: "How do I sign in?", a: "No passwords — click Connect Freighter, approve the popup, and sign a one-time message. Your Stellar wallet address is your identity." },
  { q: "How does voting work?", a: "Votes are taken off-chain for speed, one per wallet per round. When a round closes, the tally is sealed into a Merkle root and anchored on Stellar so you can verify your vote." },
  { q: "What is minting a delegate?", a: "Each candidate has an exclusive NFT-inspired collectible. Minting it on Stellar funds the delegate and earns you loyalty points — it never changes vote power." },
  { q: "Is this real money?", a: "No. CrownFi runs on Stellar Testnet with test USDC. It’s a demo — treat all assets as disposable." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-gold">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-display text-base font-semibold text-[#23252f]">{q}</span>
        <span className={`shrink-0 font-display text-xl text-[#a97f16] transition-transform ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <div className="border-t border-[#eee6d3] px-5 py-4 text-sm leading-relaxed text-[#5f6172]">{a}</div>}
    </div>
  );
}
