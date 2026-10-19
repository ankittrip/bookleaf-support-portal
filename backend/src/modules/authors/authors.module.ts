import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  Author,
  AuthorSchema,
} from './schemas/author.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Author.name,
        schema: AuthorSchema,
      },
    ]),
  ],
  exports: [MongooseModule],
})
export class AuthorsModule {}