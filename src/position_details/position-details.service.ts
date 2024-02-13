import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PositionDetails } from './position_details.entity';
import { Position } from 'src/positions/positions.entity';
@Injectable()
export class PositionDetailsService {
  constructor(
    @InjectRepository(PositionDetails)
    private readonly positionDetailsRepository: Repository<PositionDetails>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,

    
  ) {}

  async createOrUpdatePositionDetails(data: { position_id: string, [key: string]: any }): Promise<{ error: boolean, message?: string, data?: PositionDetails }> {
    try {
      const { position_id, ...restData } = data;

      if (!position_id) {
        return { error: true, message: 'Position ID is required.' };
      }
      let position = await this.positionRepository.findOne({ where: { id: parseInt(position_id) } });
      if(!position){
        return { error: true, message: 'Position not found.' };
      }
      
      let positionDetails = await this.positionDetailsRepository.findOne({ where: { position_id: position_id } });

      if (!positionDetails) {
       // If positionDetails doesn't exist, create a new one
        const positionDetails = this.positionDetailsRepository.create({
        position_id: position_id,
       ...restData,
       });

       // Save the new positionDetails record to obtain its ID
       const savedPositionDetails = await this.positionDetailsRepository.save(positionDetails);

        // Find the corresponding Position entity
      
      // Update the Position entity with the new positionDetails ID
       position.details = savedPositionDetails;

        // Save the updated Position entity
        await this.positionRepository.save(position);
        
        // Save the updated Position entity
      } else {
        // Update existing positionDetails with the provided data
        positionDetails = this.positionDetailsRepository.merge(positionDetails, restData);
        await this.positionDetailsRepository.save(positionDetails);

      }


      return { error: false, message: 'Position details saved successfully.' };
    } catch (error) {
      console.log(error)
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
