'use client'
import { Mail, Phone, Eye, Building2, EyeOff } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ProfilePreviewData {
  contactName: string;
  contactTitle?: string;
  email: string;
  phone: string;
  companyName: string;
  companyLogo?: string;
}

interface ProfilePreviewCardProps {
  data: ProfilePreviewData;
  prelistingMode?: boolean;
}

function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function ProfilePreviewCard({ data, prelistingMode = false }: ProfilePreviewCardProps) {
  return (
    <Card className="border-2 border-dashed border-primary/30 bg-card/50">
      <CardHeader className="pb-2 pt-4 px-4">
        <p className="text-xs font-medium text-primary uppercase tracking-wider">
          Så visas du för företag
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/* Contact Card Preview */}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Kontakt & ansvarig annonsör
          </p>
          
          {/* Avatar and name */}
          <div className="flex items-center gap-4 mb-4">
            {prelistingMode ? (
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              </div>
            ) : data.companyLogo ? (
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={data.companyLogo}
                  alt="Logotyp"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <span className="text-base font-medium text-muted-foreground">
                  {data.contactName ? getInitials(data.contactName) : "?"}
                </span>
              </div>
            )}

            <div className="min-w-0">
              {prelistingMode ? (
                <>
                  <p className="font-medium text-muted-foreground">
                    Annonsör: Diskret
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Kontakt sker via HalmstadLokaler
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium truncate">
                    {data.companyName || <span className="text-muted-foreground italic">Företagsnamn</span>}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    Kontaktperson: {data.contactName || <span className="italic">Ditt namn</span>}
                    {data.contactTitle && `, ${data.contactTitle}`}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Contact buttons preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm bg-background">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {prelistingMode ? (
                  <span className="italic">Dold för besökare</span>
                ) : (
                  data.phone || <span className="italic">Visa telefon</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm bg-background">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {prelistingMode ? (
                  <span className="italic">Dold för besökare</span>
                ) : (
                  data.email || <span className="italic">Visa e-post</span>
                )}
              </span>
            </div>
          </div>

          {/* CTA Preview */}
          <div className="mt-3">
            <div className="w-full py-2.5 px-4 rounded-lg bg-primary/10 text-primary text-sm font-medium text-center">
              Kontakta annonsör
            </div>
          </div>

          {/* Microcopy under button */}
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Företag kontaktar dig direkt via denna information.
          </p>
        </div>

        {/* Advertiser Section Preview - only shown if not prelisting */}
        {!prelistingMode && data.companyName && (
          <div className="text-center py-4 mt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">
              Lokalen annonseras av
            </p>
            <p className="font-semibold text-sm">{data.companyName}</p>
            {data.companyLogo && (
              <div className="flex justify-center mt-2">
                <img
                  src={data.companyLogo}
                  alt={`${data.companyName} logotyp`}
                  className="max-w-[80px] max-h-10 object-contain opacity-80"
                />
              </div>
            )}
          </div>
        )}

        {/* Prelisting info */}
        {prelistingMode && (
          <div className="text-center py-4 mt-4 border-t border-border bg-muted/30 rounded-lg -mx-2 px-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <EyeOff className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Diskret läge aktivt</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Företagsnamn visas inte publikt. Kontakt sker via HalmstadLokaler.
            </p>
          </div>
        )}

        {/* Help text */}
        <p className="text-xs text-muted-foreground mt-4 text-center leading-relaxed">
          Denna information visas tillsammans med varje lokalannons.
        </p>
      </CardContent>
    </Card>
  );
}

