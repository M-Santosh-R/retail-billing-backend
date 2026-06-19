import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, ILike } from 'typeorm';
import { Bill } from './bill.entity';
import { BillItem } from './bill-item.entity';
import { CreateBillDto } from './dto/bill.dto';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill) private billRepo: Repository<Bill>,
    @InjectRepository(BillItem) private billItemRepo: Repository<BillItem>,
  ) {}

  async create(storeId: string, dto: CreateBillDto): Promise<Bill> {
    const count = await this.billRepo.count({ where: { storeId } });
    const invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;

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
    const { search, startDate, endDate, page = 1, limit = 20 } = options;
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

    const [bills, total] = await qb.getManyAndCount();
    return { bills, total, page, limit };
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
