import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Bill } from './bill.entity';
import { Item } from '../items/item.entity';

@Entity('bill_items')
export class BillItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'bill_id' })
  billId: string;

  @ManyToOne(() => Bill, (bill) => bill.items)
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @Column({ name: 'item_id', nullable: true })
  itemId: string;

  @ManyToOne(() => Item, { nullable: true })
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @Column({ name: 'item_name' })
  itemName: string;

  @Column({ name: 'item_price', type: 'decimal', precision: 10, scale: 2 })
  itemPrice: number;

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
