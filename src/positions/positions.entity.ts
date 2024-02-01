// src/positions/position.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  start_month: string;

  @Column({ nullable: true })
  start_year: number;

  @Column({ nullable: true })
  end_month: string;

  @Column({ nullable: true })
  end_year: number;

  @Column()
  role: string;

  @ManyToOne(() => UserAccounts, (user) => user.positions)
  @JoinColumn({ name: 'user_id' })
  user: UserAccounts;

  @Column({ type: 'json', nullable: true })
  achievements: any;

//   @ManyToOne(() => Company, (company) => company.positions)
//   @JoinColumn({ name: 'company_id' })
//   company: Company;

  @Column({ nullable: true })
  alternative_brand_icon_url: string;
}
