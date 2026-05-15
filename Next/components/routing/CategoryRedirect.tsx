'use client'
import { useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { SLUG_TO_TYPE, LEGACY_SLUG_REDIRECTS, TYPE_TO_SLUG } from "@/config/categoryHeroConfig";

/**
 * Component that handles 301-style redirects for legacy category slugs.
 * Redirects snake_case and other non-canonical slugs to their canonical versions.
 */
export function CategoryRedirect({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!slug) return;

    // Check if this is a legacy slug that needs redirecting
    const canonicalSlug = LEGACY_SLUG_REDIRECTS[slug.toLowerCase()];
    
    if (canonicalSlug) {
      // Redirect to canonical slug (simulates 301 for SPA)
      navigate(`/${canonicalSlug}/`, { replace: true });
      return;
    }

    // Check if slug contains underscore (should never happen in public URLs)
    if (slug.includes("_")) {
      // Try to find a canonical version
      const normalizedSlug = slug.replace(/_/g, "-");
      if (SLUG_TO_TYPE[normalizedSlug]) {
        navigate(`/${normalizedSlug}/`, { replace: true });
        return;
      }
    }
  }, [slug, navigate]);

  return <>{children}</>;
}

