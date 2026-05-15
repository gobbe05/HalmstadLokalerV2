import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type GoogleMapsKeyResponse = { key?: string };

export function useGoogleMapsApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem("google_maps_api_key");
    if (cached) {
      setApiKey(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke<GoogleMapsKeyResponse>(
          "google-maps-key"
        );

        if (cancelled) return;

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        const key = data?.key?.trim();
        if (!key) {
          setError("Google Maps API-nyckel saknas i secrets.");
          setLoading(false);
          return;
        }

        sessionStorage.setItem("google_maps_api_key", key);
        setApiKey(key);
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { apiKey, loading, error };
}
