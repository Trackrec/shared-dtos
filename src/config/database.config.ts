import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import * as dotenv from "dotenv";
import { UserAccounts } from "src/auth/User.entity";
import { Position } from "src/positions/positions.entity";
import { PositionDetails } from "src/position_details/position_details.entity";
import { Company } from "src/company/company.entity";
dotenv.config();
const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = process.env;

export const databaseConfig: TypeOrmModuleOptions = {
    type: "mysql",
    host: DB_HOST,
    port: parseInt(DB_PORT),
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_DATABASE,
    connectTimeout: 60000,
    entities: [UserAccounts, Position, PositionDetails, Company],
    logging: false,
    synchronize: true,
  };
  