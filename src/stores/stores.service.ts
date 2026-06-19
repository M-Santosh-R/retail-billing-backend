import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './store.entity';

export class UpdateStoreDto {
  name?: string;
  address?: string;
  phone?: string;
  gstNumber?: string;
  footerMessage?: string;
}

@Injectable()
export class StoresService {
  constructor(@InjectRepository(Store) private storeRepo: Repository<Store>) {}

  async findById(id: string): Promise<Store> {
    const store = await this.storeRepo.findOne({ where: { id } });
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }

  async update(id: string, dto: UpdateStoreDto): Promise<Store> {
    const store = await this.findById(id);
    Object.assign(store, dto);
    return this.storeRepo.save(store);
  }

  async findAll(): Promise<Store[]> {
    return this.storeRepo.find({ order: { createdAt: 'DESC' } });
  }

  async updateSubscription(id: string, plan: string, expiryDate: Date, isActive: boolean): Promise<Store> {
    const store = await this.findById(id);
    store.subscriptionPlan = plan;
    store.expiryDate = expiryDate;
    store.isActive = isActive;
    return this.storeRepo.save(store);
  }
}
