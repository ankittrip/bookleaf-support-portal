import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { AiModule } from '../ai/ai.module.js';

import {
  Book,
  BookSchema,
} from '../books/schemas/book.schema.js';

import {
  Ticket,
  TicketSchema,
} from './schemas/ticket.schema.js';

import {
  TicketMessage,
  TicketMessageSchema,
} from './schemas/ticket-message.schema.js';

import {
  TicketNote,
  TicketNoteSchema,
} from './schemas/ticket-note.schema.js';

import { TicketsController } from './tickets.controller.js';
import { TicketsService } from './tickets.service.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@Module({
  imports: [
    AuthModule,
    AiModule,

    MongooseModule.forFeature([
      { name: Book.name, schema: BookSchema },
      { name: Ticket.name, schema: TicketSchema },
      {
        name: TicketMessage.name,
        schema: TicketMessageSchema,
      },
      { name: TicketNote.name, schema: TicketNoteSchema },
    ]),
  ],
  controllers: [TicketsController],
  providers: [TicketsService, RolesGuard],
  exports: [TicketsService],
})
export class TicketsModule {}