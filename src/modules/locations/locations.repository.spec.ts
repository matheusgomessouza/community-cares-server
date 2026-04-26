import { Test, TestingModule } from '@nestjs/testing';
import { LocationsRepository } from './locations.repository';
import { PrismaService } from '../../infrastructure/prisma.service';
import {
  Location,
  LocationRecord,
  LocationUpdate,
} from './locations.interface';

const mockLocationRecord: LocationRecord = {
  id: 1,
  name: 'Test Repo Location',
  type: 'Clinic',
  address: '789 Health Way',
  contact: '555-9012',
  coords: { lat: 51.5074, lng: -0.1278 },
};

describe('LocationsRepository', () => {
  let repository: LocationsRepository;

  let mockLocationsDelegate: {
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(async () => {
    mockLocationsDelegate = {
      findMany: jest.fn().mockResolvedValue([mockLocationRecord]),
      create: jest.fn().mockResolvedValue(mockLocationRecord),
      update: jest.fn().mockResolvedValue({
        ...mockLocationRecord,
        name: 'Repo Updated Location',
      }),
    };

    // We mock the deep property prisma.client.locations
    const mockPrismaService = {
      client: {
        locations: mockLocationsDelegate,
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<LocationsRepository>(LocationsRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('findAll', () => {
    it('should call prisma.client.locations.findMany and return an array of locations', async () => {
      const result = await repository.findAll();

      // Ensure the deeply nested mocked method is called
      expect(mockLocationsDelegate.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockLocationRecord]);
    });
  });

  describe('create', () => {
    it('should call prisma.client.locations.create with wrapped data and return record', async () => {
      const newLocation: Location = {
        name: 'Test Repo Location',
        type: 'Clinic',
        address: '789 Health Way',
        contact: '555-9012',
        coords: { lat: 51.5074, lng: -0.1278 },
      };

      const result = await repository.create(newLocation);

      expect(mockLocationsDelegate.create).toHaveBeenCalledWith({
        data: newLocation,
      });
      expect(mockLocationsDelegate.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLocationRecord);
    });
  });

  describe('update', () => {
    it('should split id from data and call prisma.client.locations.update', async () => {
      const updateData: LocationUpdate = {
        id: 1,
        name: 'Repo Updated Location',
      };

      const result = await repository.update(updateData);

      expect(mockLocationsDelegate.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Repo Updated Location' },
      });
      expect(mockLocationsDelegate.update).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        ...mockLocationRecord,
        name: 'Repo Updated Location',
      });
    });
  });
});
