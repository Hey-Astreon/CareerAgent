import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateTailoredKit } from "@/lib/ai/drafter";
import { validatePDFExtractability } from "@/lib/ai/ats_validator";

export async function POST(req: Request) {
  try {
    const { profileSlug, jobPostingId } = await req.json();

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

    // Check if application kit already generated
    let application = await db.application.findFirst({
      where: {
        profileId: profile.id,
        jobPostingId: job.id,
      },
    });

    // Run Drafter-Reviewer Agent Loop
    const kit = await generateTailoredKit(
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
      job.company,
      job.rawDescription
    );

    // Validate PDF extractability score dynamically for this specific job
    const atsCheck = await validatePDFExtractability(profile.masterResumePath, job.title, job.rawDescription);

    if (application) {
      application = await db.application.update({
        where: { id: application.id },
        data: {
          tailoredCvPath: profile.masterResumePath,
          tailoredCoverLetter: kit.coverLetter,
          atsExtractabilityScore: atsCheck.extractabilityScore,
          updatedAt: new Date(),
        },
      });
    } else {
      application = await db.application.create({
        data: {
          profileId: profile.id,
          jobPostingId: job.id,
          status: "SHORTLISTED",
          tailoredCvPath: profile.masterResumePath,
          tailoredCoverLetter: kit.coverLetter,
          atsExtractabilityScore: atsCheck.extractabilityScore,
        },
      });
    }

    return NextResponse.json({
      success: true,
      applicationId: application.id,
      kit: {
        tailoredSummary: kit.tailoredSummary,
        tailoredProjects: kit.tailoredProjects,
        coverLetter: kit.coverLetter,
        atsReviewerScore: kit.atsReviewerScore,
        reviewerFeedback: kit.reviewerFeedback,
        atsExtractabilityScore: atsCheck.extractabilityScore,
        pdfPath: profile.masterResumePath,
      },
    });
  } catch (error) {
    console.error("Application Kit Generator API Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate application kit" },
      { status: 500 }
    );
  }
}
