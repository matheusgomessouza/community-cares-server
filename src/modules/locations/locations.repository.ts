import { Injectable } from '@nestjs/common';
import { Locations, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/prisma.service';

@Injectable()
export class LocationsRepository {
  constructor(private prisma: PrismaService) {}
  async create(locationData: Prisma.LocationsCreateInput): Promise<Locations> {
    return await this.prisma.locations.create({ data: locationData });
  }

  async findAll(): Promise<Locations[]> {
    return this.prisma.locations.findMany() as Promise<Locations[]>;
  }

  async update(params: {
    where: Prisma.LocationsWhereUniqueInput;
    data: Prisma.LocationsUpdateInput;
  }): Promise<Locations> {
    const { where, data } = params;
    return this.prisma.locations.update({
      data,
      where,
    });
  }
}
