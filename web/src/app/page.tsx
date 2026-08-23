"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Slide } from "@/components/Carousel";
import type { MarketView } from "@/components/MarketCard";
import { CountUp } from "@/components/ui";
import { getJson } from "@/lib/api";
import styles from "./home.module.css";

type Stats = { votes: number; collectiblesSold: number; fans: number; predictions: number };

const FALLBACK_CANDIDATES: Slide[] = [
  { id: "philippines", name: "Isabel Reyes", country: "Philippines", sash: "Philippines", portraitUrl: "/candidates/philippines.webp" },
  { id: "thailand", name: "Ratana Somsri", country: "Thailand", sash: "Thailand", portraitUrl: "/candidates/thailand.webp" },
  { id: "vietnam", name: "Linh Nguyen", country: "Vietnam", sash: "Vietnam", portraitUrl: "/candidates/vietnam.webp" },
  { id: "japan", name: "Aiko Mori", country: "Japan", sash: "Japan", portraitUrl: "/candidates/japan.webp" },
  { id: "indonesia", name: "Ayu Pratama", country: "Indonesia", sash: "Indonesia", portraitUrl: "/candidates/indonesia.webp" },
];

const FALLBACK_MARKETS = [
  { label: "Live · Q&A", question: "Who wins the Q&A round?", left: "Delegate A", leftPct: 62, right: "Delegate B", rightPct: 38 },
  { label: "Live · Long gown", question: "Top score in evening wear?", left: "Philippines", leftPct: 54, right: "Thailand", rightPct: 46 },
  { label: "Upcoming · Crown", question: "Who takes the final crown?", left: "Open field", leftPct: 100, right: "", rightPct: 0 },
  { label: "Resolved · Swimsuit", question: "Swimsuit round winner", left: "Resolved onchain", leftPct: 100, right: "", rightPct: 0 },
];

const REWARD_TASKS = [
  ["01", "Cast a verified vote", "Once per active round", "+25"],
  ["02", "Collect a delegate", "Official portrait edition", "+50"],
  ["03", "Join a prediction", "Before the market locks", "+15"],
  ["04", "Verify your receipt", "Confirm the anchored proof", "+10"],
];

const ROADMAP = [
  { period: "Now", status: "Foundation", title: "Base migration", items: ["Base Sepolia integration", "EVM wallet connection", "Contract interface mapping", "Existing data preserved"] },
  { period: "Phase 02", status: "Next", title: "Fan actions", items: ["Receipt-backed voting", "USDC collectibles", "Free-play prediction pools", "Loyalty points and rankings"] },
  { period: "Phase 03", status: "Planned", title: "Live pageants", items: ["Organizer command center", "Candidate review workflow", "Public result settlement", "Partner pilot event"] },
  { period: "Phase 04", status: "Planned", title: "Mainnet stage", items: ["Audited Base contracts", "Production RPC provider", "Sponsored fan transactions", "Base ecosystem launch"] },
];

function marketPreview(market: MarketView, index: number) {
  const sorted = [...market.options].sort((a, b) => b.percent - a.percent);
  const first = sorted[0];
  const second = sorted[1];
  return {
    label: `${market.live ? "Live" : market.status === "resolved" ? "Resolved" : "Upcoming"} · ${market.category}`,
    question: market.question,
    left: first?.label ?? "Open field",
    leftPct: first?.percent ?? 100,
    right: second?.label ?? "",
    rightPct: second?.percent ?? 0,
    key: market.id || String(index),
  };
}

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

  const candidates = useMemo(() => (slides.length ? slides : FALLBACK_CANDIDATES).slice(0, 5), [slides]);
  const marketCards = useMemo(() => markets.length ? markets.slice(0, 4).map(marketPreview) : FALLBACK_MARKETS.map((m, i) => ({ ...m, key: String(i) })), [markets]);
  const tally = [46, 31, 23];

  return (
    <div className={styles.home}>
      <section className={styles.hero} id="experience">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Built for the onchain stage</span>
          <h1>The future wears <em>the crown.</em></h1>
          <p>A transparent pageant platform for voting, collecting and predicting—designed for a new generation of fans.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/vote">Enter CrownFi</Link>
            <Link className={styles.secondaryButton} href="#platform-story">Explore the platform</Link>
          </div>
          <div className={styles.heroChips}><span>Verifiable votes</span><span>Digital collectibles</span><span>Live predictions</span></div>
        </div>

        <div className={styles.crownScene} aria-label="CrownFi crown in a dimensional orbit">
          <div className={styles.crownHalo} />
          <div className={styles.crownOrbit}><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="CrownFi crown" />
          <span className={styles.crownLabel}>Crown protocol active</span>
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
            ["Votes cast", stats?.votes ?? 0],
            ["Predictions made", stats?.predictions ?? 0],
            ["NFTs collected", stats?.collectiblesSold ?? 0],
          ].map(([label, value]) => (
            <div className={styles.stat} key={label}>
              <b><CountUp to={Number(value)} /><span>+</span></b>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.voteSection} id="platform-story" aria-labelledby="vote-title">
        <header className={styles.splitHeading}>
          <div><span className={styles.eyebrow}>Cast your vote</span><h2 id="vote-title">Who wears the <em>crown?</em></h2></div>
          <p>A dimensional voting room with live standings and one clear, receipt-backed action.</p>
        </header>
        <div className={styles.voteRoom}>
          <div className={styles.candidateDeck} aria-label="Featured CrownFi delegates">
            {candidates.slice(0, 3).map((candidate, index) => (
              <Link href={`/contestants/${candidate.id}`} className={styles.candidateCard} key={candidate.id} style={{ "--card-index": index } as React.CSSProperties}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={candidate.portraitUrl || FALLBACK_CANDIDATES[index].portraitUrl || ""} alt={candidate.name} />
                <span>{candidate.country}</span><strong>{candidate.name}</strong>
              </Link>
            ))}
          </div>
          <div className={styles.voteCopy}>
            <span className={styles.liveBadge}><i /> Final round · Voting open</span>
            <h3>One wallet.<br /><em>One verified vote.</em></h3>
            <p>Select a delegate, confirm once and keep a cryptographic receipt proving your vote belongs in the official count.</p>
            <div className={styles.actions}><Link className={styles.primaryButton} href="/vote">Vote now</Link><Link className={styles.secondaryButton} href="/verify">Verify a receipt</Link></div>
            <div className={styles.tally}>
              {candidates.slice(0, 3).map((candidate, index) => <div key={candidate.id}><span>{candidate.name}</span><i><b style={{ width: `${tally[index]}%` }} /></i><strong>{tally[index]}%</strong></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.predictions} aria-labelledby="prediction-title">
        <header className={styles.predictionHead}>
          <span className={styles.eyebrow}>Prediction markets</span>
          <h2 id="prediction-title">Predict the <em>crown.</em></h2>
          <p>Browse freely, connect only when you participate, and follow pageant outcomes through clear pools and moving crowd odds.</p>
        </header>
        <div className={styles.marketConsole}>
          <div className={styles.marketGuide}>
            <div className={styles.guideStats}><span><b>Live</b> markets</span><span><b>USDC</b> pooled</span><span><b>24/7</b> odds</span></div>
            <h3>How it moves</h3><p>Every action stays clear from the first position through final settlement.</p>
            <ol><li>Pick a market</li><li>Choose an outcome</li><li>Watch the odds move</li><li>Claim after resolution</li></ol>
            <Link href="/predictions">Open all markets →</Link>
          </div>
          <div className={styles.marketGrid}>
            {marketCards.map(({ key, ...market }) => <MarketPreview key={key} {...market} />)}
          </div>
        </div>
      </section>

      <section className={styles.platformSuite} aria-labelledby="suite-title">
        <header className={styles.sectionIntro}>
          <span className={styles.pill}>Inside the CrownFi platform</span>
          <h2 id="suite-title">Every CrownFi experience, <em>on one stage.</em></h2>
          <p>The approved dimensional system now powers the real homepage—from collecting and loyalty to future organizer tools and public proof.</p>
        </header>

        <div className={styles.productGrid}>
          <article className={`${styles.productPanel} ${styles.collectPanel}`}>
            <PanelMeta label="Digital collectible vault" route="/contestants" />
            <div className={styles.collectStage}>
              {["/nfts/thailand.webp", "/nfts/philippines.webp", "/nfts/vietnam.webp"].map((src, index) => <img src={src} alt="CrownFi delegate collectible" key={src} style={{ "--nft-index": index } as React.CSSProperties} />)}
            </div>
            <div className={styles.productCopy}><h3>Own the <em>moment.</em></h3><p>Support a delegate through official editions while the collectible remains portable through its onchain ownership record.</p><Link href="/contestants">Explore collectibles →</Link></div>
          </article>

          <article className={`${styles.productPanel} ${styles.loyaltyPanel}`}>
            <PanelMeta label="Fan rewards and ranking" route="/loyalty" />
            <div className={styles.productCopy}><h3>Participation becomes <em>momentum.</em></h3><p>Tasks, points, shop rewards and live standings share one dimensional fan dashboard.</p></div>
            <div className={styles.loyaltyExperience}>
              <div className={styles.pointsStage}><span className={styles.rankLeft}><b>#08</b>Global rank</span><div className={styles.pointsOrb}><b>1,250</b><span>Crown points</span></div><span className={styles.rankRight}><b>+180</b>This week</span></div>
              <div className={styles.rewardBoard}>
                <div className={styles.taskPanel}><h4>Earn points</h4>{REWARD_TASKS.map(([n, title, detail, points]) => <div className={styles.rewardTask} key={n}><i>{n}</i><span><b>{title}</b><small>{detail}</small></span><em>{points}</em></div>)}</div>
                <div className={styles.podiumPanel}><h4>Live standings</h4><div className={styles.podium}><div><b>Fan 02</b><i>2</i></div><div><b>Fan 01</b><i>1</i></div><div><b>Fan 03</b><i>3</i></div></div></div>
              </div>
            </div>
          </article>

          <article className={`${styles.productPanel} ${styles.darkPanel} ${styles.organizerPanel}`}>
            <PanelMeta label="Organizer command center" route="Coming soon" />
            <div className={styles.organizerLayout}>
              <div className={styles.productCopy}><h3>Run the show.<br /><em>Prove every result.</em></h3><p>The organizer command center is being prepared for candidate review, round controls and verified winner publishing.</p><span className={styles.comingSoon}>Coming soon</span></div>
              <div className={styles.dashboardPreview}><div className={styles.dashboardTop}>CrownFi studio / Coronation Night</div><div className={styles.dashboardBody}><aside>Overview<br />Candidates<br />Rounds<br />Results</aside><div><h4>Your pageant</h4><div className={styles.miniMetrics}><span><b>24</b>Candidates</span><span><b>05</b>Rounds</span><span><b>98%</b>Ready</span></div></div></div><strong>Locked preview</strong></div>
            </div>
          </article>

          <article className={`${styles.productPanel} ${styles.darkPanel} ${styles.ticketPanel}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}<img className={styles.ticketBackdrop} src="/stadium/stage.png" alt="" />
            <PanelMeta label="Ticketing and seats" route="Coming soon" />
            <div className={styles.ticketCopy}><span className={styles.lockOrb}>⌁</span><h3>Reserve your <em>seat.</em></h3><p>Verified tickets, digital seating and venue check-in are being prepared for release.</p><span className={styles.comingSoon}>Coming soon</span><div className={styles.seats}>{Array.from({ length: 21 }, (_, i) => <i key={i} style={{ "--seat": i % 7 } as React.CSSProperties} />)}</div></div>
          </article>

          <article className={`${styles.productPanel} ${styles.proofPanel}`}>
            <PanelMeta label="Public receipt verification" route="/verify" />
            <div className={styles.proofCard}><div><span>Vote receipt</span><b>Verified</b></div><dl><dt>Round</dt><dd>long-gown-2026</dd><dt>Wallet</dt><dd>0x9B3...72A1</dd><dt>Candidate</dt><dd>philippines</dd><dt>Leaf index</dt><dd>000014</dd></dl><code>4da3c871b940...e39f2b12c5a9</code></div>
            <div className={styles.productCopy}><h3>Trust the result.<br /><em>Verify the receipt.</em></h3><p>Fast offchain intake becomes an anchored public proof when the official round closes.</p><ol className={styles.proofSteps}><li><b>01</b>Cast the vote and keep the receipt.</li><li><b>02</b>The closed-round tally becomes a Merkle tree.</li><li><b>03</b>The root is anchored publicly.</li><li><b>04</b>Confirm inclusion without exposing unnecessary data.</li></ol><Link href="/verify">Verify a receipt →</Link></div>
          </article>
        </div>
      </section>

      <section className={styles.partners} aria-labelledby="partners-title">
        <header className={styles.sectionIntro}><span className={styles.pill}>Ecosystem and integrations</span><h2 id="partners-title">Connected to what <em>moves the crown.</em></h2><p>Technology and pageant communities move together in two continuous streams.</p></header>
        <LogoMarquee labels={["Base", "USDC", "Viem", "Wagmi", "Privy", "GCash"]} />
        <LogoMarquee labels={["Organizers", "Delegates", "Fan communities", "Media", "Sponsors", "Venues"]} reverse />
      </section>

      <section className={styles.roadmap} aria-labelledby="roadmap-title">
        <header className={styles.sectionIntro}><span className={styles.pill}>CrownFi roadmap</span><h2 id="roadmap-title">Turn the card. <em>See what comes next.</em></h2><p>Hover or focus a card to reveal each delivery milestone.</p></header>
        <div className={styles.roadmapGrid}>{ROADMAP.map((phase) => <article className={styles.roadmapCard} tabIndex={0} key={phase.title}><div><span>{phase.period}</span><small>{phase.status}</small><h3>{phase.title}</h3><em>Hover or focus to flip</em></div><div><h3>{phase.title}</h3><ul>{phase.items.map(item => <li key={item}>{item}</li>)}</ul></div></article>)}</div>
      </section>

      <section className={styles.finale}><span><img src="/brand/logo.png" alt="CrownFi crown" /></span><h2>The crown is more than the finale.</h2><p>It connects every fan, every action and every verifiable result.</p><Link className={styles.primaryButton} href="/vote">Enter CrownFi</Link></section>
    </div>
  );
}

function PanelMeta({ label, route }: { label: string; route: string }) {
  return <div className={styles.panelMeta}><span>{label}</span><b>{route}</b></div>;
}

function MarketPreview({ label, question, left, leftPct, right, rightPct }: { label: string; question: string; left: string; leftPct: number; right: string; rightPct: number }) {
  return <article className={styles.marketCard}><span>{label}</span><h3>{question}</h3><div><p><i>{left}</i><b>{leftPct}%</b></p><em><i style={{ width: `${leftPct}%` }} /></em>{right && <><p><i>{right}</i><b>{rightPct}%</b></p><em><i style={{ width: `${rightPct}%` }} /></em></>}</div></article>;
}

function LogoMarquee({ labels, reverse = false }: { labels: string[]; reverse?: boolean }) {
  const all = [...labels, ...labels];
  return <div className={styles.marquee}><div className={reverse ? styles.marqueeReverse : styles.marqueeTrack}>{all.map((label, i) => <span aria-hidden={i >= labels.length} key={`${label}-${i}`}><b>{label.slice(0, 2).toUpperCase()}</b>{label}</span>)}</div></div>;
}
