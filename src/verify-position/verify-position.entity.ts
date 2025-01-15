import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { Position } from 'src/positions/positions.entity';

@Entity('verify_position')
export class VerifyPosition {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  email: string;

  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @ManyToOne(() => UserAccounts)
  @JoinColumn({ name: 'request_by' })
  requestBy: UserAccounts;

  @ManyToOne(() => Position, (position) => position.verify_request)
  @JoinColumn({ name: 'position_id' })
  position: Position;

  @ManyToOne(() => UserAccounts, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: UserAccounts;

  @Column()
  unique_token: string;

  @Column({
    type: 'enum',
    enum: ['Requested', 'Approved', 'Rejected'],
    default: 'Requested',
  })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
