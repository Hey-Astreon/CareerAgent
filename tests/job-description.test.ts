import { describe, expect, it } from "vitest";
import { descriptionKindLabel, isSparseDescription, sourceTextToReadableText } from "../src/lib/jobDescription";

describe("job description presentation", () => {
  it("preserves paragraph separation while converting source HTML into readable original text", () => {
    expect(sourceTextToReadableText("<p>Build APIs.</p><p>Review code.</p>")).toBe("Build APIs.\n\nReview code.");
  });

  it("marks synthetic listing summaries as sparse and complete source text as full", () => {
    expect(isSparseDescription("Full Stack Engineer at Example Co. Discovered on WeWorkRemotely.")).toBe(true);
    expect(descriptionKindLabel("<p>Design and maintain systems.</p>".repeat(12), true)).toBe("full");
  });

  it("classifies detailed readable source text by its content even when a provider completeness flag is absent", () => {
    const detailedText = "<p>Design and maintain distributed systems with product and engineering teams.</p>".repeat(8);
    expect(isSparseDescription(detailedText)).toBe(false);
  });
});
