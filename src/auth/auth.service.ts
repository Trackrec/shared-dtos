import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccounts } from './User.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
  ) {}

  async findOrCreate(userDto: any): Promise<{ error: boolean; message?: string; user?: UserAccounts }> {
    const { email, displayName, profilePicture, accessToken, vanityName, username } = userDto;

    try {
     
      let user = await this.userRepository.findOne({
        where: [{ email }, { username }], 
      });

      if (user) {
        return { error: false, user };
      }

      user = this.userRepository.create({
        email,
        full_name: displayName,
        profile_image: profilePicture,
        linkedin_access_token: accessToken,
        username,
        role: 'Applicant',
      });

      await this.userRepository.save(user);

      return { error: false, user };
    } catch (error) {

      if (error.code === '23505') {
        if (error.detail.includes('email')) {
          return { error: true, message: 'User with this email already exists.' };
        } else if (error.detail.includes('username')) {
          return { error: true, message: 'User with this username already exists.' };
        }
      } else {
        return { error: true, message: 'Error creating or finding user.' };
      }
    }
  }

  async getMe(username: string): Promise<{ error: boolean; user?: UserAccounts; message?: string }> {
    try {
      const user = await this.userRepository.findOne({where:{username: username}});

      if (!user) {
        return { error: true, message: 'User not found' };
      }

      return { error: false, user };
    } catch (error) {
      // Handle database errors or other exceptions
      return { error: true, message: `Error retrieving user details: ${error.message}` };
    }
  }
}
