import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';
import type { Types } from 'mongoose';

@Schema({
  timestamps: true,
  collection: 'ticketNotes',
})
export class TicketNote {
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
  adminUserId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 5000,
  })
  body!: string;
}

export const TicketNoteSchema =
  SchemaFactory.createForClass(TicketNote);

TicketNoteSchema.index({ ticketId: 1, createdAt: -1 });