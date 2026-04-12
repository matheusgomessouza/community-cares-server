import { Injectable } from '@nestjs/common';
import { Location, LocationRecord, LocationUpdate } from './location.interface';
import { LocationsRepository } from './locations.repository';

@Injectable()
export class LocationsService {
  constructor(private locationsRepository: LocationsRepository) {}

  create(location: Location): Promise<LocationRecord> {
    return this.locationsRepository.create(location);
  }

  retrieve(): Promise<LocationRecord[]> {
    return this.locationsRepository.findAll();
  }

  update(locationInformation: LocationUpdate): Promise<LocationRecord> {
    return this.locationsRepository.update(locationInformation);
  }
}
