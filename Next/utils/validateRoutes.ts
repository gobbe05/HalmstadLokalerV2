/**
 * Route validation utility
 * 
 * This file defines all valid routes in the application.
 * Use validateInternalLink() to check if a link target is valid.
 * 
 * Run the route audit by importing and calling auditRouteLinks() in development.
 */

// All valid static routes in the application
export const VALID_ROUTES = [
  // Public routes
  '/',
  '/lokaler',
  '/fastighetsagare',
  '/om-oss',
  '/lagg-in-annons',
  '/mina-favoriter',
  
  // Canonical category routes (SEO-friendly, no underscores)
  '/kontor/',
  '/lager/',
  '/butik/',
  '/industri/',
  '/restaurang/',
  '/skola-vard-omsorg/',
  '/coworking/',
  '/ovrigt/',
  
  // Auth routes
  '/auth',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/admin/login',
  
  // Admin routes
  '/admin',
  '/admin/kunder',
  '/admin/stader',
  '/admin/lokaler',
  '/admin/leads',
  '/admin/fakturering',
  '/admin/statistik',
  '/admin/profil',
  
  // Advertiser routes
  '/app',
  '/app/lokaler',
  '/app/leads',
  '/app/profil',
] as const;

// Route patterns with dynamic segments
export const DYNAMIC_ROUTE_PATTERNS = [
  /^\/fastighetsagare\/[\w-]+$/,        // /fastighetsagare/:slug
  /^\/lokal\/[\w-]+$/,                   // /lokal/:id
  /^\/admin\/kunder\/[\w-]+$/,           // /admin/kunder/:id
  /^\/admin\/lokaler\/[\w-]+$/,          // /admin/lokaler/:id
  /^\/app\/lokaler\/[\w-]+$/,            // /app/lokaler/:id
  /^\/app\/lokaler\/new$/,               // /app/lokaler/new (special case)
  /^\/[\w-]+\/$/,                        // /:slug/ (category pages with trailing slash)
] as const;

/**
 * Validates if an internal link target is a valid route
 */
export function validateInternalLink(path: string): boolean {
  // Check static routes
  if (VALID_ROUTES.includes(path as any)) {
    return true;
  }
  
  // Check dynamic route patterns
  for (const pattern of DYNAMIC_ROUTE_PATTERNS) {
    if (pattern.test(path)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Common internal link targets used in the codebase
 * This serves as documentation and can be used for validation
 */
export const COMMON_LINK_TARGETS = {
  // Auth
  login: '/auth',
  signup: '/auth?mode=signup',
  forgotPassword: '/auth/forgot-password',
  
  // Public
  home: '/',
  listings: '/lokaler',
  favorites: '/mina-favoriter',
  advertiserOnboarding: '/lagg-in-annons',
  
  // Category pages (canonical slugs)
  categoryKontor: '/kontor/',
  categoryLager: '/lager/',
  categoryButik: '/butik/',
  categoryIndustri: '/industri/',
  categoryRestaurang: '/restaurang/',
  categorySkolaVard: '/skola-vard-omsorg/',
  categoryCoworking: '/coworking/',
  categoryOvrigt: '/ovrigt/',
  
  // Advertiser portal
  appDashboard: '/app',
  appListings: '/app/lokaler',
  appNewListing: '/app/lokaler/new',
  appLeads: '/app/leads',
  appProfile: '/app/profil',
  
  // Admin portal
  adminDashboard: '/admin',
  adminCustomers: '/admin/kunder',
  adminListings: '/admin/lokaler',
  adminLeads: '/admin/leads',
  adminStats: '/admin/statistik',
  adminProfile: '/admin/profil',
  adminCities: '/admin/stader',
} as const;

// Type for valid link targets
export type ValidLinkTarget = typeof COMMON_LINK_TARGETS[keyof typeof COMMON_LINK_TARGETS];

/**
 * Development helper: logs warning if link target is invalid
 */
export function warnIfInvalidRoute(path: string, componentName?: string): void {
  if (import.meta.env.DEV && !validateInternalLink(path)) {
    console.warn(
      `[Route Validation] Invalid link target: "${path}"` +
      (componentName ? ` in ${componentName}` : '') +
      '\nCheck VALID_ROUTES in src/utils/validateRoutes.ts'
    );
  }
}
