import { Injectable } from '@nestjs/common';

import { TicketClassificationService } from './classification/ticket-classification.service.js';
import { ResponseDraftService } from './drafting/response-draft.service.js';
import { LlmClientService } from './providers/llm-client.service.js';

import type {
  DraftResult,
  TicketClassificationInput,
  TicketClassificationResult,
  TicketDraftInput,
} from './shared/ai.types.js';

@Injectable()
export class AiService {
  constructor(
    private readonly llm: LlmClientService,
    private readonly classification: TicketClassificationService,
    private readonly drafting: ResponseDraftService,
  ) {}

  /**
   * Indicates whether the configured LLM provider is available.
   */
  isAvailable(): boolean {
    return this.llm.isAvailable();
  }

  /**
   * Classifies a support ticket and determines its priority.
   */
  classifyTicket(
    ticket: TicketClassificationInput,
  ): Promise<TicketClassificationResult | null> {
    return this.classification.classifyTicket(ticket);
  }

  /**
   * Generates an editable response draft for an admin to review.
   */
  generateResponseDraft(
    ticket: TicketDraftInput,
  ): Promise<DraftResult> {
    return this.drafting.generateResponseDraft(ticket);
  }
}