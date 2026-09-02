"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LoopCarousel } from "@/components/LoopCarousel";
import { Flag } from "@/components/Flag";
import { short } from "@/lib/format";
import { getJson } from "@/lib/api";

type Collectible = { id: string; title: string; priceUsdc: number; metadataUri: string; imageUrl?: string | null; tokenId?: string; contestant: { id: string; name: string; country: string; sash: string; portraitUrl?: string | null } };

export default function CollectPage() {
  const [items, setItems] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(true);

  function load() { getJson<Collectible[]>("/api/collectibles", []).then((d) => { setItems(d); setLoading(false); }); }
  useEffect(load, []);

  return (
    <div className="space-y-10">
      {/* The Base contract is deployed, but the owner-authorized purchase/mint service is not released. */}
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="eyebrow mb-2">Collect</div>
          <h1 className="tracking-tight text-4xl font-semibold text-[#23252f]">Collectibles that fund <span className="font-display italic text-[#c8a233]">delegates</span></h1>
          <p className="mt-2 max-w-xl text-sm text-[#5f6172]">
            Preview the five official delegate portraits registered for the Base collection. Public purchases and owner-authorized
            minting remain locked until the collectible checkout is released.
          </p>
        </div>
        <div className="card-gold w-full px-5 py-4 text-sm text-[#5f6172] sm:w-auto sm:max-w-[17rem]">
          <span className="tag-off">Coming soon</span>
          <p className="mt-2">Gallery and profiles are available now. No collectible payment or mint is accepted yet.</p>
        </div>
      </div>

      {/* ── How it works ────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { n: "1", t: "Explore delegates", d: "Review each official portrait and candidate profile." },
          { n: "2", t: "Checkout opens later", d: "USDC payment stays disabled until the Base purchase service is complete." },
          { n: "3", t: "Owner-authorized mint", d: "The deployed contract mints only after CrownFi confirms a valid entitlement." },
        ].map((s) => (
          <div key={s.n} className="card-gold p-5">
            <div className="flex items-center gap-2">
              <span className="num-gold">{s.n}</span>
              <span className="font-display text-base text-[#23252f]">{s.t}</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#5f6172]">{s.d}</p>
          </div>
        ))}
      </section>

      {/* ── The collectibles themselves ─────────────────── */}
      <section>
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="tracking-tight text-2xl font-semibold text-[#23252f]">Collection preview</h2>
          {!loading && items.length > 0 && (
            <span className="text-sm text-[#7a7768]">{items.length} registered design{items.length === 1 ? "" : "s"}</span>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`glass p-3 ${i === 1 ? "w-72 sm:w-80" : "hidden w-56 opacity-60 sm:block"}`}>
                <div className="aspect-square w-full animate-pulse rounded-xl bg-[#efe9d8]" />
                <div className="mx-auto mt-3 h-4 w-32 animate-pulse rounded bg-[#efe9d8]" />
                <div className="mx-auto mt-2 h-3 w-20 animate-pulse rounded bg-[#efe9d8]" />
              </div>
            ))}
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="glass p-10 text-center">
            <div className="font-display text-xl text-[#23252f]">Nothing to collect yet</div>
            <p className="mt-2 text-sm text-[#7a7768]">Collectibles go live once a pageant is approved. Check back shortly.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <LoopCarousel
            items={items}
            ariaLabel="Candidate collectibles"
            render={(c, { center }) => {
              const collected = Boolean(c.tokenId);
              return (
                <div className={`glass overflow-hidden p-3 ${center ? "shadow-spot ring-1 ring-[#e3cf8f]" : ""}`}>
                  {/* The NFT artwork itself — the resolved image from the token's metadata. */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#faf7ef]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.imageUrl ?? c.contestant.portraitUrl ?? ""}
                      alt={c.title}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    {collected && <span className="tag-on absolute left-2 top-2">Minted</span>}
                  </div>

                  <div className="px-1 pb-1 pt-3 text-center">
                    <div className="truncate font-display text-lg font-semibold text-[#23252f]">{c.contestant.name}</div>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-[#6f6c5f]">
                      <Flag sash={c.contestant.sash} /> {c.contestant.country}
                    </div>

                    <div className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#b8912f]">Minting soon on Base</div>

                    {/* Profile button sits under every collectible. */}
                    <div className="mt-3 flex flex-col gap-2">
                      <Link href={`/contestants/${c.contestant.id}`} className="btn-gold w-full">View profile</Link>
                    </div>

                    {c.tokenId && <div className="mono mt-2 text-[11px] text-emerald">NFT {short(c.tokenId, 6)}</div>}
                  </div>
                </div>
              );
            }}
          />
        )}
      </section>

    </div>
  );
}
