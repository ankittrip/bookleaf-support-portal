import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import type { Types } from 'mongoose';

export enum TicketStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
}

export enum TicketCategory {
  ROYALTY_PAYMENTS = 'Royalty & Payments',
  ISBN_METADATA = 'ISBN & Metadata Issues',
  PRINTING_QUALITY = 'Printing & Quality',
  DISTRIBUTION = 'Distribution & Availability',
  PRODUCTION = 'Book Status & Production Updates',
  GENERAL = 'General Inquiry',
}

export enum TicketPriority {
  CRITICAL = 'Critical',
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low',
}

export enum AiProcessingStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Schema({
  timestamps: true,
  collection: 'tickets',
})
export class Ticket {
  @Prop({ required: true, index: true })
  authorId!: string;

  @Prop({ type: String, default: null, index: true })
  bookId!: string | null;

  @Prop({ required: true, trim: true, maxlength: 200 })
  subject!: string;

  @Prop({ required: true, trim: true, maxlength: 10000 })
  description!: string;

  @Prop({
    type: String,
    enum: TicketStatus,
    default: TicketStatus.OPEN,
    index: true,
  })
  status!: TicketStatus;

  // Current category, which an admin can override.
  @Prop({
    type: String,
    enum: TicketCategory,
    default: TicketCategory.GENERAL,
    index: true,
  })
  category!: TicketCategory;

  // Preserve the original AI suggestion when an admin overrides it.
  @Prop({
    type: String,
    enum: TicketCategory,
    default: null,
  })
  aiSuggestedCategory!: TicketCategory | null;

  @Prop({
    type: String,
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
    index: true,
  })
  priority!: TicketPriority;

  @Prop({
    type: String,
    enum: TicketPriority,
    default: null,
  })
  aiSuggestedPriority!: TicketPriority | null;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true,
  })
  assignedTo!: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  aiDraftResponse!: string | null;

  @Prop({
    type: String,
    enum: AiProcessingStatus,
    default: AiProcessingStatus.PENDING,
  })
  aiProcessingStatus!: AiProcessingStatus;

  @Prop({ type: Date, default: null })
  lastMessageAt!: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

TicketSchema.index({ status: 1, priority: 1, createdAt: 1 });
TicketSchema.index({ authorId: 1, createdAt: -1 });