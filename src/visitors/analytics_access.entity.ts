import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountsVisitors } from './accounts_visitor.entity';
import { UserAccounts } from 'src/auth/User.entity';

@Entity('analytics_access')
export class AnalyticsAccess {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @ManyToOne(() => AccountsVisitors, (accountVisitor) => accountVisitor.analyticsAccess, {
    onDelete: 'CASCADE',
  })
  accountVisitor: AccountsVisitors;

  @ManyToOne(() => UserAccounts, (user) => user.analyticsAccess, { onDelete: 'CASCADE' })
  user: UserAccounts;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
