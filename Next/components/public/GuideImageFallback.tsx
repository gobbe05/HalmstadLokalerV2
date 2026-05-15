'use client'
import { cn } from "@/lib/utils";

interface GuideImageFallbackProps {
  area?: string | null;
  categoryLabel?: string | null;
  title: string;
  subline?: string | null;
  className?: string;
  textSize?: "card" | "hero";
}

export function GuideImageFallback({
  area,
  categoryLabel,
  title,
  subline,
  className,
  textSize = "card",
}: GuideImageFallbackProps) {
  const display = area || categoryLabel || title;

  return (
    <div
      className={cn(
        "relative w-full h-full overflow-hidden bg-gradient-to-br from-foreground via-foreground/95 to-accent/70",
        className
      )}
    >
      {/* Soft radial glow */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, hsl(var(--accent) / 0.35), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse at 80% 90%, hsl(var(--primary) / 0.25), transparent 55%)",
        }}
      />

      <div className="relative h-full w-full flex flex-col justify-end p-5 sm:p-6 md:p-8">
        <span
          className={cn(
            "font-heading font-bold text-background leading-[0.95] tracking-tight line-clamp-2",
            textSize === "hero"
              ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
              : "text-2xl sm:text-3xl"
          )}
        >
          {display}
        </span>
        {subline && (
          <span
            className={cn(
              "text-background/70 mt-2",
              textSize === "hero" ? "text-sm md:text-base" : "text-xs"
            )}
          >
            {subline}
          </span>
        )}
      </div>
    </div>
  );
}

