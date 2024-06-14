// city.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getRepository } from 'typeorm';
import { City } from './city.entity';
import { Country } from './country.entity';
import { State } from './state.entity';

@Injectable()
export class CityService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
  ) {}

  async searchCountries(searchTerm: string): Promise<Country[]> {
    const like = `${searchTerm.toLowerCase()}`;
    const countries = await this.countryRepository
      .createQueryBuilder('country')
      .select(['country.id', 'country.name'])
      .where('LOWER(country.name) LIKE :like', { like: `%${like}%` })
      .orderBy('country.name')
      .limit(30)
      .getMany();
    return countries;
  }

  async searchStates(searchTerm: string): Promise<State[]> {
    const like = `%${searchTerm.toLowerCase()}%`;

    const states = await this.stateRepository
      .createQueryBuilder('state')
      .leftJoinAndSelect('state.country', 'country')
      .where('LOWER(state.name) LIKE :like', { like: `%${like}%` }) // Adjusted LIKE operator for case-insensitive search
      .orderBy('state.name')
      .limit(30)
      .getMany();

    return states;
  }

  async searchCities(searchTerm: string): Promise<City[]> {
    const like = `${searchTerm}%`;
    const cities = await this.cityRepository
      .createQueryBuilder('city')
      .leftJoinAndSelect('city.country', 'country')
      .leftJoinAndSelect('city.state', 'state')
      .where('LOWER(city.name) LIKE :like', { like: `%${like.toLowerCase()}%` })
      .orderBy('city.name')
      .limit(100)
      .getMany();
    return cities;
  }
  async searchPlaces(searchTerm) {
    const countries = await this.searchCountries(searchTerm);
    const states = await this.searchStates(searchTerm);
    const cities = await this.searchCities(searchTerm);

    const places = [countries, states, cities]
      .flat()
      .map((item) => this.buildPlace(item))
      .map((place) => this.buildName(place))
      .map((place) => this.buildId(place))
      .filter(
        (value, index, self) =>
          self.findIndex((p) => p.name === value.name) === index,
      );

    return places;
  }

  buildPlace(obj) {
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

  buildName(place) {
    const name = [place.country_name, place.state_name, place.city_name]
      .filter((i) => i !== null && i !== undefined)
      .join(' ');

    return { ...place, name };
  }

  buildId(place) {
    const { country_id, state_id, city_id } = place;
    return { ...place, id: `${country_id}-${state_id}-${city_id}` };
  }

  async searchCities2(
    searchTerm: string,
  ): Promise<{ error: boolean; cities?: any; message?: string }> {
    try {
      if (!searchTerm) {
        throw new BadRequestException('Search term is required');
      }

      const cities = await this.searchPlaces(searchTerm);
      return { error: false, cities };
    } catch (error) {
      console.log(error);
      return { error: true, message: error.message };
    }
  }
}
