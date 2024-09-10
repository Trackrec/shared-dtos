// recruiter-company.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { RecruiterCompanyUser } from './recruiter-company-user.entity';
import { AccountProject } from 'src/admin/projects/project.entity';
import { UserAccounts } from 'src/auth/User.entity';
@Entity()
export class RecruiterCompany {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  company_name: string;

  @Column({  length: 255 })
  logo: string; 

  @OneToMany(() => RecruiterCompanyUser, (recruiterCompanyUser) => recruiterCompanyUser.company)
  recruiters: RecruiterCompanyUser[];

  @OneToMany(() => AccountProject, project => project.company)
  projects: AccountProject[];

  @OneToOne(() => UserAccounts, (user) => user.companyCreated)
  @JoinColumn({ name: 'created_by' })
  created_by: UserAccounts;
}
