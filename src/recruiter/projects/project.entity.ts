import { UserAccounts } from 'src/auth/User.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsNotEmpty, MaxLength, ValidateIf } from 'class-validator';
import { ProjectApplication } from 'src/applications/application.entity';
import { RecruiterCompany } from 'src/recruiter/recruiter-company/recruiter-company.entity';

@Entity()
export class RecruiterProject {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    @IsNotEmpty()
    title: string;

    @Column({ length: 255, nullable: true })
    company_name: string;

    @Column({  length: 255, nullable: true })
    logo: string; 

    @Column({ length: 10, nullable: true }) 
    logo_type: string;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)  // Only validate if published is true
    @IsNotEmpty()
    experience: number;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    ote_start: number;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    ote_end: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    location_type: string;

    @Column({ type: 'text', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    @MaxLength(400)
    description: string;

    @Column({ type: 'text', nullable: true,  })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    experience_type: string;

    @Column({ type: 'simple-array', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    location: string[];

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    existing_business_range: number;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    business_range: number;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    partnership_range: number;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    inbound_range: number;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    outbound_range: number;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    smb: number;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    midmarket: number;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    enterprise: number;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    minimum_deal_size: number;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    minimum_sale_cycle: number;

    @Column({ type: 'int', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    hybrid_days: number;

    @Column({ type: 'simple-array', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    Industry_Works_IN: string[];

    @Column({ type: 'simple-array', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    Industry_Sold_To: string[];

    @Column({ type: 'simple-array', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    selectedPersona: string[];

    @Column({ type: 'simple-array', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    territory: string[];

    @Column({ type: 'simple-array', nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    languages: string[];

    @Column({ length: 255, nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    linkedin_profile: string;

    @Column({ length: 255, nullable: true })
    @ValidateIf(o => o.published)
    @IsNotEmpty()
    minimum_salecycle_type: string;

    @Column({ type: 'longtext', nullable: true })
    timeline: string;

    @Column({ type: 'longtext', nullable: true })
    benefits: string;

    @Column({ type: 'longtext', nullable: true })
    elevator_pitch: string;

    @Column({ type: 'longtext', nullable: true })
    travel_requirement_percentage: string;

    @Column({nullable: true})
    start_date: Date;

    @Column({ default: '$', nullable: true })
    currency: string;

    @Column({ default: 'United States Dollar (USD)', nullable: true })
    currency_country: string;

    @Column({ nullable: true })
    is_travel_requirements: boolean;

    @Column({ type: 'longtext', nullable: true })
    report_to: string;

    @Column({ type: 'longtext', nullable: true })
    hiring_process: string;

    @Column({ type: 'longtext', nullable: true })
    growth_opportunities: string;

    @Column({ type: 'int', default: 0 })
    visits_count: number;

    @Column({ default: null })
    project_custom_url: string;

    // New fields for draft and publish status
    @Column({ type: 'boolean', default: true })
    draft: boolean;

    @Column({ type: 'boolean', default: false })
    published: boolean;

    @Column({ type: 'text', nullable: true,  })
    @MaxLength(400)
    company_elevator_pitch: string;

    @Column({ type: 'text', nullable: true,  })
    @MaxLength(400)
    main_problem: string;

    @ManyToOne(() => UserAccounts, user => user.projects)
    user: UserAccounts;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => ProjectApplication, application => application.user)
    applications: ProjectApplication[];

    @ManyToOne(() => RecruiterCompany, company => company.projects, { nullable: true })
  company: RecruiterCompany;
}
