// city.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { City } from './city.entity';
import { Country } from './country.entity';
import { State } from './state.entity';
import { CountryDto } from 'src/shared-dtos/src/country.dto';
import { StateDto } from 'src/shared-dtos/src/state.dto';
import {
  CityDto,
  FilteredPlacesDto,
  SearchCountryStatesDto,
  SearchCountryStatesResponseDto,
  SearchLocationCountriesResponseDto,
  SearchLocationsResponseDto,
  SearchPlacesDto,
} from 'src/shared-dtos/src/city.dto';

@Injectable()
export class CityService {
  private readonly logger = new Logger(CityService.name);

  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
  ) {}

  async searchCountries(searchTerm: string): Promise<CountryDto[]> {
    const like = `${searchTerm.toLowerCase()}`;
    const countries: CountryDto[] = await this.countryRepository
      .createQueryBuilder('country')
      .select(['country.id', 'country.name'])
      .where('LOWER(country.name) LIKE :like', { like: `%${like}%` })
      .orderBy('country.name')
      .limit(30)
      .getMany();
    return countries;
  }

  async searchStates(searchTerm: string): Promise<StateDto[]> {
    const like = `%${searchTerm.toLowerCase()}%`;

    const states: StateDto[] = await this.stateRepository
      .createQueryBuilder('state')
      .leftJoinAndSelect('state.country', 'country')
      .where('LOWER(state.name) LIKE :like', { like: `%${like}%` }) // Adjusted LIKE operator for case-insensitive search
      .orderBy('state.name')
      .limit(30)
      .getMany();

    return states;
  }

  async searchCities(searchTerm: string): Promise<CityDto[]> {
    const like = `${searchTerm}%`;
    const cities: CityDto[] = await this.cityRepository
      .createQueryBuilder('city')
      .leftJoinAndSelect('city.country', 'country')
      .leftJoinAndSelect('city.state', 'state')
      .where('LOWER(city.name) LIKE :like', { like: `%${like.toLowerCase()}%` })
      .orderBy('city.name')
      .limit(100)
      .getMany();
    return cities;
  }
  async searchPlaces(searchTerm): Promise<FilteredPlacesDto[]> {
    const countries: CountryDto[] = await this.searchCountries(searchTerm);
    const states: StateDto[] = await this.searchStates(searchTerm);
    const cities: CityDto[] = await this.searchCities(searchTerm);

    let places = [states, cities].flat();

    // If a country is found, retrieve its associated cities
    if (countries.length > 0) {
      const countryIds: number[] = countries.map((country) => country.id);
      const countryCities: CityDto[] = await this.searchCitiesByCountryIds(countryIds);
      places = [...countryCities, ...places];
    }

    const filteredPlaces: FilteredPlacesDto[] = places
      .map((item) => this.buildPlace(item))
      .map((place) => this.buildName(place))
      .map((place) => this.buildId(place))
      .filter((value, index, self) => self.findIndex((p) => p.name === value.name) === index);

    return filteredPlaces;
  }

  // New method to fetch cities by country IDs
  async searchCitiesByCountryIds(countryIds: number[]): Promise<CityDto[]> {
    // Implement logic to fetch cities based on country IDs
    // This could be a database query or another API call
    return await this.cityRepository.find({ where: { countryId: In(countryIds) }, take: 20 });
  }

  buildPlace(obj) {
    let place = {};

    if (obj instanceof State) {
      place = {
        label: 'State',
        state_id: obj.id,
        state_name: obj.name,
        country_id: obj.countryId,
        country_name: obj.countryName,
      };
    } else if (obj instanceof City) {
      place = {
        label: 'City',
        city_id: obj.id,
        city_name: obj.name,
        state_id: obj.stateId,
        state_name: obj.stateName,
        country_id: obj.countryId,
        country_name: obj.countryName,
      };
    }

    return place;
  }

  buildName(place) {
    const name = [place.country_name, place.state_name, place.city_name]
      .filter((i) => i !== null && i !== undefined)
      .join(' > ');

    return { ...place, name };
  }

  buildId(place) {
    const { country_id: countryId, state_id: stateId, city_id: cityId } = place;
    return { ...place, id: `${countryId}-${stateId}-${cityId}` };
  }

  async searchCities2(
    searchTerm: string,
  ): Promise<{ error: boolean; cities?: FilteredPlacesDto[]; message?: string }> {
    try {
      if (!searchTerm) {
        throw new BadRequestException('Search term is required');
      }

      const cities: FilteredPlacesDto[] = await this.searchPlaces(searchTerm);
      return { error: false, cities };
    } catch (error) {
      console.log(error);
      return { error: true, message: error.message };
    }
  }

  async searchLocationCountries(searchTerm: string): Promise<SearchLocationCountriesResponseDto> {
    try {
      const like = `${searchTerm.toLowerCase()}`;
      const countries: CountryDto[] = await this.countryRepository
        .createQueryBuilder('country')
        .select(['country.id', 'country.name'])
        .where('LOWER(country.name) LIKE :like', { like: `%${like}%` })
        .orderBy('country.name')
        .limit(30)
        .getMany();

      return { error: false, countries };
    } catch (e) {
      console.log(e);
      return { error: true, message: 'Something went wrong, please try again.' };
    }
  }

  async searchPlaces2(searchTerm) {
    const countries: CountryDto[] = await this.searchCountries(searchTerm);
    const states: StateDto[] = await this.searchStates(searchTerm);
    const cities: CityDto[] = await this.searchCities(searchTerm);

    const places: SearchPlacesDto[] = [countries, states, cities]
      .flat()
      .map((item) => this.buildPlace2(item))
      .map((place) => this.buildName(place))
      .map((place) => this.buildId(place))
      .filter((value, index, self) => self.findIndex((p) => p.name === value.name) === index);

    return places;
  }

  buildPlace2(obj: Country | State | City) {
    let place = {};

    if (obj instanceof Country) {
      place = {
        label: 'Country',
        country_id: obj.id,
        country_name: obj.name,
      };
    } else if (obj instanceof State) {
      place = {
        label: 'State',
        state_id: obj.id,
        state_name: obj.name,
        country_id: obj.countryId,
        country_name: obj.countryName,
      };
    } else if (obj instanceof City) {
      place = {
        label: 'City',
        city_id: obj.id,
        city_name: obj.name,
        state_id: obj.stateId,
        state_name: obj.stateName,
        country_id: obj.countryId,
        country_name: obj.countryName,
      };
    }

    return place;
  }

  // buildName(place) {
  //   const name = [place.country_name, place.state_name, place.city_name]
  //     .filter((i) => i !== null && i !== undefined)
  //     .join(' > ');

  //   return { ...place, name };
  // }

  // buildId(place) {
  //   const { country_id, state_id, city_id } = place;
  //   return { ...place, id: `${country_id}-${state_id}-${city_id}` };
  // }

  async searchLocations(searchTerm: string): Promise<SearchLocationsResponseDto> {
    try {
      if (!searchTerm) {
        throw new BadRequestException('Search term is required');
      }

      const locations: SearchPlacesDto[] = await this.searchPlaces2(searchTerm);
      return { error: false, locations };
    } catch (error) {
      console.log(error);
      return { error: true, message: error.message };
    }
  }

  async searchPlaces3(searchTerm): Promise<SearchCountryStatesDto[]> {
    const countries: CountryDto[] = await this.searchCountries(searchTerm);
    const states: StateDto[] = await this.searchStates(searchTerm);

    const places: SearchCountryStatesDto[] = [countries, states]
      .flat()
      .map((item) => this.buildPlace2(item))
      .map((place) => this.buildName(place))
      .map((place) => this.buildId(place))
      .filter((value, index, self) => self.findIndex((p) => p.name === value.name) === index);

    return places;
  }

  async searchCountriesStates(searchTerm: string): Promise<SearchCountryStatesResponseDto> {
    try {
      if (!searchTerm) {
        throw new BadRequestException('Search term is required');
      }

      const locations: SearchCountryStatesDto[] = await this.searchPlaces3(searchTerm);
      return { error: false, locations };
    } catch (error) {
      console.log(error);
      return { error: true, message: error.message };
    }
  }
}
