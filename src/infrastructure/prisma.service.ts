import { Injectable } from '@nestjs/common';
import {
  PrismaClient as PrismaClientValue,
  type PrismaClient,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService {
  readonly client: unknown;

  constructor() {
    const adapter = new PrismaPg(process.env.DATABASE_URL ?? '');
    type PrismaClientConstructor = new (options: {
      adapter: unknown;
    }) => PrismaClient;

    const PrismaClientConstructor =
      PrismaClientValue as unknown as PrismaClientConstructor;

    this.client = new PrismaClientConstructor({ adapter });
  }
}
