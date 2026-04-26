import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CoordsDto } from './locations-create.dto';

export class LocationsUpdateDto {
  @ApiProperty({ description: 'ID of the location to update' })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ description: 'Name of the location', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Type of the location', required: false })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Physical address of the location',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    description: 'Contact information for the location',
    required: false,
  })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiProperty({
    description: 'Geographical coordinates of the location',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordsDto)
  coords?: CoordsDto;
}
