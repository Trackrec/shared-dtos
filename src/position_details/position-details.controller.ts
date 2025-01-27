import { Controller, Post, Body, Get, Param, Logger } from '@nestjs/common';
import { PositionDetailsService } from './position-details.service';
import {
  PositionDetailParamDto,
  PositionDetailsRequestDto,
  PositionDetailsResponseDto,
} from 'src/shared-dtos/src/position_detail.dto';
import {
  createPositionDetailsSchema,
  positionDetailsByIdSchema,
} from 'src/validations/position_detail.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';

@Controller('position-details')
export class PositionDetailsController {
  private readonly logger = new Logger(PositionDetailsController.name);

  constructor(private readonly positionDetailsService: PositionDetailsService) {}

  @Post('/create-or-update')
  async createOrUpdatePositionDetails(
    @Body(new ZodValidationPipe(createPositionDetailsSchema)) data: PositionDetailsRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    this.logger.log(
      `Received request to create or update position details for position ID: ${data.position_id}`,
    );
    try {
      if (!data.position_id) {
        this.logger.warn(`Position ID is missing in the request payload.`);
        return { error: true, message: 'Position ID is required.' };
      }

      const result = await this.positionDetailsService.createOrUpdatePositionDetails(data);
      return result;
    } catch (error) {
      this.logger.error(`Error while creating or updating position details: ${error.message}`);
      return { error: true, message: 'Error: ' + error.message };
    }
  }

  @Get('/:position_id')
  async getPositionDetails(
    @Param(new ZodValidationPipe(positionDetailsByIdSchema)) param: PositionDetailParamDto,
  ): Promise<PositionDetailsResponseDto> {
    const { position_id: positionId } = param;
    this.logger.log(`Received request to fetch position details for position ID: ${positionId}`);

    try {
      const result = await this.positionDetailsService.getPositionDetails(positionId);
      return result;
    } catch (error) {
      this.logger.error(
        `Error while fetching position details for position ID: ${positionId} - ${error.message}`,
      );
      return { error: true, message: 'Internal server error.' };
    }
  }
}
