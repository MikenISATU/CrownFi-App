"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Flag } from "@/components/Flag";
import type { MarketView } from "@/components/MarketCard";
import { getJson } from "@/lib/api";
import styles from "./home.module.css";

const ROADMAP = [
  { period: "Now", status: "Testnet", title: "Prediction markets", items: ["Base Sepolia settlement", "Official test USDC", "Privy and EVM wallets", "Live crowd odds"] },
  { period: "Phase 02", status: "Next", title: "Market hardening", items: ["Independent contract audit", "Indexed odds history", "Result-source policy", "Sponsored transactions"] },
  { period: "Phase 03", status: "Planned", title: "Live pageants", items: ["Partner pilot event", "Market moderation", "Official result feeds", "Mobile experience"] },
  { period: "Phase 04", status: "Planned", title: "Mainnet stage", items: ["Base mainnet contracts", "Production liquidity", "Risk and dispute controls", "Ecosystem launch"] },
];

const NATIONS_ROW_ONE = [
  { name: "Philippines", sash: "PH" },
  { name: "Thailand", sash: "TH" },
  { name: "Indonesia", sash: "ID" },
  { name: "Vietnam", sash: "VN" },
  { name: "Japan", sash: "JP" },
  { name: "United States", sash: "US" },
  { name: "Mexico", sash: "MX" },
  { name: "Brazil", sash: "BR" },
  { name: "Colombia", sash: "CO" },
  { name: "Venezuela", sash: "VE" },
];

const NATIONS_ROW_TWO = [
  { name: "India", sash: "IN" },
  { name: "South Africa", sash: "ZA" },
  { name: "Nigeria", sash: "NG" },
  { name: "France", sash: "FR" },
  { name: "Spain", sash: "ES" },
  { name: "Italy", sash: "IT" },
  { name: "Australia", sash: "AU" },
  { name: "Canada", sash: "CA" },
  { name: "Dominican Republic", sash: "DO" },
  { name: "Puerto Rico", sash: "PR" },
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
  const [markets, setMarkets] = useState<MarketView[]>([]);

  useEffect(() => {
    getJson<MarketView[]>("/api/markets", [], { ttl: 30_000 }).then(setMarkets);
  }, []);

  const onchainMarkets = useMemo(() => markets.filter((market) => market.onchain), [markets]);
  const marketCards = useMemo(() => onchainMarkets.slice(0, 4).map(marketPreview), [onchainMarkets]);
  return (
    <div className={styles.home}>
      <section className={styles.hero} id="experience">
        <div className={styles.heroCopy}>
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
        <header className={styles.sectionIntro}><span className={styles.pill}>Participating nations</span><h2 id="partners-title">Global nations. <em>One crown.</em></h2><p>A global field moves together toward one transparent market.</p></header>
        <FlagMarquee nations={NATIONS_ROW_ONE} />
        <FlagMarquee nations={NATIONS_ROW_TWO} reverse />
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

function FlagMarquee({ nations, reverse = false }: { nations: { name: string; sash: string }[]; reverse?: boolean }) {
  const all = [...nations, ...nations];
  return <div className={styles.marquee}><div className={reverse ? styles.marqueeReverse : styles.marqueeTrack}>{all.map((nation, i) => <span aria-hidden={i >= nations.length} key={`${nation.name}-${i}`}><b aria-hidden><Flag sash={nation.sash} className={styles.nationFlag} /></b>{nation.name}</span>)}</div></div>;
}
