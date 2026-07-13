"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/session/SessionProvider";
import { Toast } from "@/components/ui";
import { messageFor } from "@/lib/messages";
import { STATUS_LABEL, STATUS_CHIP, isEditableByOrganizer, canOrganizerSubmit } from "@/lib/pageant";

type Candidate = { id: string; fullName: string; number: number | null; bio: string | null; age: number | null; location: string | null; profileUrl: string | null; nftArtworkUrl: string | null; maxSupply: number; images: { categoryKey: string; url: string }[] };
type Pageant = any;

// NFT collectible artwork is produced by the platform team (Phase 2 → Pinata/IPFS),
// so organizers only upload the competition photos here.
const UPLOAD_KINDS: { key: string; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "swimsuit", label: "Swimsuit" },
  { key: "long_gown", label: "Long Gown" },
];

export default function OrganizerDashboard() {
  const { fan, connect, connecting } = useSession();
  const [mine, setMine] = useState<Pageant[]>([]);
  const [sel, setSel] = useState<Pageant | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState({ msg: "", tone: "ok" as "ok" | "err" });
  const flash = (msg: string, tone: "ok" | "err" = "ok") => { setToast({ msg, tone }); setTimeout(() => setToast({ msg: "", tone: "ok" }), 3200); };

  const loadMine = useCallback(async () => {
    const r = await fetch("/api/pageants?mine=1");
    if (r.ok) setMine(await r.json());
  }, []);
  const loadDetail = useCallback(async (id: string) => {
    const r = await fetch(`/api/pageants/${id}`);
    if (r.ok) setSel(await r.json());
  }, []);

  useEffect(() => { if (fan) loadMine(); }, [fan, loadMine]);

  if (!fan) {
    return (
      <div className="glass mx-auto max-w-md p-8 text-center">
        <div className="eyebrow mb-2">Organizer</div>
        <h1 className="font-display text-2xl text-[#23252f]">Run your pageant on CrownFi</h1>
        <p className="mt-2 text-sm text-[#5f6172]">Connect your wallet to create and manage pageant submissions.</p>
        <button className="btn-gold mt-4" onClick={connect}>{connecting ? "Connecting…" : "Connect wallet"}</button>
      </div>
    );
  }

  // ── Editor view ──
  if (sel) {
    return <PageantEditor pageant={sel} onBack={() => { setSel(null); loadMine(); }} reload={() => loadDetail(sel.id)} flash={flash} />;
  }

  // ── List view ──
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow mb-2">Organizer dashboard</div>
          <h1 className="font-display text-4xl font-semibold text-[#23252f]">Your pageants</h1>
          <p className="mt-2 text-sm text-[#5f6172]">Create a pageant, add candidates and photos, then submit it for review.</p>
        </div>
        <button className="btn-gold" onClick={() => setCreating((c) => !c)}>{creating ? "Close" : "New pageant"}</button>
      </div>

      {creating && <CreateForm onCreated={(p) => { setCreating(false); loadMine(); setSel(p); }} flash={flash} />}

      <div className="grid gap-3 sm:grid-cols-2">
        {mine.map((p) => (
          <button key={p.id} onClick={() => loadDetail(p.id)} className="glass glass-hover p-4 text-left">
            <div className="flex items-center justify-between">
              <div className="font-display text-lg text-[#23252f]">{p.title}</div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_CHIP[p.status]}`}>{STATUS_LABEL[p.status]}</span>
            </div>
            <div className="mt-1 text-xs text-[#7a7768]">{p.orgName} · {p._count?.candidates ?? 0} candidates</div>
            {p.status === "requires_changes" && p.reviewNote && <div className="mt-2 rounded-lg bg-[#fbeede] px-2 py-1 text-xs text-[#9a5a12]">Changes requested: {p.reviewNote}</div>}
          </button>
        ))}
        {mine.length === 0 && !creating && <div className="glass p-6 text-center text-sm text-[#7a7768] sm:col-span-2">No pageants yet. Click “New pageant” to start.</div>}
      </div>

      <Toast msg={toast.msg} tone={toast.tone} />
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <label className="text-sm"><div className="mb-1 text-[#5f6172]">{label}</div><input className="field" {...props} /></label>;
}

function CreateForm({ onCreated, flash }: { onCreated: (p: any) => void; flash: (m: string, t?: "ok" | "err") => void }) {
  const [f, setF] = useState({ title: "", orgName: "", contactName: "", email: "", website: "", facebook: "", instagram: "", verification: "", venue: "", eventDate: "", description: "" });
  const set = (k: keyof typeof f) => (e: any) => setF({ ...f, [k]: e.target.value });
  const [busy, setBusy] = useState(false);
  const valid = f.title && f.orgName && f.contactName && f.email;

  async function create() {
    setBusy(true);
    const r = await fetch("/api/pageants", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
    setBusy(false);
    if (r.ok) { flash("Pageant created — add your candidates."); onCreated(await r.json()); }
    else { const d = await r.json().catch(() => ({})); flash(messageFor(d.error, "Could not create pageant."), "err"); }
  }

  return (
    <div className="glass grid gap-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Event title *" value={f.title} onChange={set("title")} placeholder="Miss Universe Philippines 2027" />
        <Field label="Organization *" value={f.orgName} onChange={set("orgName")} placeholder="Miss Universe Philippines" />
        <Field label="Contact person *" value={f.contactName} onChange={set("contactName")} placeholder="Your name" />
        <Field label="Official email *" type="email" value={f.email} onChange={set("email")} placeholder="you@org.com" />
        <Field label="Official website" value={f.website} onChange={set("website")} placeholder="https://…" />
        <Field label="Facebook" value={f.facebook} onChange={set("facebook")} placeholder="https://facebook.com/…" />
        <Field label="Instagram" value={f.instagram} onChange={set("instagram")} placeholder="https://instagram.com/…" />
        <Field label="Verification links" value={f.verification} onChange={set("verification")} placeholder="Any links that prove legitimacy" />
        <Field label="Venue" value={f.venue} onChange={set("venue")} placeholder="Event venue" />
        <Field label="Event date" type="date" value={f.eventDate} onChange={set("eventDate")} />
        <label className="text-sm sm:col-span-2"><div className="mb-1 text-[#5f6172]">Description</div><textarea className="field min-h-24" value={f.description} onChange={set("description")} placeholder="About the event" /></label>
      </div>
      <button className="btn-gold w-fit" disabled={busy || !valid} onClick={create}>{busy ? "Creating…" : "Create pageant"}</button>
    </div>
  );
}

function PageantEditor({ pageant, onBack, reload, flash }: { pageant: any; onBack: () => void; reload: () => void; flash: (m: string, t?: "ok" | "err") => void }) {
  const editable = isEditableByOrganizer(pageant.status);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function addCandidate() {
    if (!name.trim()) return;
    setBusy(true);
    const r = await fetch(`/api/pageants/${pageant.id}/candidates`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: name }) });
    setBusy(false);
    if (r.ok) { setName(""); reload(); } else { const d = await r.json().catch(() => ({})); flash(messageFor(d.error, "Could not add candidate."), "err"); }
  }
  async function submit() {
    const r = await fetch(`/api/pageants/${pageant.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "submit" }) });
    if (r.ok) { flash("Submitted for review!"); reload(); } else { const d = await r.json().catch(() => ({})); flash(d.error === "no_candidates" ? "Add at least one candidate first." : messageFor(d.error, "Could not submit."), "err"); }
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-[#7a7768] hover:text-[#23252f]">← Back to my pageants</button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-[#23252f]">{pageant.title}</h1>
          <div className="mt-1 text-sm text-[#7a7768]">{pageant.orgName}</div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CHIP[pageant.status]}`}>{STATUS_LABEL[pageant.status]}</span>
      </div>

      {pageant.status === "requires_changes" && pageant.reviewNote && (
        <div className="rounded-xl border border-[#f0d9a0] bg-[#fff8e6] px-4 py-3 text-sm text-[#6b5410]">Admin requested changes: {pageant.reviewNote}</div>
      )}
      {!editable && pageant.status !== "requires_changes" && (
        <div className="glass p-3 text-sm text-[#7a7768]">This pageant is <b>{STATUS_LABEL[pageant.status].toLowerCase()}</b> and can’t be edited right now.</div>
      )}

      {/* Candidates */}
      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-[#23252f]">Candidates</h2>
        {editable && (
          <div className="glass mb-4 flex flex-col gap-3 p-4 sm:flex-row">
            <input className="field" placeholder="Candidate full name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCandidate()} />
            <button className="btn-gold shrink-0" disabled={busy || !name.trim()} onClick={addCandidate}>Add candidate</button>
          </div>
        )}
        <div className="grid gap-4">
          {(pageant.candidates ?? []).map((c: Candidate) => (
            <CandidateCard key={c.id} pageantId={pageant.id} candidate={c} editable={editable} reload={reload} flash={flash} />
          ))}
          {(pageant.candidates ?? []).length === 0 && <div className="glass p-6 text-center text-sm text-[#7a7768]">No candidates yet.</div>}
        </div>
      </section>

      {editable && canOrganizerSubmit(pageant.status) && (
        <div className="flex justify-end">
          <button className="btn-gold !px-8 !py-3" onClick={submit}>Submit for review</button>
        </div>
      )}
      <Toast msg="" tone="ok" />
    </div>
  );
}

function CandidateCard({ pageantId, candidate, editable, reload, flash }: { pageantId: string; candidate: Candidate; editable: boolean; reload: () => void; flash: (m: string, t?: "ok" | "err") => void }) {
  const imgByKind = (k: string) => candidate.images?.find((i) => i.categoryKey === k)?.url;

  async function del() {
    if (!confirm(`Remove ${candidate.fullName}?`)) return;
    const r = await fetch(`/api/pageants/${pageantId}/candidates/${candidate.id}`, { method: "DELETE" });
    if (r.ok) reload();
  }

  return (
    <div className="glass p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-lg text-[#23252f]">{candidate.fullName}</div>
          <div className="text-xs text-[#7a7768]">{candidate.location ?? "—"} · supply {candidate.maxSupply}</div>
        </div>
        {editable && <button onClick={del} className="text-xs text-[#9f1239] hover:underline">Remove</button>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {UPLOAD_KINDS.map((k) => (
          <UploadSlot key={k.key} pageantId={pageantId} cid={candidate.id} kind={k.key} label={k.label} url={imgByKind(k.key)} editable={editable} reload={reload} flash={flash} />
        ))}
      </div>
    </div>
  );
}

function UploadSlot({ pageantId, cid, kind, label, url, editable, reload, flash }: { pageantId: string; cid: string; kind: string; label: string; url?: string; editable: boolean; reload: () => void; flash: (m: string, t?: "ok" | "err") => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("kind", kind);
    const r = await fetch(`/api/pageants/${pageantId}/candidates/${cid}/upload`, { method: "POST", body: fd });
    setBusy(false);
    if (r.ok) { reload(); } else { const d = await r.json().catch(() => ({})); flash(messageFor(d.error, "Upload failed."), "err"); }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-wider text-[#7a7768]">{label}</div>
      <button
        onClick={() => editable && inputRef.current?.click()}
        disabled={!editable || busy}
        className={`relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-dashed ${url ? "border-transparent" : "border-[#d9d3c3]"} bg-[#faf7ef] text-xs text-[#7a7768] ${editable ? "hover:border-[#c9a227]" : "opacity-70"}`}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span>{busy ? "Uploading…" : editable ? "+ Upload" : "—"}</span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}
