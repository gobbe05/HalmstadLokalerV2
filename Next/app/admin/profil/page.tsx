'use client'
import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
}

export default function AdminProfilePage() {
  const { user } = useAuthContext();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    email: "",
    phone: "",
    company_name: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else if (data) {
        setProfile(data);
        setFormData({
          display_name: data.display_name || "",
          email: data.email || "",
          phone: data.phone || "",
          company_name: data.company_name || "",
        });
      }
      setIsLoading(false);
    }

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setIsSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update(formData)
      .eq("id", profile.id);

    if (error) {
      toast.error("Kunde inte spara profilen");
    } else {
      toast.success("Profilen sparad");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="text-muted-foreground">Laddar profil...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-medium text-foreground">Min profil</h1>
          <p className="text-muted-foreground">Hantera dina kontaktuppgifter</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profilinformation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="display_name">Namn</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="company_name">Företag</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Sparar..." : "Spara"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
