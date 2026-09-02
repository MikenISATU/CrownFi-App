import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";

// Compatibility response for old clients. Closing now requires the admin's Base wallet
// through prepare-close -> AuditAnchor.publish() -> confirm-close.
export async function POST(req: NextRequest) {
  const admin = requireAdmin(req);
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ error: "use_base_anchor_flow" }, { status: 409 });
}
