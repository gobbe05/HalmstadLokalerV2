import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerBillingOverview {
  profile_id: string;
  display_name: string | null;
  email: string | null;
  company_name: string | null;
  org_number: string | null;
  billing_email: string | null;
  billing_address: string | null;
  billing_zip: string | null;
  billing_city: string | null;
  contact_person: string | null;
  phone: string | null;
  is_complete: boolean;
  missing_fields: string[];
}

/**
 * ADMIN ONLY: Fetches billing overview for all customers.
 */
export function useAdminBilling() {
  return useQuery({
    queryKey: ["admin-billing"],
    queryFn: async (): Promise<CustomerBillingOverview[]> => {
      // Get all advertiser user_ids
      const { data: advertiserRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "advertiser");

      if (!advertiserRoles || advertiserRoles.length === 0) return [];

      const advertiserUserIds = advertiserRoles.map((r) => r.user_id);

      // Get profiles for advertisers
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, email, company_name")
        .in("user_id", advertiserUserIds)
        .is("deleted_at", null)
        .order("company_name", { ascending: true });

      if (!profiles) return [];

      // Get billing info for all profiles
      const profileIds = profiles.map((p) => p.id);
      const { data: billingRecords } = await supabase
        .from("customer_billing")
        .select("*")
        .in("profile_id", profileIds);

      const billingMap = new Map(
        billingRecords?.map((b) => [b.profile_id, b]) || []
      );

      return profiles.map((profile) => {
        const billing = billingMap.get(profile.id);
        const missing: string[] = [];

        if (!billing?.org_number) missing.push("Org.nr");
        if (!billing?.billing_email) missing.push("Faktura-e-post");
        if (!billing?.billing_address) missing.push("Adress");
        if (!billing?.company_name && !profile.company_name) missing.push("Företag");

        return {
          profile_id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
          company_name: billing?.company_name || profile.company_name,
          org_number: billing?.org_number || null,
          billing_email: billing?.billing_email || null,
          billing_address: billing?.billing_address || null,
          billing_zip: billing?.billing_zip || null,
          billing_city: billing?.billing_city || null,
          contact_person: billing?.contact_person || null,
          phone: billing?.phone || null,
          is_complete: missing.length === 0,
          missing_fields: missing,
        };
      });
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
