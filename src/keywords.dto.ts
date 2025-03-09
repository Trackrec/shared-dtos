import { UserDto } from './user.dto';

export interface KeywordsDto {
  id: number;
  keywords: string[] | null;
  userAccount: UserDto | null;
  createdAt: Date;
  updatedAt: Date;
}
