import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import type { Model } from 'mongoose';

import { AppModule } from '../app.module.js';
import { User, UserRole } from '../modules/users/schemas/user.schema.js';
import { Author } from '../modules/authors/schemas/author.schema.js';
import { Book } from '../modules/books/schemas/book.schema.js';

interface SampleBook {
  book_id: string;
  title: string;
  isbn: string;
  genre: string;
  publication_date: string | null;
  status: string;
  mrp: number | null;
  author_royalty_per_copy: number | null;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  last_royalty_payout_date: string | null;
  print_partner: string | null;
  available_on: string[];
}

interface SampleAuthor {
  author_id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  joined_date: string;
  books: SampleBook[];
}

interface SampleData {
  authors: SampleAuthor[];
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date in sample data: ${value}`);
  }

  return date;
}

async function seedDatabase(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const authorModel = app.get<Model<Author>>(
      getModelToken(Author.name),
    );

    const bookModel = app.get<Model<Book>>(
      getModelToken(Book.name),
    );

    const userModel = app.get<Model<User>>(
      getModelToken(User.name),
    );

    const filePath = join(
      process.cwd(),
      'data',
      'bookleaf_sample_data.json',
    );

    const data = JSON.parse(
      readFileSync(filePath, 'utf8'),
    ) as SampleData;

    if (!Array.isArray(data.authors)) {
      throw new Error('Dataset must contain an authors array.');
    }

    const totalBooks = data.authors.reduce(
      (total, author) => total + (author.books?.length ?? 0),
      0,
    );

    // Prevent accidentally seeding an incomplete or incorrect dataset.
    if (data.authors.length !== 10 || totalBooks !== 18) {
      throw new Error(
        `Expected 10 authors and 18 books; received ` +
        `${data.authors.length} authors and ${totalBooks} books.`,
      );
    }

    const authorPassword = process.env.DEMO_AUTHOR_PASSWORD;
    const adminPassword = process.env.DEMO_ADMIN_PASSWORD;
    const adminEmail = process.env.DEMO_ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

    if (!authorPassword || !adminPassword || !adminEmail) {
      throw new Error(
        'Set DEMO_AUTHOR_PASSWORD, DEMO_ADMIN_PASSWORD, ' +
        'and DEMO_ADMIN_EMAIL in backend/.env.',
      );
    }

    const authorPasswordHash = await bcrypt.hash(authorPassword, 10);
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

    let processedBooks = 0;

    for (const rawAuthor of data.authors) {
      const authorId = rawAuthor.author_id;
      const email = rawAuthor.email.trim().toLowerCase();

      // Save the author profile without duplicating its author ID.
      await authorModel.updateOne(
        { authorId },
        {
          $set: {
            authorId,
            name: rawAuthor.name,
            email,
            phone: rawAuthor.phone ?? null,
            city: rawAuthor.city ?? null,
            joinedDate: toDate(rawAuthor.joined_date),
          },
        },
        { upsert: true },
      ).exec();

      // Create a separate login account with a hashed password.
      await userModel.updateOne(
        { email },
        {
          $set: {
            email,
            passwordHash: authorPasswordHash,
            role: UserRole.AUTHOR,
            authorId,
          },
        },
        { upsert: true },
      ).exec();

      for (const rawBook of rawAuthor.books ?? []) {
        await bookModel.updateOne(
          { bookId: rawBook.book_id },
          {
            $set: {
              bookId: rawBook.book_id,
              authorId,
              title: rawBook.title,
              isbn: rawBook.isbn,
              genre: rawBook.genre,
              publicationDate: toDate(rawBook.publication_date),
              status: rawBook.status,
              mrp: rawBook.mrp ?? null,
              authorRoyaltyPerCopy:
                rawBook.author_royalty_per_copy ?? null,
              totalCopiesSold: rawBook.total_copies_sold,
              totalRoyaltyEarned: rawBook.total_royalty_earned,
              royaltyPaid: rawBook.royalty_paid,
              royaltyPending: rawBook.royalty_pending,
              lastRoyaltyPayoutDate: toDate(
                rawBook.last_royalty_payout_date,
              ),
              printPartner: rawBook.print_partner ?? null,
              availableOn: rawBook.available_on ?? [],
            },
          },
          { upsert: true },
        ).exec();

        processedBooks++;
      }
    }

    // Create or update the administrator login.
    await userModel.updateOne(
      { email: adminEmail },
      {
        $set: {
          email: adminEmail,
          passwordHash: adminPasswordHash,
          role: UserRole.ADMIN,
          authorId: null,
        },
      },
      { upsert: true },
    ).exec();

    console.log('Database seeding completed successfully.');
    console.log(`Authors processed: ${data.authors.length}`);
    console.log(`Books processed: ${processedBooks}`);
    console.log(`Admin account: ${adminEmail}`);
    console.log('Demo passwords are configured in backend/.env.');
  } finally {
    await app.close();
  }
}

seedDatabase().catch((error: unknown) => {
  console.error('Database seeding failed:', error);
  process.exitCode = 1;
});