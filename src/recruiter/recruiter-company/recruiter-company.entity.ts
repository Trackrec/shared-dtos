// recruiter-company.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { RecruiterCompanyUser } from './recruiter-company-user.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { RecruiterProject } from '../projects/project.entity';
@Entity()
export class RecruiterCompany {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  company_name: string;

  @Column({ length: 255 })
  logo: string;

  @Column({ length: 10, default: 'jpg' })
  logo_type: string;

  @OneToMany(() => RecruiterCompanyUser, (recruiterCompanyUser) => recruiterCompanyUser.company)
  recruiters: RecruiterCompanyUser[];

  @OneToMany(() => RecruiterProject, (project) => project.company)
  projects: RecruiterProject[];

  @OneToOne(() => UserAccounts, (user) => user.companyCreated)
  @JoinColumn({ name: 'created_by' })
  created_by: UserAccounts;
}
