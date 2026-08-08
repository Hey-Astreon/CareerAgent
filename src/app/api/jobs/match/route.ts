import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeCompositeMatchScore } from "@/lib/ai/scorer";

export async function POST(req: Request) {
  const startTime = Date.now();
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

    // Cache Check: If forceRefresh is false, look up cached match in DB
    if (!forceRefresh) {
      const cachedRecord = await db.matchScore.findUnique({
        where: {
          profileId_jobPostingId: {
            profileId: profile.id,
            jobPostingId: job.id,
          },
        },
      });

      if (cachedRecord) {
        return NextResponse.json({
          success: true,
          matchScore: {
            score: cachedRecord.score,
            hardSkills: JSON.parse(cachedRecord.hardSkills || "[]"),
            missingSkills: JSON.parse(cachedRecord.missingSkills || "[]"),
            reasoning: cachedRecord.reasoning,
            cached: true,
            latencyMs: Date.now() - startTime,
          },
        });
      }
    }

    // Execute 4-Layer Match Pipeline
    const candidateContext = {
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
    };

    const result = await computeCompositeMatchScore(
      candidateContext,
      job.title,
      job.rawDescription,
      job.location,
      job.url || "http://valid.url",
      job.postedAt || undefined,
      job.platform,
      true // Enable AI for single job match API
    );

    // Save/Update match score record in SQLite
    const matchRecord = await db.matchScore.upsert({
      where: {
        profileId_jobPostingId: {
          profileId: profile.id,
          jobPostingId: job.id,
        },
      },
      update: {
        score: result.finalScore,
        hardSkills: JSON.stringify(result.hardSkills),
        missingSkills: JSON.stringify(result.missingSkills),
        reasoning: result.reasoning,
      },
      create: {
        profileId: profile.id,
        jobPostingId: job.id,
        score: result.finalScore,
        hardSkills: JSON.stringify(result.hardSkills),
        missingSkills: JSON.stringify(result.missingSkills),
        reasoning: result.reasoning,
      },
    });

    return NextResponse.json({
      success: true,
      matchScore: {
        score: matchRecord.score,
        eligible: result.eligible,
        rejectionReason: result.rejectionReason,
        deterministicSignals: result.deterministicSignals,
        hardSkills: result.hardSkills,
        missingSkills: result.missingSkills,
        reasoning: result.reasoning,
        version: result.version,
        cached: false,
        aiCallsCount: result.aiCallsCount,
        latencyMs: Date.now() - startTime,
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
