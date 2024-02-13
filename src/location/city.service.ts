// city.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from './city.entity';

@Injectable()
export class CityService {
  constructor(
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
  ) {}

  async searchCities(searchTerm: string): Promise<{ error: boolean, cities?: City[], message?: string }> {
    try {
      if (!searchTerm) {
        throw new BadRequestException('Search term is required');
      }

      const like = `${searchTerm}%`;

      const cities = await this.cityRepository
  .createQueryBuilder('city')
  .leftJoinAndSelect('city.country', 'country')
  .leftJoinAndSelect('city.state', 'state')
  .where('LOWER(city.name) LIKE LOWER(:like)', { like: like.toLowerCase() })
  .orWhere('city.stateId = state.id')
  .orWhere('city.countryId = country.id')
  .distinct(true)
  .limit(100)
  .getMany();

    

      return { error: false, cities };
    } catch (error) {
      return { error: true, message: error.message };
    }
  }
}
