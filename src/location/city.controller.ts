import { Controller, Get, Logger, Query } from '@nestjs/common';
import { CityService } from './city.service';
import {
  SearchCountryStatesResponseDto,
  SearchLocationCountriesResponseDto,
  SearchLocationsResponseDto,
  SearchPlacesResponseDto,
} from 'src/shared-dtos/src/city.dto';

@Controller()
export class CityController {
  private readonly logger = new Logger(CityController.name);

  constructor(private readonly cityService: CityService) {}

  @Get('cities/search')
  async searchCities(@Query('term') searchTerm: string): Promise<SearchPlacesResponseDto> {
    this.logger.log(`Searching for cities with term: "${searchTerm}"`);

    try {
      const result = await this.cityService.searchCities2(searchTerm);
      return result;
    } catch (error) {
      this.logger.error(
        `Error searching for cities with term: "${searchTerm}" - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Failed to search for cities' };
    }
  }

  @Get('countries/search')
  async searchCountries(
    @Query('term') searchTerm: string,
  ): Promise<SearchLocationCountriesResponseDto> {
    this.logger.log(`Searching for countries with term: "${searchTerm}"`);

    try {
      const result = await this.cityService.searchLocationCountries(searchTerm);
      return result;
    } catch (error) {
      this.logger.error(
        `Error searching for countries with term: "${searchTerm}" - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Failed to search for countries' };
    }
  }

  @Get('locations/search')
  async searchLocations(@Query('term') searchTerm: string): Promise<SearchLocationsResponseDto> {
    this.logger.log(`Searching for locations with term: "${searchTerm}"`);

    try {
      const result = await this.cityService.searchLocations(searchTerm);
      return result;
    } catch (error) {
      this.logger.error(
        `Error searching for locations with term: "${searchTerm}" - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Failed to search for locations' };
    }
  }

  @Get('get-countries-states/search')
  async searchCountriesStates(
    @Query('term') searchTerm: string,
  ): Promise<SearchCountryStatesResponseDto> {
    this.logger.log(`Searching for country states with term: "${searchTerm}"`);

    try {
      const result = await this.cityService.searchCountriesStates(searchTerm);
      return result;
    } catch (error) {
      this.logger.error(
        `Error searching for country states with term: "${searchTerm}" - ${error.message}`,
        error.stack,
      );
      return { error: true, message: 'Failed to search for country states' };
    }
  }
}
