import { describe, expect, it } from "vitest";
import { canFetchMatchSourceText } from "@/lib/matchDescription";

describe("Match Studio source-description access", () => {
  it("only enables the existing approved source-description providers", () => {
    expect(canFetchMatchSourceText("GREENHOUSE", "https://boards.greenhouse.io/example/jobs/1")).toBe(true);
    expect(canFetchMatchSourceText("ashby", "https://jobs.ashbyhq.com/example/role")).toBe(true);
    expect(canFetchMatchSourceText("WEWORKREMOTELY", "https://weworkremotely.com/remote-jobs/example")).toBe(true);
    expect(canFetchMatchSourceText("GREENHOUSE", "https://careers.example.com/role")).toBe(false);
    expect(canFetchMatchSourceText("LINKEDIN", "https://www.linkedin.com/jobs/view/1")).toBe(false);
    expect(canFetchMatchSourceText("ASHBY", "http://jobs.ashbyhq.com/example/role")).toBe(false);
  });
});
