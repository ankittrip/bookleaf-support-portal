import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, collection: 'books' })
export class Book {
  @Prop({ required: true, unique: true, index: true })
  bookId!: string;

  @Prop({ required: true, index: true })
  authorId!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true })
  isbn!: string;

  @Prop({ required: true })
  genre!: string;

  @Prop({ type: Date, default: null })
  publicationDate!: Date | null;

  @Prop({ required: true })
  status!: string;

  @Prop({ type: Number, default: null })
  mrp!: number | null;

  @Prop({ type: Number, default: null })
  authorRoyaltyPerCopy!: number | null;

  @Prop({ type: Number, default: 0 })
  totalCopiesSold!: number;

  @Prop({ type: Number, default: 0 })
  totalRoyaltyEarned!: number;

  @Prop({ type: Number, default: 0 })
  royaltyPaid!: number;

  @Prop({ type: Number, default: 0 })
  royaltyPending!: number;

  @Prop({ type: Date, default: null })
  lastRoyaltyPayoutDate!: Date | null;

  @Prop({ type: String, default: null })
  printPartner!: string | null;

  @Prop({ type: [String], default: [] })
  availableOn!: string[];
}

export const BookSchema = SchemaFactory.createForClass(Book);