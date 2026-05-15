'use client'
import { CheckCircle2, XCircle, AlertTriangle, Image, FileText, Globe, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { City } from "@/contexts/CityContext";

interface CheckItem {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  check: (city: City) => boolean;
  critical: boolean;
}

const LAUNCH_CHECKLIST: CheckItem[] = [
  {
    key: "domain",
    label: "Domän konfigurerad",
    shortLabel: "Domän",
    icon: Globe,
    check: (city) => !!city.domain && city.domain.trim().length > 0,
    critical: true,
  },
  {
    key: "hero_image",
    label: "Hero-bild uppladdad",
    shortLabel: "Hero",
    icon: Image,
    check: (city) => !!city.hero_image_url && city.hero_image_url.trim().length > 0,
    critical: true,
  },
  {
    key: "og_image",
    label: "OG-bild för delning",
    shortLabel: "OG",
    icon: Megaphone,
    check: (city) => !!city.og_image_url && city.og_image_url.trim().length > 0,
    critical: true,
  },
  {
    key: "seo_title",
    label: "SEO-titel",
    shortLabel: "Titel",
    icon: FileText,
    check: (city) => !!city.seo_title && city.seo_title.trim().length > 0,
    critical: false,
  },
  {
    key: "seo_description",
    label: "SEO-beskrivning",
    shortLabel: "Beskr.",
    icon: FileText,
    check: (city) => !!city.seo_description && city.seo_description.trim().length > 0,
    critical: false,
  },
  {
    key: "intro_text",
    label: "Introduktionstext",
    shortLabel: "Intro",
    icon: FileText,
    check: (city) => !!city.intro_text && city.intro_text.trim().length > 0,
    critical: false,
  },
];

export interface LaunchReadiness {
  isReady: boolean;
  criticalMissing: string[];
  optionalMissing: string[];
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export function getCityLaunchReadiness(city: City): LaunchReadiness {
  const results = LAUNCH_CHECKLIST.map((item) => ({
    ...item,
    passed: item.check(city),
  }));

  const criticalMissing = results
    .filter((r) => r.critical && !r.passed)
    .map((r) => r.label);
  
  const optionalMissing = results
    .filter((r) => !r.critical && !r.passed)
    .map((r) => r.label);

  const completedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return {
    isReady: criticalMissing.length === 0,
    criticalMissing,
    optionalMissing,
    completedCount,
    totalCount,
    percentage,
  };
}

interface CityLaunchChecklistProps {
  city: City;
  compact?: boolean;
}

export function CityLaunchChecklist({ city, compact = false }: CityLaunchChecklistProps) {
  const readiness = getCityLaunchReadiness(city);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help">
              {readiness.isReady ? (
                <Badge variant="default" className="gap-1 text-[10px] px-1.5 bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-3 h-3" />
                  Redo
                </Badge>
              ) : readiness.criticalMissing.length > 0 ? (
                <Badge variant="destructive" className="gap-1 text-[10px] px-1.5">
                  <XCircle className="w-3 h-3" />
                  {readiness.criticalMissing.length} saknas
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 bg-amber-100 text-amber-800 hover:bg-amber-200">
                  <AlertTriangle className="w-3 h-3" />
                  Delvis
                </Badge>
              )}
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {readiness.completedCount}/{readiness.totalCount}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-2">
              <p className="font-medium">Lanseringschecklista</p>
              {readiness.criticalMissing.length > 0 && (
                <div>
                  <p className="text-xs text-destructive font-medium">Kritiskt (måste åtgärdas):</p>
                  <ul className="text-xs list-disc list-inside">
                    {readiness.criticalMissing.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {readiness.optionalMissing.length > 0 && (
                <div>
                  <p className="text-xs text-amber-600 font-medium">Rekommenderat:</p>
                  <ul className="text-xs list-disc list-inside">
                    {readiness.optionalMissing.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {readiness.isReady && readiness.optionalMissing.length === 0 && (
                <p className="text-xs text-green-600">Allt klart för lansering!</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Lanseringschecklista</h4>
        <span className="text-xs text-muted-foreground">
          {readiness.completedCount}/{readiness.totalCount} ({readiness.percentage}%)
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${
            readiness.isReady
              ? "bg-green-500"
              : readiness.criticalMissing.length > 0
              ? "bg-destructive"
              : "bg-amber-500"
          }`}
          style={{ width: `${readiness.percentage}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="grid grid-cols-2 gap-2">
        {LAUNCH_CHECKLIST.map((item) => {
          const passed = item.check(city);
          const Icon = item.icon;
          return (
            <div
              key={item.key}
              className={`flex items-center gap-2 text-xs p-2 rounded-md ${
                passed
                  ? "bg-green-50 text-green-700"
                  : item.critical
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {passed ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              ) : item.critical ? (
                <XCircle className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              )}
              <Icon className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <span className="truncate">{item.shortLabel}</span>
            </div>
          );
        })}
      </div>

      {/* Summary message */}
      {!readiness.isReady && (
        <p className="text-xs text-destructive">
          ⚠️ Kritiska objekt saknas – staden kan inte publiceras korrekt.
        </p>
      )}
    </div>
  );
}

