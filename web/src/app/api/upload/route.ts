import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import sharp from "sharp";
import { readFanSession } from "@/lib/fanAuth";
import { readAdminSession } from "@/lib/adminAuth";

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB (client downscales first; this is a safety net for GIFs/fallbacks)
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_DIM = 1600; // banners never need to be wider than this

// Generic image upload (banners, etc.). Any signed-in fan or admin. Dev writes to
// web/public/assets/uploads (served statically); prod: swap for Supabase Storage / Pinata.
export async function POST(req: NextRequest) {
  const fan = readFanSession(req);
  const admin = readAdminSession(req);
  if (!fan && !admin) return NextResponse.json({ error: "fan_auth_required" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file") as File | null;
  const folder = String(form?.get("folder") ?? "uploads").replace(/[^a-z0-9-]/gi, "") || "uploads";
  if (!file) return NextResponse.json({ error: "missing_file" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file_too_large" }, { status: 400 });

  const raw = Buffer.from(await file.arrayBuffer());
  const stem = randomBytes(8).toString("hex");

  try {
    const dir = path.join(process.cwd(), "public", "assets", folder);
    await mkdir(dir, { recursive: true });

    // Animated GIFs are passed through untouched (re-encoding would flatten them).
    // Everything else is downscaled + re-encoded to WebP so banners stay lightweight.
    let filename: string;
    let out: Buffer;
    if (file.type === "image/gif") {
      filename = `${stem}.gif`;
      out = raw;
    } else {
      filename = `${stem}.webp`;
      out = await sharp(raw)
        .rotate() // honor EXIF orientation
        .resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    }

    await writeFile(path.join(dir, filename), out);
    return NextResponse.json({ ok: true, url: `/assets/${folder}/${filename}` });
  } catch (e) {
    console.error("[api/upload] failed:", e);
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
