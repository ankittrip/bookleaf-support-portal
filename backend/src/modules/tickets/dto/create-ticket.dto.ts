import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTicketDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  bookId?: string | null;

  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  subject!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  description!: string;
}