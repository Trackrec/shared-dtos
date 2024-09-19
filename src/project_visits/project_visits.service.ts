import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectVisitors } from './project_visits.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { AccountProject } from 'src/admin/projects/project.entity';
import { RecruiterProject } from 'src/recruiter/projects/project.entity';
@Injectable()
export class ProjectVisitorsService {
  constructor(
    @InjectRepository(ProjectVisitors)
    private readonly projectVisitorsRepository: Repository<ProjectVisitors>,
    @InjectRepository(UserAccounts)
    private readonly accountsUserRepository: Repository<UserAccounts>,
    @InjectRepository(RecruiterProject)
    private readonly accountsProjectRepository: Repository<RecruiterProject>,
  ) {}

  async create(projectVisitorsData: {
    project_id: number;
  }, user_id: any): Promise<any> {

    const user = await this.accountsUserRepository.findOne({
      where: { id: user_id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const project = await this.accountsProjectRepository.findOne({
      where: { id: projectVisitorsData.project_id },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const existing_visitor = await this.projectVisitorsRepository.findOne({
      where: {
        project: { id: projectVisitorsData.project_id },
        user: { id: user_id },
      },
    });

    if (existing_visitor) {
      throw new Error('Visitor already exist');
    }

    const project_visitors = new ProjectVisitors();

    project_visitors.project = project;
    project_visitors.user = user;

    await this.projectVisitorsRepository.save(project_visitors);
    return project_visitors;
  }

  async getProjectVisitors(projectId: number): Promise<any> {
    const project = await this.accountsProjectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const visitorCount = await this.projectVisitorsRepository.count({
      where: { project: { id: projectId } },
    });

    return visitorCount;
  }
}
