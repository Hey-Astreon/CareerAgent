import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const profiles = await db.profile.findMany({
      include: {
        projects: true,
        virtualExps: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ success: true, profiles });
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch candidate profiles" },
      { status: 500 }
    );
  }
}
