import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectVisitors } from './project_visits.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { RecruiterProject } from 'src/recruiter/projects/project.entity';
import { CreateProjectVisitorRequestDto, ProjectVisitorsDto } from 'src/shared-dtos/src/recruiter_project.dto';
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

  async create(projectVisitorsData: CreateProjectVisitorRequestDto, user_id: number): Promise<ProjectVisitorsDto> {

    const user: UserAccounts = await this.accountsUserRepository.findOne({
      where: { id: user_id },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const project: RecruiterProject = await this.accountsProjectRepository.findOne({
      where: { id: projectVisitorsData.project_id },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const existing_visitor: ProjectVisitorsDto = await this.projectVisitorsRepository.findOne({
      where: {
        project: { id: projectVisitorsData.project_id },
        user: { id: user_id },
      },
    });

    if (existing_visitor) {
      throw new Error('Visitor already exist');
    }

    const project_visitors: ProjectVisitors = new ProjectVisitors();

    project_visitors.project = project;
    project_visitors.user = user;

    await this.projectVisitorsRepository.save(project_visitors);
    return project_visitors;
  }

  async getProjectVisitors(projectId: number): Promise<number> {
    const project : RecruiterProject= await this.accountsProjectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    const visitorCount: number = await this.projectVisitorsRepository.count({
      where: { project: { id: projectId } },
    });

    return visitorCount;
  }
}
