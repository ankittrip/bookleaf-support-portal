import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { AiService } from '../ai/ai.service.js';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { Book } from '../books/schemas/book.schema.js';
import {
  Ticket,
  TicketStatus,
  TicketCategory,
  TicketPriority,
  AiProcessingStatus,
} from './schemas/ticket.schema.js';



import { TicketMessage } from './schemas/ticket-message.schema.js';

import type { CreateTicketDto } from './dto/create-ticket.dto.js';

@Injectable()
export class TicketsService {
    private readonly logger = new Logger(TicketsService.name);
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<Ticket>,

    @InjectModel(TicketMessage.name)
    private readonly ticketMessageModel: Model<TicketMessage>,
    

    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,

    private readonly aiService: AiService,
  ) {}

  async createForAuthor(
    authorId: string,
    dto: CreateTicketDto,
  ) {
    const subject = dto.subject.trim();
    const description = dto.description.trim();
    const bookId = dto.bookId?.trim() || null;

    if (!subject || !description) {
      throw new BadRequestException(
        'Subject and description are required.',
      );
    }

    // Ensure the selected book belongs to the logged-in author.
    if (bookId) {
      const bookExists = await this.bookModel.exists({
        bookId,
        authorId,
      });

      if (!bookExists) {
        throw new BadRequestException(
          'The selected book is not available for this author.',
        );
      }
    }

    const ticket = await this.ticketModel.create({
  authorId,
  bookId,
  subject,
  description,
  status: TicketStatus.OPEN,
  category: TicketCategory.GENERAL,
  priority: TicketPriority.MEDIUM,
  aiProcessingStatus: AiProcessingStatus.PENDING,
  lastMessageAt: new Date(),
});

// Start AI classification without delaying ticket creation.
void this.processTicketWithAi(ticket._id.toString());

    return {
      id: ticket._id.toString(),
      bookId: ticket.bookId,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      category: ticket.category,
      priority: ticket.priority,
      createdAt: ticket.get('createdAt'),
    };
  }

  private async processTicketWithAi(
  ticketId: string,
): Promise<void> {
  try {
    const ticket = await this.ticketModel.findById(ticketId).exec();

    if (!ticket) {
      return;
    }

    let bookTitle: string | undefined;

    // Retrieve the associated book only when a book was selected.
    if (ticket.bookId) {
      const book = await this.bookModel
        .findOne({
          bookId: ticket.bookId,
          authorId: ticket.authorId,
        })
        .select('title')
        .lean()
        .exec();

      bookTitle = book?.title;
    }

    const classification = await this.aiService.classifyTicket({
      subject: ticket.subject,
      description: ticket.description,
      bookTitle,
    });

    // AI may be unavailable or return no valid classification.
    if (!classification) {
      await this.ticketModel.findOneAndUpdate(
        {
          _id: ticketId,
          aiProcessingStatus: AiProcessingStatus.PENDING,
        },
        {
          $set: {
            aiProcessingStatus: AiProcessingStatus.FAILED,
          },
        },
      );

      return;
    }

    // Update only if the ticket is still awaiting AI processing.
    const updatedTicket = await this.ticketModel.findOneAndUpdate(
      {
        _id: ticketId,
        aiProcessingStatus: AiProcessingStatus.PENDING,
      },
      {
        $set: {
          category: classification.category,
          priority: classification.priority,
          aiSuggestedCategory: classification.category,
          aiSuggestedPriority: classification.priority,
          aiProcessingStatus: AiProcessingStatus.COMPLETED,
        },
      },
    ).exec();

    if (updatedTicket) {
      this.logger.log(
        `AI classification completed for ticket ${ticketId}`,
      );
    }
  } catch (error: unknown) {
    this.logger.error(
      `AI classification failed for ticket ${ticketId}: ${
        error instanceof Error
          ? error.message
          : 'Unknown error'
      }`,
    );

    try {
      await this.ticketModel.findOneAndUpdate(
        {
          _id: ticketId,
          aiProcessingStatus: AiProcessingStatus.PENDING,
        },
        {
          $set: {
            aiProcessingStatus: AiProcessingStatus.FAILED,
          },
        },
      );
    } catch (updateError: unknown) {
      this.logger.error(
        `Failed to update AI processing status for ticket ${ticketId}`,
      );
    }
  }
}

  async findForAuthor(authorId: string) {
  return this.ticketModel
    .find({ authorId })
    .select(
      '_id bookId subject description status category priority createdAt updatedAt lastMessageAt',
    )
    .sort({ createdAt: -1 })
    .lean()
    .exec();
}

  async findDetailsForAuthor(
  authorId: string,
  ticketId: string,
) {
  if (!/^[a-fA-F0-9]{24}$/.test(ticketId)) {
    throw new BadRequestException('Invalid ticket ID.');
  }

  // Find this ticket only if it belongs to the logged-in author.
  const ticket = await this.ticketModel
    .findOne({
      _id: ticketId,
      authorId,
    })
    .exec();

  if (!ticket) {
    throw new NotFoundException('Ticket not found.');
  }

  // Retrieve public conversation messages only.
  const messages = await this.ticketMessageModel
    .find({ ticketId: ticket._id })
    .select('senderRole senderUserId body createdAt')
    .sort({ createdAt: 1 })
    .exec();

  return {
    id: ticket._id.toString(),
    bookId: ticket.bookId,
    subject: ticket.subject,
    description: ticket.description,
    status: ticket.status,
    category: ticket.category,
    priority: ticket.priority,
    createdAt: ticket.get('createdAt'),
    updatedAt: ticket.get('updatedAt'),
    messages: messages.map((message) => ({
      id: message._id.toString(),
      senderRole: message.senderRole,
      senderUserId: message.senderUserId.toString(),
      body: message.body,
      createdAt: message.get('createdAt'),
    })),
  };
}


}