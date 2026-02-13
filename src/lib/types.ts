export interface Venue {
  id: string;
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number | null;
  priceLevel: number | null;
  phoneNumber: string | null;
  website: string | null;
  photoRefs: string[];
  types: string[];
  capacity: number | null;
  description: string | null;
}

export interface SearchContext {
  lat: number;
  lng: number;
  radiusKm: number;
  location: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
}
