// keywords.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keywords } from './keyword.entity';
import { UserAccounts } from 'src/auth/User.entity';
@Injectable()
export class KeywordsService {
  constructor(
    @InjectRepository(Keywords)
    private readonly keywordsRepository: Repository<Keywords>,
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>
  ) {}

  async getKeywords(user_id: number){
    try{
       let user= await this.userRepository.findOne({where:{id: user_id}, select:["keywords", "id", "full_name"]})
       if(!user){
        return {error: false, message: "Keywords not found."}
       }
       return { error: false, user}
    }
    catch(e){
      return { error: true, message: 'Keywords not found.' };

    }
  }
  async createOrUpdateKeywords(userId: number, newKeywords: string[]): Promise<{ error: boolean, message: string }> {
    try {
        let user = await this.userRepository.findOne({where:{id:userId}});

        if (!user) {
          return { error: true, message: 'User not found' };
        }
  
        let keywords = await this.keywordsRepository.findOne({ where: { userAccount:{id: userId} } });
  
        if (!keywords) {
          keywords = new Keywords();
          keywords.keywords = newKeywords;
          keywords.userAccount = user;
          await this.keywordsRepository.save(keywords);
          user.keywords = keywords;
          await this.userRepository.save(user);
        } else {
          keywords.keywords = newKeywords;
          await this.keywordsRepository.save(keywords);
        }
  
      return { error: false, message: 'Keywords updated successfully' };
    } catch (error) {
      console.error('Error creating or updating keywords:', error);
      return { error: true, message: 'Something went wrong, please try again!' };
    }
  }
}
