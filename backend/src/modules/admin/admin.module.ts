import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

import { Author, AuthorSchema } from '../authors/schemas/author.schema.js';
import { Book, BookSchema } from '../books/schemas/book.schema.js';
import { Ticket, TicketSchema } from '../tickets/schemas/ticket.schema.js';

import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

import { AiModule } from '../ai/ai.module.js';

import {
  TicketMessage,
  TicketMessageSchema,
} from '../tickets/schemas/ticket-message.schema.js';

import {
  TicketNote,
  TicketNoteSchema,
} from '../tickets/schemas/ticket-note.schema.js';

@Module({
  imports: [
    AuthModule,
    AiModule,
    MongooseModule.forFeature([
      { name: Author.name, schema: AuthorSchema },
      { name: Book.name, schema: BookSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: TicketMessage.name, schema: TicketMessageSchema },
      { name: TicketNote.name, schema: TicketNoteSchema }
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService, RolesGuard],
})
export class AdminModule {}