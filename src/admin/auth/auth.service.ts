// user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserAccounts } from 'src/auth/User.entity';
import { In, Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AdminAuthService {
    constructor(
        @InjectRepository(UserAccounts)
        private readonly userRepository: Repository<UserAccounts>,
     
      ) {}

  async createAdminUser(): Promise<any> {
   try{ 
    const existingAdmin = await this.userRepository.findOne({ where: { email: 'admin@admin.com' } });
    if (existingAdmin) {
        return {error:true, message: "Admin user already created"}
    }

    const adminUser = this.userRepository.create({
        full_name: 'admin',
        role: 'Admin',
        email: 'admin@admin.com',
        password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 10), 
      });
  
      await this.userRepository.save(adminUser);
      return {error: false, message: "Admin user successfully created."}
   }
   catch(e){
    return {error:true, message: "Admin user not created."}
   }
  }

  async createUser(email: string, full_name:string, password: string ){
    try{
      console.log(password)
      if(!email || !full_name || !password){
        return {error:true, message:"All the fields are required."}
      }
      const user = await this.userRepository.findOne({
        where: {
          email,
          role: In(['User', 'Admin']) 
        }
      });
      
      if(user){
        return {error: true, message:"User already exist with this email."}
      }
      const newUser = this.userRepository.create({
        full_name,
        role: 'User',
        email,
        password: await bcrypt.hash(password.toString(), 10), 
      });

      await this.userRepository.save(newUser);

      return {error: false, message: "User created successfully."}

    }
    catch(e){
      return {error: true, message: "User not created."}
    }
  }

  async changePassword(email: string, oldPassword: string, newPassword: string): Promise < any > {
    try {

        if (!email || !oldPassword || !newPassword) {
            return {
                error: true,
                message: "Please send all the required fields."
            }
        }
        const user = await this.userRepository.findOne({
            where: {
                email: email
            }
        });

        if (!user) {
            return {
                error: true,
                message: "User not exist with this email."
            };
        }


        const oldPasswordValid = await bcrypt.compare(oldPassword, user.password);

        if (!oldPasswordValid) {
            return {
                error: true,
                message: "Your current password is not correct."
            };
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;

        await this.userRepository.update({
            id: user.id
        }, user);
        return {
            error: false,
            message: "Password changed successfully."
        }
    } catch (e) {
        return {
            error: true,
            message: "Password not changed."
        }
    }
}

  async loginUser(email: string, password: string): Promise < any > {
    try {
        const user = await this.userRepository
            .createQueryBuilder('user')
            .where('user.email = :email', {
                email
            })
            .andWhere('user.role IN (:...roles)', {
                roles: ['User', 'Admin']
            })
            .getOne();

        if (!user) {
            return {
                error: true,
                message: "User with this email not found."
            }
        }


        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return {
                error: true,
                message: "Your email or password is incorrect."
            }
        }

        const jwtToken = this.generateToken(user);
        return {
            error: false,
            token: jwtToken
        }
    } catch (e) {
        return {
            error: true,
            messsage: "Unable to login, please try again."
        }
    }

}

  private generateToken(user: any): string {
    const payload = {
      id: user.id,
      email: user.email,
      username: user.username,
    };

    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn:'24h' });
  }


}
