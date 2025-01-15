// application.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { RecruiterProject } from 'src/recruiter/projects/project.entity';
@Entity()
export class ProjectApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  ote: number;

  @Column({ default: true })
  available: boolean;

  @ManyToOne(() => UserAccounts)
  @JoinColumn()
  user: UserAccounts;

  @Column({ type: 'int', nullable: true })
  position_id: number;

  @ManyToOne(() => RecruiterProject, (project) => project.applications)
  @JoinColumn()
  project: RecruiterProject;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
