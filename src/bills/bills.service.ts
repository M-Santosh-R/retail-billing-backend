import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Bill } from './bill.entity';
import { BillItem } from './bill-item.entity';
import { Store } from '../stores/store.entity';
import { CreateBillDto } from './dto/bill.dto';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill) private billRepo: Repository<Bill>,
    @InjectRepository(BillItem) private billItemRepo: Repository<BillItem>,
    @InjectRepository(Store) private storeRepo: Repository<Store>,
  ) {}

  async create(storeId: string, dto: CreateBillDto): Promise<Bill> {
    const store = await this.storeRepo.findOne({ where: { id: storeId } });
    const prefix = store?.invoicePrefix || 'INV';

    const now        = new Date();
    const year       = now.getFullYear();
    const month      = String(now.getMonth() + 1).padStart(2, '0');
    const monthStart = new Date(year, now.getMonth(), 1);
    const monthEnd   = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthCount = await this.billRepo.count({
      where: { storeId, createdAt: Between(monthStart, monthEnd) },
    });

    const invoiceNumber = `${prefix}-${year}-${month}-${String(monthCount + 1).padStart(4, '0')}`;

    const bill = this.billRepo.create({
      storeId,
      invoiceNumber,
      totalAmount: dto.totalAmount,
    });
    const savedBill = await this.billRepo.save(bill);

    const billItems = dto.items.map((item) =>
      this.billItemRepo.create({
        billId: savedBill.id,
        itemId: item.itemId,
        itemName: item.itemName,
        itemPrice: item.itemPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
      }),
    );
    await this.billItemRepo.save(billItems);

    return this.findOne(storeId, savedBill.id);
  }

  async findAll(storeId: string, options: { search?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const { search, startDate, endDate } = options;
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 20;
    const qb = this.billRepo
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.items', 'items')
      .where('bill.storeId = :storeId', { storeId })
      .orderBy('bill.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('bill.invoiceNumber ILIKE :search', { search: `%${search}%` });
    }
    if (startDate && endDate) {
      qb.andWhere('bill.createdAt BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(new Date(endDate).setHours(23, 59, 59)),
      });
    }

    const aggQb = this.billRepo
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.totalAmount), 0)', 'sum')
      .where('bill.storeId = :storeId', { storeId });
    if (search) aggQb.andWhere('bill.invoiceNumber ILIKE :search', { search: `%${search}%` });
    if (startDate && endDate) {
      aggQb.andWhere('bill.createdAt BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(new Date(endDate).setHours(23, 59, 59)),
      });
    }

    const [[bills, total], agg] = await Promise.all([qb.getManyAndCount(), aggQb.getRawOne()]);
    return { bills, total, page, limit, totalAmount: parseFloat(agg.sum) || 0 };
  }

  async findOne(storeId: string, id: string): Promise<Bill> {
    const bill = await this.billRepo.findOne({
      where: { id, storeId },
      relations: ['items', 'store'],
    });
    if (!bill) throw new NotFoundException('Bill not found');
    return bill;
  }
}
