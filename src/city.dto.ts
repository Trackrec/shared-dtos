import { CountryDto } from "./country.dto";
import { StateDto } from "./state.dto";

export interface CityDto {
    id: number;
    name: string;
    stateId: number;
    state: StateDto; 
    stateCode: string;
    stateName: string;
    countryId: number;
    country: CountryDto; 
    countryCode: string;
    countryName: string;
    latitude: number;
    longitude: number;
    wikiDataId: string;
  }
  

export interface FilteredPlacesDto {
    id: string; 
    name: string; 
    label: 'State' | 'City'; 
    country_id: number; 
    country_name: string; 
    state_id?: number; 
    state_name?: string; 
    city_id?: number; 
    city_name?: string;
  }

export interface SearchPlacesDto {
    id: string; 
    name: string; 
    label: 'Country' | 'State' | 'City'; 
    country_id: number; 
    country_name: string;
    state_id?: number; 
    state_name?: string;
    city_id?: number; 
    city_name?: string; 
  }
  
  export interface SearchCountryStatesDto {
    id: string; 
    name: string; 
    label: 'Country' | 'State' | 'City';
    country_id: number; 
    country_name: string; 
    state_id?: number;
    state_name?: string;
  }
  

export interface SearchPlacesResponseDto{
   error: boolean; 
   cities?: FilteredPlacesDto[]; 
   message?: string 
}
  
export interface SearchLocationCountriesResponseDto{
  error: boolean; 
  message?: string; 
  countries?: CountryDto[]
}

export interface SearchLocationsResponseDto{
  error: boolean; 
  locations?: SearchPlacesDto[]; 
  message?: string
}

export interface  SearchCountryStatesResponseDto{
  error: boolean; 
  locations?: SearchCountryStatesDto[]; 
  message?: string
}