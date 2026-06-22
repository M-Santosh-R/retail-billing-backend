import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Store } from '../stores/store.entity';
import { User } from '../users/user.entity';
import { Device } from '../devices/device.entity';
import { Bill } from '../bills/bill.entity';
import { BillsModule } from '../bills/bills.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [TypeOrmModule.forFeature([Store, User, Device, Bill]), BillsModule, ReportsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
