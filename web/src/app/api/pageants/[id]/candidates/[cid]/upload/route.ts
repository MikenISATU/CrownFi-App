import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { readFanSession } from "@/lib/fanAuth";
import { isEditableByOrganizer, slugify } from "@/lib/pageant";
import { folderForKind, assetPath, CANDIDATE_ASSET_KINDS } from "@/lib/assets";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// POST (multipart) — upload a candidate image of a given kind into the pageant asset folder.
// Dev writes to web/public/assets/... (served statically). Prod: swap for Supabase Storage / Pinata.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string; cid: string }> }) {
  const { id, cid } = await ctx.params;

  const fan = readFanSession(req);
  if (!fan) return NextResponse.json({ error: "fan_auth_required" }, { status: 401 });

  const pageant = await db.pageant.findUnique({ where: { id } });
  if (!pageant) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (pageant.ownerFanId !== fan.fanId) return NextResponse.json({ error: "not_authorized" }, { status: 403 });
  if (!isEditableByOrganizer(pageant.status)) return NextResponse.json({ error: "not_editable" }, { status: 409 });

  const candidate = await db.candidate.findUnique({ where: { id: cid } });
  if (!candidate || candidate.pageantId !== id) return NextResponse.json({ error: "candidate_not_found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  const kind = String(form?.get("kind") ?? "");
  if (!file) return NextResponse.json({ error: "missing_file" }, { status: 400 });
  if (!CANDIDATE_ASSET_KINDS.includes(kind as any)) return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file_too_large" }, { status: 400 });

  const candSlug = `${slugify(candidate.fullName)}-${cid.slice(-6)}`;
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  const filename = `${folderForKind(kind)}.${ext}`;

  try {
    const dir = path.join(process.cwd(), "public", "assets", "pageants", pageant.slug, "candidates", candSlug, folderForKind(kind));
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));
    const url = assetPath(pageant.slug, candSlug, kind, filename);

    // Record the image + set the convenience fields the UI reads directly.
    await db.candidateImage.upsert({
      where: { candidateId_categoryKey: { candidateId: cid, categoryKey: kind } },
      update: { url },
      create: { candidateId: cid, categoryKey: kind, url },
    });
    if (kind === "profile") await db.candidate.update({ where: { id: cid }, data: { profileUrl: url } });
    if (kind === "nft_artwork") await db.candidate.update({ where: { id: cid }, data: { nftArtworkUrl: url } });

    return NextResponse.json({ ok: true, url });
  } catch (e) {
    console.error("[upload] failed:", e);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
