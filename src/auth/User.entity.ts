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
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  IsIn,
  ArrayNotEmpty,
} from 'class-validator';
import { Position } from 'src/positions/positions.entity';
import { Keywords } from 'src/keywords/keyword.entity';
import { AnalyticsAccess } from 'src/visitors/analytics_access.entity';
import { AccountProject } from 'src/admin/projects/project.entity';
import { ProjectApplication } from 'src/applications/application.entity';
export enum LocationPreference {
  ONSITE = 'onsite',
  REMOTE = 'remote',
  HYBRID = 'hybrid',
}
@Entity({ name: 'accounts_users' })
export class UserAccounts {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  @IsEmail()
  email: string;

  @Column({ default: null })
  phone: string;

  @Column({ default: null })
  full_name: string;

  @Column({ default: null })
  profile_image: string;

  @Column({ default: null })
  custom_current_role: string;

  @Column({
    type: 'datetime',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  published_at: Date | null;

  @Column({ default: null })
  has_avatar: boolean;

  @Column({ default: false })
  isFirstExperienceMailSent: boolean;

  @Column({ default: false })
  blocked: boolean;

  @Column({ default: true })
  open_to_work: boolean;

  @Column({ default: null, type: 'longtext' })
  linkedin_access_token: string;

  @Column({ default: null })
  ote_expectation: number;

  @Column({ type: 'bigint', nullable: true })
  ote_min: number;

  @Column({ type: 'bigint', nullable: true })
  ote_max: number;

  @Column('simple-array')
  @ArrayNotEmpty()
  @IsIn(
    [
      LocationPreference.ONSITE,
      LocationPreference.REMOTE,
      LocationPreference.HYBRID,
    ],
    { each: true },
  )
  location_preferences: LocationPreference[];
  constructor() {
    this.location_preferences = [LocationPreference.HYBRID];
  }

  @Column({ default: null })
  password: string;

  @Column({ default: true })
  otp: boolean;

  @Column({ default: false })
  is_preferences_save: boolean;

  @Column()
  role: string;

  @Column({ default: null })
  username: string;

  @Column({ default: null })
  city: string;

  @ArrayNotEmpty()
  @Column('simple-array', { nullable: true })
  languages: string[];

  @Column({ default: '$', nullable: true })
  currency: string;

  @Column({ default: 'United States Dollar (USD)', nullable: true })
  currency_country: string;

  @ArrayNotEmpty()
  @Column('simple-array', { nullable: true })
  next_desired_titles: string[];

  @Column({ default: false })
  isExperienceImported: boolean;

  @Column({ type: 'longtext', nullable: true })
  about: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @CreateDateColumn({ default: null })
  last_accessed_at: Date;

  @OneToMany(() => Position, (position) => position.user)
  positions: Position[];

  @OneToOne(() => Keywords, { cascade: true, eager: true })
  @JoinColumn({ name: 'keyword_id' })
  keywords: Keywords;

  @OneToMany(() => AnalyticsAccess, (analyticsAccess) => analyticsAccess.user)
  analyticsAccess: AnalyticsAccess[];

  @OneToMany(() => AccountProject, (project) => project.user)
  projects: AccountProject[];

  @OneToMany(() => ProjectApplication, (application) => application.user)
  applications: ProjectApplication[];
}
