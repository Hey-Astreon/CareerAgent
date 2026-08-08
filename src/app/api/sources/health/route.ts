import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const syncStates = await db.providerSyncState.findMany({
      orderBy: { providerKey: "asc" },
    });

    const formattedStates = syncStates.map((state) => ({
      provider: state.providerKey,
      status: state.status,
      lastSyncAttemptAt: state.lastSyncAttemptAt ? state.lastSyncAttemptAt.toISOString() : null,
      lastSuccessfulSyncAt: state.lastSuccessfulSyncAt ? state.lastSuccessfulSyncAt.toISOString() : null,
      lastFailedSyncAt: state.lastFailedSyncAt ? state.lastFailedSyncAt.toISOString() : null,
      consecutiveFailures: state.consecutiveFailures,
      lastError: state.lastError,
      totalJobsSeen: state.totalJobsSeen,
    }));

    return NextResponse.json({
      success: true,
      sources: formattedStates,
    });
  } catch (error) {
    console.error("Error fetching source health:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve source health metrics" },
      { status: 500 }
    );
  }
}
