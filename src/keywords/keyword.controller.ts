// keywords.controller.ts

import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { KeywordsService } from './keyword.service';
import { CreateUpdateKeywordRequestDto, UserParamDto } from 'src/shared-dtos/src/user.dto';
import { createUpdateKeywordRequestSchema, userParamSchema } from 'src/validations/user.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';
@Controller('keywords')
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}
  
  @Post(':userId')
  async createOrUpdateKeywords(
    @Param(new ZodValidationPipe(userParamSchema)) param: UserParamDto,
    @Body(new ZodValidationPipe(createUpdateKeywordRequestSchema)) body: CreateUpdateKeywordRequestDto,
  ): Promise<{ error: boolean, message: string }> {
    try {
      const {userId}=param;
      const {keywords}=body;
      const result = await this.keywordsService.createOrUpdateKeywords(userId, keywords);
      return result;
    } catch (error) {
      console.error('Error creating or updating keywords:', error);
      return { error: true, message: 'Something went wrong, please try again!' };
    }
  }

  @Get(':userId')
  async getKeywords(@Param(new ZodValidationPipe(userParamSchema)) param: UserParamDto){
    const {userId} =param;
    return await this.keywordsService.getKeywords(userId)
  }
}
