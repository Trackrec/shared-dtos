import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { PositionDetailsService } from './position-details.service';
import { PositionDetails } from './position_details.entity';
import { PositionDetailParamDto, PositionDetailsDto, PositionDetailsRequestDto, PositionDetailsResponseDto } from 'src/shared-dtos/src/position_detail.dto';
import { createPositionDetailsSchema, positionDetailsByIdSchema } from 'src/validations/position_detail.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
@Controller('position_details')
export class PositionDetailsController {
  constructor(private readonly positionDetailsService: PositionDetailsService) {}

  @Post('/create-or-update')
  async createOrUpdatePositionDetails(@Body(new ZodValidationPipe(createPositionDetailsSchema)) data:PositionDetailsRequestDto): Promise<{ error: boolean, message: string}> {
    try {
      if (!data.position_id) {
        return { error: true, message: 'Position ID is required.' };
      }

      const result: { error: boolean, message: string} = await this.positionDetailsService.createOrUpdatePositionDetails(data);
      return result;
    } catch (error) {
      // Handle specific error types if needed
      return { error: true, message: 'Error :'+error.message };
    }
  }
  
  @Get('/:position_id')
  async getPositionDetails(@Param(new ZodValidationPipe(positionDetailsByIdSchema)) param: PositionDetailParamDto): Promise<PositionDetailsResponseDto> {
    try {
      const { position_id } =param;
      const result: PositionDetailsResponseDto = await this.positionDetailsService.getPositionDetails(position_id);
      return result;
    } catch (error) {
      // Handle specific error types if needed
      return { error: true, message: 'Internal server error.' };
    }
  }
}
