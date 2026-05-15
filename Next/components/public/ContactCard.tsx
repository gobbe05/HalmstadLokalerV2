'use client'
import { useState } from "react";
import { Mail, Phone, Eye, EyeOff } from "lucide-react";
import { useCityContext } from "@/contexts/CityContext";
import { trackContactReveal } from "@/lib/properties";

type ContactCardProps = {
  contactName: string | null;
  contactTitle?: string | null;
  contactEmail: string | null;
  contactPhonePrimary: string | null;
  contactPhoneSecondary?: string | null;
  companyLogo?: string | null;
  companyName?: string | null;
  propertyId?: string;
  isPrelisting?: boolean;
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function ContactCard({
  contactName,
  contactTitle,
  contactEmail,
  contactPhonePrimary,
  contactPhoneSecondary,
  companyLogo,
  companyName,
  propertyId,
  isPrelisting = false,
}: ContactCardProps) {
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const { currentCity } = useCityContext();

  const handleRevealEmail = () => {
    setShowEmail(true);
    if (propertyId) {
      trackContactReveal(propertyId, "email");
    }
  };

  const handleRevealPhone = () => {
    setShowPhone(true);
    if (propertyId) {
      trackContactReveal(propertyId, "phone");
    }
  };

  // Show discrete message for prelisting
  if (isPrelisting) {
    const cityName = currentCity?.name || "oss";
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-medium">Diskret annonsering</p>
            <p className="text-sm text-muted-foreground">Kontakta via formuläret</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Fastighetsägaren har valt diskret annonsering. Kontakta dem via formuläret så förmedlar {cityName}Lokaler din förfrågan.
        </p>
      </div>
    );
  }

  const hasContactInfo = contactEmail || contactPhonePrimary;
  const hasAnyContent = contactName || hasContactInfo;

  if (!hasAnyContent) {
    return null;
  }

  // Mask email: show first 2 chars + domain hint
  const maskEmail = (email: string) => {
    const [local, domain] = email.split("@");
    if (!domain) return "***@***";
    const domainParts = domain.split(".");
    const domainName = domainParts[0];
    return `${local.slice(0, 2)}***@${domainName.slice(0, 3)}...`;
  };

  // Mask phone: show first 4 digits
  const maskPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return `${digits.slice(0, 3)}-***`;
  };

  return (
    <div className="space-y-4">
      {/* Name and title - prominent hierarchy */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-muted border border-border/50 flex items-center justify-center shrink-0">
          <span className="text-base font-medium text-muted-foreground">
            {getInitials(contactName)}
          </span>
        </div>
        <div className="min-w-0">
          {contactName && (
            <p className="font-semibold text-foreground truncate">
              {contactName}
            </p>
          )}
          {contactTitle && (
            <p className="text-sm text-muted-foreground truncate">
              {contactTitle}
            </p>
          )}
        </div>
      </div>

      {/* Contact reveal buttons */}
      <div className="space-y-2">
        {contactEmail && (
          <div>
            {showEmail ? (
              <a
                href={`mailto:${contactEmail}`}
                className="flex items-center gap-3 text-sm text-foreground hover:text-accent transition-colors py-2"
              >
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="break-all">{contactEmail}</span>
              </a>
            ) : (
              <button
                className="flex items-center gap-3 w-full text-left text-sm py-2 group"
                onClick={handleRevealEmail}
              >
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{maskEmail(contactEmail)}</span>
                <span className="ml-auto text-accent text-xs font-medium flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Eye className="h-3 w-3" />
                  Visa
                </span>
              </button>
            )}
          </div>
        )}

        {contactPhonePrimary && (
          <div>
            {showPhone ? (
              <div className="space-y-1">
                <a
                  href={`tel:${contactPhonePrimary}`}
                  className="flex items-center gap-3 text-sm text-foreground hover:text-accent transition-colors py-2"
                >
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{contactPhonePrimary}</span>
                </a>
                {contactPhoneSecondary && (
                  <a
                    href={`tel:${contactPhoneSecondary}`}
                    className="flex items-center gap-3 text-sm text-foreground hover:text-accent transition-colors py-2 pl-7"
                  >
                    <span>{contactPhoneSecondary}</span>
                  </a>
                )}
              </div>
            ) : (
              <button
                className="flex items-center gap-3 w-full text-left text-sm py-2 group"
                onClick={handleRevealPhone}
              >
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{maskPhone(contactPhonePrimary)}</span>
                <span className="ml-auto text-accent text-xs font-medium flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Eye className="h-3 w-3" />
                  Visa
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Company logo as subtle footer */}
      {companyLogo && (
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
              <img
                src={companyLogo}
                alt="Företagslogotyp"
                className="h-full w-full object-contain"
              />
            </div>
            {companyName && (
              <span className="text-sm text-muted-foreground truncate">
                {companyName}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

