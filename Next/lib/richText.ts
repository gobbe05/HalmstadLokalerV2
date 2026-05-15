// Converts rich-text fields that may be stored either as HTML (TipTap) or as plain text
// into safe HTML that preserves line breaks.
//
// Rationale: Some legacy content (or certain update paths) can end up as plain text
// with \n line breaks. HTML collapses newlines, so we normalize to <p>/<br>.

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function looksLikeHtml(input: string) {
  // Detect tags like <p>, <br>, <strong> etc.
  return /<\/?[a-z][\s\S]*>/i.test(input);
}

/**
 * If the input already looks like HTML, returns it as-is.
 * Otherwise escapes and wraps into paragraphs and <br> to preserve line breaks.
 */
export function toHtmlPreserveLineBreaks(input: string): string {
  const raw = (input ?? "").toString();
  if (!raw) return "";

  if (looksLikeHtml(raw)) return raw;

  const cleaned = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (!cleaned) return "";

  const escaped = escapeHtml(cleaned);
  const paragraphs = escaped.split(/\n\n+/);

  return paragraphs
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}
