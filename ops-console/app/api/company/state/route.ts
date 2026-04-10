import { NextRequest, NextResponse } from "next/server";
import {
  deleteTask,
  readCompanyState,
  saveAgent,
  saveDocMeta,
  saveTask,
} from "@/lib/company/server";
import { isLocalRequest } from "@/lib/local-only";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Local access only" }, { status: 404 });
  }

  try {
    const state = await readCompanyState();
    return NextResponse.json(state);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load state" },
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
    const type = body?.type as string | undefined;

    if (type === "saveAgent") {
      const agents = await saveAgent(body.agent ?? {});
      return NextResponse.json({ ok: true, agents });
    }

    if (type === "saveTask") {
      const tasks = await saveTask(body.task ?? {});
      return NextResponse.json({ ok: true, tasks });
    }

    if (type === "deleteTask") {
      const taskId = typeof body.taskId === "string" ? body.taskId : "";
      const tasks = await deleteTask(taskId);
      return NextResponse.json({ ok: true, tasks });
    }

    if (type === "saveDocMeta") {
      const docRegistry = await saveDocMeta(body.doc ?? {});
      return NextResponse.json({ ok: true, docRegistry });
    }

    return NextResponse.json({ error: "Unknown update type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save state" },
      { status: 500 }
    );
  }
}
