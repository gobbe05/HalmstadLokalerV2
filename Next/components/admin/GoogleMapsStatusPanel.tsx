'use client'
import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

export function GoogleMapsStatusPanel() {
  const { apiKey, loading, error } = useGoogleMapsApiKey();
  const [mapsLoadError, setMapsLoadError] = useState<string | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState<boolean | null>(null);
  const [testing, setTesting] = useState(false);

  const testMapsLoad = async () => {
    if (!apiKey) return;

    setTesting(true);
    setMapsLoadError(null);
    setMapsLoaded(null);

    // Remove any existing test script
    const existingScript = document.getElementById("gmap-test-script");
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.id = "gmap-test-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places&callback=__gmapsTestCallback`;
    script.async = true;

    (window as any).__gmapsTestCallback = () => {
      setMapsLoaded(true);
      setTesting(false);
      delete (window as any).__gmapsTestCallback;
    };

    script.onerror = () => {
      setMapsLoadError("Script load failed (check console for details)");
      setMapsLoaded(false);
      setTesting(false);
    };

    // Listen for Google Maps auth errors
    const handleAuthError = (e: ErrorEvent) => {
      if (e.message?.includes("Google Maps") || e.filename?.includes("maps.googleapis.com")) {
        setMapsLoadError(e.message || "Auth error");
        setMapsLoaded(false);
        setTesting(false);
      }
    };
    window.addEventListener("error", handleAuthError);

    document.head.appendChild(script);

    // Timeout after 10s
    setTimeout(() => {
      if (testing) {
        setMapsLoadError("Timeout – no response from Google Maps");
        setMapsLoaded(false);
        setTesting(false);
      }
      window.removeEventListener("error", handleAuthError);
    }, 10000);
  };

  const keyPreview = apiKey ? `${apiKey.slice(0, 8)}…${apiKey.slice(-4)}` : "–";

  return (
    <Card className="max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Google Maps Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {/* Key fetch status */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">API-nyckel (från backend)</span>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : error ? (
            <span className="flex items-center gap-1 text-destructive">
              <XCircle className="h-4 w-4" /> Fel
            </span>
          ) : apiKey ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" /> {keyPreview}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-destructive">
              <XCircle className="h-4 w-4" /> Saknas
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 rounded p-2 break-words">
            {error}
          </p>
        )}

        {/* Maps load test */}
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Maps JS-bibliotek</span>
          {mapsLoaded === null && !testing ? (
            <span className="text-muted-foreground">Ej testat</span>
          ) : testing ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : mapsLoaded ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" /> Laddat OK
            </span>
          ) : (
            <span className="flex items-center gap-1 text-destructive">
              <XCircle className="h-4 w-4" /> Misslyckades
            </span>
          )}
        </div>

        {mapsLoadError && (
          <p className="text-xs text-destructive bg-destructive/10 rounded p-2 break-words">
            {mapsLoadError}
          </p>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={testMapsLoad}
          disabled={!apiKey || loading || testing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${testing ? "animate-spin" : ""}`} />
          Testa Maps-laddning
        </Button>

        <p className="text-xs text-muted-foreground">
          Nyckeln hämtas från edge-funktionen <code>google-maps-key</code> som läser{" "}
          <code>VITE_GOOGLE_MAPS_API_KEY</code> från secrets.
        </p>
      </CardContent>
    </Card>
  );
}

