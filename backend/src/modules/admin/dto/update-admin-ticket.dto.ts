import { IsEnum, IsOptional } from 'class-validator';

import {
  TicketStatus,
  TicketCategory,
  TicketPriority,
} from '../../tickets/schemas/ticket.schema.js';

export class UpdateAdminTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}