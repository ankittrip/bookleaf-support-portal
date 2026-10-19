import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AiService } from './ai.service.js';

import { TicketClassificationService } from './classification/ticket-classification.service.js';

import { DraftPromptBuilder } from './drafting/draft-prompt.builder.js';
import { DraftValidator } from './drafting/draft-validator.js';
import { FallbackTemplateBuilder } from './drafting/fallback-template.builder.js';
import { ResponseDraftService } from './drafting/response-draft.service.js';

import { LlmClientService } from './providers/llm-client.service.js';

@Module({
  imports: [ConfigModule],
  providers: [
    AiService,
    LlmClientService,
    TicketClassificationService,
    ResponseDraftService,
    DraftPromptBuilder,
    DraftValidator,
    FallbackTemplateBuilder,
  ],
  exports: [AiService],
})
export class AiModule {}