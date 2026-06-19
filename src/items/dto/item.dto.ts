import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateItemDto {
  @ApiProperty({ example: 'Coca Cola' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 40 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price: number;
}

export class UpdateItemDto {
  @ApiProperty({ example: 'Coca Cola 500ml', required: false })
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ example: 45, required: false })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price?: number;
}
