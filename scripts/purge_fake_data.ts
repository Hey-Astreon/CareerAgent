import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const db = new PrismaClient({ adapter });

async function purgeFakeData() {
  console.log("Starting data integrity purge...");

  // Purge any JobPosting or Opportunity records originating from mock Wellfound or fabricated URLs
  const deletedPostings = await db.jobPosting.deleteMany({
    where: {
      OR: [
        { platform: "WELLFOUND" },
        { url: { contains: "3012948-react-frontend-systems-engineer" } },
        { url: { contains: "2948102-full-stack-infrastructure-engineer" } },
        { url: { contains: "2819401-react-developer-product-engineer" } },
        { url: { contains: "3109284-backend-systems-infrastructure-developer" } },
      ],
    },
  });

  const deletedOpps = await db.opportunity.deleteMany({
    where: {
      OR: [
        { company: "LangChain" },
        { company: "Modal Labs" },
        { company: "Resend" },
        { company: "Pinecone" },
      ],
    },
  });

  console.log(`[Data Purge Complete] Deleted ${deletedPostings.count} mock JobPostings and ${deletedOpps.count} mock Opportunities.`);
}

purgeFakeData()
  .catch((err) => {
    console.error("Data Purge Error:", err);
  })
  .finally(async () => {
    await db.$disconnect();
  });
