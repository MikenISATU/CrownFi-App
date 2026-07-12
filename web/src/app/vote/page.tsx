"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  ShieldCheck,
  Vote as VoteIcon,
  Wallet,
} from "lucide-react";
import { useSession } from "@/session/SessionProvider";
import { Toast } from "@/components/ui";
import { getJson, postJson } from "@/lib/api";
import { flag, short } from "@/lib/format";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardContent,
  ConfirmModal,
  EmptyState,
  OrnatePortrait,
  PageSection,
  SectionHeader,
  StatusBadge,
} from "@/components/ui-kit";

type Round = { id: string; title: string; status: string };
type Contestant = {
  id: string;
  name: string;
  country: string;
  sash: string;
  portraitUrl?: string;
};

const getPortraitPath = (
  sash: string,
  category: "preliminary" | "gown" | "swimsuit" = "gown",
) => {
  const sashLower = sash.toLowerCase();

  if (category === "swimsuit") {
    if (sashLower === "vn") return "/assets/candidates/vn_swimsuit.jpg";
    if (sashLower === "th") return "/assets/candidates/th_swimsuit.jpg";
    if (sashLower === "kr") return "/assets/candidates/kr_swimsuit.jpg";
    if (sashLower === "sg") return "/assets/candidates/sg_swimsuit.jpg";
    if (sashLower === "ph") return "/assets/candidates/ph_swimsuit_new.jpg";
    if (sashLower === "my") return "/assets/candidates/my_swimsuit.jpg";
    if (sashLower === "jp") return "/assets/candidates/jp_swimsuit_new.jpg";
    if (sashLower === "id") return "/assets/candidates/id_swimsuit.jpg";
    if (sashLower === "in") return "/assets/candidates/in_swimsuit.jpg";
    if (sashLower === "cn") return "/assets/candidates/cn_swimsuit_new.jpg";
    if (sashLower === "sg") return "/assets/candidates/sg_swimsuit_boat.jpg";
  }

  if (category === "gown") {
    if (sashLower === "vn") return "/assets/candidates/vn_gown.jpg";
    if (sashLower === "th") return "/assets/candidates/th_gown.jpg";
    if (sashLower === "kr") return "/assets/candidates/kr_gown.jpg";
    if (sashLower === "sg") return "/assets/candidates/sg_gown.jpg";
    if (sashLower === "ph") return "/assets/candidates/ph_gown_new.jpg";
    if (sashLower === "my") return "/assets/candidates/my_gown.jpg";
    if (sashLower === "jp") return "/assets/candidates/jp_gown_new.jpg";
    if (sashLower === "id") return "/assets/candidates/id_gown.jpg";
    if (sashLower === "in") return "/assets/candidates/in_gown.jpg";
    if (sashLower === "cn") return "/assets/candidates/cn_gown_new.jpg";
    if (sashLower === "sg") return "/assets/candidates/sg_gown_purple.jpg";
    if (sashLower === "kr") return "/assets/candidates/kr_gown_pink.jpg";
  }

  const map: Record<string, string> = {
    ph: "/assets/candidates/candidate_philippines_portrait_silver-gown.webp",
    jp: "/assets/candidates/candidate_japan_portrait_yellow-gown.webp",
    vn: "/assets/candidates/candidate_vietnam_portrait_silver-gown.webp",
    cn: "/assets/candidates/candidate_china_portrait_yellow-gown_outdoor.webp",
    sg: "/assets/candidates/candidate_singapore_portrait_silver-gown.webp",
    kr: "/assets/candidates/candidate_south-korea_portrait_yellow-gown.webp",
    th: "/assets/candidates/candidate_thailand_portrait_silver-gown_profile.webp",
    id: "/assets/candidates/candidate_indonesia_portrait_gold-gown.webp",
    in: "/assets/candidates/candidate_india_portrait_gold-gown_stage.webp",
    my: "/assets/candidates/candidate_malaysia_portrait_gold-gown.webp",
  };
  return map[sashLower] || `/portraits/${sashLower}.webp`;
};

function VotePageContent() {
  const { fan, address, ready, connecting, connect } = useSession();
  const searchParams = useSearchParams();
  const initialCandidate = searchParams.get("candidate") || "";
  const [contestants, setContestants] = useState<Contestant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [round, setRound] = useState<Round | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [specialtyCategory, setSpecialtyCategory] = useState<
    "swimsuit" | "gown" | "preliminary"
  >("swimsuit");
  const [picked, setPicked] = useState<string>("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [voteId, setVoteId] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; tone: "ok" | "err" }>({
    msg: "",
    tone: "ok",
  });

  useEffect(() => {
    Promise.all([
      getJson<Contestant[]>("/api/contestants", []).then((items) => {
        setContestants(items);
        if (
          initialCandidate &&
          items.some((contestant) => contestant.id === initialCandidate)
        ) {
          setPicked(initialCandidate);
          setConfirming(true);
        }
      }),
      getJson<Round[]>("/api/rounds", []).then((items) => {
        setRounds(items);
        setRound(
          items.find(
            (item) =>
              item.status === "open" &&
              item.title.toLowerCase().includes("preliminary"),
          ) ??
            items.find((item) => item.status === "open") ??
            items[0] ??
            null,
        );
      }),
    ]).finally(() => setLoading(false));
  }, [initialCandidate]);

  function flash(msg: string, tone: "ok" | "err") {
    setToast({ msg, tone });
    setTimeout(() => setToast({ msg: "", tone }), 3000);
  }

  function chooseCandidate(id: string) {
    setPicked(id);
    setVoteId("");
    const defaultRound =
      rounds.find(
        (r) =>
          r.status === "open" && r.title.toLowerCase().includes("preliminary"),
      ) ||
      rounds.find((r) => r.status === "open") ||
      rounds[0] ||
      null;
    setRound(defaultRound);
    setConfirming(true);
  }

  function chooseSpecialtyCandidate(
    candidateId: string,
    category: "swimsuit" | "gown" | "preliminary",
  ) {
    setPicked(candidateId);
    setVoteId("");
    const targetRound =
      rounds.find(
        (r) => r.status === "open" && r.title.toLowerCase().includes(category),
      ) ||
      rounds.find((r) => r.status === "open") ||
      rounds[0] ||
      null;
    setRound(targetRound);
    setConfirming(true);
  }

  async function cast() {
    if (!fan || !round || !picked) return;
    setBusy(true);
    try {
      const { ok, data } = await postJson<{ error?: string; voteId?: string }>(
        "/api/vote",
        {
          roundId: round.id,
          fanId: fan.id,
          contestantId: picked,
        },
      );
      const payload = data as { error?: string; voteId?: string };
      const error = payload.error;
      if (ok) {
        setVoteId(payload.voteId ?? "recorded");
        setConfirming(false);
        flash("Vote recorded. You can verify it after the round closes.", "ok");
      } else if (error === "duplicate_vote" || error === "quota_reached") {
        flash("This wallet has already used its vote for the round.", "err");
      } else if (error === "round_closed") {
        flash("Voting closed before this vote could be submitted.", "err");
      } else if (error === "db_unavailable") {
        flash("The database is not configured yet. Follow SUPABASE.md.", "err");
      } else {
        flash(`Could not record the vote${error ? `: ${error}` : "."}`, "err");
      }
    } finally {
      setBusy(false);
    }
  }

  const pickedContestant = contestants.find(
    (contestant) => contestant.id === picked,
  );
  const votingOpen = round?.status === "open";

  const filteredContestants = contestants.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PageSection className="max-w-6xl space-y-8 px-0 py-0">
      <div className="flex flex-col gap-4 border-b border-gold/15 pb-6 md:flex-row md:items-end md:justify-between">
        <SectionHeader
          eyebrow="Cast your vote"
          title="Choose the next Queen on-chain"
          description="Compare every contestant in one view. Your vote is recorded off-chain for speed and included in a Stellar-anchored checkpoint after the round closes."
          className="mb-0"
        />
        <div className="flex flex-wrap items-center gap-2">
          {round ? (
            <>
              <Badge tone="gold">{round.title}</Badge>
              <StatusBadge status={round.status as "open" | "closed"} />
            </>
          ) : (
            <Badge tone="neutral">No voting round</Badge>
          )}
          <Badge tone="info">Off-chain intake</Badge>
        </div>
      </div>

      {ready && !fan && (
        <Card className="border-gold/25 bg-gold/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl border border-gold/20 bg-gold/10 text-gold">
                <Wallet size={19} />
              </span>
              <div>
                <h2 className="font-semibold text-white">
                  Connect before choosing your finalist
                </h2>
                <p className="mt-1 text-sm text-gold-soft/45">
                  CrownFi associates one vote receipt with the connected wallet
                  for this round.
                </p>
              </div>
            </div>
            <Button onClick={connect} disabled={connecting}>
              {connecting ? "Connecting…" : "Connect Freighter"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!votingOpen && round && (
        <div className="rounded-2xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-gold-soft/60">
          Voting is closed for{" "}
          <strong className="text-gold-soft">{round.title}</strong>. Receipts
          can now be checked from the verification page after its checkpoint is
          available.
        </div>
      )}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="aspect-[3/5] animate-pulse rounded-2xl border border-line bg-white/5"
            />
          ))}
        </div>
      ) : contestants.length === 0 ? (
        <EmptyState
          title="No contestants are available"
          description="An administrator must add contestants before voting can begin."
        />
      ) : (
        <div className="space-y-16">
          {/* Search Input */}
          <div className="relative max-w-md w-full mx-auto md:mx-0">
            <input
              type="text"
              placeholder="Search by name or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-gold/25 bg-black/50 px-5 py-2.5 pl-11 text-sm text-white placeholder-gold-soft/50 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-all"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-soft/50">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
          </div>

          <section aria-labelledby="candidate-grid-heading">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2
                id="candidate-grid-heading"
                className="font-display text-2xl font-semibold text-white"
              >
                All contestants
              </h2>
              <span className="text-sm text-gold-soft/40">
                {filteredContestants.length} {filteredContestants.length === 1 ? "candidate" : "candidates"}
              </span>
            </div>
            {filteredContestants.length === 0 ? (
              <div className="text-center py-12 text-gold-soft/50 border border-dashed border-gold/20 rounded-xl bg-gold/5">
                No contestants found matching "{searchQuery}"
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredContestants.map((contestant) => (
                <OrnatePortrait
                  key={contestant.id}
                  id={contestant.id}
                  name={contestant.name}
                  country={contestant.country}
                  sash={contestant.sash}
                  imageUrl={getPortraitPath(contestant.sash, "preliminary")}
                  onVote={() => chooseCandidate(contestant.id)}
                  className={
                    picked === contestant.id &&
                    (!round ||
                      round.title.toLowerCase().includes("preliminary"))
                      ? "ring-2 ring-gold shadow-[0_0_25px_rgba(212,175,55,0.28)]"
                      : ""
                  }
                />
              ))}
              </div>
            )}
          </section>

          {/* New Section: Outfits Showcase & Specialty Voting */}
          <section className="space-y-6 border-t border-gold/15 pt-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <SectionHeader
                title="Specialty Outfits Voting"
                description="View contestants in their segment outfits and cast your vote for the specialty rounds."
                className="mb-0"
              />
              {/* Category tabs */}
              <div className="flex justify-center gap-6 border-b border-gold/10 pb-1">
                <button
                  onClick={() => {
                    setSpecialtyCategory("swimsuit");
                    setVoteId("");
                  }}
                  className="relative pb-2 text-xs font-semibold tracking-widest uppercase transition-all duration-300 focus:outline-none"
                >
                  <span
                    className={
                      specialtyCategory === "swimsuit"
                        ? "text-gold"
                        : "text-gold-soft/40 hover:text-gold-soft/75"
                    }
                  >
                    Swimsuit Segment
                  </span>
                  {specialtyCategory === "swimsuit" && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setSpecialtyCategory("gown");
                    setVoteId("");
                  }}
                  className="relative pb-2 text-xs font-semibold tracking-widest uppercase transition-all duration-300 focus:outline-none"
                >
                  <span
                    className={
                      specialtyCategory === "gown"
                        ? "text-gold"
                        : "text-gold-soft/40 hover:text-gold-soft/75"
                    }
                  >
                    Evening Gown Segment
                  </span>
                  {specialtyCategory === "gown" && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                  )}
                </button>
              </div>
            </div>

            {/* Grid of candidates for the specialty segment */}
            {filteredContestants.length === 0 ? (
              <div className="text-center py-12 text-gold-soft/50 border border-dashed border-gold/20 rounded-xl bg-gold/5">
                No contestants found matching "{searchQuery}"
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredContestants.map((contestant) => (
                <OrnatePortrait
                  key={contestant.id + "-" + specialtyCategory}
                  id={contestant.id}
                  name={contestant.name}
                  country={contestant.country}
                  sash={contestant.sash}
                  imageUrl={getPortraitPath(contestant.sash, specialtyCategory)}
                  onVote={() =>
                    chooseSpecialtyCandidate(contestant.id, specialtyCategory)
                  }
                  className={
                    picked === contestant.id &&
                    round?.title.toLowerCase().includes(specialtyCategory)
                      ? "ring-2 ring-gold shadow-[0_0_25px_rgba(212,175,55,0.28)]"
                      : ""
                  }
                />
              ))}
              </div>
            )}
          </section>
        </div>
      )}

      {voteId && pickedContestant && (
        <Card className="border-emerald/30 bg-emerald/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald/15 text-emerald">
                <CheckCircle2 size={23} />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold text-white">
                  Vote recorded for {pickedContestant.name}
                </h2>
                <p className="mt-1 text-sm text-gold-soft/50">
                  Receipt {short(voteId, 8)} becomes independently verifiable
                  after the round closes and its checkpoint is published.
                </p>
              </div>
            </div>
            <ButtonLink href="/verify" variant="secondary">
              <ShieldCheck size={17} /> Open verification
            </ButtonLink>
          </CardContent>
        </Card>
      )}

      <ConfirmModal
        open={confirming && Boolean(pickedContestant)}
        onClose={() => setConfirming(false)}
        onConfirm={cast}
        title="Confirm your vote"
        description="Review the selected contestant and round before the vote is submitted."
        confirmLabel={
          pickedContestant ? `Vote for ${pickedContestant.name}` : "Cast vote"
        }
        pendingLabel="Recording vote…"
        pending={busy}
      >
        {pickedContestant && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-gold/25 bg-black/30">
                <img
                  src={getPortraitPath(
                    pickedContestant.sash,
                    round?.title.toLowerCase().includes("swimsuit")
                      ? "swimsuit"
                      : "gown",
                  )}
                  alt={pickedContestant.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center">
                <Badge tone="gold" className="w-fit">
                  {flag(pickedContestant.sash)} {pickedContestant.country}
                </Badge>
                <h3 className="mt-3 font-display text-3xl font-semibold text-white">
                  {pickedContestant.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-gold-soft/50">
                  This selection cannot be changed after the vote is accepted
                  for the current round.
                </p>
              </div>
            </div>
            <dl className="space-y-2 rounded-2xl border border-line bg-black/25 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gold-soft/40">Voting round</dt>
                <dd className="font-semibold text-gold-soft">
                  {round?.title ?? "Unavailable"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gold-soft/40">Wallet</dt>
                <dd className="mono text-xs text-gold-soft">
                  {address ? short(address, 8) : "Not connected"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gold-soft/40">Blockchain step</dt>
                <dd className="text-right text-gold-soft">
                  Final checkpoint after closure
                </dd>
              </div>
            </dl>
            {!fan && (
              <p className="rounded-2xl border border-ruby/30 bg-ruby/10 px-4 py-3 text-sm text-ruby">
                Connect Freighter before confirming this vote.
              </p>
            )}
            {!votingOpen && (
              <p className="rounded-2xl border border-ruby/30 bg-ruby/10 px-4 py-3 text-sm text-ruby">
                This round is not open for voting.
              </p>
            )}
          </div>
        )}
      </ConfirmModal>

      <Toast msg={toast.msg} tone={toast.tone} />
    </PageSection>
  );
}

export default function VotePage() {
  return (
    <Suspense
      fallback={
        <PageSection className="py-12 text-center text-sm text-gold-soft/50">
          Loading voting experience…
        </PageSection>
      }
    >
      <VotePageContent />
    </Suspense>
  );
}
