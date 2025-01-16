import { Controller, Post, Get, Param, Body, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PositionService } from './positions.service';
import { Position } from './positions.entity';
import { AllPositionsByUserIdResponseDto, PositionDto, PositionRequestDto, PositionWithCompany, PostionResponseDto } from 'src/shared-dtos/src/Position.dto';
@Controller('positions')
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @Post()
  async createPosition(@Req() req: Request, @Body() positionData: PositionRequestDto) {
    try {
      const userId: number = req["user_id"];
      const createdPosition: PositionWithCompany = await this.positionService.createPosition(null,userId, positionData);
      return { error: false, position: createdPosition };
    } catch (error) {
      return { error: true, message: error.message };
      //todo: add logger here
    }
  }

  @Get(':id')
  async getPositionById(@Param('id') positionId: number): Promise<PostionResponseDto> {
    try {
      const position: PositionDto = await this.positionService.getPositionById(positionId);
      return { error: false, position };
    } catch (error) {
      //todo: add logger here
      return { error: true, message: error.message };
    }
  }

  @Put(':id')
  async updatePosition(@Param('id') positionId: number, @Body() positionData: Partial<PositionDto>) {
    try {
      const updatedPosition: PositionDto = await this.positionService.updatePosition(positionId, positionData);
      return { error: false, position: updatedPosition };
    } catch (error) {
      //todo: add logger here
      return { error: true, message: error.message };
    }
  }

  @Delete(':id')
  async deletePosition(@Param('id') positionId: number): Promise<{error: boolean; message: string}> {
    try {
      await this.positionService.deletePosition(positionId);
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
