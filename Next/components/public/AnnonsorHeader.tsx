'use client'
import { Phone, Mail } from "lucide-react";
import Link from "next/link";

export interface AnnonsorHeaderProps {
  logoUrl?: string | null;
  companyName: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  backLink?: string;
  /** Compact mode for sticky headers - reduces padding and hides contact name on mobile */
  compact?: boolean;
}

/**
 * Global advertiser header component - "business card" style
 * Used on all advertiser pages (/annonsor/:slug) and property owner pages (/fastighetsagare/:slug)
 * 
 * Design rules:
 * - If logoUrl exists → show only logo (hide company name visually, keep for SEO)
 * - If logoUrl missing → show company name as heading
 * - Contact person displayed as secondary text (never as main heading)
 * - CTAs: Phone button with number, Email button with "Skicka e-post"
 * - Never show: addresses, "kontakta oss direkt...", metadata, empty fields
 */
export function AnnonsorHeader({
  logoUrl,
  companyName,
  contactName,
  phone,
  email,
  backLink,
  compact = false,
}: AnnonsorHeaderProps) {
  // Wrapper component for identity zone - Link if backLink provided, div otherwise
  const IdentityContent = (
    <>
      {/* Logo - only shown if exists */}
      {logoUrl && (
        <div className="flex-shrink-0">
          <img
            src={logoUrl}
            alt={`${companyName} logotyp`}
            className={compact 
              ? "h-8 md:h-10 max-h-[32px] md:max-h-[40px] max-w-[120px] md:max-w-[160px] w-auto object-contain"
              : "h-12 md:h-16 max-h-[48px] md:max-h-[64px] max-w-[200px] md:max-w-[280px] w-auto object-contain"
            }
          />
        </div>
      )}
      
      <div className="flex flex-col gap-1">
        {/* PRIMARY: Company name (hidden visually if logo exists, kept for SEO) */}
        {logoUrl ? (
          <span className="sr-only">{companyName}</span>
        ) : (
          <span className={`${compact ? 'text-base md:text-lg' : 'text-xl md:text-2xl'} font-heading font-bold tracking-tight text-foreground`}>
            {companyName}
          </span>
        )}
        
        {/* SECONDARY: Contact person - hidden on mobile in compact mode */}
        {contactName && contactName.trim() && contactName !== companyName && (
          <p className={`text-xs md:text-sm text-muted-foreground/80 ${compact ? 'hidden md:block' : ''}`}>
            <span className="font-medium">Kontakt:</span> {contactName}
          </p>
        )}
      </div>
    </>
  );

  return (
    <header className={`bg-secondary/30 ${compact ? '' : 'border-b border-border/40'}`}>
      <div className={`container mx-auto px-4 ${compact ? 'py-3 md:py-4' : 'py-8 md:py-10'}`}>
        {/* Two-zone layout: Identity (left) + Contact CTAs (right) */}
        <div className={`flex ${compact ? 'flex-row items-center justify-between' : 'flex-col lg:flex-row lg:items-center lg:justify-between'} gap-4 ${compact ? '' : 'lg:gap-6'}`}>
          
          {/* LEFT ZONE: Identity */}
          {backLink ? (
            <Link 
              href={backLink} 
              className="flex items-center gap-4 hover:opacity-80 transition-opacity"
            >
              {IdentityContent}
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              {IdentityContent}
            </div>
          )}
          
          {/* SEO: h1 for company name when used as page header */}
          {!backLink && <h1 className="sr-only">{companyName}</h1>}
          
          {/* RIGHT ZONE: Contact CTAs only */}
          <div className={`flex ${compact ? 'flex-row' : 'flex-col sm:flex-row'} gap-2 sm:gap-3`}>
            {phone && (
              <a
                href={`tel:${phone}`}
                className={`inline-flex items-center justify-center gap-2 rounded-full 
                           bg-accent text-accent-foreground font-medium
                           hover:bg-accent/90 transition-colors shadow-sm
                           ${compact ? 'px-3 py-2 text-xs md:px-4 md:py-2 md:text-sm min-h-[36px] md:min-h-[40px]' : 'px-5 py-2.5 text-sm min-h-[44px]'}`}
              >
                <Phone className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                <span className={compact ? 'hidden sm:inline' : ''}>{phone}</span>
              </a>
            )}
            
            {email && (
              <a
                href={`mailto:${email}`}
                className={`inline-flex items-center justify-center gap-2 rounded-full 
                           bg-background border-2 border-accent/30 text-foreground font-medium
                           hover:border-accent hover:bg-accent/5 transition-colors
                           ${compact ? 'px-3 py-2 text-xs md:px-4 md:py-2 md:text-sm min-h-[36px] md:min-h-[40px]' : 'px-5 py-2.5 text-sm min-h-[44px]'}`}
              >
                <Mail className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                <span className={compact ? 'hidden sm:inline' : ''}>Skicka e-post</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

