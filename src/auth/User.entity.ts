import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { IsEmail, IsNotEmpty, IsString, Length } from "class-validator";
  import { Position } from 'src/positions/positions.entity';
  
  @Entity({ name: 'accounts_users' })
  export class UserAccounts {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ unique: true })
     @IsEmail()
     email: string;

    @Column({default:null})
    phone: string;
  
    @Column({default:null})
    full_name: string;
  
    @Column({default:null})
    profile_image: string;
  
  
    @Column({default:null})
    has_avatar: boolean;
  
    @Column({default:null,  type:"longtext"})
    linkedin_access_token: string;
  
    @Column({default:null})
    ote_expectation_id: number;

    @Column({default:null})
    password: string;

    @Column({default:true})
    otp: boolean;

    @Column({default:false})
    is_preferences_save : boolean;

    @Column()
    role: string;

    @Column({default:null, unique: true})
    username: string

    @Column({default:false})
    isExperienceImported: boolean

  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => Position, (position) => position.user)
    positions: Position[];
  }

