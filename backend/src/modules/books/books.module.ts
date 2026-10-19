import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { Book, BookSchema } from './schemas/book.schema.js';
import { BooksController } from './books.controller.js';
import { BooksService } from './books.service.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Book.name,
        schema: BookSchema,
      },
    ]),
    AuthModule,
  ],
  controllers: [BooksController],
  providers: [BooksService, RolesGuard],
  exports: [BooksService],
})
export class BooksModule {}