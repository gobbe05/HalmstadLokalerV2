import { Mail, Phone, Building2 } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

type SizeVariant = {
  label: string;
  avatarSize: string;
  avatarText: string;
  logoSize: string;
};

const sizeVariants: SizeVariant[] = [
  { label: "48px", avatarSize: "h-12 w-12", avatarText: "text-base", logoSize: "h-10 w-10" },
  { label: "52px", avatarSize: "h-[52px] w-[52px]", avatarText: "text-lg", logoSize: "h-11 w-11" },
  { label: "56px", avatarSize: "h-14 w-14", avatarText: "text-lg", logoSize: "h-12 w-12" },
];

const demoContactName = "Annas Nilsson";
const demoContactTitle = "Fastighetschef";
const demoEmail = "anna@company.se";
const demoPhone = "070-123 45 67";
const demoCompanyName = "Annas Bolag";

function ContactDemo({ variant, showPlaceholderLogo }: { variant: SizeVariant; showPlaceholderLogo?: boolean }) {
  return (
    <div className="bg-card border rounded-xl p-6 space-y-4">
      <div className="text-center mb-4">
        <span className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
          {variant.label}
        </span>
      </div>
      
      {/* Avatar + Name */}
      <div className="flex items-center gap-3">
        <div className={`${variant.avatarSize} rounded-full bg-muted border border-border/50 flex items-center justify-center shrink-0`}>
          <span className={`${variant.avatarText} font-medium text-muted-foreground`}>
            {getInitials(demoContactName)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground truncate">{demoContactName}</p>
          <p className="text-sm text-muted-foreground truncate">{demoContactTitle}</p>
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-3 py-2">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{demoEmail}</span>
        </div>
        <div className="flex items-center gap-3 py-2">
          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>{demoPhone}</span>
        </div>
      </div>

      {/* Company logo section */}
      <div className="pt-3 border-t border-border/50">
        <div className="flex items-center gap-2">
          {showPlaceholderLogo ? (
            <div className={`${variant.logoSize} rounded bg-muted flex items-center justify-center overflow-hidden shrink-0`}>
              <Building2 className="h-1/2 w-1/2 text-muted-foreground" />
            </div>
          ) : (
            <div className={`${variant.logoSize} rounded bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden shrink-0 border border-border/30`}>
              <span className="text-xs font-bold text-primary/70">LOGO</span>
            </div>
          )}
          <span className="text-sm text-muted-foreground truncate">{demoCompanyName}</span>
        </div>
      </div>
    </div>
  );
}

export default function SizeComparisonDemo() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PublicHeader />
      
      <main className="flex-1">
        <div className="container max-w-5xl py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold mb-3">Jämförelse av storlekar</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Här ser du kontaktsektionen med olika storlekar för avatar och logotyp. 
              Nuvarande storlek är 40px (h-10).
            </p>
          </div>

          {/* Current size reference */}
          <div className="mb-8 p-4 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground text-center mb-4">
              <strong>Nuvarande storlek (40px)</strong> — för jämförelse
            </p>
            <div className="max-w-xs mx-auto bg-card border rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted border border-border/50 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-muted-foreground">
                    {getInitials(demoContactName)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{demoContactName}</p>
                  <p className="text-sm text-muted-foreground truncate">{demoContactTitle}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-muted/50 flex items-center justify-center shrink-0">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground truncate">{demoCompanyName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Size variants comparison */}
          <div className="grid md:grid-cols-3 gap-6">
            {sizeVariants.map((variant) => (
              <ContactDemo key={variant.label} variant={variant} showPlaceholderLogo />
            ))}
          </div>

          {/* Recommendation */}
          <div className="mt-10 p-6 bg-primary/5 rounded-xl border border-primary/20">
            <h2 className="font-semibold mb-2">Min rekommendation</h2>
            <p className="text-muted-foreground text-sm">
              <strong>52px</strong> ger bäst balans mellan synlighet och proportioner. 
              Avataren blir tydligt läsbar och logotypen får tillräckligt utrymme utan att dominera layouten.
              56px fungerar också bra om du vill ha en ännu mer framträdande kontaktsektion.
            </p>
          </div>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}
