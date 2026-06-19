import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Item } from './item.entity';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';

@Injectable()
export class ItemsService {
  constructor(@InjectRepository(Item) private itemRepo: Repository<Item>) {}

  async create(storeId: string, dto: CreateItemDto): Promise<Item> {
    const item = this.itemRepo.create({ ...dto, storeId });
    return this.itemRepo.save(item);
  }

  async findAll(storeId: string, search?: string): Promise<Item[]> {
    const where: any = { storeId, isDeleted: false };
    if (search) {
      where.name = ILike(`%${search}%`);
    }
    return this.itemRepo.find({ where, order: { name: 'ASC' } });
  }

  async findOne(storeId: string, id: string): Promise<Item> {
    const item = await this.itemRepo.findOne({ where: { id, storeId, isDeleted: false } });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async update(storeId: string, id: string, dto: UpdateItemDto): Promise<Item> {
    const item = await this.findOne(storeId, id);
    Object.assign(item, dto);
    return this.itemRepo.save(item);
  }

  async remove(storeId: string, id: string): Promise<{ message: string }> {
    const item = await this.findOne(storeId, id);
    await this.itemRepo.update(item.id, { isDeleted: true });
    return { message: 'Item deleted successfully' };
  }
}
