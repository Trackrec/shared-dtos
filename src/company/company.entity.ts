// company.entity.ts
import { Position } from 'src/positions/positions.entity';
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';

@Entity()
export class Company {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, default: null })
  company_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain: string;

  @Column({ type: 'longtext', nullable: true })
  logo_url: string;

  @Column({ type: 'longtext', nullable: true })
  website_url: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;

  @OneToMany(() => Position, (position) => position.company)
  positions: Position[];
}
