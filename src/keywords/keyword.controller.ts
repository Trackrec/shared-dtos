import { Controller, Post, Body, Param, Get, Logger } from '@nestjs/common';
import { KeywordsService } from './keyword.service';
import { CreateUpdateKeywordRequestDto, UserParamDto } from 'src/shared-dtos/src/user.dto';
import { createUpdateKeywordRequestSchema, userParamSchema } from 'src/validations/user.validation';
import { ZodValidationPipe } from 'src/pipes/zod_validation.pipe';

@Controller('keywords')
export class KeywordsController {
  private readonly logger = new Logger(KeywordsController.name);

  constructor(private readonly keywordsService: KeywordsService) {}

  @Post(':userId')
  async createOrUpdateKeywords(
    @Param(new ZodValidationPipe(userParamSchema)) param: UserParamDto,
    @Body(new ZodValidationPipe(createUpdateKeywordRequestSchema))
    body: CreateUpdateKeywordRequestDto,
  ): Promise<{ error: boolean; message: string }> {
    const { userId } = param;
    const { keywords } = body;

    this.logger.log(
      `Request to create or update keywords for user ID: ${userId} with keywords: ${JSON.stringify(keywords)}`,
    );

    try {
      const result = await this.keywordsService.createOrUpdateKeywords(userId, keywords);
      return result;
    } catch (error) {
      this.logger.error(
        `Error updating keywords for user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Something went wrong, please try again!' };
    }
  }

  @Get(':userId')
  async getKeywords(@Param(new ZodValidationPipe(userParamSchema)) param: UserParamDto) {
    const { userId } = param;
    this.logger.log(`Fetching keywords for user ID: ${userId}`);

    try {
      const result = await this.keywordsService.getKeywords(userId);
      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching keywords for user ID: ${userId} - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Failed to fetch keywords' };
    }
  }
}
