import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { Location, LocationRecord, LocationUpdate } from './location.interface';

interface LocationsDelegate {
  create(args: { data: Location }): Promise<LocationRecord>;
  findMany(): Promise<LocationRecord[]>;
  update(args: {
    where: { id: number };
    data: Partial<Location>;
  }): Promise<LocationRecord>;
}

@Injectable()
export class LocationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get locations(): LocationsDelegate {
    const client = this.prisma.client as {
      locations: LocationsDelegate;
    };

    return client.locations;
  }

  async create(locationData: Location): Promise<LocationRecord> {
    return await this.locations.create({ data: locationData });
  }

  async findAll(): Promise<LocationRecord[]> {
    return await this.locations.findMany();
  }

  async update(params: LocationUpdate): Promise<LocationRecord> {
    const { id, ...data } = params;
    return await this.locations.update({
      where: { id },
      data,
    });
  }
}
