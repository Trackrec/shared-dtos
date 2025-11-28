import { CityDto } from './city.dto';
import { CountryDto } from './country.dto';

export interface StateDto {
  id: number;
  name: string;
  countryId: number | null;
  countryCode: string | null;
  countryName: string | null;
  stateCode: string | null;
  type: string | null;
  latitude: string | null;
  longitude: string | null;
  country: CountryDto;
  cities: CityDto[];
  googlePlaceId: string | null;
}
