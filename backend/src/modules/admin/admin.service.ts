import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';


import { AiService } from '../ai/ai.service.js';
import { isValidObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import type { Model, Types } from 'mongoose';
import {
  TicketMessage,
  MessageSenderRole,
} from '../tickets/schemas/ticket-message.schema.js';

import { TicketNote } from '../tickets/schemas/ticket-note.schema.js';


import { Author } from '../authors/schemas/author.schema.js';
import { Book } from '../books/schemas/book.schema.js';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
} from '../tickets/schemas/ticket.schema.js';

import type { AdminTicketQueryDto } from './dto/admin-ticket-query.dto.js';
import type { UpdateAdminTicketDto } from './dto/update-admin-ticket.dto.js';

interface TicketQueueRow {
  _id: Types.ObjectId;
  authorId: string;
  bookId: string | null;
  subject: string;
  description: string;
  status: TicketStatus;
  category: string;
  priority: TicketPriority;

  aiProcessingStatus?: string | null;
  aiSuggestedCategory?: string | null;
  aiSuggestedPriority?: string | null;

  assignedTo: Types.ObjectId | null;
  createdAt: Date;
  lastMessageAt: Date | null;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<Ticket>,

    @InjectModel(Author.name)
    private readonly authorModel: Model<Author>,

    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,

    @InjectModel(TicketMessage.name)
    private readonly ticketMessageModel: Model<TicketMessage>,

    @InjectModel(TicketNote.name)
    private readonly ticketNoteModel: Model<TicketNote>,

    private readonly aiService: AiService,
  ) {}

  async findAllTickets(query: AdminTicketQueryDto) {
    const filter: Record<string, unknown> = {};

    if (query.status) filter.status = query.status;
    if (query.category) filter.category = query.category;
    if (query.priority) filter.priority = query.priority;

    if (query.dateFrom || query.dateTo) {
      const createdAt: Record<string, Date> = {};

      if (query.dateFrom) {
        createdAt.$gte = new Date(query.dateFrom);
      }

      if (query.dateTo) {
        createdAt.$lte = new Date(query.dateTo);
      }

      filter.createdAt = createdAt;
    }

    const page = query.page;
    const limit = query.limit;
    const skip = (page - 1) * limit;

    const [ticketRows, total] = await Promise.all([
      this.ticketModel
        .aggregate<TicketQueueRow>([
          { $match: filter },
          {
            $addFields: {
              statusOrder: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ['$status', 'Open'] },
                      then: 0,
                    },
                    {
                      case: { $eq: ['$status', 'In Progress'] },
                      then: 1,
                    },
                    {
                      case: { $eq: ['$status', 'Resolved'] },
                      then: 2,
                    },
                    {
                      case: { $eq: ['$status', 'Closed'] },
                      then: 3,
                    },
                  ],
                  default: 4,
                },
              },
              priorityOrder: {
                $switch: {
                  branches: [
                    {
                      case: {
                        $eq: ['$priority', TicketPriority.CRITICAL],
                      },
                      then: 0,
                    },
                    {
                      case: {
                        $eq: ['$priority', TicketPriority.HIGH],
                      },
                      then: 1,
                    },
                    {
                      case: {
                        $eq: ['$priority', TicketPriority.MEDIUM],
                      },
                      then: 2,
                    },
                  ],
                  default: 3,
                },
              },
            },
          },
          { $sort: { statusOrder: 1, priorityOrder: 1, createdAt: 1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: { statusOrder: 0, priorityOrder: 0 } },
        ])
        .exec(),

      this.ticketModel.countDocuments(filter).exec(),
    ]);

    const authorIds = [...new Set(ticketRows.map((t) => t.authorId))];
    const bookIds = [
      ...new Set(
        ticketRows.flatMap((t) => (t.bookId ? [t.bookId] : [])),
      ),
    ];

    const [authors, books] = await Promise.all([
      this.authorModel
        .find({ authorId: { $in: authorIds } })
        .select('authorId name email')
        .lean()
        .exec(),

      this.bookModel
        .find({ bookId: { $in: bookIds } })
        .select('bookId title')
        .lean()
        .exec(),
    ]);

    const authorById = new Map<
      string,
      { name: string; email: string }
    >();

    for (const author of authors) {
      authorById.set(author.authorId, {
        name: author.name,
        email: author.email,
      });
    }

    const bookById = new Map<string, { title: string }>();

    for (const book of books) {
      bookById.set(book.bookId, { title: book.title });
    }

    return {
      data: ticketRows.map((ticket) => ({
        id: ticket._id.toString(),
        authorId: ticket.authorId,
        author: authorById.get(ticket.authorId) ?? null,
        bookId: ticket.bookId,
        book: ticket.bookId
          ? bookById.get(ticket.bookId) ?? null
          : null,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
category: ticket.category,
priority: ticket.priority,

aiProcessingStatus: ticket.aiProcessingStatus ?? null,
aiSuggestedCategory: ticket.aiSuggestedCategory ?? null,
aiSuggestedPriority: ticket.aiSuggestedPriority ?? null,

assignedTo: ticket.assignedTo?.toString() ?? null,
        createdAt: ticket.createdAt,
        lastMessageAt: ticket.lastMessageAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTicket(
  ticketId: string,
  dto: UpdateAdminTicketDto,
) {
  if (!isValidObjectId(ticketId)) {
    throw new BadRequestException('Invalid ticket ID.');
  }

  const updates: Partial<
    Pick<Ticket, 'status' | 'category' | 'priority'>
  > = {};

  if (dto.status !== undefined) updates.status = dto.status;
  if (dto.category !== undefined) updates.category = dto.category;
  if (dto.priority !== undefined) updates.priority = dto.priority;

  if (Object.keys(updates).length === 0) {
    throw new BadRequestException(
      'Provide a status, category, or priority to update.',
    );
  }

  const ticket = await this.ticketModel
    .findByIdAndUpdate(
      ticketId,
      { $set: updates },
      { returnDocument: 'after', runValidators: true },
    )
    .lean()
    .exec();

  if (!ticket) {
    throw new NotFoundException('Ticket not found.');
  }

  return {
    id: ticket._id.toString(),
    status: ticket.status,
    category: ticket.category,
    priority: ticket.priority,
    assignedTo: ticket.assignedTo?.toString() ?? null,
    updatedAt: ticket.updatedAt,
  };
}

async assignTicketToMe(
  ticketId: string,
  adminUserId: string,
) {
  if (!isValidObjectId(ticketId)) {
    throw new BadRequestException('Invalid ticket ID.');
  }

  if (!isValidObjectId(adminUserId)) {
    throw new BadRequestException('Invalid admin user ID.');
  }

  const ticket = await this.ticketModel
    .findByIdAndUpdate(
      ticketId,
      { $set: { assignedTo: adminUserId } },
      { returnDocument: 'after', runValidators: true },
    )
    .lean()
    .exec();

  if (!ticket) {
    throw new NotFoundException('Ticket not found.');
  }

  return {
    id: ticket._id.toString(),
    assignedTo: ticket.assignedTo?.toString() ?? null,
  };
}

async sendPublicReply(
  ticketId: string,
  adminUserId: string,
  body: string,
) {
  if (!isValidObjectId(ticketId)) {
    throw new BadRequestException('Invalid ticket ID.');
  }

  const content = body.trim();

  if (!content) {
    throw new BadRequestException('Reply cannot be empty.');
  }

  const ticket = await this.ticketModel
    .findById(ticketId)
    .exec();

  if (!ticket) {
    throw new NotFoundException('Ticket not found.');
  }

  const message = await this.ticketMessageModel.create({
    ticketId: ticket._id,
    senderUserId: adminUserId,
    senderRole: MessageSenderRole.ADMIN,
    body: content,
  });

  const lastMessageAt = new Date();

  await this.ticketModel.updateOne(
    { _id: ticket._id },
    { $set: { lastMessageAt } },
  ).exec();

  return {
    id: message._id.toString(),
    ticketId: ticket._id.toString(),
    senderRole: message.senderRole,
    body: message.body,
    createdAt: message.get('createdAt'),
  };
}

async addInternalNote(
  ticketId: string,
  adminUserId: string,
  body: string,
) {
  if (!isValidObjectId(ticketId)) {
    throw new BadRequestException('Invalid ticket ID.');
  }

  const content = body.trim();

  if (!content) {
    throw new BadRequestException('Note cannot be empty.');
  }

  const ticketExists = await this.ticketModel
    .exists({ _id: ticketId });

  if (!ticketExists) {
    throw new NotFoundException('Ticket not found.');
  }

  const note = await this.ticketNoteModel.create({
    ticketId,
    adminUserId,
    body: content,
  });

  return {
    id: note._id.toString(),
    ticketId: ticketId,
    adminUserId,
    body: note.body,
    createdAt: note.get('createdAt'),
  };
}

  async findInternalNotes(ticketId: string) {
    if (!isValidObjectId(ticketId)) {
      throw new BadRequestException('Invalid ticket ID.');
    }

    const ticketExists = await this.ticketModel.exists({ _id: ticketId });
    if (!ticketExists) {
      throw new NotFoundException('Ticket not found.');
    }

    const notes = await this.ticketNoteModel
      .find({ ticketId })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    return notes.map((note) => ({
      id: note._id.toString(),
      ticketId: note.ticketId.toString(),
      adminUserId: note.adminUserId.toString(),
      body: note.body,
      createdAt: (note as typeof note & { createdAt: Date }).createdAt,
    }));
  }

  async generateAiDraft(ticketId: string) {
    if (!isValidObjectId(ticketId)) {
      throw new BadRequestException('Invalid ticket ID.');
    }

    const ticket = await this.ticketModel.findById(ticketId).exec();
    if (!ticket) {
      throw new NotFoundException('Ticket not found.');
    }

    const author = await this.authorModel
      .findOne({ authorId: ticket.authorId })
      .select('name')
      .lean()
      .exec();

    // Only fetch fields required to draft an author-facing response.
    let bookContext: Record<string, unknown> | undefined;
    if (ticket.bookId) {
      const book = await this.bookModel
        .findOne({ bookId: ticket.bookId, authorId: ticket.authorId })
        .select(
          [
            'title',
            'isbn',
            'genre',
            'status',
            'publicationDate',
            'mrp',
            'authorRoyaltyPerCopy',
            'totalCopiesSold',
            'totalRoyaltyEarned',
            'royaltyPaid',
            'royaltyPending',
            'lastRoyaltyPayoutDate',
            'printPartner',
            'availableOn',
          ].join(' '),
        )
        .lean()
        .exec();

      if (book) {
        bookContext = {
          title: book.title,
          isbn: book.isbn,
          genre: book.genre,
          status: book.status,
          publicationDate: book.publicationDate,
          mrp: book.mrp,
          authorRoyaltyPerCopy: book.authorRoyaltyPerCopy,
          totalCopiesSold: book.totalCopiesSold,
          totalRoyaltyEarned: book.totalRoyaltyEarned,
          royaltyPaid: book.royaltyPaid,
          royaltyPending: book.royaltyPending,
          lastRoyaltyPayoutDate: book.lastRoyaltyPayoutDate,
          printPartner: book.printPartner,
          availableOn: book.availableOn,
        };
      }
    }

    // AI failures now return an editable template instead of null/503.
    const draft = await this.aiService.generateResponseDraft({
      subject: ticket.subject,
      description: ticket.description,
      category: ticket.category,
      priority: ticket.priority,
      authorName: author?.name,
      bookContext,
    });

    const updatedTicket = await this.ticketModel
      .findByIdAndUpdate(
        ticketId,
        { $set: { aiDraftResponse: draft.text } },
        { returnDocument: 'after', runValidators: true },
      )
      .select('_id aiDraftResponse category priority updatedAt')
      .exec();

    if (!updatedTicket) {
      throw new NotFoundException('Ticket not found.');
    }

    return {
      ticketId: updatedTicket._id.toString(),
      aiDraftResponse: updatedTicket.get('aiDraftResponse'),
      draftSource: draft.source,
      warning: draft.warning ?? null,
      category: updatedTicket.category,
      priority: updatedTicket.priority,
      updatedAt: updatedTicket.get('updatedAt'),
    };
  }
}
