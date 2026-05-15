import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCityContext } from "@/contexts/CityContext";

export interface AdvertiserSlugData {
  slug: string;
  cityId: string;
  isActive: boolean;
  profileId: string;
}

/**
 * Hook to get the current advertiser's active slug for the current city
 */
export function useCurrentAdvertiserSlug(profileId: string | undefined) {
  const { currentCity } = useCityContext();
  
  return useQuery({
    queryKey: ["advertiser-slug", profileId, currentCity?.id],
    queryFn: async (): Promise<AdvertiserSlugData | null> => {
      if (!profileId || !currentCity?.id) return null;
      
      // First try to get from advertiser_slugs table
      const { data, error } = await supabase
        .from("advertiser_slugs")
        .select("slug, city_id, is_active, profile_id")
        .eq("profile_id", profileId)
        .eq("city_id", currentCity.id)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching advertiser slug:", error);
      }
      
      if (data) {
        return {
          slug: data.slug,
          cityId: data.city_id,
          isActive: data.is_active,
          profileId: data.profile_id,
        };
      }
      
      // Fallback: If no slug in advertiser_slugs, try to create one from profile.slug
      // This handles advertisers who haven't created any listings yet
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("slug, company_name")
        .eq("id", profileId)
        .single();
      
      if (profileError || !profile?.slug) {
        console.error("No slug available for profile:", profileError);
        return null;
      }
      
      // Create the advertiser_slug entry
      const { data: newSlug, error: insertError } = await supabase
        .from("advertiser_slugs")
        .insert({
          profile_id: profileId,
          city_id: currentCity.id,
          slug: profile.slug,
          is_active: true,
        })
        .select("slug, city_id, is_active, profile_id")
        .single();
      
      if (insertError) {
        // If insert fails due to conflict, try to fetch existing
        console.error("Error creating advertiser slug:", insertError);
        
        // Still return the profile slug as fallback for display
        return {
          slug: profile.slug,
          cityId: currentCity.id,
          isActive: true,
          profileId: profileId,
        };
      }
      
      return {
        slug: newSlug.slug,
        cityId: newSlug.city_id,
        isActive: newSlug.is_active,
        profileId: newSlug.profile_id,
      };
    },
    enabled: !!profileId && !!currentCity?.id,
  });
}

/**
 * Hook to resolve an advertiser by slug within the current city
 * Returns the profile if found, or redirect info if slug is old
 */
export function useResolveAdvertiserSlug(slug: string | undefined) {
  const { currentCity } = useCityContext();
  
  return useQuery({
    queryKey: ["resolve-advertiser-slug", slug, currentCity?.id],
    queryFn: async () => {
      if (!slug || !currentCity?.id) return null;
      
      // First, try to find an active slug
      const { data: activeSlug, error: activeError } = await supabase
        .from("advertiser_slugs")
        .select(`
          slug,
          city_id,
          is_active,
          profile_id,
          profiles!inner(
            id,
            company_name,
            display_name,
            email,
            phone,
            company_logo,
            website,
            address,
            city,
            postal_code,
            org_number,
            status,
            is_active
          )
        `)
        .eq("city_id", currentCity.id)
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      
      if (activeError && activeError.code !== "PGRST116") {
        console.error("Error finding active slug:", activeError);
        throw activeError;
      }
      
      if (activeSlug) {
        const profile = (activeSlug as any).profiles;
        return {
          found: true,
          redirect: false,
          redirectTo: null,
          profile: {
            id: profile.id,
            companyName: profile.company_name,
            displayName: profile.display_name,
            email: profile.email,
            phone: profile.phone,
            companyLogo: profile.company_logo,
            website: profile.website,
            address: profile.address,
            city: profile.city,
            postalCode: profile.postal_code,
            orgNumber: profile.org_number,
            status: profile.status,
            isActive: profile.is_active,
          },
          slug: activeSlug.slug,
        };
      }
      
      // Check if this is an old/inactive slug that should redirect
      const { data: oldSlug, error: oldError } = await supabase
        .from("advertiser_slugs")
        .select(`
          slug,
          city_id,
          is_active,
          profile_id
        `)
        .eq("city_id", currentCity.id)
        .eq("slug", slug)
        .eq("is_active", false)
        .maybeSingle();
      
      if (oldError && oldError.code !== "PGRST116") {
        console.error("Error finding old slug:", oldError);
        throw oldError;
      }
      
      if (oldSlug) {
        // Find the active slug for this profile
        const { data: newActiveSlug } = await supabase
          .from("advertiser_slugs")
          .select("slug")
          .eq("profile_id", oldSlug.profile_id)
          .eq("city_id", currentCity.id)
          .eq("is_active", true)
          .maybeSingle();
        
        if (newActiveSlug) {
          return {
            found: true,
            redirect: true,
            redirectTo: `/annonsor/${newActiveSlug.slug}`,
            profile: null,
            slug: newActiveSlug.slug,
          };
        }
      }
      
      // Fallback: Try to find profile directly by slug field
      // This handles advertisers who don't have an entry in advertiser_slugs yet
      const { data: profileBySlug, error: profileError } = await supabase
        .from("profiles")
        .select(`
          id,
          company_name,
          display_name,
          email,
          phone,
          company_logo,
          website,
          address,
          city,
          postal_code,
          org_number,
          status,
          is_active,
          slug
        `)
        .eq("slug", slug)
        .eq("status", "approved")
        .eq("is_active", true)
        .is("deleted_at", null)
        .maybeSingle();
      
      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error finding profile by slug:", profileError);
      }
      
      if (profileBySlug) {
        return {
          found: true,
          redirect: false,
          redirectTo: null,
          profile: {
            id: profileBySlug.id,
            companyName: profileBySlug.company_name,
            displayName: profileBySlug.display_name,
            email: profileBySlug.email,
            phone: profileBySlug.phone,
            companyLogo: profileBySlug.company_logo,
            website: profileBySlug.website,
            address: profileBySlug.address,
            city: profileBySlug.city,
            postalCode: profileBySlug.postal_code,
            orgNumber: profileBySlug.org_number,
            status: profileBySlug.status,
            isActive: profileBySlug.is_active,
          },
          slug: profileBySlug.slug,
        };
      }
      
      // Not found at all
      return {
        found: false,
        redirect: false,
        redirectTo: null,
        profile: null,
        slug: null,
      };
    },
    enabled: !!slug && !!currentCity?.id,
  });
}

/**
 * Hook to resolve an advertiser by legacy UUID
 * Used to redirect old UUID-based URLs to new slug-based URLs
 */
export function useResolveLegacyAdvertiserId(advertiserId: string | undefined) {
  const { currentCity } = useCityContext();
  
  return useQuery({
    queryKey: ["resolve-legacy-advertiser", advertiserId, currentCity?.id],
    queryFn: async () => {
      if (!advertiserId || !currentCity?.id) return null;
      
      // Check if this looks like a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(advertiserId)) {
        return null; // Not a UUID, probably already a slug
      }
      
      // Find the active slug for this profile ID
      const { data, error } = await supabase
        .from("advertiser_slugs")
        .select("slug")
        .eq("profile_id", advertiserId)
        .eq("city_id", currentCity.id)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error && error.code !== "PGRST116") {
        console.error("Error resolving legacy advertiser ID:", error);
        return null;
      }
      
      if (data) {
        return {
          redirect: true,
          redirectTo: `/annonsor/${data.slug}`,
        };
      }
      
      return null;
    },
    enabled: !!advertiserId && !!currentCity?.id,
  });
}
