import { NextResponse } from "next/server";
import { runReminderJob } from "@/lib/events/runReminders";
import { isCronAuthorized } from "@/lib/secret";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  if (!isCronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runReminderJob();
    return NextResponse.json(result);
  } catch (error) {
    console.error("reminder job failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Job failed" }, { status: 500 });
  }
}

export function GET(request: Request) {
  return handle(request);
}

export function POST(request: Request) {
  return handle(request);
}
