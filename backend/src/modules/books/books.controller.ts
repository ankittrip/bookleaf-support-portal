import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';

import { BooksService } from './books.service.js';
import { JwtAuthGuard } from '../auth/../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../users/schemas/user.schema.js';

import type { AuthenticatedRequest } from '../../common/interfaces/authenticated-user.interface.js';

@Controller('author/books')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AUTHOR)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  getMyBooks(@Req() request: AuthenticatedRequest) {
    const authorId = request.user.authorId;

    if (!authorId) {
      throw new ForbiddenException(
        'This account is not linked to an author profile.',
      );
    }

    return this.booksService.findForAuthor(authorId);
  }
}