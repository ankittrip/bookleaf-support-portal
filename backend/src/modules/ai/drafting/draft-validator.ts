import { Injectable } from '@nestjs/common';

import {
  APPROVED_FOLLOW_UP,
  FIRST_PERSON_PROMISE,
  HARD_ACTION,
  ISBN_ERROR_SIGNAL,
  PRODUCTION_DELAY_SIGNAL,
  ROYALTY_DELAY_SIGNAL,
  ROYALTY_LOW_AMOUNT_SIGNAL,
  UNSUPPORTED_FUTURE_ACTION,
} from '../shared/ai.constants.js';
import type { TicketDraftInput } from '../shared/ai.types.js';

const PLACEHOLDER_PATTERN =
  /\[(?:author|author name|first name|name|book|book title|amount|date|ticket id|insert[^\]]*)\]/i;

const INTERNAL_LANGUAGE_PATTERN =
  /\b(?:system prompt|developer prompt|internal instructions|chain of thought|classification result|priority label|validation rules|LLM response|fallback template)\b/i;

const ADMIN_LANGUAGE_PATTERN =
  /\b(?:admin dashboard|internal queue|backend service|database record|API endpoint|support agent notes)\b/i;

const BANK_INFORMATION_REQUEST_PATTERN =
  /\b(?:send|share|provide|upload)\b[^.!?\n]{0,80}\b(?:bank statement|bank credentials|bank account details|account password|OTP|one-time password)\b/i;

const DISTRIBUTION_ACTION_PATTERN =
  /\b(?:please|kindly)\s+(?:re-?sync|resync|re-?synchroni[sz]e)\b|\b(?:you|author)\b[^.!?\n]{0,80}\b(?:trigger|initiate|perform|run|request)\b[^.!?\n]{0,40}\b(?:re-?sync|resync|re-?synchroni[sz]e)\b/i;

const COMPLETED_ACTION_PATTERN =
  /\b(?:has|have|had|was|were|already)\s+(?:been\s+)?(?:forwarded|escalated|investigated|reviewed|verified|corrected|approved|processed|resolved|released|transferred|initiated)\b/i;

const IN_PROGRESS_ACTION_PATTERN =
  /\b(?:I am|we are|our team is|the support team is|the production team is|the finance team is)\s+(?:currently\s+)?(?:checking|reviewing|investigating|verifying|processing|escalating|following up|working on)\b/i;

const VAGUE_TIMELINE_PATTERN =
  /\b(?:very soon|soon|shortly|in no time|as soon as possible|at the earliest|without delay)\b/i;

const RESOLUTION_PROMISE_PATTERN =
  /\b(?:resolve|fix|complete|finish)\b[^.!?\n]{0,80}\b(?:within|in the next)\s+48\s+hours\b/i;

const PAYMENT_DATE_PROMISE_PATTERN =
  /\b(?:you will receive|you should receive|payment will be credited|the amount will be credited|your payment will arrive)\b[^.!?\n]{0,100}\b(?:on|by|before|within)\s+(?:\d{1,2}[/-]\d{1,2}|tomorrow|today|the next \d+ days?)\b/i;

const ROYALTY_ELIGIBILITY_PATTERN =
  /\b(?:(?:your|the|this|that|it)\s+)?(?:pending\s+)?(?:royalty\s+)?(?:balance|amount|payment|payout)\b[^.!?\n]{0,110}\b(?:qualifies for (?:a )?(?:payout|payment)|is eligible for (?:a )?(?:payout|payment)|is payable|will be paid|has qualified for (?:a )?(?:payout|payment)|makes you eligible for (?:a )?(?:payout|payment))\b|\b(?:it|this balance|this amount|the pending balance|the pending amount)\s+(?:therefore\s+)?(?:qualifies for (?:a )?(?:payout|payment)|is eligible for (?:a )?(?:payout|payment)|is payable|will be paid)\b|\b(?:you are eligible|you qualify|you now qualify|you are entitled to)\b[^.!?\n]{0,100}\b(?:payout|payment|royalt(?:y|ies)|upcoming cycle)\b/i;

const UNSUPPORTED_QUARTER_LINKAGE_PATTERN =
  /\b(?:our records|the records|the dashboard|the account)\b[^.!?\n]{0,160}\b(?:do not|don't|does not|doesn't|cannot|can't|has not|have not|is not|are not)\b[^.!?\n]{0,160}\b(?:link|associate|assign|identify|show|indicate|confirm)\b[^.!?\n]{0,120}\b(?:pending balance|reporting quarter|quarter|royalt(?:y|ies))\b/i;

const PAYOUT_CAVEAT_PATTERN =
  /\b(?:does not|doesn't|do not|don't|cannot|can't|not alone|alone does not|by itself does not|does not by itself|does not necessarily)\b[^.!?\n]{0,100}\b(?:confirm|establish|prove|mean|guarantee|determine)\b[^.!?\n]{0,100}\b(?:payout eligibility|eligibility|payment date|payment is due|payment is scheduled|payout|payment|will be paid)\b|\b(?:meeting|exceeding|being above|being below)\s+(?:the )?(?:minimum )?(?:payout )?threshold\b[^.!?\n]{0,100}\bdoes not\b[^.!?\n]{0,60}\b(?:confirm|establish|guarantee)\b/i;

const THRESHOLD_COMPARISON_PATTERN =
  /\b(?:pending\s+(?:royalty\s+)?(?:balance|amount)|(?:royalty\s+)?(?:balance|amount)\s+(?:currently\s+)?pending)\b[^.!?\n]{0,120}\b(?:above|below|exceeds|is greater than|is less than|higher than|lower than|does not exceed|is at or below|is under|is over)\b[^.!?\n]{0,80}\b(?:(?:the|that)\s+)?(?:(?:minimum|payout)\s+){0,2}threshold\b|\b(?:above|below|exceeds|is greater than|is less than|higher than|lower than|does not exceed|is at or below|is under|is over)\b[^.!?\n]{0,80}\b(?:(?:the|that)\s+)?(?:(?:minimum|payout)\s+){0,2}threshold\b/i;
const NO_FURTHER_INFO_PATTERN =
  /\b(?:no further (?:information|info|details) (?:is|are|will be) (?:required|needed|necessary)|no additional (?:information|details) (?:is|are|will be) (?:required|needed|necessary)|nothing else (?:is|will be) required from you|nothing further (?:is|will be) needed from you|no further action is needed from your side|no action is required from your side|you do not need to provide (?:anything|anything else|any other information|any further information|any additional information)|you need not provide anything further)\b/i;

const BANK_DETAILS_ASSERTION_PATTERN =
  /\b(?:your|the) bank(?: account)? (?:details|information)\s+(?:are|is|have been)\s+(?:already\s+)?(?:linked|registered|configured|verified|up to date)\b/i;

const BANK_DETAILS_CHECK_REQUEST_PATTERN =
  /\b(?:please\s+)?(?:check|verify|confirm|make sure)\b[^.!?\n]{0,100}\bbank(?: account)?\s+(?:details|information)\b/i;

const DATE_OR_PERIOD_PATTERN = /\b(?:next quarter|upcoming cycle)\b/i;
const POLICY_REFERENCE_PREFIX = /^\s*As a general policy reference,/i;

@Injectable()
export class DraftValidator {
  validate(
  ticket: TicketDraftInput,
  draft: string,
  derivedFacts?: unknown,
): string[] {
  const issues: string[] = [];

  if (!draft.trim()) {
    return ['The generated draft is empty.'];
  }

  const ticketRecord = ticket as unknown as Record<string, unknown>;
  const category = String(ticketRecord.category ?? '').toLowerCase();

  const ticketText = [
    ticketRecord.subject,
    ticketRecord.description,
    ticketRecord.message,
    ticketRecord.body,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join('\n');

  const factsText = toText(derivedFacts);
  const bookContextText = toText(ticketRecord.bookContext);

  const numericSourceText = [
    ticketText,
    factsText,
    bookContextText,
  ]
    .filter(Boolean)
    .join('\n');

  // Ordinary ticket and book facts can support dates as before.
  const sourceTimeText = [
    ticketText,
    bookContextText,
  ]
    .filter(Boolean)
    .join('\n');

  // Policy-reference dates receive a separate, restricted allowance.
  const factsRecord =
    typeof derivedFacts === 'object' && derivedFacts !== null
      ? (derivedFacts as Record<string, unknown>)
      : undefined;

  const policyReferenceText =
    factsRecord?.policyReference === undefined
      ? ''
      : toText(factsRecord.policyReference);

  const normalizedDraft = normalizeWhitespace(draft);

  this.validatePlaceholders(normalizedDraft, issues);
  this.validateInternalLanguage(normalizedDraft, issues);
  this.validateStructure(normalizedDraft, issues);

  this.validateUnsupportedNumbers(
    normalizedDraft,
    numericSourceText,
    issues,
  );

  this.validateRoyaltyClaims(
    normalizedDraft,
    ticketText,
    numericSourceText,
    category,
    issues,
  );

  this.validateActions(
    normalizedDraft,
    factsText,
    ticketText,
    category,
    issues,
  );

  this.validateMissingInformationClaims(
    normalizedDraft,
    ticketRecord,
    derivedFacts,
    issues,
  );

  this.validateTiming(
    normalizedDraft,
    sourceTimeText,
    policyReferenceText,
    issues,
  );

  return [...new Set(issues)];
}

  private validatePlaceholders(draft: string, issues: string[]): void {
    if (PLACEHOLDER_PATTERN.test(draft)) {
      issues.push('The draft contains an unresolved placeholder.');
    }

    if (/\b(?:authorFirstName|authorName|bookTitle|ticketId)\b/.test(draft)) {
      issues.push('The draft contains an unresolved variable name.');
    }
  }

  private validateInternalLanguage(draft: string, issues: string[]): void {
    if (INTERNAL_LANGUAGE_PATTERN.test(draft)) {
      issues.push('The draft reveals internal AI or implementation details.');
    }

    if (ADMIN_LANGUAGE_PATTERN.test(draft)) {
      issues.push('The draft contains internal administrative terminology.');
    }

    if (/^\s*(?:#{1,6}\s|[-*]\s|\d+\.\s)/m.test(draft)) {
      issues.push('The email must not contain Markdown headings or lists.');
    }
  }

  private validateStructure(draft: string, issues: string[]): void {
    const paragraphs = draft
      .trim()
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    if (paragraphs.length !== 3) {
      issues.push('The email must contain a greeting and exactly two body paragraphs.');
    }

    if (!/^Dear\s+[A-Z][A-Za-z'-]*(?:\s+[A-Z][A-Za-z'-]*)?,?$/.test(paragraphs[0] ?? '')) {
      issues.push('The email greeting must use the format "Dear FirstName,".');
    }

    if (paragraphs.length === 3 && paragraphs.slice(1).some((paragraph) => paragraph.length < 20)) {
      issues.push('Both body paragraphs must provide a meaningful response.');
    }

    if (/\{\{[^}]+\}\}|<[^>]+>/.test(draft)) {
      issues.push('The draft contains unresolved template or markup syntax.');
    }
  }

  private validateUnsupportedNumbers(
    draft: string,
    sourceText: string,
    issues: string[],
  ): void {
    const numberPattern =
      /\b\d+\s*[-–—]\s*\d+\s*(?:business\s+)?(?:days?|hours?)\b|(?:₹|INR\s*|Rs\.?\s*|\$\s*)\d[\d,]*(?:\.\d+)?|\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b|\b\d+(?:\.\d+)?\s*(?:days?|weeks?|months?|years?|hours?|%|percent|copies)\b/gi;

    const sourceNumbers = extractNumberTokens(sourceText);
    const matches = draft.match(numberPattern) ?? [];

    for (const match of matches) {
      const normalized = normalizeNumberToken(match);
      const standardPolicyReference =
  /\b(?:3\s*[-–—]\s*5\s+business\s+days?|5\s*[-–—]\s*7\s+business\s+days?|7\s*[-–—]\s*10\s+business\s+days?|24\s*[-–—]\s*48\s+hours?|48\s+hours?|45\s+days?|80\s*\/\s*20|1,?000)\b/i.test(
    match,
  );

      if (standardPolicyReference) continue;

      if (!sourceNumbers.has(normalized)) {
        issues.push(`The draft contains a potentially unsupported figure or date: "${match}".`);
      }
    }
  }

  private validateRoyaltyClaims(
    draft: string,
    ticketText: string,
    numericSourceText: string,
    category: string,
    issues: string[],
  ): void {
    const royaltyRelated =
      category.includes('royalty') ||
      ROYALTY_DELAY_SIGNAL.test(ticketText) ||
      ROYALTY_LOW_AMOUNT_SIGNAL.test(ticketText);

    if (!royaltyRelated) return;

    if (ROYALTY_ELIGIBILITY_PATTERN.test(draft)) {
      issues.push('The draft makes an unsupported royalty eligibility or payout guarantee.');
    }

    if (UNSUPPORTED_QUARTER_LINKAGE_PATTERN.test(draft)) {
      issues.push('The draft makes an unsupported claim about the reporting quarter recorded in the system.');
    }

    const asksAboutThreshold =
      /\b(?:minimum payout threshold|payout threshold|minimum threshold|threshold)\b/i.test(ticketText);

    const combinedSource = `${ticketText}\n${numericSourceText}`;
    const hasPendingAmount =
      /\b(?:pending|unpaid|not received|haven't received|have not received|awaiting payment)\b/i.test(
        combinedSource,
      ) || /(?:royalty[_\s-]*pending|pending[_\s-]*(?:royalty|balance|amount)|pendingRoyaltyAmount)/i.test(numericSourceText);

    const hasPendingBalanceFact =
      /(?:royalty[_\s-]*pending|pending[_\s-]*(?:royalty|balance|amount)|pendingRoyaltyAmount)["']?\s*[:=]?\s*["']?(?:₹|INR\s*|Rs\.?\s*)?\d/i.test(numericSourceText) ||
      /\b(?:pending (?:royalty )?(?:balance|amount)|(?:royalty )?balance currently pending)\b[^.!?\n]{0,50}(?:₹|INR\s*|Rs\.?\s*)\d/i.test(numericSourceText);

    const mentionsThreshold = /\b(?:threshold|minimum payout|minimum payment)\b/i.test(draft);

    if (
      hasPendingBalanceFact &&
      (asksAboutThreshold || category.includes('royalty')) &&
      !THRESHOLD_COMPARISON_PATTERN.test(draft)
    ) {
      issues.push(
        'The draft should explicitly compare the pending balance with the minimum payout threshold because the author asked about it.',
      );
    }

    if (mentionsThreshold && hasPendingAmount && !PAYOUT_CAVEAT_PATTERN.test(draft)) {
      issues.push(
        'The draft should clarify that exceeding the threshold alone does not confirm payout eligibility or a scheduled payment.',
      );
    }
  }

  private validateActions(
  draft: string,
  factsText: string,
  ticketText: string,
  category: string,
  issues: string[],
): void {
  // Never request sensitive banking information.
  if (BANK_INFORMATION_REQUEST_PATTERN.test(draft)) {
    issues.push(
      'The draft requests sensitive banking information.',
    );
  }

  // Publishing-specific workflow validation.
  const isPublishingQuestion =
    /\b(?:how\s+(?:do\s+i|can\s+i|to)\s+publish|publish(?:ing)?\s+(?:a|the|my|your)\s+book|publishing process|book publishing)\b/i.test(
      ticketText,
    );

  const unsupportedPublishingWorkflow =
    /\b(?:publish\s+(?:a|the|new)\s+book\s+(?:wizard|tab|section)|publish(?:ing)?\s+(?:tab|section|wizard)|set\s+pricing|pricing\s+setup|cover\s+files|supporting\s+(?:files|materials|documents)|file\s+formats?|upload\s+your\s+content|follow\s+the\s+prompts|(?:you|the system|the dashboard)\s+(?:will\s+)?be\s+prompted|the system will guide|the dashboard will guide|production team will review\s+(?:the\s+)?(?:files|materials|submission)|we(?:'ll|’ll| will)\s+(?:handle|manage|complete|take care of)\s+(?:the\s+)?(?:setup|upload|publishing process)|we(?:'ll|’ll| will)\s+guide you|guide you through\s+(?:the\s+)?(?:upload|setup|publishing|next steps)|direct you to\s+(?:the\s+)?(?:appropriate\s+)?(?:support\s+)?resources)\b/i;

  const unsupportedEmailWorkflow =
    /\b(?:email|emailing)\s+(?:us|bookleaf|our team|the team)\b.{0,100}\b(?:publish|publishing|start|begin|setup|details|process)\b|\b(?:start|begin)\b[^.!?\n]{0,60}\bpublishing process\b[^.!?\n]{0,40}\bby emailing\b/i;

  if (
    isPublishingQuestion &&
    (
      unsupportedPublishingWorkflow.test(draft) ||
      unsupportedEmailWorkflow.test(draft)
    )
  ) {
    issues.push(
      'The draft invents an undocumented publishing workflow or an unsupported assistance commitment.',
    );
  }

  // Do not tell authors to trigger an unsupported distribution re-sync.
  if (DISTRIBUTION_ACTION_PATTERN.test(draft)) {
    issues.push(
      'The draft asks the author to perform an unsupported distribution-sync action.',
    );
  }

  // Do not claim completed actions without supporting facts.
  if (
    COMPLETED_ACTION_PATTERN.test(draft) &&
    !supportsActionClaim(draft, factsText)
  ) {
    issues.push(
      'The draft claims that an action has already occurred without supporting facts.',
    );
  }

  // Do not claim internal work is currently in progress without evidence.
  if (
    IN_PROGRESS_ACTION_PATTERN.test(draft) &&
    !supportsActionClaim(draft, factsText)
  ) {
    issues.push(
      'The draft claims that an internal action is in progress without supporting facts.',
    );
  }

  const hasApprovedFollowUp = APPROVED_FOLLOW_UP.test(draft);

  if (
    UNSUPPORTED_FUTURE_ACTION.test(draft) &&
    !hasApprovedFollowUp
  ) {
    issues.push(
      'The draft promises an unsupported future action or update.',
    );
  }

  if (FIRST_PERSON_PROMISE.test(draft)) {
    issues.push(
      'The draft contains a first-person promise or unsupported follow-up commitment.',
    );
  }

  if (
    hasApprovedFollowUp &&
    !isFollowUpAppropriate(category, ticketText)
  ) {
    issues.push(
      'The 48-hour follow-up commitment is not supported for this ticket type.',
    );
  }

  if (
    HARD_ACTION.test(draft) &&
    /\b(?:I|we|our team|the support team|the production team|the finance team)\b/i.test(
      draft,
    ) &&
    !hasApprovedFollowUp &&
    !supportsActionClaim(draft, factsText) &&
    !/\b(?:may|might|could|would|if needed|if appropriate|whether)\b/i.test(
      draft,
    )
  ) {
    issues.push(
      'The draft may promise an action that is not confirmed by the available facts.',
    );
  }

  if (
    /\b(?:we|our team|the support team)\b[^.!?\n]{0,100}\b(?:escalate|forward|investigate|review)\b/i.test(
      draft,
    ) &&
    !supportsActionClaim(draft, factsText)
  ) {
    issues.push(
      'The draft makes an unverified internal action claim.',
    );
  }
}

  private validateMissingInformationClaims(
    draft: string,
    ticketRecord: Record<string, unknown>,
    derivedFacts: unknown,
    issues: string[],
  ): void {
    const trustedContexts = [
      ticketRecord.authorContext,
      ticketRecord.accountContext,
      ticketRecord.bookContext,
      ticketRecord.author,
      derivedFacts,
    ];

    if (NO_FURTHER_INFO_PATTERN.test(draft) && !hasVerifiedInformationCompleteness(trustedContexts)) {
      issues.push(
        'The draft claims no further information is required, but the supplied data does not confirm that the case is complete.',
      );
    }

    const bankStatus = getBankDetailsStatus(trustedContexts);
    const bankClaimSentences = (draft.match(/[^.!?]+[.!?]?/g) ?? []).filter((sentence) =>
      BANK_DETAILS_ASSERTION_PATTERN.test(sentence),
    );

    const hasUnsupportedBankAssertion = bankClaimSentences.some(
      (sentence) =>
        !BANK_DETAILS_CHECK_REQUEST_PATTERN.test(sentence) && bankStatus !== 'linked',
    );

    if (hasUnsupportedBankAssertion) {
      issues.push(
        'The draft claims that bank details are linked or verified without a confirmed account status.',
      );
    }
  }

  private validateTiming(
  draft: string,
  sourceText: string,
  policyReferenceText: string,
  issues: string[],
): void {
  if (VAGUE_TIMELINE_PATTERN.test(draft)) {
    issues.push(
      'The draft uses a vague timeline that may create an unsupported expectation.',
    );
  }

  if (RESOLUTION_PROMISE_PATTERN.test(draft)) {
    issues.push(
      'The draft promises resolution within 48 hours without verified authorization.',
    );
  }

  if (PAYMENT_DATE_PROMISE_PATTERN.test(draft)) {
    issues.push(
      'The draft promises a payment date without verified payment details.',
    );
  }

  const sourceDateKeys = new Set(
    extractConcreteDates(sourceText).map(dateKey),
  );

  const policyDateKeys = new Set(
    extractConcreteDates(policyReferenceText).map(dateKey),
  );

  const sentences = draft.match(/[^.!?]+[.!?]?/g) ?? [];

  for (const date of extractConcreteDates(draft)) {
    const key = dateKey(date);

    // Dates already present in the ticket or book context remain valid.
    if (sourceDateKeys.has(key)) {
      continue;
    }

    // Policy-reference dates are permitted only in an explicitly
    // identified general-policy sentence.
    const isAuthorizedPolicyDate = sentences.some((sentence) => {
      if (!POLICY_REFERENCE_PREFIX.test(sentence)) {
        return false;
      }

      return extractConcreteDates(sentence).some(
        (sentenceDate) =>
          dateKey(sentenceDate) === key && policyDateKeys.has(key),
      );
    });

    if (!isAuthorizedPolicyDate) {
      issues.push(
        `The draft contains a specific calendar date that is not supported by the ticket or book context, or is not properly identified as a policy reference: "${date}".`,
      );
    }
  }

  for (const sentence of sentences) {
    if (
      DATE_OR_PERIOD_PATTERN.test(sentence) &&
      !POLICY_REFERENCE_PREFIX.test(sentence) &&
      !containsSourceTimeReference(sentence, sourceText)
    ) {
      issues.push(
        'A specific payment-cycle reference must begin with "As a general policy reference," unless it is supplied in the ticket or book context.',
      );

      break;
    }
  }
}
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';

  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return String(value);
  }
}

function extractNumberTokens(value: string): Set<string> {
  const matches = value.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  return new Set(matches.map(normalizeNumberToken));
}

function normalizeNumberToken(value: string): string {
  const numericToken = value.match(/\d[\d,]*(?:\.\d+)?/)?.[0];
  if (!numericToken) return value.toLowerCase().replace(/\s+/g, ' ').trim();

  const normalizedNumber = Number(numericToken.replace(/,/g, ''));
  return Number.isFinite(normalizedNumber)
    ? String(normalizedNumber)
    : numericToken.replace(/,/g, '');
}

function supportsActionClaim(draft: string, factsText: string): boolean {
  if (!factsText.trim()) return false;

  const actionWords = [
    'forward',
    'escalate',
    'investigate',
    'review',
    'verify',
    'correct',
    'approve',
    'process',
    'resolve',
    'release',
    'transfer',
    'initiate',
    'follow up',
  ];

  const draftLower = draft.toLowerCase();
  const factsLower = factsText.toLowerCase();
  return actionWords.some((action) => draftLower.includes(action) && factsLower.includes(action));
}

function isFollowUpAppropriate(category: string, ticketText: string): boolean {
  const supportedCategory =
    category.includes('royalty') || category.includes('isbn') || category.includes('production');

  const supportedSignal =
    ROYALTY_DELAY_SIGNAL.test(ticketText) ||
    ROYALTY_LOW_AMOUNT_SIGNAL.test(ticketText) ||
    ISBN_ERROR_SIGNAL.test(ticketText) ||
    PRODUCTION_DELAY_SIGNAL.test(ticketText);

  return supportedCategory && supportedSignal;
}

function extractConcreteDates(value: string): string[] {
  const patterns = [
    /\b\d{4}-\d{1,2}-\d{1,2}\b/g,
    /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g,
    /\b\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{4}\b/gi,
    /\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/gi,
  ];

  const matches: string[] = [];
  for (const pattern of patterns) {
    matches.push(...(value.match(pattern) ?? []));
  }

  return [...new Set(matches)];
}

function dateKey(rawDate: string): string {
  const date = rawDate.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ');

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(date);
  if (iso) {
    return makeIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3])) ?? `raw:${date}`;
  }

  const dayMonthYear = /^(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})$/.exec(date);
  if (dayMonthYear) {
    const month = monthNumber(dayMonthYear[2]);
    return makeIsoDate(Number(dayMonthYear[3]), month, Number(dayMonthYear[1])) ?? `raw:${date}`;
  }

  const monthDayYear = /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})\s+(\d{4})$/.exec(date);
  if (monthDayYear) {
    const month = monthNumber(monthDayYear[1]);
    return makeIsoDate(Number(monthDayYear[3]), month, Number(monthDayYear[2])) ?? `raw:${date}`;
  }

  // Slash-formatted dates remain raw because the day/month order can vary.
  return `raw:${date.replace(/\b0+(\d)\b/g, '$1')}`;
}

function monthNumber(month: string): number {
  const key = month.toLowerCase().slice(0, 3);
  const months: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };
  return months[key] ?? 0;
}

function makeIsoDate(year: number, month: number, day: number): string | null {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `date:${date.toISOString().slice(0, 10)}`;
}

function containsSourceTimeReference(sentence: string, sourceText: string): boolean {
  const sentenceLower = sentence.toLowerCase();
  const sourceLower = sourceText.toLowerCase();

  const dateMatches = extractConcreteDates(sentence);
  const sourceDates = extractConcreteDates(sourceLower);
  if (
    dateMatches.some((date) =>
      sourceDates.some((sourceDate) => dateKey(sourceDate) === dateKey(date)),
    )
  ) {
    return true;
  }

  const periodMatches = sentenceLower.match(/\b(?:next quarter|upcoming cycle)\b/g) ?? [];
  return periodMatches.some((period) => sourceLower.includes(period));
}

function flattenEntries(
  value: unknown,
  parentPath = '',
): Array<{ key: string; path: string; value: unknown }> {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flattenEntries(item, `${parentPath}[${index}]`));
  }

  if (value === null || typeof value !== 'object') return [];

  const record = value as Record<string, unknown>;
  const result: Array<{ key: string; path: string; value: unknown }> = [];

  for (const [key, child] of Object.entries(record)) {
    const path = parentPath ? `${parentPath}.${key}` : key;
    result.push({ key, path, value: child });
    result.push(...flattenEntries(child, path));
  }

  return result;
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getBankDetailsStatus(contexts: unknown[]): 'linked' | 'missing' | 'unknown' {
  const statuses = new Set<'linked' | 'missing'>();

  for (const context of contexts) {
    for (const entry of flattenEntries(context)) {
      const key = normalizeKey(entry.path);
      const bankRelated = /bank|payoutaccount/.test(key);
      if (!bankRelated) continue;

      const statusField =
        /(?:linked|verified|configured|provided|present|complete|available|status|set)$/.test(key) ||
        /^(?:hasbankdetails|hasbankaccount|bankdetails|bankaccountdetails|payoutbankaccount|payoutbankdetails)$/.test(key);
      if (!statusField) continue;

      const raw = entry.value;
      if (typeof raw === 'boolean') {
        statuses.add(raw ? 'linked' : 'missing');
        continue;
      }

      if (typeof raw === 'string') {
        const value = raw.toLowerCase().trim();
        if (/^(?:linked|verified|configured|provided|present|complete|available|active|true|yes)$/.test(value)) {
          statuses.add('linked');
        } else if (/^(?:missing|not linked|unlinked|not configured|not provided|absent|incomplete|false|no)$/.test(value)) {
          statuses.add('missing');
        }
      }
    }
  }

  if (statuses.size !== 1) return 'unknown';
  return [...statuses][0];
}

function hasVerifiedInformationCompleteness(contexts: unknown[]): boolean {
  for (const context of contexts) {
    for (const entry of flattenEntries(context)) {
      const key = normalizeKey(entry.path);
      const value = entry.value;

      const positiveCompletionFlag = /^(?:nofurtherinformationrequired|noadditionalinformationrequired|allrequiredinformationprovided|supportinformationcomplete|caseinformationcomplete|informationcomplete|requiredinformationcomplete)$/.test(key);
      const negativeNeedFlag = /^(?:additionalinformationrequired|furtherinformationrequired|missinginformation|requiredinformationmissing)$/.test(key);

      if (
        positiveCompletionFlag &&
        (value === true || (typeof value === 'string' && /^(?:true|yes|complete|completed|all provided|none required)$/i.test(value.trim())))
      ) {
        return true;
      }

      if (
        negativeNeedFlag &&
        (value === false || (typeof value === 'string' && /^(?:false|no|none|not required)$/i.test(value.trim())))
      ) {
        return true;
      }
    }
  }

  return false;
}
