import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectVisitors } from './project_visits.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { RecruiterProject } from 'src/recruiter/projects/project.entity';
import {
  CreateProjectVisitorRequestDto,
  ProjectVisitorsDto,
} from 'src/shared-dtos/src/recruiter_project.dto';

@Injectable()
export class ProjectVisitorsService {
  private readonly logger = new Logger(ProjectVisitorsService.name);

  constructor(
    @InjectRepository(ProjectVisitors)
    private readonly projectVisitorsRepository: Repository<ProjectVisitors>,
    @InjectRepository(UserAccounts)
    private readonly accountsUserRepository: Repository<UserAccounts>,
    @InjectRepository(RecruiterProject)
    private readonly accountsProjectRepository: Repository<RecruiterProject>,
  ) {}

  async create(
    projectVisitorsData: CreateProjectVisitorRequestDto,
    userId: number,
  ): Promise<ProjectVisitorsDto> {
    this.logger.log(
      `Attempting to create a project visitor for user ID: ${userId} and project ID: ${projectVisitorsData.project_id}`,
    );

    const user: UserAccounts = await this.accountsUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User with ID ${userId} not found.`);
      throw new Error('User not found');
    }

    const project: RecruiterProject = await this.accountsProjectRepository.findOne({
      where: { id: projectVisitorsData.project_id },
    });

    if (!project) {
      this.logger.warn(`Project with ID ${projectVisitorsData.project_id} not found.`);
      throw new Error('Project not found');
    }

    const existingVisitor: ProjectVisitorsDto = await this.projectVisitorsRepository.findOne({
      where: {
        project: { id: projectVisitorsData.project_id },
        user: { id: userId },
      },
    });

    if (existingVisitor) {
      this.logger.warn(
        `Visitor already exists for user ID: ${userId} and project ID: ${projectVisitorsData.project_id}`,
      );
      throw new Error('Visitor already exist');
    }

    const projectVisitors: ProjectVisitors = new ProjectVisitors();

    projectVisitors.project = project;
    projectVisitors.user = user;

    await this.projectVisitorsRepository.save(projectVisitors);

    this.logger.log(
      `Successfully created project visitor for user ID: ${userId} and project ID: ${projectVisitorsData.project_id}`,
    );

    return projectVisitors;
  }

  async getProjectVisitors(projectId: number): Promise<number> {
    this.logger.log(`Fetching visitor count for project ID: ${projectId}`);

    const project: RecruiterProject = await this.accountsProjectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      this.logger.warn(`Project with ID ${projectId} not found.`);
      throw new Error('Project not found');
    }

    const visitorCount: number = await this.projectVisitorsRepository.count({
      where: { project: { id: projectId } },
    });

    this.logger.log(`Visitor count for project ID ${projectId}: ${visitorCount}`);

    return visitorCount;
  }
}
