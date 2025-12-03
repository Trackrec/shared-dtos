import { CityDto } from './city.dto';
import { StateDto } from './state.dto';

export interface CountryDto {
  id: number;
  name: string;
  iso3: string | null;
  iso2: string | null;
  numericCode: string | null;
  phoneCode: string | null;
  capital: string | null;
  currency: string | null;
  currencyName: string | null;
  currencySymbol: string | null;
  tld: string | null;
  native: string | null;
  region: string | null;
  regionId: string | null;
  subregion: string | null;
  subregionId: string | null;
  nationality: string | null;
  timezones:
    | {
        zoneName: string;
        gmtOffset: number;
        gmtOffsetName: string;
        abbreviation: string;
        tzName: string;
      }[]
    | null;
  latitude: string | null;
  longitude: string | null;
  emoji: string | null;
  emojiU: string | null;
  states: StateDto[];
  cities: CityDto[];
  googlePlaceId: string | null;
}
