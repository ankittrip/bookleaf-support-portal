import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-user.interface.js';

import { UserRole } from '../users/schemas/user.schema.js';
import { TicketsService } from './tickets.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';

@Controller('author/tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AUTHOR)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
  ) {}

  @Post()
  createTicket(
    @Req() request: AuthenticatedRequest,
    @Body() dto: CreateTicketDto,
  ) {
    const authorId = request.user.authorId;

    if (!authorId) {
      throw new ForbiddenException(
        'This account is not linked to an author.',
      );
    }

    return this.ticketsService.createForAuthor(
      authorId,
      dto,
    );
  }

  @Get()
getMyTickets(
  @Req() request: AuthenticatedRequest,
) {
  const authorId = request.user.authorId;

  if (!authorId) {
    throw new ForbiddenException(
      'This account is not linked to an author.',
    );
  }

  return this.ticketsService.findForAuthor(authorId);
}
  @Get(':id')
getTicketDetails(
  @Req() request: AuthenticatedRequest,
  @Param('id') ticketId: string,
) {
  const authorId = request.user.authorId;

  if (!authorId) {
    throw new ForbiddenException(
      'This account is not linked to an author.',
    );
  }

  return this.ticketsService.findDetailsForAuthor(
    authorId,
    ticketId,
  );
}
}