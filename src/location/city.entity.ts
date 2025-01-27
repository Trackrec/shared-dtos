import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { State } from './state.entity';
import { Country } from './country.entity';

@Entity()
export class City {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'state_id' })
  stateId: number;

  @ManyToOne(() => State, (state) => state.cities)
  state: State;

  @Column({ name: 'state_code' })
  stateCode: string;

  @Column({ name: 'state_name' })
  stateName: string;

  @Column({ name: 'country_id' })
  countryId: number;

  @ManyToOne(() => Country, (country) => country.cities)
  country: Country;

  @Column({ name: 'country_code' })
  countryCode: string;

  @Column({ name: 'country_name' })
  countryName: string;

  @Column()
  latitude: number;

  @Column()
  longitude: number;

  @Column({ name: 'wikiDataId' })
  wikiDataId: string;
}
