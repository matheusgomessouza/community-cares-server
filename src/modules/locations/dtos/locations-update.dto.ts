import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';

export class LocationsUpdateDto {
  @ApiProperty({ description: 'ID of the location to update' })
  @IsNotEmpty()
  @IsNumber()
  id!: number;

  @ApiProperty({ description: 'Field to update' })
  field: any;
}
