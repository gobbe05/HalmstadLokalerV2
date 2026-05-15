import { supabase } from "@/integrations/supabase/client";

export interface Site {
  id: string;
  name: string;
  domain: string | null;
  is_published: boolean;
  seo_title: string | null;
  seo_description: string | null;
  intro_text: string | null;
  hero_image_url: string | null;
}

// Cache for current site to avoid repeated lookups
let cachedSite: Site | null = null;
let cacheHostname: string | null = null;

/**
 * Get the current site based on the hostname
 * Returns the matching city/site or the default (halmstad)
 */
export async function getCurrentSite(): Promise<Site | null> {
  const hostname = window.location.hostname;
  
  // Return cached result if hostname matches
  if (cachedSite && cacheHostname === hostname) {
    return cachedSite;
  }
  
  try {
    const { data: cities, error } = await supabase
      .from("cities")
      .select("id, name, domain, is_published, seo_title, seo_description, intro_text, hero_image_url");
    
    if (error) {
      console.error("Error fetching cities:", error);
      return null;
    }
    
    if (!cities || cities.length === 0) {
      return null;
    }
    
    // Check exact domain match first
    let site = cities.find(c => c.domain === hostname);
    
    // Check if hostname contains domain (for www prefix)
    if (!site) {
      site = cities.find(c => c.domain && hostname.includes(c.domain));
    }
    
    // Check subdomain match (e.g., halmstad.example.com)
    if (!site) {
      const subdomain = hostname.split('.')[0];
      site = cities.find(c => c.id === subdomain);
    }
    
    // Default to halmstad or first city
    if (!site) {
      site = cities.find(c => c.id === 'halmstad') || cities[0];
    }
    
    // Cast to include is_published with default
    cachedSite = {
      ...site,
      is_published: (site as any).is_published ?? false
    };
    cacheHostname = hostname;
    
    return cachedSite;
  } catch (error) {
    console.error("Error in getCurrentSite:", error);
    return null;
  }
}

/**
 * Get the public base URL for a site
 * Returns the production URL if published, otherwise the current origin
 */
export function getPublicBaseUrl(site: Site | null): string {
  if (site?.is_published && site.domain) {
    return `https://${site.domain}`;
  }
  return window.location.origin;
}

/**
 * Get the production URL for a site (even if not published yet)
 * Useful for showing "future production URL" in admin/portal
 */
export function getProductionUrl(site: Site | null): string | null {
  if (site?.domain) {
    return `https://${site.domain}`;
  }
  return null;
}

/**
 * Check if we're on a preview/development environment
 */
export function isPreviewEnvironment(): boolean {
  const hostname = window.location.hostname;
  return (
    hostname.includes('lovable.app') ||
    hostname.includes('localhost') ||
    hostname.includes('127.0.0.1') ||
    hostname.includes('preview')
  );
}

/**
 * Generate the full advertiser page URL
 */
export function getAdvertiserPageUrl(
  slug: string, 
  site: Site | null, 
  preferProduction: boolean = true
): string {
  const base = preferProduction && site?.is_published 
    ? getPublicBaseUrl(site)
    : window.location.origin;
  
  return `${base}/annonsor/${slug}`;
}

/**
 * Clear the site cache (useful after updates)
 */
export function clearSiteCache(): void {
  cachedSite = null;
  cacheHostname = null;
}

/**
 * Slugify a string (matches the database function)
 */
export function slugify(text: string): string {
  if (!text) return '';
  
  let result = text.toLowerCase();
  
  // Replace Swedish characters
  result = result
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/Å/g, 'a')
    .replace(/Ä/g, 'a')
    .replace(/Ö/g, 'o');
  
  // Replace & with "och"
  result = result.replace(/&/g, 'och');
  
  // Replace spaces and underscores with hyphens
  result = result.replace(/[\s_]+/g, '-');
  
  // Remove all non-alphanumeric except hyphens
  result = result.replace(/[^a-z0-9-]/g, '');
  
  // Collapse multiple hyphens
  result = result.replace(/-+/g, '-');
  
  // Trim hyphens from start/end
  result = result.replace(/^-+|-+$/g, '');
  
  // Limit to 50 characters
  result = result.substring(0, 50);
  
  // Trim trailing hyphen after truncation
  result = result.replace(/-+$/g, '');
  
  return result;
}
