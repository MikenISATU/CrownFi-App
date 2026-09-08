import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

// PayMongo webhook — fires when a GCash (or card) payment clears. We verify the signature, then
// record the order encoded in reference_number ("mint:<collectibleId>:<fanId>"). Base collectible
// fulfillment is disabled until a server-authorized transaction path is released.
// Configure this URL in the PayMongo dashboard and set PAYMONGO_WEBHOOK_SECRET.
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  const sigHeader = req.headers.get("paymongo-signature");

  // Verify HMAC signature (t=timestamp, te=test sig, li=live sig).
  if (secret) {
    if (!sigHeader) return NextResponse.json({ error: "no_signature" }, { status: 401 });
    const parts = Object.fromEntries(sigHeader.split(",").map((p) => p.split("=")));
    const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${raw}`).digest("hex");
    const provided = parts.li || parts.te || "";
    if (provided.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
      return NextResponse.json({ error: "bad_signature" }, { status: 401 });
    }
  }

  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const type = event?.data?.attributes?.type;
  if (type !== "checkout_session.payment.paid") return NextResponse.json({ ok: true, ignored: type });

  const ref: string = event?.data?.attributes?.data?.attributes?.reference_number ?? "";
  const [kind, collectibleId, fanId] = ref.split(":");
  if (kind !== "mint" || !collectibleId || !fanId) return NextResponse.json({ ok: true, note: "no fulfillable reference" });

  try {
    const [fan, collectible, already] = await Promise.all([
      db.fan.findUnique({ where: { id: fanId } }),
      db.collectible.findUnique({ where: { id: collectibleId } }),
      db.purchase.findFirst({ where: { fanId, collectibleId } }),
    ]);
    if (already) return NextResponse.json({ ok: true, note: "already fulfilled" });
    if (!fan?.walletAddress || !collectible) return NextResponse.json({ ok: true, note: "missing fan/collectible" });

    await db.paymentLog.create({
      data: {
        fanId,
        kind: "mint",
        provider: "gcash",
        amount: collectible.priceUsdc,
        currency: "PHP",
        status: "pending",
        reference: String(event?.data?.id ?? ""),
        detail: "Payment received; Base collectible fulfillment is not enabled.",
      },
    });
    return NextResponse.json({ ok: true, pendingFulfillment: true }, { status: 202 });
  } catch (e: any) {
    console.error("[paymongo webhook] fulfill failed:", e?.message ?? e);
    return NextResponse.json({ error: "fulfill_failed" }, { status: 500 });
  }
}
