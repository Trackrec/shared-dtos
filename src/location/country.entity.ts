import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { State } from './state.entity';
import { City } from './city.entity';

@Entity()
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ name: 'iso3' })
  iso3: string;

  @Column({ name: 'iso2' })
  iso2: string;

  @Column({ name: 'numeric_code' })
  numericCode: string;

  @Column({ name: 'phone_code' })
  phoneCode: string;

  @Column()
  capital: string;

  @Column()
  currency: string;

  @Column({ name: 'currency_name' })
  currencyName: string;

  @Column({ name: 'currency_symbol' })
  currencySymbol: string;

  @Column()
  tld: string;

  @Column()
  native: string;

  @Column()
  region: string;

  @Column({ name: 'region_id' })
  regionId: string;

  @Column()
  subregion: string;

  @Column({ name: 'subregion_id' })
  subregionId: string;

  @Column()
  nationality: string;

  @Column({ type: 'simple-json' })
  timezones: { zoneName: string, gmtOffset: number, gmtOffsetName: string, abbreviation: string, tzName: string }[];

  @Column()
  latitude: string;

  @Column()
  longitude: string;

  @Column({default: null})
  emoji: string;

  @Column({ name: 'emojiU' })
  emojiU: string;

  @OneToMany(() => State, state => state.country)
  states: State[];

  @OneToMany(() => City, city => city.country)
  cities: City[];
}
