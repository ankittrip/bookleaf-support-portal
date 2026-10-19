import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true, collection: 'authors' })
export class Author {
  @Prop({ required: true, unique: true, index: true })
  authorId!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({ type: String, default: null })
  phone!: string | null;

  @Prop({ type: String, default: null })
  city!: string | null;

  @Prop({ type: Date, default: null })
  joinedDate!: Date | null;
}

export const AuthorSchema = SchemaFactory.createForClass(Author);