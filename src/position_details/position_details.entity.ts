import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

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
  industry_worked_in_id: number;

  @Column({ type: 'integer', nullable: true })
  industory_sold_to_id: number;

  @Column({ type: 'integer', nullable: true })
  segment_id: number;

  // Continue with the remaining fields...

  @Column({ type: 'boolean', nullable: true })
  is_booking_meeting: boolean;

  @Column({ type: 'integer', nullable: true })
  meeting_booked_id: number;

  @Column('simple-array', { nullable: true })
  sold_to_ids: number[];

  @Column({ type: 'integer', nullable: true })
  segment_smb_id: number;

  @Column({ type: 'integer', nullable: true })
  segment_mid_market_id: number;

  @Column({ type: 'integer', nullable: true })
  segment_enterprise_id: number;

  @Column('simple-array', { nullable: true })
  worked_in_ids: number[];

  @Column({ type: 'integer', nullable: true })
  short_sales_cycle_id: number;

  @Column({ type: 'integer', nullable: true })
  long_sales_cycle_id: number;

  @Column({ type: 'boolean', nullable: true })
  disable_prospecting: boolean;

  @Column('json', { nullable: true })
  notable_clients: Record<string, any>;

  @Column('simple-array', { nullable: true })
  achievements_ids: number[];

  @Column({ type: 'integer', nullable: true })
  short_deal_size_id: number;

  @Column({ type: 'integer', nullable: true })
  long_deal_size_id: number;

  @Column('json', { nullable: true })
  worked_in: Record<string, any>;

  @Column('json', { nullable: true })
  sold_to: Record<string, any>;

  @Column('json', { nullable: true })
  territories: Record<string, any>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
