import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-user.interface.js';
import { UpdateAdminTicketDto } from './dto/update-admin-ticket.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../users/schemas/user.schema.js';
import { AdminService } from './admin.service.js';
import { AdminTicketQueryDto } from './dto/admin-ticket-query.dto.js';
import { CreateAdminMessageDto } from './dto/create-admin-message.dto.js';
import { CreateInternalNoteDto } from './dto/create-internal-note.dto.js';

@Controller('admin/tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  findAllTickets(@Query() query: AdminTicketQueryDto) {
    return this.adminService.findAllTickets(query);
  }

  @Patch(':id')
  updateTicket(
    @Param('id') ticketId: string,
    @Body() dto: UpdateAdminTicketDto,
  ) {
    return this.adminService.updateTicket(ticketId, dto);
  }

  @Post(':id/assign-to-me')
  assignToMe(
    @Param('id') ticketId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.assignTicketToMe(
      ticketId,
      request.user.userId,
    );
  }

  @Post(':id/messages')
  sendPublicReply(
    @Param('id') ticketId: string,
    @Body() dto: CreateAdminMessageDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.sendPublicReply(
      ticketId,
      request.user.userId,
      dto.body,
    );
  }

  @Get(':id/notes')
  findInternalNotes(@Param('id') ticketId: string) {
    return this.adminService.findInternalNotes(ticketId);
  }

  @Post(':id/notes')
  addInternalNote(
    @Param('id') ticketId: string,
    @Body() dto: CreateInternalNoteDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.adminService.addInternalNote(
      ticketId,
      request.user.userId,
      dto.body,
    );
  }

  @Post(':id/ai-draft')
  generateAiDraft(@Param('id') ticketId: string) {
    return this.adminService.generateAiDraft(ticketId);
  }
}
