'use client'
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Receipt, Loader2 } from "lucide-react";

interface BillingSectionProps {
  profileId: string;
}

interface CustomerBilling {
  id: string;
  profile_id: string;
  company_name: string | null;
  org_number: string | null;
  contact_person: string | null;
  phone: string | null;
  email_general: string | null;
  billing_address: string | null;
  billing_zip: string | null;
  billing_city: string | null;
  billing_email: string | null;
}

export function BillingSection({ profileId }: BillingSectionProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    company_name: "",
    org_number: "",
    contact_person: "",
    phone: "",
    email_general: "",
    billing_address: "",
    billing_zip: "",
    billing_city: "",
    billing_email: "",
  });

  const { data: billing, isLoading } = useQuery({
    queryKey: ["customer-billing", profileId],
    queryFn: async () => {
      // Try to fetch existing billing record
      const { data, error } = await supabase
        .from("customer_billing")
        .select("*")
        .eq("profile_id", profileId)
        .maybeSingle();

      if (error) throw error;

      // If no billing record exists, create one
      if (!data) {
        const { data: newBilling, error: insertError } = await supabase
          .from("customer_billing")
          .insert({ profile_id: profileId })
          .select()
          .single();

        if (insertError) throw insertError;
        return newBilling as CustomerBilling;
      }

      return data as CustomerBilling;
    },
    enabled: !!profileId,
  });

  useEffect(() => {
    if (billing) {
      setFormData({
        company_name: billing.company_name || "",
        org_number: billing.org_number || "",
        contact_person: billing.contact_person || "",
        phone: billing.phone || "",
        email_general: billing.email_general || "",
        billing_address: billing.billing_address || "",
        billing_zip: billing.billing_zip || "",
        billing_city: billing.billing_city || "",
        billing_email: billing.billing_email || "",
      });
    }
  }, [billing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!formData.company_name.trim()) {
        throw new Error("Företagsnamn krävs");
      }
      if (!formData.org_number.trim()) {
        throw new Error("Organisationsnummer krävs");
      }
      if (!formData.billing_email.trim()) {
        throw new Error("Faktura-e-post krävs");
      }

      const { error } = await supabase
        .from("customer_billing")
        .update({
          company_name: formData.company_name.trim(),
          org_number: formData.org_number.trim(),
          contact_person: formData.contact_person.trim() || null,
          phone: formData.phone.trim() || null,
          email_general: formData.email_general.trim() || null,
          billing_address: formData.billing_address.trim() || null,
          billing_zip: formData.billing_zip.trim() || null,
          billing_city: formData.billing_city.trim() || null,
          billing_email: formData.billing_email.trim(),
        })
        .eq("profile_id", profileId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-billing", profileId] });
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Faktureringsuppgifter sparade");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Kunde inte spara");
    },
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4" />
            Faktureringsuppgifter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="h-4 w-4" />
          Faktureringsuppgifter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="company_name">
              Företagsnamn <span className="text-destructive">*</span>
            </Label>
            <Input
              id="company_name"
              value={formData.company_name}
              onChange={(e) => handleChange("company_name", e.target.value)}
              placeholder="Juridiskt företagsnamn"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org_number">
              Organisationsnummer <span className="text-destructive">*</span>
            </Label>
            <Input
              id="org_number"
              value={formData.org_number}
              onChange={(e) => handleChange("org_number", e.target.value)}
              placeholder="XXXXXX-XXXX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_person">Kontaktperson</Label>
            <Input
              id="contact_person"
              value={formData.contact_person}
              onChange={(e) => handleChange("contact_person", e.target.value)}
              placeholder="Namn på kontaktperson"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefonnummer</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="07X-XXX XX XX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_general">Allmän e-post</Label>
            <Input
              id="email_general"
              type="email"
              value={formData.email_general}
              onChange={(e) => handleChange("email_general", e.target.value)}
              placeholder="info@foretag.se"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_email">
              Faktura-e-post <span className="text-destructive">*</span>
            </Label>
            <Input
              id="billing_email"
              type="email"
              value={formData.billing_email}
              onChange={(e) => handleChange("billing_email", e.target.value)}
              placeholder="faktura@foretag.se"
            />
          </div>
        </div>

        <div className="pt-2">
          <Label className="text-sm font-medium mb-3 block">Faktureringsadress</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3 space-y-2">
              <Label htmlFor="billing_address" className="text-xs text-muted-foreground">
                Gatuadress
              </Label>
              <Input
                id="billing_address"
                value={formData.billing_address}
                onChange={(e) => handleChange("billing_address", e.target.value)}
                placeholder="Storgatan 1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="billing_zip" className="text-xs text-muted-foreground">
                Postnummer
              </Label>
              <Input
                id="billing_zip"
                value={formData.billing_zip}
                onChange={(e) => handleChange("billing_zip", e.target.value)}
                placeholder="123 45"
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="billing_city" className="text-xs text-muted-foreground">
                Stad
              </Label>
              <Input
                id="billing_city"
                value={formData.billing_city}
                onChange={(e) => handleChange("billing_city", e.target.value)}
                placeholder="Stockholm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Spara faktureringsuppgifter
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

