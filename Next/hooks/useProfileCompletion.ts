import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

export type ProfileStatus = "pending" | "approved" | "rejected";

export interface ProfileCompletionData {
  isComplete: boolean;
  hasContactPerson: boolean;
  hasPhone: boolean;
  hasEmail: boolean;
  hasCompanyName: boolean;
  hasAddress: boolean;
  hasPostalCode: boolean;
  hasCity: boolean;
  profileId: string | null;
  /** The advertiser's approval status. Only 'approved' advertisers can publish listings publicly. */
  advertiserStatus: ProfileStatus;
  /** Whether the advertiser is approved and can publish listings publicly */
  isApproved: boolean;
  profile: {
    display_name: string | null;
    company_name: string | null;
    org_number: string | null;
    phone: string | null;
    email: string | null;
    company_logo: string | null;
    contact_title: string | null;
    address: string | null;
    postal_code: string | null;
    city: string | null;
    status: ProfileStatus;
  } | null;
}

export function useProfileCompletion() {
  const { user } = useAuthContext();

  return useQuery({
    queryKey: ["profile-completion", user?.id],
    queryFn: async (): Promise<ProfileCompletionData> => {
      if (!user?.id) {
        return {
          isComplete: false,
          hasContactPerson: false,
          hasPhone: false,
          hasEmail: false,
          hasCompanyName: false,
          hasAddress: false,
          hasPostalCode: false,
          hasCity: false,
          profileId: null,
          advertiserStatus: "pending",
          isApproved: false,
          profile: null,
        };
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, display_name, company_name, org_number, phone, email, company_logo, contact_title, address, postal_code, city, status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !profile) {
        return {
          isComplete: false,
          hasContactPerson: false,
          hasPhone: false,
          hasEmail: false,
          hasCompanyName: false,
          hasAddress: false,
          hasPostalCode: false,
          hasCity: false,
          profileId: null,
          advertiserStatus: "pending",
          isApproved: false,
          profile: null,
        };
      }

      const hasContactPerson = !!profile.display_name?.trim();
      const hasPhone = !!profile.phone?.trim();
      const hasEmail = !!profile.email?.trim();
      const hasCompanyName = !!profile.company_name?.trim();
      const hasAddress = !!profile.address?.trim();
      const hasPostalCode = !!profile.postal_code?.trim();
      const hasCity = !!profile.city?.trim();

      // Profile is complete if all required fields are filled:
      // Contact person, email, phone, company name, and full address (street, postal code, city)
      const isComplete = hasContactPerson && hasEmail && hasPhone && hasCompanyName && hasAddress && hasPostalCode && hasCity;
      
      // Cast status to ProfileStatus (defaults to 'pending' if null)
      const advertiserStatus = (profile.status as ProfileStatus) || "pending";
      const isApproved = advertiserStatus === "approved";

      return {
        isComplete,
        hasContactPerson,
        hasPhone,
        hasEmail,
        hasCompanyName,
        hasAddress,
        hasPostalCode,
        hasCity,
        profileId: profile.id,
        advertiserStatus,
        isApproved,
        profile: {
          display_name: profile.display_name,
          company_name: profile.company_name,
          org_number: profile.org_number,
          phone: profile.phone,
          email: profile.email,
          company_logo: profile.company_logo,
          contact_title: profile.contact_title,
          address: profile.address,
          postal_code: profile.postal_code,
          city: profile.city,
          status: advertiserStatus,
        },
      };
    },
    enabled: !!user?.id,
  });
}
