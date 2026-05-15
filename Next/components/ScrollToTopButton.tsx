'use client'
import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  };

  return (
    <Button
      onClick={scrollToTop}
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg transition-all duration-300",
        "bg-accent hover:bg-accent/90 text-accent-foreground",
        isVisible 
          ? "translate-y-0 opacity-100" 
          : "translate-y-4 opacity-0 pointer-events-none"
      )}
      aria-label="Scrolla till toppen"
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  );
}

