// application.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { AccountProject } from 'src/admin/projects/project.entity';
@Entity()
export class ProjectApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  ote: number;

  @Column({ default: true })
  available: boolean;

  @OneToOne(() => UserAccounts)
  @JoinColumn()
  user: UserAccounts;

  @OneToOne(() => AccountProject)
  @JoinColumn()
  project: AccountProject;

  @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;
}
