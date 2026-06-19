import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'gst_number', nullable: true })
  gstNumber: string;

  @Column({ name: 'subscription_plan', default: 'free' })
  subscriptionPlan: string;

  @Column({ name: 'expiry_date', nullable: true })
  expiryDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'footer_message', default: 'Thank You. Visit Again.', nullable: true })
  footerMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
