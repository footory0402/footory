import { NextRequest, NextResponse } from "next/server";
import { runVerificationScript } from "@/lib/company/server";
import { isLocalRequest } from "@/lib/local-only";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Local access only" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const script = body?.script as "lint" | "typecheck" | "test:run";
    const result = await runVerificationScript(script);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run check" },
      { status: 500 }
    );
  }
}
