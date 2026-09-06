"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type QA = { q: string; a: string };
type Group = { title: string; items: QA[]; id?: string };

const GROUPS: Group[] = [
  {
    title: "Wallet & sign-in",
    items: [
      { q: "How do I sign in?", a: "There are no passwords. Choose Base Account, Coinbase Wallet, or MetaMask, connect on Base, and sign the one-time message. CrownFi never sees your private key." },
      { q: "Which wallet and network do I need?", a: "Use Base Account, Coinbase Wallet, or MetaMask on Base Sepolia during testing. CrownFi will ask your wallet to switch if it is on another network." },
      { q: "I don’t have MetaMask — what now?", a: "Choose Base Account for a smart-wallet experience, or use Coinbase Wallet from the same wallet menu." },
      { q: "What if I switch or lock my wallet?", a: "If you switch Base accounts, CrownFi asks you to sign in as the new wallet. Locking the wallet does not expose its private key to CrownFi." },
    ],
  },
  {
    title: "Voting & leaderboard",
    items: [
      { q: "How does voting work?", a: "Votes are taken off-chain for speed and privacy. You can vote once per round; duplicate votes are blocked at the database level. Vote totals update live on the vote page and the leaderboard." },
      { q: "Is my vote really counted?", a: "When a round closes, votes are sealed into a Merkle root for anchoring on Base. The Verify page provides a cryptographic receipt proving inclusion without exposing unnecessary identity data." },
      { q: "Does buying tickets or collectibles give me more votes?", a: "No. Support and purchases never increase voting power. Voting stays capped and fair." },
    ],
  },
  {
    title: "Tickets & seats",
    items: [
      { q: "How do I buy a ticket?", a: "Ticketing is coming soon. When released, you will approve the USDC payment from your connected Base wallet and then choose a seat." },
      { q: "How does seat selection work?", a: "Each ticket unlocks its tier’s zone in the seat map. Taken seats are greyed out, and no two tickets can hold the same seat." },
      { q: "How do I get into the event?", a: "Your ticket has a printable voucher with a QR code. At the door it’s scanned once and marked redeemed — it can’t be reused." },
    ],
  },
  {
    title: "NFTs & minting",
    items: [
      { q: "What are candidate collectibles?", a: "Official contestant portrait NFTs. Open a candidate’s page to see price, supply, and how many are minted, then mint directly there." },
      { q: "Where does my payment go?", a: "In live mode the USDC is split on-chain — the contestant receives her cut instantly and a small platform fee is taken. In demo mode it’s simulated." },
      { q: "Can I mint the same collectible twice?", a: "No — one of each collectible per fan, so points and ownership stay fair." },
    ],
  },
  {
    title: "Loyalty points & rewards",
    items: [
      { q: "How do I earn points?", a: "You earn points by voting, collecting NFTs, and completing social tasks (follow, join Discord, share). Your balance and full history live on the Rewards page." },
      { q: "How do I redeem rewards?", a: "Spend points in the loyalty shop. Redeeming validates your balance and any limited stock, then issues you a voucher code." },
    ],
  },
  {
    title: "Transactions & security",
    items: [
      { q: "Is this real money?", a: "No. CrownFi currently targets Base Sepolia with test assets. It’s a demo — don’t use it for real-money voting or ticketing." },
      { q: "How is my identity protected?", a: "Actions are tied to a wallet-signed session, so no one can vote or act on your behalf. Voter identity is never written on-chain." },
    ],
  },
];

function Item({ qa }: { qa: QA }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-gold">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-display text-base font-semibold text-[#23252f]">{qa.q}</span>
        <ChevronDown size={18} className={`shrink-0 text-[#a97f16] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-[#eee6d3] px-5 py-4 text-sm leading-relaxed text-[#5f6172]">{qa.a}</div>}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="space-y-10">
      <header>
        <div className="eyebrow mb-2">Help center</div>
        <h1 className="tracking-tight text-4xl font-semibold text-[#23252f] sm:text-5xl">Frequently asked questions</h1>
        <p className="mt-2 max-w-xl text-sm text-[#5f6172]">Everything about wallets, voting, tickets, NFTs, and rewards. Still stuck? Reach us on Discord.</p>
      </header>

      {GROUPS.map((g) => (
        <section key={g.title}>
          <h2 className="mb-3 tracking-tight text-2xl font-semibold text-[#23252f]">{g.title}</h2>
          <div className="space-y-3">
            {g.items.map((qa) => <Item key={qa.q} qa={qa} />)}
          </div>
        </section>
      ))}

      <section id="legal" className="glass p-6">
        <h2 className="tracking-tight text-xl font-semibold text-[#23252f]">Terms & privacy</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5f6172]">
          CrownFi is a hackathon/testnet demonstration. It is not production voting infrastructure, not a mainnet financial
          application, and not a replacement for legal tabulation or compliance systems. Test assets and demo data are
          disposable. Do not submit sensitive personal information. By using CrownFi you accept that current on-chain testing occurs
          on Base Sepolia with no real-world value.
        </p>
        <div className="mt-4">
          <Link href="/" className="btn-ghost">Back to home</Link>
        </div>
      </section>
    </div>
  );
}
