'use client'
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { AlertTriangle, UserCircle, ArrowRight } from "lucide-react";

export function ProfileReminderCard() {
  const { data: profileData, isLoading } = useProfileCompletion();

  // Don't show if loading or profile is complete
  if (isLoading || !profileData || profileData.isComplete) {
    return null;
  }

  // Calculate what's missing - required fields: contact person, email, phone, address (street, postal code, city)
  const missingFields: string[] = [];
  if (!profileData.hasContactPerson) missingFields.push("Kontaktperson");
  if (!profileData.hasEmail) missingFields.push("E-post");
  if (!profileData.hasPhone) missingFields.push("Telefon");
  if (!profileData.hasAddress) missingFields.push("Adress");
  if (!profileData.hasPostalCode) missingFields.push("Postnummer");
  if (!profileData.hasCity) missingFields.push("Stad");

  const totalFields = 6;
  const completedCount = totalFields - missingFields.length;
  const progressPercentage = (completedCount / totalFields) * 100;

  return (
    <Card className="border-amber-500/50 bg-gradient-to-br from-amber-500/5 to-amber-500/10">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-full bg-amber-500/10 shrink-0">
              <UserCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">
                  Komplettera kontaktuppgifter
                </h3>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
För att publicera din lokal och kunna ta emot förfrågningar behöver kontaktperson, e-post, telefon och adress vara ifyllda.
              </p>
              
              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Profil {Math.round(progressPercentage)}% klar</span>
                  <span className="font-medium">{completedCount}/{totalFields} fält</span>
                </div>
                <Progress value={progressPercentage} className="h-1.5" />
              </div>

              {/* Missing fields */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {missingFields.map((field) => (
                  <span 
                    key={field}
                    className="px-2 py-0.5 text-xs rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  >
                    {field} saknas
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex sm:items-center sm:justify-end">
            <Button asChild className="w-full sm:w-auto gap-1.5">
              <Link to="/app/profil">
                Gå till kontaktuppgifter
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

