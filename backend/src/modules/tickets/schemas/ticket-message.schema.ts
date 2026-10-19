import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import type { Types } from 'mongoose';

export enum MessageSenderRole {
  AUTHOR = 'author',
  ADMIN = 'admin',
}

@Schema({
  timestamps: true,
  collection: 'ticketMessages',
})
export class TicketMessage {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true,
  })
  ticketId!: Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  senderUserId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: MessageSenderRole,
    required: true,
  })
  senderRole!: MessageSenderRole;

  @Prop({
    required: true,
    trim: true,
    maxlength: 5000,
  })
  body!: string;
}

export const TicketMessageSchema =
  SchemaFactory.createForClass(TicketMessage);

TicketMessageSchema.index({ ticketId: 1, createdAt: 1 });