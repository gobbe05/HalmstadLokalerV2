'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Check, Loader2, Search, Building2, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LocalMatchingFormProps {
  advertiserId: string;
  advertiserName?: string;
  defaultExpanded?: boolean;
}

const MOVE_OPTIONS = [
  { value: "3", label: "Inom 3 månader" },
  { value: "6", label: "Inom 6 månader" },
  { value: "12", label: "Inom 12 månader" },
  { value: "18", label: "Inom 18 månader" },
  { value: "24", label: "Inom 24 månader" },
];

const LEASE_OPTIONS = [
  { value: "ja", label: "Ja" },
  { value: "nej", label: "Nej" },
  { value: "nyetablering", label: "Nyetablering" },
];

export function LocalMatchingForm({ advertiserId, advertiserName, defaultExpanded = false }: LocalMatchingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Auto-reset success message after 8 seconds
  useEffect(() => {
    if (isSubmitted) {
      const timer = setTimeout(() => {
        setIsSubmitted(false);
        setIsExpanded(false);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted]);
  
  const [formData, setFormData] = useState({
    minArea: "",
    maxArea: "",
    moveWithinMonths: "",
    leaseStatus: "",
    message: "",
    companyName: "",
    orgNumber: "",
    contactName: "",
    phone: "",
    email: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.companyName.trim()) {
      toast.error("Vänligen ange företagsnamn");
      return;
    }
    if (!formData.contactName.trim()) {
      toast.error("Vänligen ange kontaktperson");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Vänligen ange telefonnummer");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Vänligen ange e-postadress");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke("public-leads", {
        body: {
          advertiser_id: advertiserId,
          lead_type: "matching",
          contact_name: formData.contactName.trim(),
          company_name: formData.companyName.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          message: formData.message.trim() || null,
          min_area_sqm: formData.minArea ? parseInt(formData.minArea, 10) : null,
          max_area_sqm: formData.maxArea ? parseInt(formData.maxArea, 10) : null,
          move_within_months: formData.moveWithinMonths ? parseInt(formData.moveWithinMonths, 10) : null,
          lease_status: formData.leaseStatus || null,
          org_number: formData.orgNumber.trim() || null,
        },
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success("Din förfrågan har skickats!");
    } catch (err) {
      console.error("Error submitting matching form:", err);
      toast.error("Kunde inte skicka förfrågan. Försök igen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="w-full border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Tack för din förfrågan!
          </h3>
          <p className="text-muted-foreground">
            {advertiserName ? `${advertiserName} har mottagit` : "Vi har mottagit"} din förfrågan och återkommer så snart som möjligt.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden border-border/60 shadow-sm">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <button className="w-full p-6 flex items-center gap-4 text-left hover:bg-muted/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-foreground">
                Hittar du inte rätt lokal?
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Beskriv vad ni söker så kontaktar vi er när vi hittar något som passar.
              </p>
            </div>
            <ChevronDown 
              className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`} 
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
          <CardContent className="pt-0 pb-6 px-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Section 1: Area */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Hur stor lokal söker ni?</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minArea">Minsta yta (kvm)</Label>
                    <Input
                      id="minArea"
                      type="number"
                      min="0"
                      placeholder="t.ex. 50"
                      value={formData.minArea}
                      onChange={(e) => handleChange("minArea", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxArea">Största yta (kvm)</Label>
                    <Input
                      id="maxArea"
                      type="number"
                      min="0"
                      placeholder="t.ex. 200"
                      value={formData.maxArea}
                      onChange={(e) => handleChange("maxArea", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Move status */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Vad är er flyttstatus?</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="moveWithin">Behov av ny lokal</Label>
                    <Select 
                      value={formData.moveWithinMonths}
                      onValueChange={(value) => handleChange("moveWithinMonths", value)}
                    >
                      <SelectTrigger id="moveWithin">
                        <SelectValue placeholder="Välj tidsram" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOVE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Hyreskontrakt uppsagt?</Label>
                    <RadioGroup
                      value={formData.leaseStatus}
                      onValueChange={(value) => handleChange("leaseStatus", value)}
                      className="flex flex-wrap gap-4 pt-2"
                    >
                      {LEASE_OPTIONS.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`lease-${option.value}`} />
                          <Label htmlFor={`lease-${option.value}`} className="cursor-pointer font-normal">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>
              </div>

              {/* Section 3: Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Övrig information och önskemål</Label>
                <Textarea
                  id="message"
                  placeholder="Beskriv gärna vilken typ av lokal ni söker, specifika krav eller önskemål..."
                  rows={4}
                  maxLength={1000}
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {formData.message.length}/1000 tecken
                </p>
              </div>

              {/* Section 4: Company info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Företagsuppgifter
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Företagsnamn *</Label>
                    <Input
                      id="companyName"
                      placeholder="Ert företagsnamn"
                      value={formData.companyName}
                      onChange={(e) => handleChange("companyName", e.target.value)}
                      maxLength={200}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="orgNumber">Organisationsnummer</Label>
                    <Input
                      id="orgNumber"
                      placeholder="XXXXXX-XXXX"
                      value={formData.orgNumber}
                      onChange={(e) => handleChange("orgNumber", e.target.value)}
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Contact info */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Hur når vi dig?</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Kontaktperson *</Label>
                    <Input
                      id="contactName"
                      placeholder="Ditt namn"
                      value={formData.contactName}
                      onChange={(e) => handleChange("contactName", e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefonnummer *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="070-123 45 67"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      maxLength={30}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-postadress *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="din@email.se"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      maxLength={255}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Skickar...
                  </>
                ) : (
                  "Skicka förfrågan"
                )}
              </Button>
            </form>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

