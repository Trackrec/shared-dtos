import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectApplication } from './application.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { RecruiterProject } from 'src/recruiter/projects/project.entity';
import { RecruiterCompanyUser } from 'src/recruiter/recruiter-company/recruiter-company-user.entity';
import { MailgunService } from 'src/mailgun/mailgun.service';
import {
  MyApplicationsListDto,
  ProjectApplicationDto,
  ProjectApplicationRequestDto,
} from 'src/shared-dtos/src/project_application.dto';

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    @InjectRepository(ProjectApplication)
    private readonly applicationRepository: Repository<ProjectApplication>,
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    @InjectRepository(RecruiterProject)
    private readonly projectRepository: Repository<RecruiterProject>,
    @InjectRepository(RecruiterCompanyUser)
    private recruiterCompanyUserRepository: Repository<RecruiterCompanyUser>,
    private readonly mailgunService: MailgunService,
  ) {}

  async createApplication(
    body: ProjectApplicationRequestDto,
    userId: number,
  ): Promise<{ error: boolean; message: string }> {
    this.logger.debug(
      `createApplication called with user ID: ${userId} and body: ${JSON.stringify(body)}`,
    );

    try {
      const {
        project_id: projectId,
        ote,
        available,
        position_id: positionId,
        city,
        custom_current_role: customCurrentRole,
      } = body;

      if (!projectId || !ote || !positionId || !city || !customCurrentRole) {
        this.logger.warn(
          `Missing required fields in the application payload for user ID: ${userId}`,
        );
        return { error: true, message: 'Please fill all the required fields.' };
      }

      const user: UserAccounts = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        this.logger.warn(`User not found with ID: ${userId}`);
        return { error: true, message: 'User not found.' };
      }

      const project: RecruiterProject = await this.projectRepository.findOne({
        where: { id: projectId },
      });
      if (!project) {
        this.logger.warn(`Project not found with ID: ${projectId}`);
        return { error: true, message: 'Project not found.' };
      }

      const applicationExists: ProjectApplication = await this.applicationRepository.findOne({
        where: { user: { id: userId }, project: { id: projectId } },
      });

      if (!applicationExists) {
        if (city && customCurrentRole) {
          user.city = city;
          user.custom_current_role = customCurrentRole;
          await this.userRepository.update(user.id, user);
          this.logger.log(`Updated user profile with city and role for user ID: ${userId}`);
        }

        const application: ProjectApplication = new ProjectApplication();
        application.ote = ote;
        application.available = available;
        application.user = user;
        application.project = project;
        application.position_id = positionId;

        await this.applicationRepository.save(application);
        this.logger.log(
          `Application created successfully for user ID: ${userId} and project ID: ${projectId}`,
        );

        const messageData = {
          from: `Trackrec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
          to: user?.email,
          subject: `Application for ${application.project.title}`,
          html: `
            Hello ${user?.full_name.split(' ')[0]}, <br/><br/>
            Thank you for applying to the ${application.project.title} with ${application.project.company_name}.
            We sent your TrackRec and Sales Fit Score to their Hiring Manager, they'll be in touch regarding next steps.<br/><br/>
            All the best!<br/>
            Team TrackRec
          `,
        };

        await this.mailgunService.sendMail(messageData);
        this.logger.log(`Confirmation email sent to ${user.email}`);

        return { error: false, message: 'Application created successfully.' };
      } else {
        this.logger.warn(`User ID: ${userId} has already applied to project ID: ${projectId}`);
        return { error: true, message: 'You have already applied to this project.' };
      }
    } catch (e) {
      this.logger.error(
        `Failed to create application for user ID: ${userId} - ${e.message}`,
        e.stack,
      );
      return { error: true, message: 'Application not created.' };
    }
  }

  async getMyApplications(userId: number): Promise<MyApplicationsListDto> {
    this.logger.debug(`getMyApplications called for user ID: ${userId}`);

    try {
      const applications: ProjectApplicationDto[] = await this.applicationRepository.find({
        where: { user: { id: userId } },
        relations: ['project'],
      });

      this.logger.log(`Fetched ${applications.length} applications for user ID: ${userId}`);
      return { error: false, applications };
    } catch (e) {
      this.logger.error(
        `Failed to fetch applications for user ID: ${userId} - ${e.message}`,
        e.stack,
      );
      return { error: true, message: 'Not able to get applications.' };
    }
  }

  async deleteApplicationsForUserAndCompany(
    userId: number,
    loggedInUser: number,
  ): Promise<{ error: boolean; message: string }> {
    this.logger.debug(
      `deleteApplicationsForUserAndCompany called by user ID: ${loggedInUser} for user ID: ${userId}`,
    );

    try {
      const checkAdmin: UserAccounts = await this.userRepository.findOne({
        where: { id: loggedInUser, role: 'Admin' },
      });

      if (!checkAdmin) {
        this.logger.warn(`User ID: ${loggedInUser} is not an admin.`);
        return { error: true, message: 'You are not an admin User.' };
      }

      const recruiterCompanyUser: RecruiterCompanyUser =
        await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: loggedInUser } },
          relations: ['company'],
        });

      if (!recruiterCompanyUser) {
        this.logger.warn(`User ID: ${loggedInUser} is not associated with any recruiter company.`);
        return { error: true, message: 'User is not associated with any recruiter company.' };
      }

      await this.applicationRepository
        .createQueryBuilder()
        .delete()
        .from(ProjectApplication)
        .where('userId = :userId', { userId })
        .andWhere('projectId IN (SELECT id FROM recruiter_project WHERE companyId = :companyId)', {
          companyId: recruiterCompanyUser.company.id,
        })
        .execute();

      this.logger.log(`Applications deleted for user ID: ${userId} by admin ID: ${loggedInUser}`);
      return { error: false, message: 'Applications deleted successfully.' };
    } catch (e) {
      this.logger.error(
        `Failed to delete applications for user ID: ${userId} - ${e.message}`,
        e.stack,
      );
      return { error: true, message: 'Something went wrong, please try again.' };
    }
  }
}
