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

export interface LocationRecord extends Location {
  id: number;
}

export interface LocationUpdate extends Partial<Location> {
  id: number;
}
