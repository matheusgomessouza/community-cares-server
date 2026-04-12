import { Controller, Get, Post, Patch, Body } from '@nestjs/common';
import { Locations } from '../../generated/prisma/client';
import { LocationsCreateDto } from './dtos/locations-create.dto';
import { LocationsService } from './locations.service';
import { LocationsUpdateDto } from './dtos/locations-update.dto';

@Controller('locations')
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Get()
  async getLocations(): Promise<Locations[]> {
    return this.locationsService.retrieve();
  }

  @Post()
  async createLocation(
    @Body() createLocationDto: LocationsCreateDto,
  ): Promise<Locations> {
    return this.locationsService.create(createLocationDto);
  }

  @Patch()
  async updateLocation(
    @Body() updateLocationDto: LocationsUpdateDto,
  ): Promise<Locations> {
    return this.locationsService.update(updateLocationDto);
  }
}
