import type { LatLng } from "@/lib/types";

export interface PlaceSuggestion {
  id: string;
  label: string;
  shortLabel: string;
  coord: LatLng;
  tags: string[];
}

export const placeSuggestions: PlaceSuggestion[] = [
  {
    id: "centro-nereu",
    label: "Centro · Praça Nereu Ramos",
    shortLabel: "Centro",
    coord: [-26.3045, -48.8487],
    tags: ["centro", "terminal", "praca"],
  },
  {
    id: "udesc-cct",
    label: "UDESC · CCT Bom Retiro",
    shortLabel: "UDESC",
    coord: [-26.2906, -48.8793],
    tags: ["udesc", "universidade", "bom retiro"],
  },
  {
    id: "univille-bloco-a",
    label: "UNIVILLE · Bloco A",
    shortLabel: "UNIVILLE",
    coord: [-26.2625, -48.871],
    tags: ["univille", "universidade", "bom retiro"],
  },
  {
    id: "ifsc-campus",
    label: "IFSC · Câmpus Joinville",
    shortLabel: "IFSC",
    coord: [-26.2417, -48.8635],
    tags: ["ifsc", "universidade", "norte"],
  },
  {
    id: "america-blumenau",
    label: "América · Rua Blumenau",
    shortLabel: "América",
    coord: [-26.2955, -48.842],
    tags: ["america", "blumenau"],
  },
  {
    id: "gloria-santos-dumont",
    label: "Glória · Av. Santos Dumont",
    shortLabel: "Glória",
    coord: [-26.274, -48.839],
    tags: ["gloria", "santos dumont"],
  },
  {
    id: "costa-silva-iririu",
    label: "Costa e Silva · Av. Iririú",
    shortLabel: "Costa e Silva",
    coord: [-26.265, -48.812],
    tags: ["costa e silva", "iririu"],
  },
  {
    id: "saguacu-beira-rio",
    label: "Saguaçu · Av. Beira Rio",
    shortLabel: "Saguaçu",
    coord: [-26.281, -48.823],
    tags: ["saguacu", "beira rio"],
  },
  {
    id: "bucarein-terminal",
    label: "Bucarein · Terminal Urbano",
    shortLabel: "Bucarein",
    coord: [-26.3141, -48.8456],
    tags: ["bucarein", "terminal"],
  },
  {
    id: "anita-garibaldi",
    label: "Anita Garibaldi · Rua Ottokar Doerffel",
    shortLabel: "Anita Garibaldi",
    coord: [-26.3154, -48.8631],
    tags: ["anita", "garibaldi", "ottokar"],
  },
  {
    id: "floresta",
    label: "Floresta · Rua Santa Catarina",
    shortLabel: "Floresta",
    coord: [-26.3372, -48.8446],
    tags: ["floresta", "santa catarina"],
  },
  {
    id: "pirabeiraba",
    label: "Pirabeiraba · Centro",
    shortLabel: "Pirabeiraba",
    coord: [-26.2017, -48.9131],
    tags: ["pirabeiraba"],
  },
];

export function searchPlaces(query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return placeSuggestions;
  return placeSuggestions.filter((place) =>
    [place.label, place.shortLabel, ...place.tags].some((value) =>
      value.toLowerCase().includes(term),
    ),
  );
}

export function getPlace(id: string) {
  return placeSuggestions.find((place) => place.id === id) ?? placeSuggestions[0];
}

export function distanceKm(a: LatLng, b: LatLng) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLon = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return +(earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))).toFixed(1);
}

export function makeRoutePath(origin: LatLng, destination: LatLng): LatLng[] {
  const midA: LatLng = [
    origin[0] + (destination[0] - origin[0]) * 0.35,
    origin[1] + (destination[1] - origin[1]) * 0.25,
  ];
  const midB: LatLng = [
    origin[0] + (destination[0] - origin[0]) * 0.68,
    origin[1] + (destination[1] - origin[1]) * 0.78,
  ];
  return [origin, midA, midB, destination];
}

export function estimateUber99(km: number) {
  return Math.max(12, +(6 + km * 2.8).toFixed(2));
}
