import { UserAccounts } from 'src/auth/User.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { IsNotEmpty } from 'class-validator';
import { ProjectApplication } from 'src/applications/application.entity';

@Entity("account_projects")
export class AccountProject {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 255 })
    @IsNotEmpty()
    title: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    project_image: string;

    @Column({ type: 'int' })
    @IsNotEmpty()
    experience: number;

    @Column({ type: 'int' })
    @IsNotEmpty()
    ote_start: number;

    @Column({ type: 'int' })
    @IsNotEmpty()
    ote_end: number;

    @Column({ type: 'varchar', length: 255 })
    @IsNotEmpty()
    location_type: string;

    @Column({ type: 'varchar', length: 255 })
    @IsNotEmpty()
    location: string;

    @Column({ type: 'int' })
    @IsNotEmpty()
    existing_business_range: number;

    @Column({ type: 'int' })
    @IsNotEmpty()
    business_range: number;

    @Column({ type: 'int' })
    @IsNotEmpty()
    inbound_range: number;

    @Column({ type: 'int' })
    @IsNotEmpty()
    outbound_range: number;

    @Column({ type: 'int' })
    @IsNotEmpty()
    smb: number;

    @Column({ type: 'int' })
    @IsNotEmpty()
    midmarket: number;

    @Column({ type: 'int' })
    @IsNotEmpty()
    enterprise: number;

    @Column({ type: 'int' })
    @IsNotEmpty()
    minimum_deal_size: number;

    @Column({ type: 'int' })
    @IsNotEmpty()
    minimum_sale_cycle: number;

    @Column({ type: 'int' })
    @IsNotEmpty()
    hybrid_days: number;

    @Column({ type: 'simple-array', nullable: true })
    @IsNotEmpty()
    Industry_Works_IN: string[];

    @Column({ type: 'simple-array',  nullable: true })
    @IsNotEmpty()
    Industry_Sold_To: string[];

    @Column({ type: 'simple-array',  nullable: true })
    @IsNotEmpty()
    selectedPersona: string[];

    @Column({ type: 'simple-array', nullable: true })
    @IsNotEmpty()
    territory: string[];

    @Column({ length: 255 })
    @IsNotEmpty()
    minimum_salecycle_type: string;

    @Column({ type: 'longtext', nullable: true })
    timeline: string;

    @Column({ type: 'longtext', nullable: true  })
    benefits: string;

    @Column({ type: 'longtext', nullable: true })
    elevator_pitch: string;

    @Column({ type: 'longtext', nullable: true  })
    role: string;

    @Column({ type: 'longtext', nullable: true  })
    travel_requirements: string;

    @Column({ type: 'longtext', nullable: true  })
    report_to: string;

    @Column({ type: 'longtext', nullable: true  })
    hiring_process: string;

    @Column({ type: 'longtext', nullable: true  })
    growth_opportunities: string;

    @Column({ type: 'int', default:0 })
    visits_count: number;

    @ManyToOne(() => UserAccounts, user => user.projects)
    user: UserAccounts;

    @CreateDateColumn()
    created_at: Date;
  
    @UpdateDateColumn()
    updated_at: Date;

    @OneToMany(() => ProjectApplication, application => application.user)
  applications: ProjectApplication[];
}
