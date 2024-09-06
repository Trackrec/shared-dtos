// recruiter-company-user.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { RecruiterCompany } from './recruiter-company.entity';

@Entity()
export class RecruiterCompanyUser {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserAccounts, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: UserAccounts;

  @ManyToOne(() => RecruiterCompany, { nullable: false })
  @JoinColumn({ name: 'company_id' })
  company: RecruiterCompany;
}
