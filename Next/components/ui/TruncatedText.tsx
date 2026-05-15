'use client'
import { useState, useRef, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  tooltipClassName?: string;
}

export function TruncatedText({ 
  text, 
  maxLength = 50, 
  className,
  tooltipClassName 
}: TruncatedTextProps) {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  // Check if text is actually truncated
  useEffect(() => {
    if (textRef.current) {
      setIsTruncated(
        textRef.current.scrollWidth > textRef.current.clientWidth ||
        text.length > maxLength
      );
    }
  }, [text, maxLength]);

  const displayText = text.length > maxLength 
    ? `${text.slice(0, maxLength)}...` 
    : text;

  if (!isTruncated) {
    return (
      <span 
        ref={textRef}
        className={cn("block truncate", className)}
      >
        {displayText}
      </span>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            ref={textRef}
            className={cn("block truncate cursor-help", className)}
          >
            {displayText}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className={cn(
            "max-w-[300px] whitespace-pre-wrap text-sm z-50",
            tooltipClassName
          )}
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

