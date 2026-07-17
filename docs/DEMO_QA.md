# CrownFi — Q&A Prep

Likely questions and our best answers, for demos, judging panels, and investor conversations.
Grouped by theme. Answers are honest about MVP boundaries — confidence comes from knowing the
limits, not hiding them.

---

## The pitch

**Q: What is CrownFi in one sentence?**
A: CrownFi is a pageant platform where voting, tickets, collectibles and prediction markets all
run on one system, with every result anchored on the Stellar blockchain so nobody — including us —
can quietly change a tally.

**Q: What problem does this actually solve?**
A: Pageant voting is a trust problem. Fans pay to vote through SMS or social media likes, results
are announced from a black box, and disputes are settled by press release. We make the count
verifiable: every closed round is sealed into a Merkle root on Stellar, and any fan can check that
their vote is inside the official count.

**Q: Who is the customer?**
A: Two sides. Fans, who vote, buy tickets and collect. And pageant organizers, who get a
turnkey platform — they register the event, upload candidates, and get voting, ticketing, NFTs
and engagement tools without building anything.

**Q: Why pageants? Isn't that niche?**
A: In the Philippines, pageants are national sport — Miss Universe viewing parties fill arenas.
The engagement model (paid fan voting, fan clubs, merchandise) already exists and already moves
money; it just runs on untrustworthy rails. We start where the passion and the payment behavior
already exist, and the same rails generalize to any fan-vote event: talent shows, esports MVPs,
music awards.

---

## Voting and trust

**Q: How does voting work?**
A: One vote per wallet per round, per stage — Swimsuit, Long Gown, Q&A and Overall are separate
rounds with separate tallies. Vote intake is off-chain, so it's instant and free for the fan. When
a round closes, we compute a Merkle tree of every vote, and anchor the root on Stellar through our
audit-anchor contract. After that, the tally can't be edited without the chain exposing it.

**Q: If intake is off-chain, can't you rig the votes before anchoring?**
A: Before the anchor, you have to trust us like you'd trust any tabulator — that's honest. What
changes after anchoring is that the result becomes tamper-evident forever: every fan gets a
cryptographic receipt, and if we dropped or altered votes, receipts stop verifying and the fraud
is provable. We moved the trust problem from "forever" to "the minutes before close," and full
on-chain intake is the roadmap for high-stakes rounds.

**Q: What stops one person from voting with 100 wallets?**
A: Layers, not magic. One vote per wallet per round, wallet signature required to create a
session, per-IP rate limits, and an accounts-per-IP cap. A determined attacker with many funded
wallets can still buy influence — the same is true of paid SMS voting, which is the incumbent. For
production we'd add cost-per-vote or KYC tiers for the final rounds; the scaffolding for KYC
providers is already in the codebase.

**Q: What is the receipt a fan gets?**
A: A Merkle inclusion proof: their vote hash plus the sibling hashes up to the root that's
anchored on Stellar. The Verify tab checks it in the browser. No identity is exposed — the proof
shows *a* vote is in the count, tied to their wallet, without publishing who voted for whom.

---

## Blockchain choices

**Q: Why blockchain at all? A database would be cheaper.**
A: A database is what pageants already have, and it's why nobody believes close results. We use
the database for what it's good at — speed, quotas, fast UX — and the chain for the one thing a
database can't do: prove after the fact that nobody edited the record. Hybrid on purpose.

**Q: Why Stellar and not Ethereum or Solana?**
A: Three reasons. Fees: anchoring and payments cost fractions of a cent, which matters when the
product is thousands of small fan transactions. Speed: ~5-second finality is live-show compatible.
And the Philippines angle: Stellar has the strongest remittance/anchor ecosystem here, which is
the realistic bridge to GCash and peso settlement. Soroban gave us proper smart contracts (Rust)
for the escrowed products — markets, splits, NFTs.

**Q: How many smart contracts do you have?**
A: Seven, all deployed and live on testnet: audit-anchor (tally roots), ticket, collectible,
sale-splitter (on-chain payment splitting), test-USDC (demo token), pageant-nft (candidate NFTs),
and prediction-market. All source is in the repo with tests.

**Q: What happens if Stellar goes down mid-event?**
A: Voting keeps working — intake is off-chain, so fans notice nothing. Anchoring and purchases
queue until the network returns. Stellar's ledger has closed every ~5 seconds for years; but the
architecture means chain downtime degrades us to "normal pageant platform" rather than "outage."

---

## Prediction markets

**Q: How do the prediction markets work?**
A: Pool-based, like Polymarket. A market has outcomes; fans stake test USDC on one; the pool's
distribution *is* the live odds. When the pageant resolves the market, winners split the losers'
pool pro-rata. Stake, unstake (before close), resolve and claim are all on-chain contract calls
the user signs in their own wallet — we never hold funds.

**Q: What does the platform earn from markets?**
A: 2% of winnings only, sent to a treasury wallet by the contract at claim time. Nothing on
stakes, nothing from losers — you only pay a fee on money you won. It's visible in the contract
source.

**Q: Isn't this gambling? Is it legal?**
A: Today it runs exclusively on testnet with valueless demo USDC — it's a mechanics demo, not a
money product. Real-money prediction markets are regulated in most jurisdictions including the
Philippines (PAGCOR), and we would not ship mainnet markets without licensing or a licensed
partner. The honest answer is: the tech is ready, the legal wrapper is a business decision we
haven't made yet.

**Q: Who decides the winning outcome? Can the resolver cheat?**
A: The market's resolver — the pageant admin — picks the winning outcome, and that's a trust
point we're explicit about. Pageant outcomes are public, televised facts, which makes oracle
fraud loud and reputationally suicidal. For production we'd add a dispute window before claims
open.

---

## NFTs, tickets, payments

**Q: What are the NFTs, really?**
A: One official portrait per candidate, metadata and art on IPFS via Pinata, minted on our
pageant-nft contract. One mint per wallet at 50 USDC, and the payment splits on-chain so the
candidate's share pays out instantly at purchase — supporting a contestant is a transaction, not
a promise. Buyers sign only the payment; minting is admin-signed so users can't mint around the
rules.

**Q: How do tickets work?**
A: Four tiers (Silver 50 to Diamond 200 USDC), each registered as a listing on the sale-splitter
contract. Buying is two signatures server-prepared, buyer-signed: the USDC payment settles
on-chain, then the ticket mints to the buyer's wallet with tier and seat. The voucher prints with
a QR that our check-in scanner verifies and marks redeemed — a ticket can't be photocopied into
two entries.

**Q: Nobody's grandmother has a crypto wallet. How do normal fans use this?**
A: Two doors. Freighter for crypto users. And Privy for everyone else — sign in with Google or
email, and a wallet is created invisibly behind the account; no seed phrase, no XLM, no crypto
vocabulary. Payments today are test USDC from a faucet; the production path is GCash via PayMongo,
which is already scaffolded in the codebase and activates with API keys.

**Q: Is any real money involved right now?**
A: No. Everything runs on Stellar testnet with a faucet-minted demo token. That's deliberate: it
lets judges and organizers exercise every flow — vote, bet, mint, buy — with zero financial or
legal exposure while the mechanics are validated.

---

## Business

**Q: How does CrownFi make money?**
A: Transaction-side: the platform share of ticket and collectible sales (the sale-splitter makes
the split programmable per listing) and the 2% fee on market winnings. Platform-side: the
organizer relationship — pageants pay for the rails the way they pay ticketing providers today.
The GMV already flows in this industry; we're repricing where it flows.

**Q: What's the moat? Anyone can fork this.**
A: The code is the least defensible part, agreed. The moat is the two-sided position: verified
organizer relationships and fan wallets that carry loyalty points, collectibles and voting history
across events. The first platform that pageant fans already have wallets on wins the next pageant
by default.

**Q: What does traction look like so far?**
A: A complete, deployed, working product: seven live contracts, end-to-end flows verified on
testnet, deployed on Vercel with a production database. The next milestone is a pilot with a
real regional pageant running a live round on the platform.

---

## Technical / security

**Q: What's the stack?**
A: Next.js 15 + React 19 with API routes as the backend, Prisma on Supabase Postgres, Soroban
contracts in Rust, Freighter and Privy for auth, deployed on Vercel with functions colocated with
the database in Tokyo. Client- and server-side caching keep navigation fast.

**Q: How is the admin panel secured?**
A: Defense in layers: a server-side wallet allowlist, and every sensitive admin action requires a
fresh challenge signed by the admin's wallet (SEP-53 style), verified server-side into an httpOnly
session cookie. Knowing the admin's address gets you nothing without the key. Fan sessions work
the same way — identity is proven by signature, never asserted.

**Q: Where are the private keys?**
A: Users' keys never leave their wallets — every payment and stake is signed client-side in
Freighter or Privy. The platform key (which signs anchors and admin mints) lives server-side as an
environment variable, never in the repo; secrets are gitignored and we verified none are in git
history.

**Q: What breaks first at scale?**
A: The database, not the chain — and that's the right failure mode, because Postgres scaling is a
solved problem (read replicas, more pooling). Vote intake is a single indexed insert with a unique
constraint; anchoring batches the whole round into one transaction regardless of vote count. The
chain sees one transaction per round close, not per vote.

**Q: What are the known limitations? (Answer honestly.)**
A: Four we'd name before anyone else does: pre-anchor intake requires trusting the operator;
market resolution is centralized to the admin; sybil resistance is rate-limiting, not identity;
and everything is testnet — no real-money licensing yet. Each has a designed next step: on-chain
intake for finals, a dispute window, KYC tiers, and a licensed payments partner respectively.

---

## Demo-day quick facts

| Fact | Value |
|---|---|
| Contracts deployed | 7 (all live on Stellar testnet) |
| Market fee | 2% of winnings only |
| NFT price / rule | 50 USDC · one mint per wallet |
| Ticket tiers | Silver 50 / Gold 100 / Platinum 150 / Diamond 200 USDC |
| Vote rule | 1 vote per wallet, per round, per stage |
| Finality | ~5s (Stellar) |
| Logins | Freighter wallet, or Google/email via Privy |
| Real money | None — testnet + faucet USDC only |
