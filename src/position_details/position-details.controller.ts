import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PositionDetailsService } from './position-details.service';
import { PositionDetails } from './position_details.entity';
@Controller('position_details')
export class PositionDetailsController {
  constructor(private readonly positionDetailsService: PositionDetailsService) {}

  @Post('/create-or-update')
  async createOrUpdatePositionDetails(@Body() data:{ position_id: any, positionData: any, companyData: any, [key: string]: any }): Promise<{ error: boolean, message?: string, data?: any }> {
    try {
      if (!data.position_id) {
        return { error: true, message: 'Position ID is required.' };
      }

      const result = await this.positionDetailsService.createOrUpdatePositionDetails(data);
      return result;
    } catch (error) {
      // Handle specific error types if needed
      return { error: true, message: 'Error :'+error.message };
    }
  }

  @Get('/:position_id')
  async getPositionDetails(@Param('position_id') position_id: string): Promise<{ error: boolean, message?: string, data?: PositionDetails }> {
    try {
      const result = await this.positionDetailsService.getPositionDetails(position_id);
      return result;
    } catch (error) {
      // Handle specific error types if needed
      return { error: true, message: 'Internal server error.' };
    }
  }
}
