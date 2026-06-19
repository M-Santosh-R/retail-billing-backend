import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { Bill } from './bill.entity';
import { BillItem } from './bill-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, BillItem])],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}
