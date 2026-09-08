"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { MarketView } from "@/components/MarketCard";
import { CountUp } from "@/components/ui";
import { getJson } from "@/lib/api";
import styles from "./home.module.css";

type Stats = { fans: number; predictions: number };

const ROADMAP = [
  { period: "Now", status: "Testnet", title: "Prediction markets", items: ["Base Sepolia settlement", "Official test USDC", "Privy and EVM wallets", "Live crowd odds"] },
  { period: "Phase 02", status: "Next", title: "Market hardening", items: ["Independent contract audit", "Indexed odds history", "Result-source policy", "Sponsored transactions"] },
  { period: "Phase 03", status: "Planned", title: "Live pageants", items: ["Partner pilot event", "Market moderation", "Official result feeds", "Mobile experience"] },
  { period: "Phase 04", status: "Planned", title: "Mainnet stage", items: ["Base mainnet contracts", "Production liquidity", "Risk and dispute controls", "Ecosystem launch"] },
];

function marketPreview(market: MarketView, index: number) {
  const hasPositions = market.totalPool > 0;
  const sorted = hasPositions ? [...market.options].sort((a, b) => b.percent - a.percent) : market.options;
  const first = sorted[0];
  const second = sorted[1];
  return {
    label: `${market.live ? "Live" : market.status === "resolved" ? "Resolved" : "Upcoming"} · ${market.category}`,
    question: market.question,
    left: hasPositions ? (first?.label ?? "Open field") : "Awaiting first prediction",
    leftPct: hasPositions ? (first?.percent ?? 0) : null,
    right: hasPositions ? (second?.label ?? "") : "",
    rightPct: hasPositions ? (second?.percent ?? 0) : null,
    key: market.id || String(index),
  };
}

export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [markets, setMarkets] = useState<MarketView[]>([]);

  useEffect(() => {
    getJson<Stats | null>("/api/stats", null, { ttl: 30_000 }).then(setStats);
    getJson<MarketView[]>("/api/markets", [], { ttl: 30_000 }).then(setMarkets);
  }, []);

  const onchainMarkets = useMemo(() => markets.filter((market) => market.onchain), [markets]);
  const marketCards = useMemo(() => onchainMarkets.slice(0, 4).map(marketPreview), [onchainMarkets]);
  const liveMarkets = onchainMarkets.filter((market) => market.live).length;
  const pooledUsdc = onchainMarkets.reduce((sum, market) => sum + market.totalPool, 0);

  return (
    <div className={styles.home}>
      <section className={styles.hero} id="experience">
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Prediction markets on Base</span>
          <h1><span>Predict the</span><em>crown.</em></h1>
          <p>Back a pageant outcome with test USDC. Follow live odds and verify the final settlement on Base Sepolia.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/predictions">Explore markets</Link>
            <Link className={styles.secondaryButton} href="#prediction-markets">How markets work</Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.heroImage} src="/brand/prediction-crown-hero.webp" alt="A luminous CrownFi market crown formed from financial chart bars" />
          <div className={styles.heroCaption}><strong>Pageant outcomes.<br />Transparent markets.</strong><span>Built on Base</span></div>
        </div>
      </section>

      <section className={styles.pulse} aria-labelledby="pulse-title">
        <header className={styles.sectionIntro}>
          <span className={styles.pill}>Platform pulse</span>
          <h2 id="pulse-title">CrownFi in <em>numbers</em></h2>
          <p>Live from the platform—every figure below is a real record, not a projection.</p>
        </header>
        <div className={styles.statsGrid}>
          {[
            ["Users registered", stats?.fans ?? 0],
            ["Markets live", liveMarkets],
            ["Predictions made", stats?.predictions ?? 0],
            ["Test USDC pooled", pooledUsdc],
          ].map(([label, value]) => (
            <div className={styles.stat} key={label}>
              <b><CountUp to={Number(value)} /><span>+</span></b>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.predictions} id="prediction-markets" aria-labelledby="prediction-title">
        <div className={styles.predictionTop}>
          <header className={styles.predictionHead}>
            <span className={styles.eyebrow}>Prediction markets</span>
            <h2 id="prediction-title">Confidence for every <em>call.</em></h2>
            <p>Choose an outcome, confirm in your wallet and follow the crowd odds through settlement.</p>
          </header>
          <div className={styles.marketBrand} aria-label="CrownFi, pageant outcomes and transparent markets">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span><img src="/brand/crownfi-base-logo.png" alt="CrownFi" /></span>
            <strong>Pageant outcomes.<br />Transparent markets.</strong>
            <small>Built on Base</small>
          </div>
        </div>
        <div className={styles.marketConsole}>
          <div className={styles.marketGuide}>
            <div className={styles.guideStats}><span><b>Live</b> markets</span><span><b>USDC</b> pooled</span><span><b>24/7</b> odds</span></div>
            <h3>How it moves</h3><p>Every action stays clear from the first position through final settlement.</p>
            <ol><li>Pick a market</li><li>Choose an outcome</li><li>Watch the odds move</li><li>Claim after resolution</li></ol>
            <Link href="/predictions">Open all markets →</Link>
          </div>
          <div className={styles.marketGrid}>
            {marketCards.length > 0 ? marketCards.map(({ key, ...market }) => <MarketPreview key={key} {...market} />) : <div className={styles.emptyMarket}><strong>No Base market is open yet.</strong><span>The first official market will appear here after it is created on Base Sepolia.</span></div>}
          </div>
        </div>
      </section>

      <section className={styles.comingSoonSection} id="coming-soon" aria-labelledby="coming-soon-title">
        <header className={styles.sectionIntro}>
          <span className={styles.pill}>After prediction markets</span>
          <h2 id="coming-soon-title">More ways to join the <em>stage.</em></h2>
          <p>These experiences stay intentionally out of the main navigation until they are ready.</p>
        </header>
        <div className={styles.comingSoonGrid}>
          {[
            ["01", "Fan voting", "One-wallet voting with a verifiable receipt."],
            ["02", "Rewards", "Participation points and fan benefits."],
            ["03", "Organizer tools", "Pageant setup, moderation and result publishing."],
          ].map(([number, title, copy]) => (
            <article className={styles.comingSoonCard} key={number}>
              <span>{number}</span><small>Coming soon</small><h3>{title}</h3><p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.partners} aria-labelledby="partners-title">
        <header className={styles.sectionIntro}><span className={styles.pill}>Ecosystem and integrations</span><h2 id="partners-title">Connected to what <em>moves the crown.</em></h2><p>Technology and pageant communities move together in two continuous streams.</p></header>
        <LogoMarquee labels={["Base", "USDC", "Viem", "Wagmi", "Privy", "GCash"]} />
        <LogoMarquee labels={["Organizers", "Delegates", "Fan communities", "Media", "Sponsors", "Venues"]} reverse />
      </section>

      <section className={styles.roadmap} id="roadmap" aria-labelledby="roadmap-title">
        <header className={styles.sectionIntro}><span className={styles.pill}>CrownFi roadmap</span><h2 id="roadmap-title">Turn the card. <em>See what comes next.</em></h2><p>Hover or focus a card to reveal each delivery milestone.</p></header>
        <div className={styles.roadmapGrid}>{ROADMAP.map((phase) => <article className={styles.roadmapCard} tabIndex={0} key={phase.title}><div><span>{phase.period}</span><small>{phase.status}</small><h3>{phase.title}</h3><em>Hover or focus to flip</em></div><div><h3>{phase.title}</h3><ul>{phase.items.map(item => <li key={item}>{item}</li>)}</ul></div></article>)}</div>
      </section>

      <section className={styles.finale}><span><img src="/brand/crownfi-base-logo.png" alt="CrownFi market crown" /></span><h2>Make your call before the crown falls.</h2><p>Choose a live outcome, confirm with test USDC and follow the market to settlement.</p><Link className={styles.primaryButton} href="/predictions">Create a prediction</Link></section>
    </div>
  );
}

function MarketPreview({ label, question, left, leftPct, right, rightPct }: { label: string; question: string; left: string; leftPct: number | null; right: string; rightPct: number | null }) {
  return <article className={styles.marketCard}><span>{label}</span><h3>{question}</h3><div><p><i>{left}</i><b>{leftPct === null ? "—" : `${leftPct}%`}</b></p><em><i style={{ width: `${leftPct ?? 0}%` }} /></em>{right && <><p><i>{right}</i><b>{rightPct === null ? "—" : `${rightPct}%`}</b></p><em><i style={{ width: `${rightPct ?? 0}%` }} /></em></>}</div></article>;
}

function LogoMarquee({ labels, reverse = false }: { labels: string[]; reverse?: boolean }) {
  const all = [...labels, ...labels];
  return <div className={styles.marquee}><div className={reverse ? styles.marqueeReverse : styles.marqueeTrack}>{all.map((label, i) => <span aria-hidden={i >= labels.length} key={`${label}-${i}`}><b>{label.slice(0, 2).toUpperCase()}</b>{label}</span>)}</div></div>;
}
