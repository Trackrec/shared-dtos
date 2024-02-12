import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PositionDetails } from './position_details.entity';
@Injectable()
export class PositionDetailsService {
  constructor(
    @InjectRepository(PositionDetails)
    private readonly positionDetailsRepository: Repository<PositionDetails>,
  ) {}

  async createOrUpdatePositionDetails(data: { position_id: string, [key: string]: any }): Promise<{ error: boolean, message?: string, data?: PositionDetails }> {
    try {
      const { position_id, ...restData } = data;

      if (!position_id) {
        return { error: true, message: 'Position ID is required.' };
      }

      let positionDetails = await this.positionDetailsRepository.findOne({ where: { position_id: position_id } });

      if (!positionDetails) {
        // If positionDetails doesn't exist, create a new one
        positionDetails = this.positionDetailsRepository.create({
          position_id: position_id ,
          ...restData,
        });
      } else {
        // Update existing positionDetails with the provided data
        positionDetails = this.positionDetailsRepository.merge(positionDetails, restData);
      }

      const savedPositionDetails = await this.positionDetailsRepository.save(positionDetails);

      return { error: false, data: savedPositionDetails, message: 'Position details saved successfully.' };
    } catch (error) {
      // Handle specific error types if needed
      return { error: true, message: 'Internal server error.' };
    }
  }

  async getPositionDetails(position_id: string): Promise<{ error: boolean, message?: string, data?: PositionDetails }> {
    try {
      const positionDetails = await this.positionDetailsRepository.findOne({ where: { position_id: position_id } });

      if (!positionDetails) {
        return { error: true, message: 'Position details not found.' };
      }

      return { error: false, data: positionDetails, message: 'Position details retrieved successfully.' };
    } catch (error) {
      // Handle specific error types if needed
      return { error: true, message: 'Internal server error.' };
    }
  }
}
