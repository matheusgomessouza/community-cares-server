import { Test, TestingModule } from '@nestjs/testing';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { LocationsCreateDto } from './dtos/locations-create.dto';
import { LocationsUpdateDto } from './dtos/locations-update.dto';
import { LocationRecord } from './locations.interface';

const mockLocationRecord: LocationRecord = {
  id: 1,
  name: 'Test Location',
  type: 'Shelter',
  address: '123 Main St',
  contact: '555-1234',
  coords: { lat: 40.7128, lng: -74.006 },
};

describe('LocationsController', () => {
  let controller: LocationsController;
  let service: LocationsService;

  beforeEach(async () => {
    const mockLocationsService = {
      retrieve: jest.fn().mockResolvedValue([mockLocationRecord]),
      create: jest.fn().mockResolvedValue(mockLocationRecord),
      update: jest
        .fn()
        .mockResolvedValue({ ...mockLocationRecord, name: 'Updated Location' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [
        {
          provide: LocationsService,
          useValue: mockLocationsService,
        },
      ],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
    service = module.get<LocationsService>(LocationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getLocations', () => {
    it('should call LocationsService.retrieve and return an array of locations', async () => {
      const result = await controller.getLocations();

      expect(jest.spyOn(service, 'retrieve')).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockLocationRecord]);
    });
  });

  describe('createLocation', () => {
    it('should call LocationsService.create with dto and return the created location', async () => {
      const createDto: LocationsCreateDto = {
        name: 'Test Location',
        type: 'Shelter',
        address: '123 Main St',
        contact: '555-1234',
        coords: { lat: 40.7128, lng: -74.006 },
      };

      const result = await controller.createLocation(createDto);

      expect(jest.spyOn(service, 'create')).toHaveBeenCalledWith(createDto);
      expect(jest.spyOn(service, 'create')).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLocationRecord);
    });
  });

  describe('updateLocation', () => {
    it('should call LocationsService.update with dto and return the updated location', async () => {
      const updateDto: LocationsUpdateDto = {
        id: 1,
        name: 'Updated Location',
      };

      const result = await controller.updateLocation(updateDto);

      expect(jest.spyOn(service, 'update')).toHaveBeenCalledWith(updateDto);
      expect(jest.spyOn(service, 'update')).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        ...mockLocationRecord,
        name: 'Updated Location',
      });
    });
  });
});
