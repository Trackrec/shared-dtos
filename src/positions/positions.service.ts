import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './positions.entity';
import { CompanyService } from 'src/company/company.service';
import { Company } from 'src/company/company.entity';
import { VerifyPosition } from 'src/verify-position/verify-position.entity';
@Injectable()
export class PositionService {
  constructor(
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    @InjectRepository(VerifyPosition)
    private readonly verifyPositionRepository: Repository<VerifyPosition>,
    private readonly companyService: CompanyService,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async createPosition(
    companyId: string,
    userId: number,
    positionData: any,
  ): Promise<any> {
    try {
      let company = await this.companyRepository.findOne({
        where: [
          { name: positionData.company_name },
          { domain: positionData.domain },
        ],
      });
      let newCompany;
      if (!company)
        newCompany = await this.companyService.createCompany({
          name: positionData?.company_name,
          logo_url: positionData.logo_url ? positionData.logo_url : null,
          domain: positionData.domain ? positionData.domain : null,
        });

      const position = this.positionRepository.create({
        ...positionData,
        user: { id: userId },
        company: { id: !company ? newCompany?.createdCompany.id : company.id },
      });

      return await this.positionRepository.save(position);
    } catch (error) {
      //todo: add logger here
      throw new Error(`Error creating position: ${error.message}`);
    }
  }

  async getPositionById(positionId: number): Promise<Position> {
    try {
      const position = await this.positionRepository.findOne({
        where: { id: positionId },
      });

      if (!position) {
        throw new NotFoundException('Position not found');
      }

      return position;
    } catch (error) {
      //todo: add logger here
      throw new Error(`Error getting position by ID: ${error.message}`);
    }
  }

  async updatePosition(
    positionId: number,
    positionData: Partial<Position>,
  ): Promise<Position> {
    try {
      //todo: remove
      await this.getPositionById(positionId);

      //todo: use return true so you dont have to do a db call to get latest details
      await this.positionRepository.update(positionId, positionData);

      //todo: remove
      return await this.getPositionById(positionId);
    } catch (error) {
      //todo: add logger here
      throw new Error(`Error updating position: ${error.message}`);
    }
  }

  async deletePosition(positionId: number): Promise<void> {
    try {
      //todo: remove
      await this.getPositionById(positionId);

      // Delete related verification requests
      await this.verifyPositionRepository.delete({
        position: { id: positionId },
      });

      //todo: add logger here, evaluate response and send appropriate object back
      await this.positionRepository.delete(positionId);
    } catch (error) {
      throw new Error(`Error deleting position: ${error.message}`);
    }
  }

  async getAllPositionsByUserId(userId: number): Promise<Position[]> {
    try {
      return await this.positionRepository.find({
        where: { user: { id: userId } },
      });
    } catch (error) {
      //todo: add logger here
      throw new Error(`Error getting positions by user ID: ${error.message}`);
    }
  }
}
