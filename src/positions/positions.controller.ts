import { Controller, Post, Get, Param, Body, Put, Delete, Req, Logger } from '@nestjs/common';
import { PositionService } from './positions.service';
import {
  AllPositionsByUserIdResponseDto,
  PositionDto,
  PositionParamDto,
  PositionRequestDto,
  PositionWithCompany,
  PostionResponseDto,
} from 'src/shared-dtos/src/position.dto';
import {
  createPositionRequestSchema,
  positionByIdSchema,
  updatePositionSchema,
} from 'src/validations/position.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';

@Controller('positions')
export class PositionController {
  private readonly logger = new Logger(PositionController.name);

  constructor(private readonly positionService: PositionService) {}

  @Post()
  async createPosition(
    @Req() req: Request,
    @Body(new ZodValidationPipe(createPositionRequestSchema)) positionData: PositionRequestDto,
  ) {
    try {
      const userId: number = req['user_id'];
      this.logger.log(
        `Creating position for user ID: ${userId} with data: ${JSON.stringify(positionData)}`,
      );

      const createdPosition: PositionWithCompany = await this.positionService.createPosition(
        null,
        userId,
        positionData,
      );

      this.logger.log(`Position created successfully for user ID: ${userId}`);
      return { error: false, position: createdPosition };
    } catch (error) {
      this.logger.error(
        `Error creating position for user ID: ${req['user_id']} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: error.message };
    }
  }

  @Get(':id')
  async getPositionById(
    @Param(new ZodValidationPipe(positionByIdSchema)) param: PositionParamDto,
  ): Promise<PostionResponseDto> {
    try {
      const { id } = param;
      this.logger.log(`Fetching position with ID: ${id}`);

      const position: PositionDto = await this.positionService.getPositionById(id);

      this.logger.log(`Successfully fetched position with ID: ${id}`);
      return { error: false, position };
    } catch (error) {
      this.logger.error(
        `Error fetching position with ID: ${param.id} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: error.message };
    }
  }

  @Put(':id')
  async updatePosition(
    @Param(new ZodValidationPipe(positionByIdSchema)) param: PositionParamDto,
    @Body(new ZodValidationPipe(updatePositionSchema)) positionData: Partial<PositionRequestDto>,
  ) {
    try {
      const { id } = param;
      this.logger.log(
        `Updating position with ID: ${id} with data: ${JSON.stringify(positionData)}`,
      );

      const updatedPosition: PositionDto = await this.positionService.updatePosition(
        id,
        positionData,
      );

      this.logger.log(`Successfully updated position with ID: ${id}`);
      return { error: false, position: updatedPosition };
    } catch (error) {
      this.logger.error(
        `Error updating position with ID: ${param.id} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: error.message };
    }
  }

  @Delete(':id')
  async deletePosition(
    @Param(new ZodValidationPipe(positionByIdSchema)) param: PositionParamDto,
  ): Promise<{ error: boolean; message: string }> {
    try {
      const { id } = param;
      this.logger.log(`Deleting position with ID: ${id}`);

      await this.positionService.deletePosition(id);

      return { error: false, message: 'Position deleted successfully' };
    } catch (error) {
      this.logger.error(
        `Error deleting position with ID: ${param.id} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: error.message };
    }
  }

  @Get('user')
  async getAllPositionsByUserId(@Req() req: Request): Promise<AllPositionsByUserIdResponseDto> {
    try {
      const userId: number = req['user_id'];
      this.logger.log(`Fetching all positions for user ID: ${userId}`);

      const positions: PositionDto[] = await this.positionService.getAllPositionsByUserId(userId);

      return { error: false, positions };
    } catch (error) {
      this.logger.error(
        `Error fetching positions for user ID: ${req['user_id']} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: error.message };
    }
  }
}
