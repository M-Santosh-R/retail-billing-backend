import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ItemsModule } from './items/items.module';
import { BillsModule } from './bills/bills.module';
import { ReportsModule } from './reports/reports.module';
import { StoresModule } from './stores/stores.module';
import { AdminModule } from './admin/admin.module';
import { User } from './users/user.entity';
import { Store } from './stores/store.entity';
import { Device } from './devices/device.entity';
import { Item } from './items/item.entity';
import { Bill } from './bills/bill.entity';
import { BillItem } from './bills/bill-item.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'password'),
        database: config.get('DB_NAME', 'retail_billing'),
        ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        entities: [User, Store, Device, Item, Bill, BillItem],
        synchronize: false,
        logging: false,
      }),
    }),
    AuthModule,
    ItemsModule,
    BillsModule,
    ReportsModule,
    StoresModule,
    AdminModule,
  ],
})
export class AppModule {}
