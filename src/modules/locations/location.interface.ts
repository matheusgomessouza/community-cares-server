export interface Location {
  name: string;
  type: string;
  address: string;
  contact: string;
  coords: {
    lat: number;
    lng: number;
  };
}

export interface LocationUpdate {
  id: number;
  name?: string;
  type?: string;
  address?: string;
  contact?: string;
  coords?: {
    lat: number;
    lng: number;
  };
}
