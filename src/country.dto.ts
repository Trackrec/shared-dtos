import { CityDto } from './city.dto';
import { StateDto } from './state.dto';

export interface CountryDto {
  id: number;
  name: string;
  iso3: string;
  iso2: string;
  numericCode: string;
  phoneCode: string;
  capital: string;
  currency: string;
  currencyName: string;
  currencySymbol: string;
  tld: string;
  native: string;
  region: string;
  regionId: string;
  subregion: string;
  subregionId: string;
  nationality: string;
  timezones: {
    zoneName: string;
    gmtOffset: number;
    gmtOffsetName: string;
    abbreviation: string;
    tzName: string;
  }[];
  latitude: string;
  longitude: string;
  emoji: string | null;
  emojiU: string;
  states: StateDto[];
  cities: CityDto[];
}
