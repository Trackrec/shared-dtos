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
     
      /** todo: Create a condition here that if email is present then 
       * search based on email, otherwise search based on username for old data
      */
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

      //todo: look for a better way to do this, check how TypeOrm gives status codes for each type, + Add pino logger to see logs later on
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
       /** todo: Create a condition here that if email is present then 
       * search based on email, otherwise search based on username for old data
      */
      const user = await this.userRepository.findOne({where:{username: username}});

      if (!user) {
        return { error: true, message: 'User not found' };
      }

      return { error: false, user };
    } catch (error) {
      // Handle database errors or other exceptions, add logger 
      return { error: true, message: `Error retrieving user details: ${error.message}` };
    }
  }
}
