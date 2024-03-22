import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { UserAccounts } from 'src/auth/User.entity';
import { Position } from 'src/positions/positions.entity';

@Entity('verify_position')
export class VerifyPosition {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  email: string;

  @ManyToOne(() => UserAccounts)
  @JoinColumn({ name: 'request_by' })
  requestBy: UserAccounts;

  @OneToOne(() => Position)
  @JoinColumn({ name: 'position_id' })
  position: Position;

  @Column({ type: 'enum', enum: ['Requested', 'Approved', 'Rejected'], default: 'Requested' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
