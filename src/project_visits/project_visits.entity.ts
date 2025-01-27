import { Entity, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { RecruiterProject } from 'src/recruiter/projects/project.entity';
@Entity('project_visitors')
export class ProjectVisitors {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => RecruiterProject, (project) => project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: RecruiterProject;

  @ManyToOne(() => UserAccounts, (user) => user, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserAccounts;
}
