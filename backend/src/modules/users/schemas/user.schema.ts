import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export enum UserRole {
  AUTHOR = 'author',
  ADMIN = 'admin',
}

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({
    required: true,
    enum: UserRole,
    default: UserRole.AUTHOR,
  })
  role!: UserRole;

  @Prop({ type: String, default: null, index: true })
  authorId!: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);