// city.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { CityService } from './city.service';
import { City } from './city.entity';

@Controller()
export class CityController {
  constructor(private readonly cityService: CityService) {}

  @Get('cities/search')
  async searchCities(@Query('term') searchTerm: string): Promise<{ error: boolean, cities?: City[], message?: string }> {
    return this.cityService.searchCities2(searchTerm);
  }

  @Get('countries/search')
  async searchCountries(@Query('term') searchTerm: string): Promise<any> {
    return this.cityService.searchLocationCountries(searchTerm);
  }

}
