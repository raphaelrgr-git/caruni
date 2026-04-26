type GoogleMapsWindow = Window & { google?: any };

export interface GoogleGeocodeSuggestion {
  label: string;
  lat: number;
  lng: number;
}

const GOOGLE_MAPS_SCRIPT_ID = "caruni-google-maps";
let loaderPromise: Promise<any> | null = null;

function getGoogleMapsApiKey() {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
}

export function hasGoogleMapsApiKey() {
  return Boolean(getGoogleMapsApiKey());
}

export async function loadGoogleMaps() {
  const win = window as GoogleMapsWindow;
  if (win.google?.maps) {
    return win.google;
  }

  if (loaderPromise) {
    return loaderPromise;
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error("VITE_GOOGLE_MAPS_API_KEY não configurada.");
  }

  loaderPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve((window as GoogleMapsWindow).google), {
        once: true,
      });
      existing.addEventListener("error", () => reject(new Error("Falha ao carregar Google Maps.")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&language=pt-BR&region=BR`;
    script.onload = () => resolve((window as GoogleMapsWindow).google);
    script.onerror = () => reject(new Error("Falha ao carregar Google Maps."));
    document.head.appendChild(script);
  });

  return loaderPromise;
}

function geocodeRequest(
  request: Record<string, unknown>,
): Promise<Array<{ formatted_address: string; geometry: { location: { lat(): number; lng(): number } } }>> {
  return loadGoogleMaps().then((google) => {
    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode(request, (results: any[] | null, status: string) => {
        if (status !== "OK" || !results?.length) {
          if (status === "ZERO_RESULTS") {
            resolve([]);
            return;
          }
          reject(new Error(`Google Geocoding retornou ${status}.`));
          return;
        }

        resolve(results as Array<{ formatted_address: string; geometry: { location: { lat(): number; lng(): number } } }>);
      });
    });
  });
}

export async function geocodeAddressWithGoogle(query: string): Promise<GoogleGeocodeSuggestion[]> {
  if (query.trim().length < 3) return [];

  const results = await geocodeRequest({
    address: query,
    region: "BR",
    componentRestrictions: { country: "BR" },
  });

  return results.slice(0, 5).map((result) => ({
    label: result.formatted_address,
    lat: result.geometry.location.lat(),
    lng: result.geometry.location.lng(),
  }));
}

export async function reverseGeocodeLatLng(
  lat: number,
  lng: number,
): Promise<GoogleGeocodeSuggestion> {
  const results = await geocodeRequest({
    location: { lat, lng },
  });

  const first = results[0];
  if (!first) {
    return {
      label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      lat,
      lng,
    };
  }

  return {
    label: first.formatted_address,
    lat: first.geometry.location.lat(),
    lng: first.geometry.location.lng(),
  };
}
