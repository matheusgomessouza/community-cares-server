import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { LocationsRepository } from './locations.repository';
import { PrismaService } from '../../infrastructure/prisma.service';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService, LocationsRepository, PrismaService],
})
export class LocationsModule {}
