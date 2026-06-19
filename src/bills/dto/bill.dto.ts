import { IsArray, IsNotEmpty, IsNumber, IsPositive, IsString, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BillItemDto {
  @ApiProperty()
  @IsUUID()
  itemId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  itemPrice: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  subtotal: number;
}

export class CreateBillDto {
  @ApiProperty({ type: [BillItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillItemDto)
  items: BillItemDto[];

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  totalAmount: number;
}
