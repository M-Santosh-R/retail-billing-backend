import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bill } from '../bills/bill.entity';
import { BillItem } from '../bills/bill-item.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Bill) private billRepo: Repository<Bill>,
    @InjectRepository(BillItem) private billItemRepo: Repository<BillItem>,
  ) {}

  async getDashboard(storeId: string) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todaySales, weeklySales, monthlySales, totalBills] = await Promise.all([
      this.getSalesInRange(storeId, todayStart, now),
      this.getSalesInRange(storeId, weekStart, now),
      this.getSalesInRange(storeId, monthStart, now),
      this.billRepo.count({ where: { storeId } }),
    ]);

    return { todaySales, weeklySales, monthlySales, totalBills };
  }

  async getPeriodSummary(storeId: string, startDate: string, endDate: string) {
    const from = new Date(startDate);
    const to   = new Date(new Date(endDate).setHours(23, 59, 59));
    const result = await this.getSalesInRange(storeId, from, to);
    return {
      total: result.total,
      count: result.count,
      average: result.count > 0 ? parseFloat((result.total / result.count).toFixed(2)) : 0,
    };
  }

  private async getSalesInRange(storeId: string, from: Date, to: Date) {
    const result = await this.billRepo
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.totalAmount), 0)', 'total')
      .addSelect('COUNT(bill.id)', 'count')
      .where('bill.storeId = :storeId', { storeId })
      .andWhere('bill.createdAt BETWEEN :from AND :to', { from, to })
      .getRawOne();
    return { total: parseFloat(result.total) || 0, count: parseInt(result.count) || 0 };
  }

  async getMostSoldItems(storeId: string, startDate?: string, endDate?: string) {
    const qb = this.billItemRepo
      .createQueryBuilder('bi')
      .innerJoin('bi.bill', 'bill')
      .select('bi.itemName', 'itemName')
      .addSelect('SUM(bi.quantity)', 'totalQuantity')
      .addSelect('SUM(bi.subtotal)', 'totalRevenue')
      .where('bill.storeId = :storeId', { storeId })
      .groupBy('bi.itemName')
      .orderBy('SUM(bi.quantity)', 'DESC')
      .limit(20);

    if (startDate && endDate) {
      qb.andWhere('bill.createdAt BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(new Date(endDate).setHours(23, 59, 59)),
      });
    }

    return qb.getRawMany();
  }

  async getHighestRevenueItems(storeId: string, startDate?: string, endDate?: string) {
    const qb = this.billItemRepo
      .createQueryBuilder('bi')
      .innerJoin('bi.bill', 'bill')
      .select('bi.itemName', 'itemName')
      .addSelect('SUM(bi.subtotal)', 'totalRevenue')
      .addSelect('SUM(bi.quantity)', 'totalQuantity')
      .where('bill.storeId = :storeId', { storeId })
      .groupBy('bi.itemName')
      .orderBy('SUM(bi.subtotal)', 'DESC')
      .limit(20);

    if (startDate && endDate) {
      qb.andWhere('bill.createdAt BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(new Date(endDate).setHours(23, 59, 59)),
      });
    }

    return qb.getRawMany();
  }

  async getCustomRange(storeId: string, startDate: string, endDate: string) {
    const [sales, mostSold, highestRevenue] = await Promise.all([
      this.getSalesInRange(storeId, new Date(startDate), new Date(new Date(endDate).setHours(23, 59, 59))),
      this.getMostSoldItems(storeId, startDate, endDate),
      this.getHighestRevenueItems(storeId, startDate, endDate),
    ]);
    return { sales, mostSold, highestRevenue };
  }
}
