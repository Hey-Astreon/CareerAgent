import fs from "fs";

export interface ATSValidationResult {
  isParseable: boolean;
  extractabilityScore: number; // Real dynamic score (e.g. 88%, 94%, 100%)
  extractedCharCount: number;
  extractedTextSample: string;
  sectionHeadersFound: string[];
}

const REQUIRED_ATS_HEADERS = [
  "EXPERIENCE", "EDUCATION", "SKILLS", "PROJECTS", "SUMMARY"
];

/**
 * Dynamically parses PDF file binary using pdf-parse to calculate real ATS text extractability,
 * section header coverage, and encoding purity.
 */
export async function validatePDFExtractability(pdfPath: string): Promise<ATSValidationResult> {
  if (!fs.existsSync(pdfPath)) {
    return {
      isParseable: false,
      extractabilityScore: 0,
      extractedCharCount: 0,
      extractedTextSample: "PDF file does not exist on disk.",
      sectionHeadersFound: [],
    };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PDFParse } = require("pdf-parse");
    const fileBuffer = fs.readFileSync(pdfPath);
    const uint8Data = new Uint8Array(fileBuffer);

    const parser = new PDFParse(uint8Data);
    await parser.load();
    const textData = await parser.getText();
    
    const rawText = textData?.text || "";
    const cleanText = rawText.replace(/\s+/g, " ").trim();
    const charCount = cleanText.length;
    const upperText = cleanText.toUpperCase();

    // Find present ATS headers
    const headersFound = REQUIRED_ATS_HEADERS.filter((header) =>
      upperText.includes(header)
    );

    // Calculate dynamic ATS score metrics
    let score = 0;

    // 1. Text Density & Character Count (Max 40 points)
    if (charCount > 3000) {
      score += 40;
    } else if (charCount > 1500) {
      score += 35;
    } else if (charCount > 800) {
      score += 25;
    } else if (charCount > 300) {
      score += 15;
    } else {
      score += 5;
    }

    // 2. Section Header Coverage (Max 30 points)
    const headerRatio = headersFound.length / REQUIRED_ATS_HEADERS.length;
    score += Math.round(headerRatio * 30);

    // 3. ASCII / Text Encoding Purity (Max 30 points)
    const nonAsciiCount = (cleanText.match(/[^\x00-\x7F]/g) || []).length;
    const nonAsciiRatio = charCount > 0 ? nonAsciiCount / charCount : 0;
    
    if (nonAsciiRatio < 0.02) {
      score += 30;
    } else if (nonAsciiRatio < 0.05) {
      score += 20;
    } else {
      score += 10;
    }

    const finalScore = Math.min(100, Math.max(25, score));

    return {
      isParseable: charCount > 100,
      extractabilityScore: finalScore,
      extractedCharCount: charCount,
      extractedTextSample: cleanText.substring(0, 250) + "...",
      sectionHeadersFound: headersFound,
    };
  } catch (err) {
    console.warn("[ATS Validator Warning] PDF parsing error:", (err as Error).message);
    return {
      isParseable: false,
      extractabilityScore: 40,
      extractedCharCount: 0,
      extractedTextSample: `PDF parsing error: ${(err as Error).message}`,
      sectionHeadersFound: [],
    };
  }
}
