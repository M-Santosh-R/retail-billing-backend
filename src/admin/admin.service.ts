import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../stores/store.entity';
import { User } from '../users/user.entity';
import { Device } from '../devices/device.entity';
import { Bill } from '../bills/bill.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Device) private deviceRepo: Repository<Device>,
    @InjectRepository(Bill) private billRepo: Repository<Bill>,
  ) {}

  async getDashboard() {
    const [totalStores, activeStores, totalBills] = await Promise.all([
      this.storeRepo.count(),
      this.storeRepo.count({ where: { isActive: true } }),
      this.billRepo.count(),
    ]);

    const expiredStores = await this.storeRepo
      .createQueryBuilder('s')
      .where('s.expiryDate < NOW()')
      .andWhere('s.id != :adminId', { adminId: '00000000-0000-0000-0000-000000000001' })
      .getCount();

    const revenueResult = await this.billRepo
      .createQueryBuilder('b')
      .select('COALESCE(SUM(b.totalAmount), 0)', 'total')
      .getRawOne();

    return {
      totalStores,
      activeStores,
      expiredStores,
      totalBills,
      totalRevenue: parseFloat(revenueResult.total) || 0,
    };
  }

  async getAllStores() {
    const stores = await this.storeRepo
      .createQueryBuilder('store')
      .leftJoin('store.users', 'user', 'user.role = :role', { role: 'owner' })
      .addSelect(['user.name', 'user.email'])
      .orderBy('store.createdAt', 'DESC')
      .getMany();

    return stores;
  }

  async updateSubscription(storeId: string, dto: { plan: string; expiryDate: string; isActive: boolean }) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    store.subscriptionPlan = dto.plan;
    store.expiryDate = new Date(dto.expiryDate);
    store.isActive = dto.isActive;
    return this.storeRepo.save(store);
  }

  async getStoreDevices(storeId: string) {
    const users = await this.userRepo.find({ where: { storeId }, select: ['id'] });
    const userIds = users.map((u) => u.id);
    if (!userIds.length) return [];

    return this.deviceRepo
      .createQueryBuilder('device')
      .leftJoinAndSelect('device.user', 'user')
      .where('device.userId IN (:...userIds)', { userIds })
      .andWhere('device.isActive = true')
      .getMany();
  }

  async forceLogoutDevice(deviceId: string) {
    await this.deviceRepo.update(deviceId, { isActive: false });
    return { message: 'Device logged out' };
  }
}
