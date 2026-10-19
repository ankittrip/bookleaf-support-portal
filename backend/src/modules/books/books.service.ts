import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { Book } from './schemas/book.schema.js';

@Injectable()
export class BooksService {
  constructor(
    @InjectModel(Book.name)
    private readonly bookModel: Model<Book>,
  ) {}

  async findForAuthor(authorId: string) {
    return this.bookModel
      .find({ authorId })
      .select(
        '-_id bookId title isbn genre publicationDate status mrp ' +
        'totalCopiesSold totalRoyaltyEarned royaltyPaid royaltyPending ' +
        'lastRoyaltyPayoutDate printPartner availableOn',
      )
      .sort({ title: 1 })
      .lean()
      .exec();
  }
}