import { NextRequest, NextResponse } from "next/server";
import { readManagedDoc, saveManagedDoc } from "@/lib/company/server";
import { isLocalRequest } from "@/lib/local-only";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Local access only" }, { status: 404 });
  }

  try {
    const docPath = request.nextUrl.searchParams.get("path");
    if (!docPath) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    const doc = await readManagedDoc(docPath);
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read doc" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Local access only" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const docPath = typeof body?.path === "string" ? body.path : "";
    const content = typeof body?.content === "string" ? body.content : "";

    if (!docPath) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    const doc = await saveManagedDoc(docPath, content);
    return NextResponse.json({ ok: true, doc });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save doc" },
      { status: 500 }
    );
  }
}
