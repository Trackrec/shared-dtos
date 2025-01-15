import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Country } from './country.entity';
import { City } from './city.entity';

@Entity()
export class State {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'country_id' })
  countryId: number;

  @Column({ name: 'country_code' })
  countryCode: string;

  @Column({ name: 'country_name' })
  countryName: string;

  @Column({ name: 'state_code' })
  stateCode: string;

  @Column()
  type: string;

  @Column()
  latitude: string;

  @Column()
  longitude: string;

  @ManyToOne(() => Country, (country) => country.states)
  country: Country;

  @OneToMany(() => City, (city) => city.state)
  cities: City[];
}
