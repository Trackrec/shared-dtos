// city.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { CityService } from './city.service';
import { City } from './city.entity';
import { FilteredPlacesDto, SearchCountryStatesResponseDto, SearchLocationCountriesResponseDto, SearchLocationsResponseDto, SearchPlacesResponseDto } from 'src/shared-dtos/src/city.dto';

@Controller()
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get('cities/search')
  async searchCities(@Query('term') searchTerm: string): Promise<SearchPlacesResponseDto> {
    return this.cityService.searchCities2(searchTerm);
  }

  @Get('countries/search')
  async searchCountries(@Query('term') searchTerm: string): Promise<SearchLocationCountriesResponseDto> {
    return this.cityService.searchLocationCountries(searchTerm);
  }

  @Get('locations/search')
  async searchLocations(@Query('term') searchTerm: string): Promise<SearchLocationsResponseDto> {
    return this.cityService.searchLocations(searchTerm);
  }

  @Get('get_countries_states/search')
  async searchCountriesStates(@Query('term') searchTerm: string): Promise<SearchCountryStatesResponseDto> {
    return this.cityService.searchCountriesStates(searchTerm);
  }

}
