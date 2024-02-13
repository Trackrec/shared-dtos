import { Position } from 'src/positions/positions.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';

@Entity()
export class PositionDetails {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'bigint', nullable: true })
  position_id: string;

  @Column({ type: 'boolean', nullable: true })
  is_leadership: boolean;

  @Column({ type: 'boolean', nullable: true })
  is_individual_contributor: boolean;

  @Column({ type: 'integer', nullable: true })
  industry_worked_in: number;

  @Column({ type: 'integer', nullable: true })
  industory_sold_to: number;

  @Column({ type: 'integer', nullable: true })
  segment_id: number;

  @Column({ type: 'bigint', nullable: true })
  revenue_generated: number;

  @Column({ type: 'boolean', nullable: true })
  is_booking_meeting: boolean;

  @Column({ type: 'integer', nullable: true })
  meeting_booked: number;

  @Column('simple-array', { nullable: true })
  sold_to_ids: number[];

  @Column({ type: 'integer', nullable: true })
  segment_smb: number;

  @Column({ type: 'integer', nullable: true })
  segment_mid_market: number;

  @Column({ type: 'integer', nullable: true })
  segment_enterprise: number;

  @Column('simple-array', { nullable: true })
  worked_in_ids: string[];

  @Column({ type: 'integer', nullable: true })
  short_sales_cycle: number;

  @Column({ type: 'integer', nullable: true })
  long_sales_cycle: number;

  @Column({ type: 'boolean', nullable: true })
  disable_prospecting: boolean;

  @Column('simple-array', { nullable: true })
  notable_clients: string[];

  @Column('simple-array', { nullable: true })
  persona: string[];

  @Column('simple-array', { nullable: true })
  achievements_ids: number[];

  @Column({ type: 'integer', nullable: true })
  short_deal_size: number;

  @Column({ type: 'integer', nullable: true })
  long_deal_size: number;

  @Column('simple-array', { nullable: true })
  worked_in: string[];

  @Column('simple-array', { nullable: true })
  sold_to: string[];

  @Column('simple-array', { nullable: true })
  territories: string[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToOne(type => Position, position => position.details)
  @JoinColumn()
  position: Position;
}
