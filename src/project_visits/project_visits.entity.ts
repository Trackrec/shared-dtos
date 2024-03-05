import { AccountProject } from 'src/admin/projects/project.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  JoinColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
} from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
@Entity('project_visitors')
export class ProjectVisitors {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => AccountProject, (project) => project)
  @JoinColumn({ name: 'project_id' })
  project: AccountProject;

  @ManyToOne(() => UserAccounts, (user) => user)
  @JoinColumn({ name: 'user_id' })
  user: UserAccounts;
}
