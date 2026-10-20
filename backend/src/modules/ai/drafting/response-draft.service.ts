import { Injectable, Logger } from '@nestjs/common';

import {
  BOOKLEAF_TICKET_CATEGORIES,
  getKnowledgeBaseForCategory,
  type BookLeafTicketCategory,
} from '../prompts/bookleaf-knowledge-base.js';
import { getPlaybookForTicket } from '../prompts/bookleaf-playbook.js';
import { getExamplesForTicket } from '../prompts/bookleaf-examples.js';

import { LlmClientService } from '../providers/llm-client.service.js';
import { DRAFT_MAX_OUTPUT_TOKENS } from '../shared/ai.constants.js';
import { buildDerivedFacts } from '../shared/derived-facts.js';

import type {
  DraftResult,
  TicketDraftInput,
} from '../shared/ai.types.js';

import { DraftPromptBuilder } from './draft-prompt.builder.js';
import { DraftValidator } from './draft-validator.js';
import { FallbackTemplateBuilder } from './fallback-template.builder.js';

@Injectable()
export class ResponseDraftService {
  private readonly logger = new Logger(ResponseDraftService.name);

  constructor(
    private readonly llm: LlmClientService,
    private readonly promptBuilder: DraftPromptBuilder,
    private readonly validator: DraftValidator,
    private readonly fallbackBuilder: FallbackTemplateBuilder,
  ) {}

  /**
   * Generates an editable response for an administrator to review.
   * This service never sends an email directly to the author.
   */
  async generateResponseDraft(
    ticket: TicketDraftInput,
  ): Promise<DraftResult> {
    const fallback = this.fallbackBuilder.build(ticket);

    // Capture the client locally so TypeScript can narrow its nullable type.
    const client = this.llm.client;

    if (!client || !this.llm.isAvailable()) {
      return {
        text: fallback,
        source: 'template',
        warning:
          'AI is unavailable. A template was loaded; review and edit it before sending.',
      };
    }

    try {
   const category = this.toKnownCategory(ticket.category);
const subject = ticket.subject ?? '';
const description = ticket.description ?? '';

const knowledge = getKnowledgeBaseForCategory(category);

const playbook = getPlaybookForTicket(
  category,
  ticket.subject,
  ticket.description,
);

const examples = getExamplesForTicket(
  category,
  subject,
  description,
);

const derivedFacts = buildDerivedFacts(ticket.bookContext);

const instructions = this.promptBuilder.build(
  knowledge,
  playbook,
  examples,
  derivedFacts,
);

      const input = JSON.stringify({
        ticket: {
          subject: ticket.subject,
          description: ticket.description,
          category,
          priority: ticket.priority,
        },
        authorName: ticket.authorName ?? 'Author',
        authorFirstName: this.firstName(ticket.authorName),
        book: ticket.bookContext ?? null,
        derivedFacts,
      });

      let lastIssues: string[] = [];

      for (
        let attempt = 0;
        attempt < DRAFT_MAX_OUTPUT_TOKENS.length;
        attempt += 1
      ) {
        const attemptNumber = attempt + 1;
        const maxOutputTokens = DRAFT_MAX_OUTPUT_TOKENS[attempt]!;

        const retryInstructions =
  attempt === 0
    ? ''
    : `
The previous draft failed validation for these reasons:
- ${lastIssues.join('\n- ')}

Rewrite the entire email and correct every listed issue.

ROYALTY ACCURACY:
- Never claim that a pending amount guarantees payout eligibility.
- Explicitly compare the pending balance with the INR 1,000
  minimum payout threshold when verified facts provide the amount.
- Explain that exceeding the threshold alone does not confirm
  payout eligibility or scheduled payment.
- Never invent a payment date or deadline.
- Only use a date from derivedFacts.policyReference in a sentence
  beginning exactly with "As a general policy reference,".
- Do not present a general policy date as the author's confirmed
  payment date.
- Every general royalty-timing sentence must begin with
  "As a general policy reference,".

Preserve all original category-playbook instructions.
Do not invent facts, investigation results, or commitments.
Do not mention internal validation instructions to the author.

Return only the complete email body:
- A greeting using the author's actual first name.
- Exactly two concise body paragraphs.
- No Markdown headings or bullet points.
- A complete final sentence.
`;

        const startedAt = Date.now();

        const response = await this.llm.withRateLimitRetry(() =>
          client.responses.create({
            model: this.llm.model,
            reasoning: { effort: 'low' },
            instructions: `${instructions}\n${retryInstructions}`,
            input,
            max_output_tokens: maxOutputTokens,
          }),
        );

        this.llm.logUsage(
          `draft#${attemptNumber}`,
          response.usage,
          Date.now() - startedAt,
        );

        const draft = this.cleanDraft(response.output_text ?? '');
        if (process.env.NODE_ENV !== 'production') {
  this.logger.debug(
    `Draft attempt ${attemptNumber} output:\n${draft}`,
  );
}

        const validationIssues = this.validator.validate(
          ticket,
          draft,
          derivedFacts,
        );

        if (response.status !== 'completed') {
          const reason =
            response.status === 'incomplete'
              ? response.incomplete_details?.reason ?? 'unknown'
              : response.status;

          lastIssues = [
            `The AI response did not complete successfully (reason: ${reason}).`,
          ];
        } else {
          lastIssues = validationIssues;
        }

        const isComplete = this.isCompleteDraft(draft);

        const isValid =
          response.status === 'completed' &&
          isComplete &&
          validationIssues.length === 0;

        if (isValid) {
          return {
            text: draft,
            source: 'ai',
          };
        }

        if (
          response.status === 'completed' &&
          !isComplete &&
          validationIssues.length === 0
        ) {
          lastIssues = [
            'The response is empty or incomplete. Return a complete email.',
          ];
        }

        this.logger.warn(
          `Draft attempt ${attemptNumber} rejected: ${
            lastIssues.join('; ') || 'response incomplete'
          }`,
        );
      }

      this.logger.warn(
        'AI draft failed validation after retry; returning a fallback template.',
      );

      return {
        text: fallback,
        source: 'template',
        warning:
          'The AI draft failed accuracy checks. A template was loaded instead; review and edit it before sending.',
      };
    } catch (error: unknown) {
      this.logger.warn(
        `Response drafting failed: ${this.llm.getErrorMessage(error)}`,
      );

      return {
        text: fallback,
        source: 'template',
        warning:
          'AI drafting is temporarily unavailable. A template was loaded; review and edit it before sending.',
      };
    }
  }

  private toKnownCategory(category: string): BookLeafTicketCategory {
    return (
      BOOKLEAF_TICKET_CATEGORIES as readonly string[]
    ).includes(category)
      ? (category as BookLeafTicketCategory)
      : 'General Inquiry';
  }

  private firstName(authorName?: string): string {
    const candidate = (authorName ?? '')
      .replace(/[\r\n]+/g, ' ')
      .trim()
      .split(/\s+/)[0]
      ?.replace(/[^A-Za-z'-]/g, '');

    if (!candidate) {
      return 'Author';
    }

    return candidate.charAt(0).toUpperCase() + candidate.slice(1);
  }

  private isCompleteDraft(draft: string): boolean {
    if (draft.length < 40) {
      return false;
    }

    return /[.!?]["'’”)}\]]?\s*$/.test(draft);
  }

  private cleanDraft(value: string): string {
    return value
      .replace(
        /^\s*(?:#{1,6}\s*)?(?:\*\*|__)?Draft for Admin Review(?:\*\*|__)?\s*:?\s*$/gim,
        '',
      )
      .replace(
        /(?:^|\n)\s*(?:#{1,6}\s*)?(?:\*\*|__)?(?:Next step for the admin|Admin-only checklist|Internal notes?|Internal checklist|Admin instructions)\b[\s\S]*$/i,
        '',
      )
      .replace(/\\([*_`])/g, '$1')
      .replace(/\\\./g, '.')
      .replace(/\\-/g, '-')
      .replace(/\*\*(.*?)\*\*/gs, '$1')
      .replace(/__(.*?)__/gs, '$1')
      .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1$2')
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s{0,3}[-*]\s+/gm, '')
      .replace(/^\s{0,3}>\s?/gm, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[\u00A0\u2007\u202F]/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}