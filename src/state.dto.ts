import { CityDto } from './city.dto';
import { CountryDto } from './country.dto';

export interface StateDto {
  id: number;
  name: string;
  countryId: number;
  countryCode: string;
  countryName: string;
  stateCode: string;
  type: string;
  latitude: string;
  longitude: string;
  country: CountryDto;
  cities: CityDto[];
}
