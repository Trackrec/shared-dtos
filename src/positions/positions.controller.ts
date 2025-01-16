import { Controller, Post, Get, Param, Body, Put, Delete, UseGuards, Req, UsePipes } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PositionService } from './positions.service';
import { Position } from './positions.entity';
import { AllPositionsByUserIdResponseDto, PositionDto, PositionParamDto, PositionRequestDto, PositionWithCompany, PostionResponseDto } from 'src/shared-dtos/src/Position.dto';
import { createPositionRequestSchema, positionByIdSchema, updatePositionSchema } from 'src/validations/position.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
@Controller('positions')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Post()
  async createPosition(@Req() req: Request, @Body(new ZodValidationPipe(createPositionRequestSchema)) positionData: PositionRequestDto) {
    try {
      const userId: number = req["user_id"];
      const createdPosition: PositionWithCompany = await this.positionService.createPosition(null,userId, positionData);
      return { error: false, position: createdPosition };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }

  @Get(':id')
  async getPositionById(@Param(new ZodValidationPipe(positionByIdSchema)) param: PositionParamDto): Promise<PostionResponseDto> {
    try {
      const {id} =param;
      const position: PositionDto = await this.positionService.getPositionById(id);
      return { error: false, position };
    } catch (error) {
      //todo: add logger here
      return { error: true, message: error.message };
    }
  }

  @Put(':id')
  async updatePosition(@Param(new ZodValidationPipe(positionByIdSchema)) param: PositionParamDto, @Body(new ZodValidationPipe(updatePositionSchema)) positionData: Partial<PositionRequestDto>) {
    try {
      const {id} =param;
      const updatedPosition: PositionDto = await this.positionService.updatePosition(id, positionData);
      return { error: false, position: updatedPosition };
    } catch (error) {
      //todo: add logger here
      return { error: true, message: error.message };
    }
  }

  @Delete(':id')
  async deletePosition(@Param(new ZodValidationPipe(positionByIdSchema)) param: PositionParamDto): Promise<{error: boolean; message: string}> {
    try {
      const {id} =param;
      await this.positionService.deletePosition(id);
      return { error: false, message: 'Position deleted successfully' };
    } catch (error) {
      //todo: add logger here
      return { error: true, message: error.message };
    }
  }

  @Get('user')
  async getAllPositionsByUserId(@Req() req: Request): Promise<AllPositionsByUserIdResponseDto> {
    try {
      const positions: PositionDto[] = await this.positionService.getAllPositionsByUserId(req['user_id']);
      return { error: false, positions };
    } catch (error) {
      //todo: add logger here
      return { error: true, message: error.message };
    }
  }
}
