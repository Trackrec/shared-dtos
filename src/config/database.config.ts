import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { UserAccounts } from 'src/auth/User.entity';
import { Position } from 'src/positions/positions.entity';
import { PositionDetails } from 'src/position_details/position_details.entity';
import { Company } from 'src/company/company.entity';
import { City } from 'src/location/city.entity';
import { Country } from 'src/location/country.entity';
import { State } from 'src/location/state.entity';
import { Keywords } from 'src/keywords/keyword.entity';
import { AccountsVisitors } from 'src/visitors/accounts_visitor.entity';
import { AnalyticsAccess } from 'src/visitors/analytics_access.entity';
import { ProjectApplication } from 'src/applications/application.entity';
import { ProjectVisitors } from 'src/project_visits/project_visits.entity';
import { VerifyPosition } from 'src/verify-position/verify-position.entity';
import { RecruiterCompanyUser } from 'src/recruiter/recruiter-company/recruiter-company-user.entity';
import { RecruiterCompany } from 'src/recruiter/recruiter-company/recruiter-company.entity';
import { RecruiterProject } from 'src/recruiter/projects/project.entity';
dotenv.config();

// eslint-disable-next-line @typescript-eslint/naming-convention
const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = process.env;

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mysql',
  host: DB_HOST,
  port: parseInt(DB_PORT),
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  connectTimeout: 60000,
  entities: [
    UserAccounts,
    Position,
    PositionDetails,
    Company,
    City,
    Country,
    State,
    Keywords,
    AccountsVisitors,
    AnalyticsAccess,
    ProjectApplication,
    ProjectVisitors,
    VerifyPosition,
    RecruiterCompanyUser,
    RecruiterCompany,
    RecruiterProject,
  ],
  logging: false,
  synchronize: true,
};
