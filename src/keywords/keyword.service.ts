import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keywords } from './keyword.entity';
import { UserAccounts } from 'src/auth/User.entity';

@Injectable()
export class KeywordsService {
  private readonly logger = new Logger(KeywordsService.name);

  constructor(
    @InjectRepository(Keywords)
    private readonly keywordsRepository: Repository<Keywords>,
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
  ) {}

  async getKeywords(user_id: number): Promise<{ error: boolean; message?: string; user?: UserAccounts }> {
    this.logger.debug(`Fetching keywords for user ID: ${user_id}`);

    try {
      let user: UserAccounts = await this.userRepository.findOne({
        where: { id: user_id },
        select: ['keywords', 'id', 'full_name'],
      });

      if (!user) {
        this.logger.warn(`No keywords found for user ID: ${user_id}`);
        return { error: false, message: 'Keywords not found.' };
      }

      this.logger.log(`Keywords fetched successfully for user ID: ${user_id}`);
      return { error: false, user };
    } catch (error) {
      this.logger.error(`Error fetching keywords for user ID: ${user_id} - ${error.message}`, error.stack);
      return { error: true, message: 'Keywords not found.' };
    }
  }

  async createOrUpdateKeywords(userId: number, newKeywords: string[]): Promise<{ error: boolean; message: string }> {
    this.logger.debug(`Creating or updating keywords for user ID: ${userId}`);

    try {
      let user: UserAccounts = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        this.logger.warn(`User not found with ID: ${userId}`);
        return { error: true, message: 'User not found' };
      }

      let keywords: Keywords = await this.keywordsRepository.findOne({ where: { userAccount: { id: userId } } });

      if (!keywords) {
        this.logger.log(`No existing keywords found for user ID: ${userId}, creating new entry.`);
        keywords = new Keywords();
        keywords.keywords = newKeywords;
        keywords.userAccount = user;

        await this.keywordsRepository.save(keywords);
        user.keywords = keywords;
        await this.userRepository.save(user);

        this.logger.log(`Keywords created successfully for user ID: ${userId}`);
      } else {
        keywords.keywords = newKeywords;
        await this.keywordsRepository.save(keywords);
        this.logger.log(`Keywords updated successfully for user ID: ${userId}`);
      }

      return { error: false, message: 'Keywords updated successfully' };
    } catch (error) {
      this.logger.error(`Error creating or updating keywords for user ID: ${userId} - ${error.message}`, error.stack);
      return { error: true, message: 'Something went wrong, please try again!' };
    }
  }
}
