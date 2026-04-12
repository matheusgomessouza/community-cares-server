import { Controller, Get, Post, Patch, Body } from '@nestjs/common';
import { LocationsCreateDto } from './dtos/locations-create.dto';
import { LocationRecord } from './location.interface';
import { LocationsService } from './locations.service';
import { LocationsUpdateDto } from './dtos/locations-update.dto';

@Controller('locations')
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Get()
  async getLocations(): Promise<LocationRecord[]> {
    return this.locationsService.retrieve();
  }

  @Post()
  async createLocation(
    @Body() createLocationDto: LocationsCreateDto,
  ): Promise<LocationRecord> {
    return this.locationsService.create(createLocationDto);
  }

  @Patch()
  async updateLocation(
    @Body() updateLocationDto: LocationsUpdateDto,
  ): Promise<LocationRecord> {
    return this.locationsService.update(updateLocationDto);
  }
}
