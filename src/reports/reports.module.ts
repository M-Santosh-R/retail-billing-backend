import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Bill } from '../bills/bill.entity';
import { BillItem } from '../bills/bill-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bill, BillItem])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
