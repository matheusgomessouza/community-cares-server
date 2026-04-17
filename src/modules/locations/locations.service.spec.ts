import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from './locations.service';
import { LocationsRepository } from './locations.repository';
import {
  Location,
  LocationRecord,
  LocationUpdate,
} from './locations.interface';

const mockLocationRecord: LocationRecord = {
  id: 1,
  name: 'Test Service Location',
  type: 'Food Bank',
  address: '456 Service Blvd',
  contact: '555-5678',
  coords: { lat: 34.0522, lng: -118.2437 },
};

describe('LocationsService', () => {
  let service: LocationsService;
  let repository: LocationsRepository;

  beforeEach(async () => {
    const mockLocationsRepository = {
      findAll: jest.fn().mockResolvedValue([mockLocationRecord]),
      create: jest.fn().mockResolvedValue(mockLocationRecord),
      update: jest.fn().mockResolvedValue({
        ...mockLocationRecord,
        name: 'Service Updated Location',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsService,
        {
          provide: LocationsRepository,
          useValue: mockLocationsRepository,
        },
      ],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
    repository = module.get<LocationsRepository>(LocationsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('retrieve', () => {
    it('should call LocationsRepository.findAll and return array of records', async () => {
      const result = await service.retrieve();

      expect(jest.spyOn(repository, 'findAll')).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockLocationRecord]);
    });
  });

  describe('create', () => {
    it('should call LocationsRepository.create with location and return record', async () => {
      const newLocation: Location = {
        name: 'Test Service Location',
        type: 'Food Bank',
        address: '456 Service Blvd',
        contact: '555-5678',
        coords: { lat: 34.0522, lng: -118.2437 },
      };

      const result = await service.create(newLocation);

      expect(jest.spyOn(repository, 'create')).toHaveBeenCalledWith(
        newLocation,
      );
      expect(jest.spyOn(repository, 'create')).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLocationRecord);
    });
  });

  describe('update', () => {
    it('should call LocationsRepository.update with updated payload and return record', async () => {
      const updateData: LocationUpdate = {
        id: 1,
        name: 'Service Updated Location',
      };

      const result = await service.update(updateData);

      expect(jest.spyOn(repository, 'update')).toHaveBeenCalledWith(updateData);
      expect(jest.spyOn(repository, 'update')).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        ...mockLocationRecord,
        name: 'Service Updated Location',
      });
    });
  });
});
