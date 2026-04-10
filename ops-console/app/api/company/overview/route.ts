import { NextRequest, NextResponse } from "next/server";
import { getCompanyOverview, readAutomationCatalog, readCompanyState } from "@/lib/company/server";
import { isLocalRequest } from "@/lib/local-only";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Local access only" }, { status: 404 });
  }

  try {
    const [overview, state, automation] = await Promise.all([
      getCompanyOverview(),
      readCompanyState(),
      readAutomationCatalog(),
    ]);

    return NextResponse.json({ overview, state, automation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load overview" },
      { status: 500 }
    );
  }
}
