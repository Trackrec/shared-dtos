import { Position } from 'src/positions/positions.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
interface Client {
  id: string;
  name: string;
  logo_url: string;
}
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
  segment_id: number;

  @Column({ type: 'bigint', nullable: true })
  revenue_generated: number;

  @Column({ type: 'boolean', nullable: true })
  is_booking_meeting: boolean;

  @Column({ type: 'integer', nullable: true })
  meeting_booked: number;

  @Column('simple-array', { nullable: true })
  sold_to_ids: string[];

  @Column({ type: 'integer', nullable: true })
  segment_smb: number;

  @Column({ type: 'integer', nullable: true })
  segment_mid_market: number;

  @Column({ type: 'integer', nullable: true })
  segment_enterprise: number;

  @Column('simple-array', { nullable: true })
  worked_in_ids: string[];

  @Column({ nullable: true })
  short_sales_cycle: string;

  @Column({ nullable: true })
  average_sales_cycle: string;

  @Column({ nullable: true })
  long_sales_cycle: string;

  @Column({ nullable: true, default: 'Weeks' })
  short_sales_cycle_duration: string;

  @Column({ nullable: true, default: 'Weeks' })
  average_sales_cycle_duration: string;

  @Column({ nullable: true, default: 'Weeks' })
  long_sales_cycle_duration: string;

  @Column({ type: 'boolean', nullable: true })
  disable_prospecting: boolean;

  @Column('json', { nullable: true })
  notable_clients: Client[];

  @Column('simple-array', { nullable: true })
  management: string[];

  @Column('simple-array', { nullable: true })
  persona: string[];

  @Column('simple-array', { nullable: true })
  achievements: string[];

  @Column({ type: 'int', nullable: true })
  quota_achievements: number;

  @Column({ type: 'int', nullable: true })
  people_rolling_up: number;

  @Column({ type: 'int', nullable: true })
  average_booked_meeting: number;

  @Column({ type: 'int', nullable: true })
  linkedin_percentage: number;

  @Column({ type: 'int', nullable: true })
  email_percentage: number;

  @Column({ type: 'int', nullable: true })
  cold_call_percentage: number;

  @Column({ type: 'int', nullable: true })
  tradeshow_percentage: number;

  @Column({ default: true })
  is_prospecting_channel_relevant: boolean;

  @Column({ type: 'int', nullable: true })
  refferals_percentage: number;

  @Column({ type: 'bigint', nullable: true })
  short_deal_size: number;

  @Column({ type: 'bigint', nullable: true })
  average_deal_size: number;

  @Column({ type: 'bigint', nullable: true })
  new_business: number;

  @Column({ type: 'bigint', nullable: true })
  existing_business: number;

  @Column({ type: 'bigint', nullable: true })
  partnership: number;

  @Column({ type: 'bigint', nullable: true })
  outbound: number;

  @Column({ type: 'bigint', nullable: true })
  inbound: number;

  @Column({ type: 'bigint', nullable: true })
  long_deal_size: number;

  @Column('simple-array', { nullable: true })
  worked_in: string[];

  @Column('simple-array', { nullable: true })
  sold_to: string[];

  @Column('simple-array', { nullable: true })
  territories: string[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @OneToOne(() => Position, (position) => position.details)
  @JoinColumn()
  position: Position;
}
