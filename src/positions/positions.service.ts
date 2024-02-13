import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './positions.entity';
import { Company } from 'src/company/company.entity';
@Injectable()
export class PositionService {
  constructor(
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
  ) {}

  async createPosition(companyId:string, userId: number, positionData: Partial<Position>): Promise<Position> {
    try {
      const position = this.positionRepository.create({
        ...positionData,
        user: { id: userId },
        company: { id: companyId } 
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

  async updatePosition(positionId: number, positionData: Partial<Position>): Promise<Position> {
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

      //todo: add logger here, evaluate response and send appropriate object back
      await this.positionRepository.delete(positionId);
    } catch (error) {
      throw new Error(`Error deleting position: ${error.message}`);
    }
  }

  async getAllPositionsByUserId(userId: number): Promise<Position[]> {
    try {
      return await this.positionRepository.find({ where: { user: { id: userId } } });
    } catch (error) {
      //todo: add logger here
      throw new Error(`Error getting positions by user ID: ${error.message}`);
    }
  }
}
