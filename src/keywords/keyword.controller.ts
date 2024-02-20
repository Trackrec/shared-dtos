// keywords.controller.ts

import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { KeywordsService } from './keyword.service';
@Controller('keywords')
export class KeywordsController {
  constructor(private readonly keywordsService: KeywordsService) {}

  @Post(':userId')
  async createOrUpdateKeywords(
    @Param('userId') userId: number,
    @Body('keywords') newKeywords: string[],
  ): Promise<{ error: boolean, message: string }> {
    try {
      const result = await this.keywordsService.createOrUpdateKeywords(userId, newKeywords);
      return result;
    } catch (error) {
      console.error('Error creating or updating keywords:', error);
      return { error: true, message: 'Something went wrong, please try again!' };
    }
  }

  @Get(':userId')
  async getKeywords(@Param('userId') userId: number){
    return await this.keywordsService.getKeywords(userId)
  }
}
