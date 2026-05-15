'use client'
interface SeoHiddenTextProps {
  children: React.ReactNode;
  /** Optional: render as different element (default: p) */
  as?: "p" | "span" | "div";
}

/**
 * Renders text that is visually hidden but accessible to search engines and screen readers.
 * Uses Tailwind's sr-only class for SEO-safe hiding.
 */
export function SeoHiddenText({ children, as: Component = "p" }: SeoHiddenTextProps) {
  return <Component className="sr-only">{children}</Component>;
}

