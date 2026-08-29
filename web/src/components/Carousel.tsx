"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Eye, Pause, Play } from "lucide-react";
import { Icons } from "./icons";
import { Portrait } from "./Portrait";
import { Flag } from "./Flag";

export type Slide = {
  id: string;
  name: string;
  country: string;
  sash: string;
  portraitUrl?: string | null;
  fallbackUrl?: string | null;
  /** Live standing shown on the focused card (votes, rank, share of the round). */
  meta?: { votes: number; rank: number; pct: number };
  profileHref?: string;
};

type VisibleSlide = { slide: Slide; index: number; offset: number };

// A responsive pageant spotlight: the active delegate stays centered while the nearest
// candidates become clickable previews. It supports keyboard controls, touch swipes,
// reduced motion, and an explicit pause control for automatic rotation.
export function SpotlightCarousel({
  slides,
  onSelect,
  onConfirm,
  selectedId,
  votedId,
  cta = "Pick candidate",
  confirmLabel = "Confirm with wallet",
  confirmDisabled = false,
  selectionDisabled = false,
  ariaLabel = "Candidates",
}: {
  slides: Slide[];
  onSelect?: (id: string) => void;
  onConfirm?: (id: string) => void;
  selectedId?: string;
  /** Locked-in choice (e.g. a vote already cast by this wallet). */
  votedId?: string;
  cta?: string;
  confirmLabel?: string;
  confirmDisabled?: boolean;
  selectionDisabled?: boolean;
  ariaLabel?: string;
}) {
  const [active, setActive] = useState(0);
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const hovered = useRef(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const chosenId = votedId || selectedId;
    if (!chosenId) return;
    const index = slides.findIndex((slide) => slide.id === chosenId);
    if (index >= 0) setActive(index);
    setRotationEnabled(false);
  }, [selectedId, slides, votedId]);

  useEffect(() => {
    if (!slides.length || !rotationEnabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRotationEnabled(false);
      return;
    }
    const timer = window.setInterval(() => {
      if (!hovered.current) setActive((value) => (value + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [rotationEnabled, slides.length]);

  const visibleSlides = useMemo<VisibleSlide[]>(() => {
    if (!slides.length) return [];
    const half = Math.floor(slides.length / 2);
    return slides
      .map((slide, index) => {
        const offset = ((index - active + slides.length + half) % slides.length) - half;
        return { slide, index, offset };
      })
      .filter(({ offset }) => Math.abs(offset) <= 2)
      .sort((a, b) => a.offset - b.offset);
  }, [active, slides]);

  if (!slides.length) {
    return <div className="glass p-8 text-center text-[#7a7768]">No contestants yet.</div>;
  }

  function focus(index: number) {
    setRotationEnabled(false);
    setActive(index);
  }

  function go(direction: number) {
    setRotationEnabled(false);
    setActive((value) => (value + direction + slides.length) % slides.length);
  }

  function pick(id: string) {
    setRotationEnabled(false);
    onSelect?.(id);
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current == null) return;
    const delta = event.changedTouches[0]?.clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) >= 44) go(delta > 0 ? -1 : 1);
  }

  return (
    <div
      className="relative mx-auto max-w-7xl overflow-hidden rounded-[30px] border border-[#e9dfc4] bg-[radial-gradient(circle_at_50%_8%,rgba(244,200,78,0.18),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.95),rgba(250,247,239,0.82))] px-3 py-5 shadow-[0_30px_70px_-52px_rgba(99,72,7,0.55)] sm:px-6 sm:py-7"
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(-1);
        if (event.key === "ArrowRight") go(1);
      }}
      onFocusCapture={(event) => {
        if (!(event.target as HTMLElement).dataset.rotationControl) setRotationEnabled(false);
      }}
      onMouseEnter={() => { hovered.current = true; }}
      onMouseLeave={() => { hovered.current = false; }}
      onTouchStart={(event) => {
        setRotationEnabled(false);
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mb-4 flex items-center justify-between gap-4 sm:mb-1">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a97f16]">Swipe or use the arrows</p>
          <p className="mt-0.5 truncate text-xs text-[#7a7768]">Focus a delegate, then choose one clear action.</p>
        </div>
        <button
          type="button"
          data-rotation-control="true"
          onClick={() => setRotationEnabled((value) => !value)}
          className="btn-ghost shrink-0 !min-h-[36px] !gap-1.5 !rounded-full !px-3 !py-1.5 !text-xs"
          aria-label={rotationEnabled ? "Pause candidate rotation" : "Start candidate rotation"}
        >
          {rotationEnabled ? <Pause size={13} /> : <Play size={13} />}
          <span className="hidden sm:inline">{rotationEnabled ? "Pause" : "Play"}</span>
        </button>
      </div>

      <div
        className="flex min-h-[590px] items-center justify-center gap-2 sm:min-h-[610px] sm:gap-4 lg:gap-5"
        aria-live={rotationEnabled ? "off" : "polite"}
        aria-atomic="false"
      >
        {visibleSlides.map(({ slide, index, offset }) => {
          const distance = Math.abs(offset);
          const isCenter = offset === 0;
          const isSelected = selectedId === slide.id;
          const isVoted = votedId === slide.id;
          const outerPreview = distance === 2;

          if (!isCenter) {
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => focus(index)}
                aria-label={`Focus ${slide.name}, ${index + 1} of ${slides.length}`}
                className={[
                  "group relative shrink-0 overflow-hidden rounded-2xl border bg-white p-1.5 text-left shadow-[0_18px_40px_-30px_rgba(32,27,13,0.5)] transition duration-300",
                  outerPreview ? "hidden w-36 opacity-35 xl:block" : "hidden w-44 opacity-65 sm:block lg:w-52",
                  "border-[#e8e1d0] hover:-translate-y-1 hover:border-[#c9a227] hover:opacity-100 focus-visible:opacity-100",
                ].join(" ")}
                style={{ transform: `translateY(${outerPreview ? 38 : 24}px) scale(${outerPreview ? 0.84 : 0.92})` }}
              >
                <Portrait id={slide.id} name={slide.name} sash={slide.sash} portraitUrl={slide.portraitUrl} fallbackUrl={slide.fallbackUrl} />
                <span className="block px-2 pb-2 pt-3 text-center">
                  <span className="block truncate font-display text-base font-semibold text-[#23252f]">{slide.name}</span>
                  <span className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px] text-[#7a7768]"><Flag sash={slide.sash} /> {slide.country}</span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a97f16] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">View <Icons.Next size={11} /></span>
                </span>
              </button>
            );
          }

          return (
            <article
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${slide.name}, ${index + 1} of ${slides.length}`}
              className={`relative z-10 w-[min(86vw,22rem)] shrink-0 overflow-hidden rounded-[24px] border bg-white p-2 shadow-[0_28px_70px_-34px_rgba(116,83,8,0.55)] transition duration-300 sm:w-[22rem] ${isVoted ? "border-[#0f6e56] ring-2 ring-[#0f6e56]/30" : isSelected ? "border-[#c9a227] ring-4 ring-[#d4af37]/15" : "border-[#e3cf8f]"}`}
            >
              {isVoted && <span className="tag-on absolute right-4 top-4 z-20"><Check size={11} strokeWidth={3} /> Voted</span>}
              {isSelected && !isVoted && <span className="absolute right-4 top-4 z-20 inline-flex items-center gap-1 rounded-full bg-[#11131a] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f4c84e] shadow"><Check size={11} strokeWidth={3} /> Selected</span>}

              <div className="relative">
                <span className="pointer-events-none absolute left-1 top-1 z-10 h-6 w-6 border-l-2 border-t-2 border-[#c8a233]" />
                <span className="pointer-events-none absolute right-1 top-1 z-10 h-6 w-6 border-r-2 border-t-2 border-[#c8a233]" />
                <span className="pointer-events-none absolute bottom-1 left-1 z-10 h-6 w-6 border-b-2 border-l-2 border-[#c8a233]" />
                <span className="pointer-events-none absolute bottom-1 right-1 z-10 h-6 w-6 border-b-2 border-r-2 border-[#c8a233]" />
                <Portrait id={slide.id} name={slide.name} sash={slide.sash} portraitUrl={slide.portraitUrl} fallbackUrl={slide.fallbackUrl} />
              </div>

              <div className="px-2 pb-2 pt-4 text-center sm:px-3">
                <div className="truncate font-display text-xl font-semibold text-[#23252f]">{slide.name}</div>
                <div className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-[#6f6c5f]"><Flag sash={slide.sash} /> {slide.country}</div>

                {slide.meta && (
                  <div className="mx-auto mt-3 max-w-[17rem]">
                    <div className="flex items-center justify-center gap-2 text-[11px] text-[#7a7768]">
                      <span className="rounded-full bg-[#faf0d2] px-2 py-0.5 font-semibold text-[#8a6d1f]">#{slide.meta.rank}</span>
                      <span className="tabular-nums"><b className="text-[#b8912f]">{slide.meta.votes.toLocaleString()}</b> votes · {slide.meta.pct}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#efe9d8]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#b8912f] via-[#f4c84e] to-[#b8912f] transition-all duration-500" style={{ width: `${slide.meta.pct}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {slide.profileHref ? (
                    <Link href={slide.profileHref} className="btn-ghost !min-h-[40px] !px-3 !py-2 !text-xs">
                      <Eye size={14} /> Profile
                    </Link>
                  ) : <span />}
                  <button
                    type="button"
                    className="btn-gold !min-h-[40px] !px-3 !py-2 !text-xs"
                    disabled={isVoted || (!isSelected && selectionDisabled) || (isSelected && confirmDisabled)}
                    aria-pressed={isSelected}
                    onClick={() => {
                      if (isSelected && onConfirm) onConfirm(slide.id);
                      else pick(slide.id);
                    }}
                  >
                    {isVoted ? <><Check size={14} /> Voted</> : !isSelected && selectionDisabled ? <><Icons.Lock size={14} /> Round closed</> : isSelected && onConfirm ? <><Icons.Wallet size={14} /> {confirmLabel}</> : <><Icons.Vote size={14} /> {cta}</>}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-1 flex items-center justify-center gap-3 sm:mt-3">
        <button type="button" onClick={() => go(-1)} className="btn-ghost h-10 w-10 !rounded-full !px-0" aria-label="Previous candidate"><Icons.Prev size={17} strokeWidth={2} /></button>
        <div className="flex items-center gap-1.5" role="group" aria-label="Choose a candidate to display">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => focus(index)}
              aria-label={`Show ${slide.name}`}
              aria-disabled={index === active}
              className={`h-2 rounded-full transition-all ${index === active ? "w-7 bg-[#b8912f]" : "w-2 bg-[#d9d2c1] hover:bg-[#c9a227]"}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => go(1)} className="btn-ghost h-10 w-10 !rounded-full !px-0" aria-label="Next candidate"><Icons.Next size={17} strokeWidth={2} /></button>
      </div>
    </div>
  );
}
