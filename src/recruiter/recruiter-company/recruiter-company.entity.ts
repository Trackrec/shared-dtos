// recruiter-company.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RecruiterCompanyUser } from './recruiter-company-user.entity';
import { AccountProject } from 'src/admin/projects/project.entity';
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
}
