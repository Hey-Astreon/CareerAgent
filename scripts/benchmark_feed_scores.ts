import { db } from "../src/lib/db";
import { computeBatchFeedScores, CachedScoreItem } from "../src/lib/ai/batchScorer";

async function benchmarkFeedScoring() {
  console.log("=== CHECKPOINT 6.1 FEED SCORING BENCHMARK ===");

  // Fetch or create active candidate profile
  let profile = await db.profile.findFirst({
    include: { projects: true, virtualExps: true },
  });

  if (!profile) {
    console.log("No profile found. Creating benchmark profile...");
    profile = await db.profile.create({
      data: {
        slug: "benchmark-candidate",
        fullName: "Benchmark Candidate",
        title: "Full Stack Developer",
        email: "benchmark@example.com",
        location: "Remote",
        masterResumePath: "/resumes/master.pdf",
      },
      include: { projects: true, virtualExps: true },
    });
  }

  // Fetch all available job postings from DB
  const allJobs = await db.jobPosting.findMany({
    take: 150,
    select: {
      id: true,
      title: true,
      rawDescription: true,
      location: true,
      url: true,
      postedAt: true,
      platform: true,
    },
  });

  console.log(`Available JobPostings in DB: ${allJobs.length}`);

  if (allJobs.length === 0) {
    console.log("No job postings in DB. Run scraper or seed DB first.");
    await db.$disconnect();
    return;
  }

  const batchSizes = [10, 50, 100, 150].filter((size) => size <= allJobs.length);
  if (batchSizes.length === 0) batchSizes.push(allJobs.length);

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

  console.log("\nBatch Size | DB Query Time | Scoring Time | Serialization | Total Latency | Target (<50ms)");
  console.log("-----------------------------------------------------------------------------------------");

  for (const size of batchSizes) {
    const subset = allJobs.slice(0, size);
    const subsetIds = subset.map((j) => j.id);

    const totalStart = performance.now();

    // 1. DB Query Phase
    const dbStart = performance.now();
    const [jobs, cachedScoresList] = await Promise.all([
      db.jobPosting.findMany({
        where: { id: { in: subsetIds } },
        select: {
          id: true,
          title: true,
          rawDescription: true,
          location: true,
          url: true,
          postedAt: true,
          platform: true,
        },
      }),
      db.matchScore.findMany({
        where: {
          profileId: profile.id,
          jobPostingId: { in: subsetIds },
        },
        select: {
          jobPostingId: true,
          score: true,
          hardSkills: true,
          missingSkills: true,
          reasoning: true,
        },
      }),
    ]);
    const dbTimeMs = performance.now() - dbStart;

    const cachedScoresMap = new Map<string, CachedScoreItem>();
    for (const item of cachedScoresList) {
      if (item.jobPostingId) {
        cachedScoresMap.set(item.jobPostingId, {
          score: item.score,
          hardSkills: item.hardSkills,
          missingSkills: item.missingSkills,
          reasoning: item.reasoning,
        });
      }
    }

    // 2. Deterministic Batch Scoring Phase
    const scoringStart = performance.now();
    const scoreResultsMap = computeBatchFeedScores(candidateContext, jobs, cachedScoresMap);
    const scoringTimeMs = performance.now() - scoringStart;

    // 3. Serialization Phase
    const serialStart = performance.now();
    const scoresOutput: Record<string, unknown> = {};
    scoreResultsMap.forEach((res, jobId) => {
      scoresOutput[jobId] = {
        score: res.score,
        scoreType: res.scoreType,
        displayLabel: res.displayLabel,
        eligible: res.eligible,
        rejectionReason: res.rejectionReason || null,
        cached: res.cached,
        hardSkills: res.hardSkills || [],
        missingSkills: res.missingSkills || [],
      };
    });
    const serializedJson = JSON.stringify({ success: true, scores: scoresOutput });
    const serialTimeMs = performance.now() - serialStart;

    const totalTimeMs = performance.now() - totalStart;
    const targetPassed = totalTimeMs < 50 ? "PASS ✅" : "WARN ⚠️";

    // Measure string length to satisfy unused var check
    if (!serializedJson) console.log("Empty json");

    console.log(
      `${String(size).padEnd(10)} | ${dbTimeMs.toFixed(2).padEnd(13)} ms | ${scoringTimeMs
        .toFixed(2)
        .padEnd(10)} ms | ${serialTimeMs.toFixed(2).padEnd(13)} ms | ${totalTimeMs
        .toFixed(2)
        .padEnd(11)} ms | ${targetPassed}`
    );
  }

  console.log("\n=======================================================");
}

benchmarkFeedScoring()
  .catch(console.error)
  .finally(async () => await db.$disconnect());
