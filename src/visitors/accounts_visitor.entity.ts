import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AnalyticsAccess } from './analytics_access.entity';

@Entity('accounts_visitors')
export class AccountsVisitors {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  full_name: string;

  @Column({ default: null })
  username: string;

  @Column({ type: 'longtext' })
  linkedin_access_token: string;

  @OneToMany(() => AnalyticsAccess, (analyticsAccess) => analyticsAccess.accountVisitor)
  analyticsAccess: AnalyticsAccess[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
