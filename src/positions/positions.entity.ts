
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne, OneToMany, ManyToMany } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { PositionDetails } from 'src/position_details/position_details.entity';
import { Company } from 'src/company/company.entity';
import { VerifyPosition } from 'src/verify-position/verify-position.entity';
@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ nullable: true })
  start_month: number;

  @Column({ nullable: true })
  start_year: number;

  @Column({ nullable: true })
  end_month: number;

  @Column({ nullable: true })
  end_year: number;

  @Column()
  role: string;

  @ManyToOne(() => UserAccounts, (user) => user.positions)
  @JoinColumn({ name: 'user_id' })
  user: UserAccounts;

  @Column({ type: 'json', nullable: true })
  achievements: any;



  @Column({ nullable: true })
  alternative_brand_icon_url: string;
  

  @ManyToOne(() => Company, company => company.positions)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @OneToOne(type => PositionDetails, positionDetails => positionDetails.position, { nullable: true })
  @JoinColumn()
  details: PositionDetails;

  @OneToMany(() => VerifyPosition, verifyPosition => verifyPosition.position)
  @JoinColumn({ name: 'verify_request_id' })
  verify_request: VerifyPosition[];
}
