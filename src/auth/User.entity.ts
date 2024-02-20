import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    JoinColumn,
  } from 'typeorm';
  import { IsEmail, IsNotEmpty, IsString, Length, IsIn, ArrayNotEmpty } from "class-validator";
  import { Position } from 'src/positions/positions.entity';
import { Keywords } from 'src/keywords/keyword.entity';
import { AnalyticsAccess } from 'src/visitors/analytics_access.entity';
  export enum LocationPreference {
    ONSITE = 'onsite',
    REMOTE = 'remote',
    HYBRID = 'hybrid',
  }
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
  
    @Column({ type: 'datetime', nullable: true })
    published_at: Date | null;

    @Column({default:null})
    has_avatar: boolean;

    @Column({default:true})
    open_to_work: boolean;
  
    @Column({default:null,  type:"longtext"})
    linkedin_access_token: string;
  
    @Column({default:null})
    ote_expectation: number;

    @Column({ type: 'enum', enum: LocationPreference, default: LocationPreference.HYBRID }) 
    @IsNotEmpty()
    @IsIn([LocationPreference.ONSITE, LocationPreference.REMOTE, LocationPreference.HYBRID]) 
    location_preferences: LocationPreference;

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

    @Column({default:null})
    city: string;

    @ArrayNotEmpty()
    @Column("simple-array", { nullable: true })
    languages: string[];

    @ArrayNotEmpty()
    @Column("simple-array", { nullable: true })
    next_desired_titles: string[];

    @Column({default:false})
    isExperienceImported: boolean
  
    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => Position, (position) => position.user)
    positions: Position[];

    @OneToOne(() => Keywords, { cascade: true, eager: true }) 
    @JoinColumn({name:'keyword_id'})
    keywords: Keywords;

    @OneToMany(() => AnalyticsAccess, analyticsAccess => analyticsAccess.user)
  analyticsAccess: AnalyticsAccess[];
  }

