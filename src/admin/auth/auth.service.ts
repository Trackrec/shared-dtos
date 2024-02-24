// user.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { UserAccounts } from 'src/auth/User.entity';
import { In, Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { MailgunService } from 'src/mailgun/mailgun.service';

@Injectable()
export class AdminAuthService {
    constructor(
        @InjectRepository(UserAccounts)
        private readonly userRepository: Repository<UserAccounts>,
        private readonly mailgunService: MailgunService
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

  generatePassword(length: number = 12): string {
    const buffer = randomBytes(Math.ceil(length / 2));
    return buffer.toString('hex').slice(0, length);
  }

  async remove(user_id:number, logged_in_user_id: number){
    try{ 
        const isAdminUser = await this.userRepository.findOne({ where: { id: logged_in_user_id, role: "Admin"} });
        if (!isAdminUser) {
          return {error:true, message: 'You are not authorized to do this.'};
        }
        const user= await this.userRepository.findOne({where:{id:user_id}})
        if(!user){
            return {error: true, message: "User not fount."}
        }
       await this.userRepository.delete({id: user_id});
       return {error: false, message: "User Deleted Successfully"}

    }
    catch(e){
        return {error:true, message: "User not deleted."}
    }
  }

  async getUserDetails(user_id:number){
    try{ 
       
    let user= await this.userRepository.findOne({where:{id:user_id}, select:["id", "full_name", "email", "role", "otp"]})
        if(!user){
            return {error: true, message: "User not found."}
        }
       return {error: false, user}

    }
    catch(e){
        return {error:true, message: "User not deleted."}
    }
  }

  async getAllUsers(user_id:number){
    try{
      const user= await this.userRepository.findOne({where:{id: user_id, role: 'Admin'}})
      if(!user){
         return {error: true, message: "You are not authorized to make this request."}
      }
      const users= await this.userRepository.find({where:{role: In(["Admin", "User"]),}, select: ["id", "full_name", "email", "otp", "role", "created_at"]})
      return {error: false, users}

    }
    catch(e){
      return {error: true, message: "Users not found."}
    }
  }

  async createUser(email: string, full_name:string, role: string, user_id:number ){
    try{
      if(!email || !full_name || !role ){
        return {error:true, message:"All the fields are required."}
      }
      const checkAdmin=await this.userRepository.findOne({where:{id: user_id, role: "Admin"}})
      if(!checkAdmin){
        return {error: true, message: "You are not admin User."}
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
      const generatedPassword=this.generatePassword()

      const newUser = this.userRepository.create({
        full_name,
        role,
        email,
        password: await bcrypt.hash(generatedPassword, 10), 
        otp: true
      });

      await this.userRepository.save(newUser);
      const messageData = {
        from: `Trackrec <mailgun@${process.env.MAILGUN_DOMAIN}>`,
        to: email,
        subject: `${full_name}, Account Credentials`,
        html: `
        <h1>Account Credentials.</h1>
        <p>Hey ${full_name}, please use Credentials to login::</p>
        <p>Email: ${email}</p>
        <p>Password: ${generatedPassword}</p>
        <p>Best, </p>
        <p>Trackrect Team</p>
        `
     };
  
      await this.mailgunService.sendMail(messageData);
    

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
        user.otp=false
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
            token: jwtToken,
            email: user.email
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
