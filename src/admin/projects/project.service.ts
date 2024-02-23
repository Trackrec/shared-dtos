import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountProject } from './project.entity';
import { UserAccounts } from 'src/auth/User.entity';
import { validate } from 'class-validator';
import { S3UploadService } from 'src/storage_bucket/storage_bucket.service';
@Injectable()
export class AccountProjectService {
  constructor(
    @InjectRepository(AccountProject)
    private readonly accountProjectRepository: Repository<AccountProject>,
    @InjectRepository(UserAccounts)
    private readonly userRepository: Repository<UserAccounts>,
    private readonly uploadService: S3UploadService,

  ) {}

  async findAll(userId): Promise<any> {
    try{
     const projects=await this.accountProjectRepository.find({where:{user:{id:userId}}});
     return {error: false, projects}
    }
    catch(e){
        return {error: true, message: "Projects not found"}
    }
  }

  async findAllUsersProjects(): Promise<any> {
    try{
     const projects=await this.accountProjectRepository.find();
     return {error: false, projects}
    }
    catch(e){
        return {error: true, message: "Projects not found"}
    }
  }

  async findOne(id: number): Promise<any> {
    try{
        const project = await this.accountProjectRepository.findOne({ where: { id }});
        if (!project) {
             return {error:true, message: 'Project not found.'};
         }  
         return {error: false, project}
     }
    catch(e){
         return {error: true, message: "Project not found."}
      }
}

  async create(accountProjectData: Partial<AccountProject>, userId:number): Promise<any> {
    try{
    const user= await this.userRepository.findOne({where:{id:userId}})
    accountProjectData.user=user
    const project = this.accountProjectRepository.create(accountProjectData);
    const errors = await validate(project);
    console.log(errors)
    if (errors.length > 0) {
       return {error: true, message: "Please send all the required fields."}
      }
    await this.accountProjectRepository.save(project);
    return {error:false, message:"Project created successfully.",project}
    }
    catch(e){
        return {error: true, message:"Project not created!"}
    }
  }

  async update(userId:number, id: number, accountProjectData: Partial<AccountProject>): Promise<any> {
    try{
        const project = await this.accountProjectRepository.findOne({ where: { id, user:{id :userId }} });
        if (!project) {
          return {error:true, message: 'Project not found or does not belong to the user.'};
        }
      
        await this.accountProjectRepository.update(id, accountProjectData);   
        return {error: false, message: "Project updated successfully."}
    }
    catch(e){
        return {error:true, message:"Project not updated."}
    }
  }

  async remove(id: number, userId:number): Promise<any> {
    try{
        const project = await this.accountProjectRepository.findOne({ where: { id, user:{id :userId }} });
        if (!project) {
          return {error:true, message: 'Project not found or does not belong to the user.'};
        }
       await this.accountProjectRepository.delete(id);
       return {error: false, message: "Project Deleted Successfully"}
    }
    catch(e){
        return {error: true, message: "Project not deleted."}
    }
   
  }


  async updateProjectPicture(id: number, image, user_id: number): Promise<{ error: boolean, message: string }> {
    try {
    const project = await this.accountProjectRepository.findOne({where:{id, user:{id:user_id}}});
    if (!project) {
      return { error: true, message: 'Project not found or you are not the owner of project.' };
    }
      let storedImage=await this.uploadService.uploadNewImage(image, "project_images")
      if(storedImage)
      project.project_image=storedImage;
      

      await this.accountProjectRepository.save(project);

      return { error: false, message: 'Project Image updated successfully' };
    } catch (error) {
      return { error: true, message: 'Failed to update project image.' };
    }
  }
}
