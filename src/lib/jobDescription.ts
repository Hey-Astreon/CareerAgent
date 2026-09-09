export function sourceTextToReadableText(value: string): string {
  return value
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<\/li\s*>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<[^>]*>?/gm, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function isSparseDescription(value: string): boolean {
  const readable = sourceTextToReadableText(value);
  if (readable.length < 180) return true;
  return /^(?:direct|verified|remote).{0,110}(?:role|position|posting).{0,110}(?:listed|discovered)/i.test(readable);
}

export function descriptionKindLabel(value: string, hasFullText?: boolean): "full" | "summary" {
  return hasFullText && !isSparseDescription(value) ? "full" : "summary";
}
