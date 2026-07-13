"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SpotlightCarousel, Slide } from "@/components/Carousel";
import { CountUp } from "@/components/ui";
import { MarketCard, MarketView, CATEGORY_LABEL, timeLeft } from "@/components/MarketCard";
import { categoryImage } from "@/lib/segments";
import { getJson } from "@/lib/api";

type Stats = { votes: number; tickets: number; collectiblesSold: number; contestants: number };

export default function Home() {
  const router = useRouter();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [markets, setMarkets] = useState<MarketView[]>([]);

  useEffect(() => {
    getJson<any[]>("/api/contestants", []).then((cs) =>
      setSlides(cs.map((c: any) => ({ id: c.id, name: c.name, country: c.country, sash: c.sash, portraitUrl: c.portraitUrl }))));
    getJson<Stats | null>("/api/stats", null).then(setStats);
    getJson<MarketView[]>("/api/markets", []).then(setMarkets);
  }, []);

  // Official first, then live, then by pool size — so the marquee always leads with the strongest market.
  const sorted = [...markets].sort((a, b) =>
    (Number(b.official) - Number(a.official)) ||
    (Number(b.live) - Number(a.live)) ||
    (b.totalPool - a.totalPool));
  const spotlight = sorted.find((m) => m.official && m.live) ?? sorted[0] ?? null;
  const rest = sorted.filter((m) => m.id !== spotlight?.id).slice(0, 3);

  return (
    <div className="space-y-24">
      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="hero-band relative -mt-2 overflow-hidden rounded-[2rem] border border-[#e7d9a8] px-6 py-20 text-center sm:px-10 sm:py-28"
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
            The ultimate blockchain-powered platform for pageants
          </p>
          <p className="mx-auto mt-6 max-w-xl text-[#5f6172]">
            Cast your vote securely, purchase verified seats, and collect limited memorabilia to fund the pageant queens you love.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/tickets" className="btn-gold !px-8 !py-3 text-base">Buy Tickets</Link>
            <Link href="/vote" className="btn-ghost !px-7 !py-3 text-base">Cast your vote</Link>
          </div>
        </div>
      </section>

      {/* ─── PREDICTION MARKETS ───────────────────────────── */}
      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#efe4c2] bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#a97f16]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#c0392b] opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#c0392b]" />
              </span>
              Live prediction markets
            </div>
            <h2 className="font-display text-4xl font-semibold text-[#23252f] sm:text-5xl">Predict the crown</h2>
            <p className="mt-2 max-w-xl text-sm text-[#5f6172]">Back your call on each stage of the night. Browse freely; connect only to participate — anyone can open a market.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/predictions" className="btn-gold !px-7 !py-3">Explore markets</Link>
            <Link href="/predictions" className="btn-ghost !px-6 !py-3">Create a prediction</Link>
          </div>
        </div>

        {spotlight ? (
          <div className="grid gap-4 lg:grid-cols-5">
            <SpotlightMarket m={spotlight} />
            <div className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
              {rest.map((m) => <MarketCard key={m.id} m={m} />)}
              {rest.length === 0 && (
                <Link href="/predictions" className="glass glass-hover flex h-full min-h-[8rem] flex-col items-center justify-center gap-2 p-6 text-center">
                  <span className="font-display text-lg text-[#23252f]">More markets inside</span>
                  <span className="text-xs text-[#7a7768]">Browse every open market, or open your own →</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="glass p-10 text-center">
            <div className="font-display text-xl text-[#23252f]">Markets open soon</div>
            <p className="mt-2 text-sm text-[#7a7768]">Prediction markets go live as pageants are approved. Anyone can open the first one from the Predict page.</p>
            <Link href="/predictions" className="btn-gold mt-4 inline-block">Visit prediction markets</Link>
          </div>
        )}
      </section>

      {/* ─── MEET THE DELEGATES ───────────────────────────── */}
      <section>
        <div className="mb-8 text-center">
          <div className="eyebrow mb-2">Delegate roster</div>
          <h2 className="font-display text-4xl font-semibold text-[#c8a233] sm:text-6xl">Meet the Delegates</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-[#5f6172]">
            Vote for the NEXT Queen onchain. Help your favorite candidate advance to the next level using your power to vote.
          </p>
        </div>
        <SpotlightCarousel slides={slides} cta="View profile" onSelect={(id) => router.push(`/contestants/${id}`)} />
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
            Every official candidate portrait becomes a limited, NFT-inspired digital collectible on Stellar. Mint your
            favorite queen, fund her journey, and hold a timeless piece of pageant history.
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
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-t from-black/45 via-transparent to-transparent px-6 text-center">
          <h2 className="font-display text-4xl font-semibold text-white drop-shadow-lg sm:text-6xl">Reserve your seat</h2>
          <Link href="/tickets" className="btn-gold !px-10 !py-3 text-lg shadow-2xl">Buy Tickets</Link>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────── */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Votes cast", value: stats?.votes ?? 0 },
          { label: "Tickets minted", value: stats?.tickets ?? 0 },
          { label: "Collectibles sold", value: stats?.collectiblesSold ?? 0 },
          { label: "Delegates", value: stats?.contestants ?? slides.length },
        ].map((s) => (
          <div key={s.label} className="glass p-5 text-center">
            <div className="font-display text-4xl font-semibold text-[#b8912f]"><CountUp to={s.value} /></div>
            <div className="mt-1 text-xs uppercase tracking-wider text-[#7a7768]">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────── */}
      <section>
        <div className="mb-6 text-center">
          <div className="eyebrow mb-2">Why it holds up</div>
          <h2 className="font-display text-3xl font-semibold text-[#23252f] sm:text-4xl">Fast to vote. Impossible to fake.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { n: "01", title: "Vote in a heartbeat", body: "Cast your vote instantly. Intake and de-duplication run off-chain, so the platform never buckles when millions rush in.", tag: "off-chain" },
            { n: "02", title: "Anchored to Stellar", body: "When a round closes, the tally is sealed into a Merkle root and anchored on Stellar. Tamper-evident, forever.", tag: "on-chain" },
            { n: "03", title: "Verify your receipt", body: "Get a cryptographic receipt proving your vote is in the official count. No trust required, and no identity exposed.", tag: "on-chain" },
          ].map((s) => (
            <div key={s.n} className="glass glass-hover p-6">
              <div className="flex items-center justify-between">
                <span className="font-display text-2xl text-[#b8912f]/70">{s.n}</span>
                <span className={s.tag === "on-chain" ? "tag-on" : "tag-off"}>{s.tag}</span>
              </div>
              <h3 className="mt-3 font-display text-xl text-[#23252f]">{s.title}</h3>
              <p className="mt-2 text-sm text-[#5f6172]">{s.body}</p>
            </div>
          ))}
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

// Large "spotlight" treatment for the leading market on the home page.
function SpotlightMarket({ m }: { m: MarketView }) {
  const top = [...m.options].sort((a, b) => b.percent - a.percent).slice(0, 3);
  return (
    <Link
      href={`/predictions/${m.id}`}
      className="group relative col-span-1 flex flex-col overflow-hidden rounded-2xl border border-[#efe4c2] bg-white shadow-[0_24px_60px_-30px_rgba(184,145,47,0.6)] ring-1 ring-[#d4af37]/40 transition hover:-translate-y-0.5 lg:col-span-3"
    >
      {/* Banner */}
      <div className="relative h-40 w-full sm:h-48">
        <div className="absolute inset-0 bg-gradient-to-br from-[#eacb63] via-[#d4af37] to-[#b8912f]" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.bannerUrl ?? categoryImage(m.category)} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {m.official && <span className="rounded-full bg-[#1a1f35] px-2.5 py-1 text-[11px] font-semibold text-[#f4e29a]">★ Official</span>}
          {m.live && (
            <span className="flex items-center gap-1 rounded-full bg-[#fdeaea] px-2 py-1 text-[11px] font-semibold text-[#c0392b]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c0392b]" /> Live
            </span>
          )}
        </div>
        <span className="absolute bottom-3 left-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{CATEGORY_LABEL[m.category] ?? m.category}</span>
        <span className="absolute bottom-3 right-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-[#5f6172] backdrop-blur">{m.status === "resolved" ? "Resolved" : timeLeft(m.endsInMs)}</span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="font-display text-2xl leading-snug text-[#23252f]">{m.question}</div>
        <div className="mt-4 flex-1 space-y-2.5">
          {top.map((o) => (
            <div key={o.index}>
              <div className="flex justify-between text-sm text-[#5f6172]">
                <span className="truncate pr-2">{o.label}</span>
                <span className="font-semibold text-[#a97f16]">{o.percent}%</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#efe9d8]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#d4af37] to-[#b8912f]" style={{ width: `${o.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-[#eee6d3] pt-4 text-sm">
          <span className="text-[#7a7768]">{m.totalPool.toLocaleString()} USDC pooled · {m.participants} predicting</span>
          <span className="font-semibold text-[#a97f16] transition group-hover:translate-x-0.5">Predict →</span>
        </div>
      </div>
    </Link>
  );
}

const HOME_FAQ = [
  { q: "How do I sign in?", a: "No passwords — click Connect Freighter, approve the popup, and sign a one-time message. Your Stellar wallet address is your identity." },
  { q: "How does voting work?", a: "Votes are taken off-chain for speed, one per wallet per round. When a round closes, the tally is sealed into a Merkle root and anchored on Stellar so you can verify your vote." },
  { q: "What is minting a delegate?", a: "Each candidate has an exclusive NFT-inspired collectible. Minting it on Stellar funds the delegate and earns you loyalty points — it never changes vote power." },
  { q: "Is this real money?", a: "No. CrownFi runs on Stellar Testnet with test USDC. It’s a demo — treat all assets as disposable." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-display text-base font-semibold text-[#23252f]">{q}</span>
        <span className={`shrink-0 font-display text-xl text-[#a97f16] transition-transform ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && <div className="border-t border-[#eee6d3] px-5 py-4 text-sm leading-relaxed text-[#5f6172]">{a}</div>}
    </div>
  );
}
