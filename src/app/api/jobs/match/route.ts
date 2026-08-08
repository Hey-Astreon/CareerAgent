import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { evaluateJobMatch } from "@/lib/ai/scorer";

export async function POST(req: Request) {
  try {
    const { profileSlug, jobPostingId, forceRefresh } = await req.json();

    if (!profileSlug || !jobPostingId) {
      return NextResponse.json(
        { success: false, error: "profileSlug and jobPostingId are required" },
        { status: 400 }
      );
    }

    const profile = await db.profile.findUnique({
      where: { slug: profileSlug },
      include: { projects: true, virtualExps: true },
    });

    const job = await db.jobPosting.findUnique({
      where: { id: jobPostingId },
    });

    if (!profile || !job) {
      return NextResponse.json(
        { success: false, error: "Profile or JobPosting not found" },
        { status: 404 }
      );
    }

    // Always run true empirical semantic AI scorer for 100% authentic evaluation
    const result = await evaluateJobMatch(
      {
        fullName: profile.fullName,
        title: profile.title,
        masterProjects: profile.projects.map((p) => ({
          title: p.title,
          techStack: p.techStack,
          architecture: p.architecture,
        })),
        virtualExps: profile.virtualExps.map((e) => ({
          company: e.company,
          roleTitle: e.roleTitle,
          outcome: e.outcome,
        })),
      },
      job.title,
      job.rawDescription
    );

    // Upsert fresh match score record in SQLite
    const matchRecord = await db.matchScore.upsert({
      where: {
        profileId_jobPostingId: {
          profileId: profile.id,
          jobPostingId: job.id,
        },
      },
      update: {
        score: result.score,
        hardSkills: JSON.stringify(result.hardSkills),
        missingSkills: JSON.stringify(result.missingSkills),
        reasoning: result.reasoning,
      },
      create: {
        profileId: profile.id,
        jobPostingId: job.id,
        score: result.score,
        hardSkills: JSON.stringify(result.hardSkills),
        missingSkills: JSON.stringify(result.missingSkills),
        reasoning: result.reasoning,
      },
    });

    return NextResponse.json({
      success: true,
      matchScore: {
        score: matchRecord.score,
        hardSkills: result.hardSkills,
        missingSkills: result.missingSkills,
        reasoning: result.reasoning,
      },
    });
  } catch (error) {
    console.error("Job Match Evaluation API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to evaluate job match" },
      { status: 500 }
    );
  }
}
