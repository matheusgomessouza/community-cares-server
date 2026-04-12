import { Injectable } from '@nestjs/common';
import { Locations } from '../../generated/prisma/client';
import { Location, LocationUpdate } from './location.interface';
import { LocationsRepository } from './locations.repository';

@Injectable()
export class LocationsService {
  constructor(private locationsRepository: LocationsRepository) {}

  create(location: Location): Promise<Locations> {
    return this.locationsRepository.create(location);
  }

  retrieve(): Promise<Locations[]> {
    return this.locationsRepository.findAll();
  }

  update(locationInformation: LocationUpdate): Promise<Locations> {
    return this.locationsRepository.update({
      where: { id: locationInformation.id },
      data: locationInformation,
    });
  }
}
