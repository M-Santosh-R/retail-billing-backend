import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Store } from '../stores/store.entity';
import { User } from '../users/user.entity';
import { Device } from '../devices/device.entity';
import { Bill } from '../bills/bill.entity';
import { BillsService } from '../bills/bills.service';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Store) private storeRepo: Repository<Store>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Device) private deviceRepo: Repository<Device>,
    @InjectRepository(Bill) private billRepo: Repository<Bill>,
    private billsService: BillsService,
    private reportsService: ReportsService,
  ) {}

  async getDashboard() {
    const ADMIN_ID = '00000000-0000-0000-0000-000000000001';
    const [totalStores, activeStores, totalBills] = await Promise.all([
      this.storeRepo.createQueryBuilder('s').where('s.id != :id', { id: ADMIN_ID }).getCount(),
      this.storeRepo.createQueryBuilder('s').where('s.id != :id', { id: ADMIN_ID }).andWhere('s.isActive = true').getCount(),
      this.billRepo.count(),
    ]);

    const expiredStores = await this.storeRepo
      .createQueryBuilder('s')
      .where('s.expiryDate < NOW()')
      .andWhere('s.id != :id', { id: ADMIN_ID })
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
      .where('store.id != :adminId', { adminId: '00000000-0000-0000-0000-000000000001' })
      .orderBy('store.createdAt', 'DESC')
      .getMany();

    const deviceCounts = await this.deviceRepo
      .createQueryBuilder('device')
      .select('user.storeId', 'storeId')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('device.user', 'user')
      .where('device.isActive = true')
      .groupBy('user.storeId')
      .getRawMany();

    const countMap = new Map(deviceCounts.map((r) => [r.storeId, parseInt(r.count, 10)]));

    return stores.map((store) => ({ ...store, deviceCount: countMap.get(store.id) || 0 }));
  }

  async updateSubscription(storeId: string, dto: { plan: string; expiryDate: string; isActive: boolean; maxDevices?: number }) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');

    store.subscriptionPlan = dto.plan;
    store.expiryDate = new Date(dto.expiryDate);
    store.isActive = dto.isActive;
    if (dto.maxDevices !== undefined) store.maxDevices = dto.maxDevices;
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

  async getStoreBills(storeId: string, options: { search?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    return this.billsService.findAll(storeId, { ...options, limit: options.limit ?? 20 });
  }

  async getStoreBill(storeId: string, billId: string) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    return this.billsService.findOne(storeId, billId);
  }

  async getStore(storeId: string) {
    const store = await this.storeRepo
      .createQueryBuilder('store')
      .leftJoin('store.users', 'user', 'user.role = :role', { role: 'owner' })
      .addSelect(['user.name', 'user.email'])
      .where('store.id = :storeId', { storeId })
      .getOne();
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async createStore(dto: { storeName: string; address?: string; phone?: string; gstNumber?: string; ownerName: string; ownerEmail: string; ownerPassword: string }) {
    const existing = await this.userRepo.findOne({ where: { email: dto.ownerEmail } });
    if (existing) throw new ConflictException('Email already in use');

    const store = this.storeRepo.create({
      name: dto.storeName,
      address: dto.address,
      phone: dto.phone,
      gstNumber: dto.gstNumber,
      subscriptionPlan: 'free',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    });
    const savedStore = await this.storeRepo.save(store);

    const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);
    const user = this.userRepo.create({
      name: dto.ownerName,
      email: dto.ownerEmail,
      passwordHash,
      role: 'owner',
      storeId: savedStore.id,
    });
    await this.userRepo.save(user);

    return savedStore;
  }

  async updateStoreDetails(storeId: string, dto: { name?: string; address?: string; phone?: string; gstNumber?: string; footerMessage?: string; invoicePrefix?: string }) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    Object.assign(store, dto);
    return this.storeRepo.save(store);
  }

  async deleteStore(storeId: string) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    // delete users first (cascades to devices); store delete cascades items/bills/bill_items
    await this.userRepo.delete({ storeId });
    await this.storeRepo.delete(storeId);
    return { message: 'Store deleted' };
  }

  async getStoreReports(storeId: string, startDate?: string, endDate?: string) {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    if (!store) throw new NotFoundException('Store not found');
    const [dashboard, mostSold, highestRevenue, periodSummary] = await Promise.all([
      this.reportsService.getDashboard(storeId),
      this.reportsService.getMostSoldItems(storeId, startDate, endDate),
      this.reportsService.getHighestRevenueItems(storeId, startDate, endDate),
      startDate && endDate ? this.reportsService.getPeriodSummary(storeId, startDate, endDate) : Promise.resolve(null),
    ]);
    return { dashboard, mostSold, highestRevenue, periodSummary };
  }
}
