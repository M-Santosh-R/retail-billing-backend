import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Store } from '../stores/store.entity';
import { BillItem } from './bill-item.entity';

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @ManyToOne(() => Store)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'invoice_number' })
  invoiceNumber: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @OneToMany(() => BillItem, (bi) => bi.bill, { cascade: true, eager: true })
  items: BillItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
