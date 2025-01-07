import { UserDto } from "./user.dto";

export interface KeywordsDto {
    id: number;
    keywords: string[] | null;
    userAccount: UserDto | null;
    created_at: Date;
    updated_at: Date;
  }
  