'use client'
import { 
  MapPin, 
  Maximize, 
  Building2, 
  Calendar,
  Eye,
  FileText
} from "lucide-react";
import DOMPurify from "dompurify";
import { type Listing } from "@/hooks/useListings";
import { Badge } from "@/components/ui/badge";
import { PropertyTypeBadges } from "@/components/public/PropertyTypeBadges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { ImageSlider } from "@/components/public/ImageSlider";
import { AddressMapPreview } from "./AddressMapPreview";

interface ListingPreviewProps {
  listing: Partial<Listing>;
  trigger?: React.ReactNode;
}

export function ListingPreview({ listing, trigger }: ListingPreviewProps) {
  const monthlyRent =
    listing.hyra_per_m2_ar && listing.area_sqm
      ? Math.round((listing.hyra_per_m2_ar * listing.area_sqm) / 12)
      : null;

  const typeLabel = listing.typ || "Lokal";
  const images = listing.bilder || [];
  const documents = listing.dokument || [];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            Förhandsgranska
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 [&>button]:hidden">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-muted-foreground" />
              Förhandsvisning – Publik sida
            </DialogTitle>
            <DialogClose asChild>
              <button
                className="rounded-full p-2 hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Stäng"
              >
                <X className="h-5 w-5" />
              </button>
            </DialogClose>
          </div>
          <p className="text-sm text-muted-foreground">
            Så här kommer lokalen att visas för besökare på den publika sidan
          </p>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Image slider preview */}
          {images.length > 0 ? (
            <ImageSlider images={images} alt={listing.titel || "Lokal"} />
          ) : (
            <div className="aspect-[16/9] bg-muted rounded-xl flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Inga bilder uppladdade</p>
              </div>
            </div>
          )}

          {/* Title and badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {listing.typ && (
                <PropertyTypeBadges 
                  typeString={listing.typ} 
                  maxVisible={4}
                  variant="outline"
                  size="sm"
                  showIcon={true}
                />
              )}
              {listing.area_sqm && (
                <Badge variant="outline" className="text-xs px-2 py-0.5">{listing.area_sqm} m²</Badge>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {listing.titel || "Titel saknas"}
            </h1>
            {listing.adress && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>
                  {listing.adress}
                  {listing.stad && `, ${listing.stad}`}
                </span>
              </div>
            )}
          </div>

          {/* Facts table */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-semibold mb-4">Fakta</h2>
            <div className="grid grid-cols-2 gap-4">
              {typeLabel && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Typ</p>
                    <p className="font-medium">{typeLabel}</p>
                  </div>
                </div>
              )}
              {listing.area_sqm && (
                <div className="flex items-start gap-3">
                  <Maximize className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Area</p>
                    <p className="font-medium">{listing.area_sqm} m²</p>
                  </div>
                </div>
              )}
              {listing.adress && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Adress</p>
                    <p className="font-medium">
                      {listing.adress}
                      {listing.postnummer && `, ${listing.postnummer}`}
                      {listing.stad && ` ${listing.stad}`}
                    </p>
                  </div>
                </div>
              )}
              {monthlyRent && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Hyra</p>
                    <p className="font-medium">
                      {monthlyRent.toLocaleString("sv-SE")} kr/mån
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Short description */}
          {listing.beskrivning_kort && (
            <div>
              <h2 className="font-semibold mb-2">Kort beskrivning</h2>
              <p className="text-muted-foreground">{listing.beskrivning_kort}</p>
            </div>
          )}

          {/* Long description */}
          {listing.beskrivning_lang && (
            <div>
              <h2 className="font-semibold mb-4">Beskrivning</h2>
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(listing.beskrivning_lang) }}
              />
            </div>
          )}

          {/* Documents section */}
          {documents.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4">Ritningar och dokument</h2>
              <div className="space-y-2">
                {documents.map((doc, index) => {
                  const fileName = doc.split('/').pop() || `Dokument ${index + 1}`;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">{fileName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map preview */}
          {listing.adress && (listing.koordinater_lat || listing.koordinater_lng) && (
            <div>
              <h2 className="font-semibold mb-4">Karta</h2>
              <AddressMapPreview
                address={listing.adress}
                postalCode={listing.postnummer || undefined}
                city={listing.stad || undefined}
                latitude={listing.koordinater_lat}
                longitude={listing.koordinater_lng}
                minimal
              />
            </div>
          )}

          {/* Empty state warnings */}
          <div className="border-t pt-6 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Checklista:</p>
            <ul className="text-sm space-y-1">
              <li className={listing.titel ? "text-primary" : "text-amber-500"}>
                {listing.titel ? "✓" : "○"} Titel
              </li>
              <li className={listing.typ ? "text-primary" : "text-amber-500"}>
                {listing.typ ? "✓" : "○"} Lokaltyp
              </li>
              <li className={listing.adress ? "text-primary" : "text-amber-500"}>
                {listing.adress ? "✓" : "○"} Adress
              </li>
              <li className={listing.area_sqm ? "text-primary" : "text-amber-500"}>
                {listing.area_sqm ? "✓" : "○"} Yta
              </li>
              <li className={images.length > 0 ? "text-primary" : "text-amber-500"}>
                {images.length > 0 ? "✓" : "○"} Bilder ({images.length} st)
              </li>
              <li className={documents.length > 0 ? "text-primary" : "text-muted-foreground"}>
                {documents.length > 0 ? "✓" : "○"} Dokument ({documents.length} st)
              </li>
              <li className={listing.beskrivning_kort ? "text-primary" : "text-muted-foreground"}>
                {listing.beskrivning_kort ? "✓" : "○"} Kort beskrivning
              </li>
              <li className={listing.beskrivning_lang ? "text-primary" : "text-muted-foreground"}>
                {listing.beskrivning_lang ? "✓" : "○"} Detaljerad beskrivning
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

