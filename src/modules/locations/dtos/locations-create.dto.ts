import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CoordsDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;
}

export class LocationsCreateDto {
  @ApiProperty({ description: 'Name of the location' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Type of the location (e.g., shelter, food bank)',
  })
  @IsNotEmpty()
  @IsString()
  type!: string;

  @ApiProperty({ description: 'Physical address of the location' })
  @IsNotEmpty()
  @IsString()
  address!: string;

  @ApiProperty({ description: 'Contact information for the location' })
  @IsNotEmpty()
  @IsString()
  contact!: string;

  @ApiProperty({ description: 'Geographical coordinates of the location' })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CoordsDto)
  coords!: CoordsDto;
}
