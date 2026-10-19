import { Transform } from 'class-transformer';
import {
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateAdminMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  body!: string;
}