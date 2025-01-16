import {
    Injectable,
    Logger,
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
import { RecruiterCompany } from '../recruiter-company/recruiter-company.entity';
import { ChangePasswordRequestDto, RecruiterUserAuthResponseDto, UpdatePreferencesRequestDto, UserDto, UserInfoResponseDto, VerifyTokenResponse } from 'src/shared-dtos/src/user.dto';
import { RecruiterCompanyDto, RecruiterCompanyUserDto } from 'src/shared-dtos/src/recruiter_company';
import { RecruiterProjectDto } from 'src/shared-dtos/src/recruiter_project.dto';
import { String } from 'aws-sdk/clients/appstream';


  @Injectable()
  export class RecruiterAuthService {
        private readonly logger = new Logger(RecruiterAuthService.name);
    
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
  
  
    async registerUser(email: string, password: string, firstName: string, lastName: string): Promise<RecruiterUserAuthResponseDto> {
      try {
        this.logger.log(`Registering user with email: ${email}`);
    
        // Check if the email already exists
        const existingUser: UserDto = await this.userRepository.findOne({ where: { email, role: In(['Admin', 'User']) } });
        if (existingUser) {
          this.logger.warn(`Registration failed: Email ${email} is already in use.`);
          return { error: true, message: 'Email is already in use.' };
        }
    
        this.logger.log(`Email ${email} is available. Proceeding with registration.`);
    
        // Hash the password
        const hashedPassword: string = await bcrypt.hash(password, 10);
        this.logger.log(`Password hashed successfully for email: ${email}`);
    
        // Create new user
        const user: UserDto = this.userRepository.create({
          email,
          password: hashedPassword,
          full_name: `${firstName} ${lastName}`,
          login_method: "register",
          role: "Admin",
        });
    
        // Save the user in the database
        await this.userRepository.save(user);
        this.logger.log(`New user registered and saved to the database with email: ${email}`);
    
        // Generate JWT token
        const token: string = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
          expiresIn: '30d',
        });
    
        this.logger.log(`JWT token generated for user ID: ${user.id}`);
    
        // Return success response
        this.logger.log(`User registration completed successfully for email: ${email}`);
        return { error: false, token };
    
      } catch (error) {
        this.logger.error(`Error occurred while registering user with email ${email}: ${error.message}`);
        return { error: true, message: 'An error occurred while registering the user.' };
      }
    }
    

    async loginUser(email: string, password: string): Promise<RecruiterUserAuthResponseDto> {
      try {
        this.logger.log(`Login attempt for email: ${email}`);
    
        // Check if the user exists with the provided email
        const user: UserDto = await this.userRepository.findOne({ where: { email, role: In(['Admin', 'User']) } });
        if (!user) {
          this.logger.warn(`Login failed: No user found with email: ${email}`);
          return { error: true, message: 'Invalid email or password.' };
        }
    
        this.logger.log(`User found with email: ${email}. Validating password.`);
    
        // Validate the provided password
        const isPasswordValid: boolean = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          this.logger.warn(`Login failed: Incorrect password for email: ${email}`);
          return { error: true, message: 'Invalid email or password.' };
        }
    
        this.logger.log(`Password validated successfully for email: ${email}`);
    
        // Generate JWT token upon successful authentication
        const token: string = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
          expiresIn: '30d',
        });
    
        this.logger.log(`JWT token generated for user ID: ${user.id}`);
    
        // Return success response with token
        this.logger.log(`User login successful for email: ${email}`);
        return { error: false, token };
    
      } catch (error) {
        this.logger.error(`Error occurred during login for email ${email}: ${error.message}`);
        return { error: true, message: 'An error occurred while logging in.' };
      }
    }
    

    async findOrCreate(
      userDto: {email: string, displayName: string, profilePicture?: string, accessToken: string, vanityName?: string, username?: string, loginMethod: string},
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
      

        let user: UserAccounts;

        if (email) {
          this.logger.log(`Checking if user with email ${email} exists with role 'Admin' or 'User'`);
          
          // Check for email and role only if email is provided
          user = await this.userRepository.findOne({
            where: { email, role: In(['Admin', 'User']) },
          });
        
        } else if (username) {
          this.logger.log(`Checking if user with username ${username} exists with role 'Admin' or 'User'`);
          
          // Check for username and role only if username is provided
          user = await this.userRepository.findOne({
            where: { username, role: In(['Admin', 'User']) },
          });
        }
        
        if (user) {
          this.logger.log(`User found with ${email ? 'email' : 'username'}: ${email || username}`);
          
          if (user.login_method == loginMethod) {
            this.logger.log(`User with ${email ? 'email' : 'username'} ${email || username} already exists and login method matches`);
            return { error: false, user };
          } else {
            this.logger.warn(`User with ${email ? 'email' : 'username'} ${email || username} already exists, but login method does not match`);
            return {
              error: true,
              message: 'User with this email already exists.',
            };
          }
        }
        
        this.logger.log('Creating new user with email and username');
        user = this.userRepository.create({
          email,
          full_name: displayName,
          profile_image: '',
          linkedin_access_token: accessToken,
          username,
          role: 'Admin',
          login_method: loginMethod,
        });
        
        await this.userRepository.save(user);
        this.logger.log('New user created and saved successfully');
        
  
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
  
    async updateCompanyUser(id: number, email: string, full_name: string, role: string, user_id: number): Promise<{ error: boolean, message: string }> {
      try {
        this.logger.log(`Starting user update. Target User ID: ${id}, Performed by User ID: ${user_id}`);
    
        // Ensure all fields are provided
        if (!email.trim() || !full_name.trim() || !role.trim()) {
          this.logger.warn(`Validation failed: Missing required fields. Email: ${email}, Full Name: ${full_name}, Role: ${role}`);
          return { error: true, message: 'All fields are required.' };
        }
    
        // Check if the current user is an admin
        this.logger.log(`Verifying admin access for User ID: ${user_id}`);
        const checkAdmin: UserDto = await this.userRepository.findOne({
          where: { id: user_id, role: 'Admin' },
          relations: ['companyCreated'],
        });
    
        if (!checkAdmin) {
          this.logger.warn(`Access denied. User ID ${user_id} is not an admin.`);
          return { error: true, message: 'You are not an admin user.' };
        }
    
        // Check if the user being updated exists
        this.logger.log(`Checking existence of target user with ID: ${id}`);
        const user: UserAccounts = await this.userRepository.findOne({
          where: { id, role: In(['User', 'Admin']) },
          relations: ['companyCreated'],
        });
    
        if (!user) {
          this.logger.warn(`User with ID ${id} not found.`);
          return { error: true, message: 'User not found.' };
        }
    
        // Check existing user-company association
        this.logger.log(`Checking company association for User ID: ${id}`);
        const existingAssociation: RecruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id } },
          relations: ["company", "user"],
        });
    
        // If email is being updated, ensure no user exists with the same email
        if (email !== user.email) {
          this.logger.log(`Checking if email ${email} already exists in the system.`);
          const existingUser: UserDto = await this.userRepository.findOne({ where: { email, role: In(['User', 'Admin']) } });
    
          if (existingUser) {
            this.logger.warn(`Email update conflict: Another user with email ${email} already exists.`);
            return { error: true, message: 'Another user already exists with this email.' };
          }
        }
    
        // Update user details
        this.logger.log(`Updating details for User ID: ${id}`);
        user.email = email.trim();
        user.full_name = full_name.trim();
    
        // Only update role if company ID matches
        if (existingAssociation?.company?.id !== user?.companyCreated?.id) {
          this.logger.log(`Updating role for User ID: ${id} to ${role}`);
          user.role = role;
        } else {
          this.logger.warn(`Role update denied for User ID: ${id}. Cannot update company owner.`);
          return { error: true, message: 'You cannot update company owner.' };
        }
    
        // Save updated user
        await this.userRepository.save(user);
        this.logger.log(`User ID: ${id} updated successfully.`);
    
        return { error: false, message: 'User updated successfully.' };
    
      } catch (e) {
        this.logger.error(`Error updating user with ID: ${id}. Error: ${e.message}`);
        return { error: true, message: 'User not updated due to an error.' };
      }
    }
    
    
    
  
    async updateUser(
      id: number,
      updateUserPayload: UpdatePreferencesRequestDto,
    ): Promise<{ error: boolean; message: string }> {
      this.logger.log(`Initiating user update for User ID: ${id}`);
    
      // Check if the user exists
      const user: UserAccounts = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.warn(`User with ID: ${id} not found.`);
        return { error: true, message: 'User not found' };
      }
    
      try {
        this.logger.log(`User with ID: ${id} found. Proceeding with update.`);
    
        updateUserPayload.is_preferences_save = true;
    
        // Check for username conflicts
        this.logger.log(`Checking if the username '${updateUserPayload.public_profile_username}' is already taken.`);
        const existingUser: UserAccounts = await this.userRepository.findOne({
          where: {
            public_profile_username: updateUserPayload.public_profile_username,
          },
        });
    
        if (existingUser && existingUser.id !== id) {
          this.logger.warn(`Public profile username '${updateUserPayload.public_profile_username}' is already in use by User ID: ${existingUser.id}`);
          return {
            error: true,
            message: 'This Public profile username is already chosen.',
          };
        }
    
        // Log before applying updates
        this.logger.log(`Updating user details for User ID: ${id}. Payload: ${JSON.stringify(updateUserPayload)}`);
    
        // Update user properties
        Object.assign(user, updateUserPayload);
    
        // Save updated user
        await this.userRepository.save(user);
    
        this.logger.log(`User ID: ${id} updated successfully.`);
        return { error: false, message: 'User updated successfully' };
    
      } catch (error) {
        this.logger.error(`Failed to update user with ID: ${id}. Error: ${error.message}`);
        return { error: true, message: 'Failed to update user' };
      }
    }
    
  
    async updatepreference(
      id: number,
      updateUserPreferencePayload: UpdatePreferencesRequestDto,
    ): Promise<{ error: boolean; message: string }> {
      this.logger.log(`Starting update preference process for User ID: ${id}`);
    
      // Check if the user exists
      const user: UserAccounts = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.warn(`User with ID: ${id} not found.`);
        return { error: true, message: 'User not found' };
      }
    
      try {
        this.logger.log(`User with ID: ${id} found. Updating preferences...`);
        
        // Log the incoming preferences data
        this.logger.debug(`Preference update payload for User ID ${id}: ${JSON.stringify(updateUserPreferencePayload)}`);
    
        // Apply the new preferences
        Object.assign(user, updateUserPreferencePayload);
    
        // Save updated preferences
        await this.userRepository.save(user);
    
        this.logger.log(`Preferences for User ID: ${id} updated successfully.`);
        return { error: false, message: 'Preferences saved successfully' };
      } catch (error) {
        this.logger.error(`Failed to update preferences for User ID: ${id}. Error: ${error.message}`, error.stack);
        return { error: true, message: 'Failed to save preferences' };
      }
    }
    
  
    async getMe(userId: number): Promise<{ error: boolean; message?: string; user?: { user: UserDto; company: RecruiterCompanyDto } }> {
      this.logger.log(`Fetching user details for User ID: ${userId}`);
    
      try {
        // Find the user by their ID
        const user: UserAccounts = await this.userRepository.findOne({
          where: { id: userId, role: In(['User', 'Admin']) },
          select: ['id', 'full_name', 'email', 'role', 'login_method'],
        });
    
        if (!user) {
          this.logger.warn(`User with ID: ${userId} not found.`);
          return { error: true, message: "User not found" };
        }
    
        this.logger.log(`User with ID: ${userId} found. Retrieving associated company details...`);
    
        // Find the associated recruiter company if it exists
        const recruiterCompanyUser: RecruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: userId } },
          relations: ['company'],
        });
    
        // Prepare the response
        const result: { user: UserDto; company: RecruiterCompanyDto } = {
          user,
          company: recruiterCompanyUser ? recruiterCompanyUser.company : null,
        };
    
        this.logger.debug(`User details for User ID ${userId}: ${JSON.stringify(result)}`);
        this.logger.log(`Successfully fetched details for User ID: ${userId}`);
    
        return { error: false, user: result };
      } catch (error) {
        this.logger.error(`Error fetching user details for User ID: ${userId}. Error: ${error.message}`, error.stack);
        return { error: true, message: 'Failed to retrieve user details.' };
      }
    }
    
    
    async importExperiences(user, userId, username) {
      const headers = {
        Authorization: `Bearer ${process.env.nobellaAccessToken}`,
      };
      let url: string = `https://nubela.co/proxycurl/api/v2/linkedin?linkedin_profile_url=https://www.linkedin.com/in/${username}&use_cache=if-recent`;
  
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

    async createUser(email: string, full_name: string, role: string, user_id: number): Promise<{ error: boolean; message: string }> {
      this.logger.log(`Admin user (ID: ${user_id}) initiated the creation of a new user with email: ${email}`);
    
      try {
        // Validate required fields
        if (!email || !full_name || !role) {
          this.logger.warn('Failed to create user: Missing required fields.');
          return { error: true, message: "All the fields are required." };
        }
    
        // Check if the current user is an admin
        const checkAdmin: UserDto = await this.userRepository.findOne({ where: { id: user_id, role: "Admin" } });
        if (!checkAdmin) {
          this.logger.warn(`User (ID: ${user_id}) attempted to create a user without admin privileges.`);
          return { error: true, message: "You are not an admin user." };
        }
    
        // Check if the user is associated with a recruiter company
        const recruiterCompanyUser: RecruiterCompanyUserDto = await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: user_id } },
          relations: ['company'],
        });
    
        if (!recruiterCompanyUser) {
          this.logger.warn(`Admin user (ID: ${user_id}) is not associated with any recruiter company.`);
          return { error: true, message: 'You are not associated with any recruiter company.' };
        }
    
        // Check if the user already exists
        const user: UserDto = await this.userRepository.findOne({
          where: {
            email,
            role: In(['User', 'Admin'])
          }
        });
    
        if (user) {
          this.logger.warn(`Attempt to create user failed: Email ${email} is already in use.`);
          return { error: true, message: "User already exists with this email." };
        }
    
        // Generate a password for the new user
        const generatedPassword: string = this.generatePassword();
        this.logger.log(`Generated password for new user with email: ${email}`);
    
        // Create the new user
        const newUser: UserDto = this.userRepository.create({
          full_name,
          role,
          email,
          password: await bcrypt.hash(generatedPassword, 10),
          otp: true,
          login_method: "invite",
        });
    
        await this.userRepository.save(newUser);
        this.logger.log(`New user created successfully with email: ${email}`);
    
        // Assign the new user to the recruiter's company
        const assignCompanyToNewUser: RecruiterCompanyUserDto = this.recruiterCompanyUserRepository.create({
          user: newUser,
          company: recruiterCompanyUser.company,
        });
    
        await this.recruiterCompanyUserRepository.save(assignCompanyToNewUser);
        this.logger.log(`Assigned new user (ID: ${newUser.id}) to company (ID: ${recruiterCompanyUser.company.id}).`);
    
        // Send login credentials via email
        const messageData = {
          from: `Trackrec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
          to: email,
          subject: `${full_name}, Account Credentials`,
          html: `
            <h1>Account Credentials</h1>
            <p>Hey ${full_name}, please use the following credentials to log in:</p>
            <p>Email: ${email}</p>
            <p>Password: ${generatedPassword}</p>
            <p>Best,</p>
            <p>Trackrec Team</p>
          `,
        };
    
        await this.mailgunService.sendMail(messageData);
        this.logger.log(`Account credentials sent to ${email}.`);
    
        return { error: false, message: "User created successfully." };
    
      } catch (e) {
        this.logger.error(`Error creating user with email: ${email}. Error: ${e.message}`, e.stack);
        return { error: true, message: "User not created." };
      }
    }
    

    generatePassword(length: number = 12): string {
      const buffer = randomBytes(Math.ceil(length / 2));
      return buffer.toString('hex').slice(0, length);
    }

    
    async changePassword(body: ChangePasswordRequestDto, user_id: number): Promise<{ error: boolean; message: string }> {
      const { current_password, new_password }: ChangePasswordRequestDto = body;
      this.logger.log(`User (ID: ${user_id}) initiated a password change request.`);
    
      try {
        // Check if required fields are provided
        if (!current_password || !new_password) {
          this.logger.warn(`User (ID: ${user_id}) did not provide all required fields for password change.`);
          return {
            error: true,
            message: "Please send all the required fields.",
          };
        }
    
        // Find the user in the database
        const user: UserDto = await this.userRepository.findOne({
          where: {
            id: user_id,
            role: In(['User', 'Admin']),
          },
        });
    
        if (!user) {
          this.logger.warn(`Password change failed: User (ID: ${user_id}) does not exist.`);
          return {
            error: true,
            message: "User does not exist with this email.",
          };
        }
    
        // Validate the current password
        const oldPasswordValid: boolean = await bcrypt.compare(current_password, user.password);
    
        if (!oldPasswordValid) {
          this.logger.warn(`User (ID: ${user_id}) provided an incorrect current password.`);
          return {
            error: true,
            message: "Your current password is not correct.",
          };
        }
    
        // Hash the new password and update the user
        const hashedNewPassword: string = await bcrypt.hash(new_password, 10);
        user.password = hashedNewPassword;
        user.otp = false;
    
        await this.userRepository.update({ id: user.id }, user);
        this.logger.log(`User (ID: ${user_id}) successfully changed their password.`);
    
        return {
          error: false,
          message: "Password changed successfully.",
        };
      } catch (e) {
        this.logger.error(`Error changing password for user (ID: ${user_id}): ${e.message}`, e.stack);
        return {
          error: true,
          message: "Password not changed.",
        };
      }
    }
    

    async deleteUser(userId: number): Promise<{ error: boolean; message: string }> {
      this.logger.log(`User (ID: ${userId}) requested deletion.`);
    
      try {
        // Find the user
        const user: UserAccounts = await this.userRepository.findOne({
          where: { id: userId, role: In(['User', 'Admin']) },
          relations: ['companyCreated'],
        });
    
        if (!user) {
          this.logger.warn(`Deletion failed: User (ID: ${userId}) does not exist.`);
          return { error: true, message: 'User does not exist.' };
        }
    
        this.logger.log(`User (ID: ${userId}) found. Proceeding with deletion checks.`);
    
        // Check if the user is linked with any company
        const companyUser: RecruiterCompanyUser = await this.recruiterCompanyUserRepository.findOne({
          where: { user: { id: userId } },
          relations: ['company'],
        });
    
        if (companyUser) {
          this.logger.log(`User (ID: ${userId}) is associated with company (ID: ${companyUser.company.id}).`);
    
          // If the user is the owner of the company
          if (user.companyCreated && user.companyCreated.id === companyUser.company.id) {
            this.logger.warn(`Deletion blocked: User (ID: ${userId}) is the owner of company (ID: ${companyUser.company.id}).`);
            return { error: true, message: 'Cannot delete user as they are the owner of a company.' };
          }
    
          // Delete the user's association with the company
          await this.recruiterCompanyUserRepository.delete({ user: { id: userId } });
          this.logger.log(`User (ID: ${userId})'s association with company (ID: ${companyUser.company.id}) deleted.`);
        }
    
        // Find all projects associated with this user and set user to null
        const userProjects: RecruiterProjectDto[] = await this.recruiterProjectRepository.find({
          where: { user: { id: userId } },
        });
    
        if (userProjects.length > 0) {
          this.logger.log(`User (ID: ${userId}) has ${userProjects.length} associated projects. Reassigning projects.`);
          // Update each project to set user to null
          for (const project of userProjects) {
            project.user = null;
            await this.recruiterProjectRepository.save(project);
            this.logger.log(`Project (ID: ${project.id}) ownership cleared.`);
          }
        }
    
        // Delete the user from the repository
        await this.userRepository.delete({ id: userId });
        this.logger.log(`User (ID: ${userId}) deleted successfully.`);
    
        return { error: false, message: 'User deleted successfully.' };
      } catch (e) {
        this.logger.error(`Error deleting user (ID: ${userId}): ${e.message}`, e.stack);
        return { error: true, message: 'Something went wrong. Please try again.' };
      }
    }
    


    async sendResetEmail(email: string): Promise<{ error: boolean; message: string }> {
      this.logger.log(`Password reset request initiated for email: ${email}`);
    
      try {
        // Check if user exists
        const user: UserDto = await this.userRepository.findOne({
          where: {
            email,
            role: In(['User', 'Admin']),
            login_method: In(['register', 'invite']),
          },
        });
    
        if (!user) {
          this.logger.warn(`Password reset failed: No user found with email ${email}`);
          return { error: true, message: "No user found with that email." };
        }
    
        this.logger.log(`User found (ID: ${user.id}, Email: ${user.email}). Generating reset token.`);
    
        // Generate reset token
        const token: string = randomBytes(20).toString('hex');
    
        // Set token and expiration date (1 hour from now)
        user.reset_password_token = token;
        user.reset_password_expires = new Date(Date.now() + 3600000); // 1 hour from now
    
        await this.userRepository.update({ id: user.id }, user);
        this.logger.log(`Password reset token generated and saved for user (ID: ${user.id}).`);
    
        // Sending password reset email
        const resetLink = `${process.env.REACT_APP_URL}/recruiter/reset-password/${token}`;
        const messageData = {
          from: `TrackRec <no-reply@${process.env.MAILGUN_DOMAIN}>`,
          to: user.email,
          subject: 'Password Reset Request',
          html: `
            <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
            <p>Please click on the following link, or paste this into your browser to complete the process:</p>
            <a href='${resetLink}'>Reset Password</a><br/><br/>
            ${resetLink}<br/><br/>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          `,
        };
    
        await this.mailgunService.sendMail(messageData);
        this.logger.log(`Password reset email sent to ${user.email}.`);
    
        return { error: false, message: "Password reset email sent." };
      } catch (e) {
        this.logger.error(`Error while processing password reset for email ${email}: ${e.message}`, e.stack);
        return { error: true, message: "Something went wrong while sending the reset email." };
      }
    }
    

    async verifyToken(token: string): Promise<VerifyTokenResponse> {
      this.logger.log(`Password reset token verification initiated for token: ${token}`);
    
      try {
        // Check if the token is valid and has not expired
        const user: UserDto = await this.userRepository.findOne({
          where: {
            reset_password_token: token,
            reset_password_expires: MoreThan(new Date()),
            role: In(['User', 'Admin']),
            login_method: In(['register', 'invite'])
          },
        });
    
        if (!user) {
          this.logger.warn(`Invalid or expired password reset token: ${token}`);
          return { error: true, message: "Password reset token is invalid or has expired." };
        }
    
        this.logger.log(`Password reset token verified for user (ID: ${user.id}, Email: ${user.email}).`);
        return { error: false, message: "Token verified", token };
      } catch (error) {
        this.logger.error(`Error during token verification for token: ${token} - ${error.message}`, error.stack);
        return { error: true, message: "Password reset token is invalid or has expired." };
      }
    }
    

    async resetPassword(token: string, new_password: string): Promise<{error: boolean, message: string}> {
      try {
        this.logger.log(`Password reset requested with token: ${token}`);  // Log when a password reset is requested
        
        const user: UserDto = await this.userRepository.findOne({
          where: {
            reset_password_token: token,
            reset_password_expires: MoreThan(new Date()),
            role: In(['User', 'Admin']),
            login_method: In(['register', 'invite'])
          }
        });
    
        if (!user) {
          this.logger.warn(`Invalid or expired reset token: ${token}`);  // Log invalid token
          return {error: true, message: "Password reset token is invalid or has expired."};
        }
    
        const hashedPassword: string = await bcrypt.hash(new_password, 10);
    
        user.password = hashedPassword;
        user.reset_password_expires = null;
        user.reset_password_token = null;
    
        await this.userRepository.update({ id: user.id }, user);
    
        this.logger.log(`Password successfully reset for user ID: ${user.id}`);  // Log successful reset
        return {error: false, message: "Password has been successfully reset."};
      } catch (error) {
        this.logger.error(`Error resetting password: ${error.message}`, { error });  // Log the error details
        return {error: true, message: "Password reset token is invalid or has expired."};
      }
    }
    



  }
  