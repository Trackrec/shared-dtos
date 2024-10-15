import {
    Injectable,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { In, MoreThan, Repository } from 'typeorm';
  import { UserAccounts } from 'src/auth/User.entity';
  import axios from 'axios';
  import { CompanyService } from 'src/company/company.service';
  import { SharedService } from 'src/shared/shared.service';
  import { Position } from 'src/positions/positions.entity';
  import { Company } from 'src/company/company.entity';
  import * as jwt from 'jsonwebtoken';
  import * as bcrypt from 'bcrypt';
  import { randomBytes } from 'crypto';
import { MailgunService } from 'src/mailgun/mailgun.service';

import { RecruiterCompanyUser } from 'src/recruiter/recruiter-company/recruiter-company-user.entity';
import { RecruiterProject } from '../projects/project.entity';


  @Injectable()
  export class RecruiterAuthService {
    constructor(
      @InjectRepository(UserAccounts)
      private readonly userRepository: Repository<UserAccounts>,
      @InjectRepository(Position)
      private readonly positionRepository: Repository<Position>,
      @InjectRepository(Company)
      private readonly companyRepository: Repository<Company>,
      private readonly companyService: CompanyService,
      private readonly sharedService: SharedService,
      @InjectRepository(RecruiterCompanyUser)
      private recruiterCompanyUserRepository: Repository<RecruiterCompanyUser>,
      @InjectRepository(RecruiterProject)
      private recruiterProjectRepository: Repository<RecruiterProject>,
      private readonly mailgunService: MailgunService

    ) {}
  
  
    async registerUser(email: string, password: string, firstName: string, lastName: string): Promise<any> {
        try {
          // Check if the email already exists
          const existingUser = await this.userRepository.findOne({ where: { email,  role: In(['Admin', 'User']) } });
          if (existingUser) {
            return { error: true, message: 'Email is already in use.' };
          }
    
          // Hash the password
          const hashedPassword = await bcrypt.hash(password, 10);
    
          // Create new user
          const user = this.userRepository.create({
            email,
            password: hashedPassword,
            full_name: `${firstName} ${lastName}`,
            login_method: "register",
            role: "Admin"
          });
    
          // Save the user in the database
          const savedUser = await this.userRepository.save(user);
    
          // Generate JWT token
          const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '30d',
          });
    
          // Return success response
          return { error: false, token };
        } catch (error) {
          return { error: true, message: 'An error occurred while registering the user.' };
        }
      }

      async loginUser(email: string, password: string): Promise<any> {
        try {
          const user = await this.userRepository.findOne({ where: { email, role: In(['Admin', 'User']) } });
          if (!user) {
            return { error: true, message: 'Invalid email or password.' };
          }
    
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            return { error: true, message: 'Invalid email or password.' };
          }
    
          const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '30d',
          });
    
          return { error: false, token };
        } catch (error) {
          return { error: true, message: 'An error occurred while logging in.' };
        }
      }

    async findOrCreate(
      userDto: any,
    ): Promise<{ error: boolean; message?: string; user?: UserAccounts }> {
      const {
        email,
        displayName,
        profilePicture,
        accessToken,
        vanityName,
        username,
        loginMethod
      } = userDto;
  
      try {
      

        let user;

if (email) {
  // Check for email and role only if email is provided
  user = await this.userRepository.findOne({
    where: { email, role: In(['Admin', 'User']) },
  });
  
} else if (username) {
  // Check for username and role only if username is provided
  user = await this.userRepository.findOne({
    where: { username,  role: In(['Admin', 'User']) },
  });
}


  
        if (user) {
          if(user.login_method==loginMethod)
          return { error: false, user };
        
          else{
            return {
                error: true,
                message: 'User with this email already exists.',
              };
          }
        }
        
      
        user = this.userRepository.create({
          email,
          full_name: displayName,
          profile_image: '',
          linkedin_access_token: accessToken,
          username,
          role: 'Admin',
          login_method: loginMethod
        });
  
        await this.userRepository.save(user);
  
        // Sending Registration Mail
        // const messageData = {
        //   from: `TrackRec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
        //   to: user.email,
        //   subject: `Welcome to TrackRec`,
        //   html: `
        //       <!DOCTYPE html>
        //       <html lang="en">
        //          <head>
        //             <meta charset="UTF-8">
        //             <meta name="viewport" content="width=device-width, initial-scale=1.0">
        //             <title>Welcome to TrackRec</title>
        //             <style>
        //                body {
        //                font-family: Arial, sans-serif;
        //                background-color: #f4f4f4;
        //                color: #333;
        //                line-height: 1.6;
        //                }
        //                .container {
        //                width: 80%;
        //                margin: auto;
        //                overflow: hidden;
        //                }
  
        //                .content {
        //                background: #fff;
        //                padding: 20px;
        //                margin: 20px 0;
        //                }
  
        //             </style>
        //          </head>
        //          <body>
        //             <div class="container">
        //                <div class="content">
        //                   <p>Hello ${user?.full_name}, and welcome to TrackRec.</p>
        //                   <p>I'm absolutely thrilled to have you here. At any given time, go to <a href="${process.env.REACT_APP_URL}">${process.env.REACT_APP_URL}</a> to access and update your track record.</p>
        //                   <p>Here’s what you can expect from using TrackRec:</p>
        //                   <ul>
        //                      <li>Showcase your sales achievements and track record (and ditch the resume once and for all).</li>
        //                      <li>Verify your experiences with approvals from managers, colleagues, and clients.</li>
        //                      <li>Share your profile with hiring managers to skip a few steps in the hiring process (and see who viewed it).</li>
        //                      <li>Receive job offers based on your own terms: location, compensation, work environment, title, etc.</li>
        //                      <li>Access salary benchmarks to understand how much others with a similar background are making in your industry and location.</li>
        //                   </ul>
        //                   <p>Let's grow your sales career,</p>
        //                   <p>Victor @ TrackRec<br>Founder</p>
        //                   <p><a href="${process.env.REACT_APP_URL}" class="button">Go to TrackRec</a></p>
        //                </div>
        //                   <p>Best,<br>
        //                      Team TrackRec<br>
        //                      <a href="${process.env.REACT_APP_URL}">app.trackrec.co</a>
        //                   </p>
        //             </div>
        //          </body>
        //       </html>
        // `,
        // };
        // if (registerEmail) {
        //   await this.mailgunService.sendMail(messageData);
        // }
        return { error: false, user };
      } catch (error) {
        //todo: look for a better way to do this, check how TypeOrm gives status codes for each type, + Add pino logger to see logs later on
        if (error.code === '23505') {
          if (error.detail.includes('email')) {
            return {
              error: true,
              message: 'User with this email already exists.',
            };
          } else if (error.detail.includes('username')) {
            return {
              error: true,
              message: 'User with this username already exists.',
            };
          }
        } else {
          return { error: true, message: 'Error creating or finding user.' };
        }
      }
    }
  
    async updateCompanyUser(id: number, email: string, full_name: string, role: string, user_id: number) {
      try {
        // Ensure all fields are provided
        if (!email.trim() || !full_name.trim() || !role.trim()) {
          return { error: true, message: 'All fields are required.' };
        }
    
        // Check if the current user is an admin
        const checkAdmin = await this.userRepository.findOne({
          where: { id: user_id, role: 'Admin' },
          relations: ['companyCreated'],
        });
        
        if (!checkAdmin) {
          return { error: true, message: 'You are not an admin user.' };
        }
    
        // Check if the user being updated exists
        const user = await this.userRepository.findOne({
          where: { id, role: In(['User', 'Admin']) },
          relations: ['companyCreated'],

        });
        if (!user) {
          return { error: true, message: 'User not found.' };
        }
    
        // Check existing user-company association
        const existingAssociation = await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id } },
          relations: ["company", "user"],
        });
    
        // If email is being updated, ensure no user exists with the same email
        if (email !== user.email) {
          const existingUser = await this.userRepository.findOne({ where: { email, role: In(['User', 'Admin']) } });
          if (existingUser) {
            return { error: true, message: 'Another user already exists with this email.' };
          }
        }
    
        // Update user details
        user.email = email.trim();
        user.full_name = full_name.trim();
    
        // Only update role if company ID matches
        if (existingAssociation?.company?.id !== user?.companyCreated?.id) {
          user.role = role;
        }
        else{
          return { error: true, message: 'You cannot update company owner.' };
        }
    
        // Save updated user
        await this.userRepository.save(user);
    
        return { error: false, message: 'User updated successfully.' };
    
      } catch (e) {
        console.error('Error updating user:', e);
        return { error: true, message: 'User not updated due to an error.' };
      }
    }
    
    
  
    async updateUser(
      id: number,
      updateUserPayload: any,
    ): Promise<{ error: boolean; message: string }> {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        return { error: true, message: 'User not found' };
      }
      try {
        updateUserPayload.is_preferences_save = true;
        const existingUser = await this.userRepository.findOne({
          where: {
            public_profile_username: updateUserPayload.public_profile_username,
          },
        });
        if (existingUser && existingUser.id != id) {
          return {
            error: true,
            message: 'This Public profile username already choosen.',
          };
        }
  
        // Update user properties based on the payload
        Object.assign(user, updateUserPayload);
  
        await this.userRepository.save(user);
  
        return { error: false, message: 'User updated successfully' };
      } catch (error) {
        return { error: true, message: 'Failed to update user' };
      }
    }
  
    async updatepreference(
      id: number,
      updateUserPreferencePayload: any,
    ): Promise<{ error: boolean; message: string }> {
      const user = await this.userRepository.findOne({ where: { id } });
      console.log(id);
      if (!user) {
        return { error: true, message: 'User not found' };
      }
      try {
        Object.assign(user, updateUserPreferencePayload);
        await this.userRepository.save(user);
        return { error: false, message: 'Preference save successfully' };
      } catch (error) {
        console.log(error);
        return { error: true, message: 'Failed to save preference' };
      }
    }
  
    async getMe(userId: number): Promise<any> {
      // Find the user by their ID
      const user = await this.userRepository.findOne({
        where: { id: userId,  role: In(['User', 'Admin']) },
        select: ['id', 'full_name', 'email', 'role', 'login_method'], 
      });
    
      if (!user) {
        return {error: true, message:"User not found"}
      }
    
      // Find the associated recruiter company if it exists
      const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
        where: { user: { id: userId } },
        relations: ['company'],
      });
    
      // Prepare the response
      const result = {
        user,
        company: recruiterCompanyUser ? recruiterCompanyUser.company : null,
      };
      console.log(result)
    
      return {error:false, user:result};
    }
    
    async importExperiences(user, userId, username) {
      const headers = {
        Authorization: `Bearer ${process.env.nobellaAccessToken}`,
      };
      let url = `https://nubela.co/proxycurl/api/v2/linkedin?linkedin_profile_url=https://www.linkedin.com/in/${username}&use_cache=if-recent`;
  
      try {
        const response = await axios.get(url, { headers });
        if (response && response.data && response.data.experiences.length > 0) {
          const { experiences } = response.data;
          const positionsPromises = experiences.map(async (experience) => {
            let company = await this.companyRepository.findOne({
              where: [{ name: experience.company }],
            });
            let newCompany = null;
            if (!company)
              newCompany = await this.companyService.createCompany({
                name: experience.company,
                logo_url: experience.logo_url ? experience.logo_url : null,
                domain: experience.domain ? experience.domain : null,
              });
  
            const positionData = {
              start_month: experience.starts_at
                ? experience.starts_at.month
                : null,
              start_year: experience.starts_at ? experience.starts_at.year : null,
              end_month: experience.ends_at ? experience.ends_at.month : null,
              end_year: experience.ends_at ? experience.ends_at.year : null,
              role: experience.title,
            };
  
            const position = this.positionRepository.create({
              ...positionData,
              company: newCompany
                ? { id: newCompany.createdCompany.id }
                : company,
              user: user,
            });
  
            return position;
          });
  
          const positions = await Promise.all(positionsPromises);
  
          // Now save all positions in one batch
          this.positionRepository.save(positions);
        }
        // Handle the response here
        // console.log('API Response:', response.data);
      } catch (error) {
        // Handle errors
        console.error('API Error:', error.message);
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

        const recruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: user_id } },
          relations: ['company'],
        });
      
        if (!recruiterCompanyUser) {
          return { error: true, message: 'You are not associated with any recruiter company.' };
      
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
          otp: true,
          login_method:"invite"
        });
  
        await this.userRepository.save(newUser);

        const assignCompanyToNewUser = this.recruiterCompanyUserRepository.create({
          user:newUser,
          company: recruiterCompanyUser.company,
        });
      
        await this.recruiterCompanyUserRepository.save(assignCompanyToNewUser);

        const messageData = {
          from: `Trackrec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
          to: email,
          subject: `${full_name}, Account Credentials`,
          html: `
          <h1>Account Credentials.</h1>
          <p>Hey ${full_name}, please use Credentials to login::</p>
          <p>Email: ${email}</p>
          <p>Password: ${generatedPassword}</p>
          <p>Best, </p>
          <p>Trackrec Team</p>
          `
       };
    
       await this.mailgunService.sendMail(messageData);
      
  
        return {error: false, message: "User created successfully."}
  
      }
      catch(e){
        console.log(e)
        return {error: true, message: "User not created."}
      }
    }

    generatePassword(length: number = 12): string {
      const buffer = randomBytes(Math.ceil(length / 2));
      return buffer.toString('hex').slice(0, length);
    }

    
  async changePassword(body: any, user_id:any): Promise < any > {
    const {current_password, new_password} =body
    try {

        if (!current_password || !new_password ) {
            return {
                error: true,
                message: "Please send all the required fields."
            }
        }
        const user = await this.userRepository.findOne({
            where: {
                id: user_id,
                role: In(['User', 'Admin'])
            }
        });

        if (!user) {
            return {
                error: true,
                message: "User not exist with this email."
            };
        }


        const oldPasswordValid = await bcrypt.compare(current_password, user.password);

        if (!oldPasswordValid) {
            return {
                error: true,
                message: "Your current password is not correct."
            };
        }

        const hashedNewPassword = await bcrypt.hash(new_password, 10);
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

async deleteUser(userId: number): Promise<{ error: boolean; message: string }> {
  try {
    // Find the user
    const user = await this.userRepository.findOne({
      where: { id: userId , role: In(['User', 'Admin']) },
      relations: ['companyCreated'],
    });

    if (!user) {
      return { error: true, message: 'User does not exist.' };
    }

    // Check if the user is linked with any company
    const companyUser = await this.recruiterCompanyUserRepository.findOne({
      where: { user: { id: userId } },
      relations: ['company'],
    });

    if (companyUser) {
      // If the user is the owner of the company
      if (user.companyCreated && user.companyCreated.id === companyUser.company.id) {
        return { error: true, message: 'Cannot delete user as they are the owner of a company.' };
      }

      // Delete the user's association with the company
      await this.recruiterCompanyUserRepository.delete({ user: { id: userId } });
    }

      // Find all projects associated with this user and set user to null
      const userProjects = await this.recruiterProjectRepository.find({
        where: { user: { id: userId } },
      });
  
      if (userProjects.length > 0) {
        // Update each project to set user to null
        for (const project of userProjects) {
          project.user = null;
          await this.recruiterProjectRepository.save(project);
        }
      }
  

       // Delete the user from the repository
       await this.userRepository.delete({ id: userId });  
     return { error: false, message: 'User deleted successfully.' };
  } catch (e) {
    console.log(e)
    return { error: true, message: 'Something went wrong. Please try again.' };
  }
}


async sendResetEmail(email: string): Promise<any> {
  try {
    const user = await this.userRepository.findOne({
      where: {
        email,
        role: In(['User', 'Admin']),
        login_method: In(['register', 'invite']),
      },
    });

    if (!user) {
      return { error: true, message: "No user found with that email." };
    }

    // Generate reset token
    const token = randomBytes(20).toString('hex');

    // Set token and expiration date (1 hour from now)
    user.reset_password_token = token;
    user.reset_password_expires = new Date(Date.now() + 3600000); // 1 hour from now

    await this.userRepository.update({ id: user.id }, user);

    // Sending password reset email
    const messageData = {
      from: `TrackRec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html: `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
      Please click on the following link, or paste this into your browser to complete the process:</p>
    <a href='${process.env.REACT_APP_URL}/recruiter/reset-password/${token}'>Reset Password</a><br/><br/>

    ${process.env.REACT_APP_URL}/recruiter/reset-password/${token} <br/><br/>

    If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await this.mailgunService.sendMail(messageData);

    return { error: false, message: "Password reset email sent." };
  } catch (e) {
    console.log(e)
    return { error: true, message: "No user found with that email." };
  }
}

async verifyToken(token:string): Promise<any>{
  try {
    const user = await this.userRepository.findOne({
      where: {
        reset_password_token: token,
        reset_password_expires: MoreThan(new Date()),
        role: In(['User', 'Admin']),
        login_method: In(['register', 'invite'])
      },
    });

    if (!user) {
      return {error: true, message:"Password reset token is invalid or has expired."}
    }
    
    return {error: false, message: "Token verified", token }
  } catch (error) {
    return {error: true, message:"Password reset token is invalid or has expired."}
  }
}

async resetPassword(token, new_password){
  try {
    const user = await this.userRepository.findOne({where:{
      reset_password_token: token,
      reset_password_expires: MoreThan(new Date()),
      role: In(['User', 'Admin']),
        login_method: In(['register', 'invite'])
    }});

    if (!user) {
      return {error: true, message:"Password reset token is invalid or has expired."}
    }

   
    const hashedPassword = await bcrypt.hash(new_password, 10);

    user.password =hashedPassword;
    user.reset_password_expires = null;
    user.reset_password_token = null;

    await this.userRepository.update({ id: user.id }, user);

    return {error: false, message:"Password has been successfully reset."}
  } catch (error) {
    console.log(error)
    return {error: true, message:"Password reset token is invalid or has expired."}
  }
}



  }
  