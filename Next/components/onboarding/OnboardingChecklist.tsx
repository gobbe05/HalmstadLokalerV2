'use client'
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, 
  Circle, 
  Building2, 
  Image, 
  Globe, 
  UserCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  href: string;
  ctaText: string;
}

export function OnboardingChecklist() {
  const { user } = useAuthContext();

  const { data: onboardingData, isLoading } = useQuery({
    queryKey: ["onboarding-progress", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, company_name, display_name, phone, email")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile) return null;

      // Get all listings for this user
      const { data: listings } = await supabase
        .from("listings")
        .select("id, status, bilder")
        .eq("owner_id", profile.id);

      const hasListings = (listings?.length || 0) > 0;
      const hasImages = listings?.some(l => l.bilder && l.bilder.length > 0) || false;
      const hasPublished = listings?.some(l => l.status === "published") || false;
      
      // Profile is complete when all required fields are filled
      const hasCompanyProfile = !!(
        profile.company_name?.trim() && 
        profile.display_name?.trim() && 
        profile.phone?.trim() && 
        profile.email?.trim()
      );

      return {
        hasListings,
        hasImages,
        hasPublished,
        hasCompanyProfile,
        listingsCount: listings?.length || 0,
        publishedCount: listings?.filter(l => l.status === "published").length || 0,
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading || !onboardingData) {
    return null;
  }

  // Only show checklist when user has at least 1 listing
  if (!onboardingData.hasListings) {
    return null;
  }

  // Steps for users with listings (profile step removed)
  const steps: OnboardingStep[] = [
    {
      id: "listing",
      title: "Skapa lokal",
      description: "Skapa en annons för din lokal",
      icon: Building2,
      completed: onboardingData.hasListings,
      href: "/app/lokaler/new",
      ctaText: "Lägg till lokal",
    },
    {
      id: "images",
      title: "Ladda upp bilder",
      description: "Bilder ökar intresset med 80%",
      icon: Image,
      completed: onboardingData.hasImages,
      href: "/app/lokaler",
      ctaText: "Lägg till bilder",
    },
    {
      id: "publish",
      title: "Publicera din lokal",
      description: "Gör lokalen synlig för besökare",
      icon: Globe,
      completed: onboardingData.hasPublished,
      href: "/app/lokaler",
      ctaText: "Publicera",
    },
  ];

  const completedSteps = steps.filter(s => s.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  // Don't show if all steps are completed
  if (completedSteps === steps.length) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Nästa steg</CardTitle>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            {completedSteps}/{steps.length} klart
          </span>
        </div>
        <CardDescription>
          Slutför dessa steg för att börja få leads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <Progress value={progressPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {progressPercentage.toFixed(0)}% slutfört
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                step.completed 
                  ? "bg-muted/50" 
                  : "bg-background border border-border hover:border-primary/30"
              }`}
            >
              {/* Step Number/Check */}
              <div className={`flex-shrink-0 ${step.completed ? "text-primary" : "text-muted-foreground"}`}>
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <div className="relative">
                    <Circle className="h-5 w-5" />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium">
                      {index + 1}
                    </span>
                  </div>
                )}
              </div>

              {/* Icon */}
              <div className={`p-1.5 rounded-md ${step.completed ? "bg-primary/10" : "bg-muted"}`}>
                <step.icon className={`h-4 w-4 ${step.completed ? "text-primary" : "text-muted-foreground"}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${step.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {step.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {step.description}
                </div>
              </div>

              {/* Action */}
              {!step.completed && (
                <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
                  <Link to={step.href}>
                    {step.ctaText}
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

