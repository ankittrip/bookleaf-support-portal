
/**
 * Shared configuration and validation signals
 * for the BookLeaf AI module.
 */

export const CLASSIFY_MAX_OUTPUT_TOKENS = 400;

export const DRAFT_MAX_OUTPUT_TOKENS = [
  700,
  1100,
] as const;

export const RATE_LIMIT_WAIT_MS = 3000;

/**
 * A documented follow-up commitment.
 * This promises an update, not a resolution or payment.
 */
export const APPROVED_FOLLOW_UP =
  /\b(?:our team|the support team|the production team|the finance team|the distribution team)\s+will\s+[^.!?\n]{0,200}?\b(?:get back to you|update you|share[^.!?\n]{0,40}with you)\b[^.!?\n]{0,40}\bwithin\s+(?:the\s+next\s+)?48\s+hours\b/i;

/**
 * Actions that require workflow evidence.
 */
export const HARD_ACTION =
  /\b(?:forward|escalate|contact(?:ing)?|reach out to|open(?:ing)?(?: a)? case|trigger|initiate|process|approve|release|transfer|pay)\b/i;

export const UNSUPPORTED_FUTURE_ACTION =
  /\b(?:I|we|our team|the support team|the production team|the finance team|the distribution team)(?:['’]ll|\s+(?:will|shall|am going to|are going to|is going to))\b[^.!?\n]{0,120}\b(?:forward|escalate|investigate|review|verify|check|confirm|update|share|provide|get back|contact(?:ing)?|reach out to|open(?:ing)?(?: a)? case|trigger|initiate|process|approve|release|transfer|pay)\b/i;

/**
 * Words used to detect hedged or uncertain statements.
 */
export const HEDGE_WORDS =
  /\b(?:whether|if|not|unless|cannot|nor|unable|unclear)\b|n['’]t\b/i;

/**
 * Ticket-content signals.
 */
export const ROYALTY_DELAY_SIGNAL =
  /\b(?:not received|haven['’]t received|have not received|no royalty|pending|overdue|delay(?:ed)?|still waiting|not (?:been )?paid|payment status|payout status|payment timeline|when (?:will|might|can) I receive|\d+\s+months?)\b/i;

export const ROYALTY_LOW_AMOUNT_SIGNAL =
  /\b(?:too low|seems low|only received|less than expected|how is royalty calculated|net profit|80\s*\/\s*20|per copy calculation|line[- ]by[- ]line|breakdown)\b/i;

export const ISBN_ERROR_SIGNAL =
  /\b(?:different|wrong|incorrect|duplicated?|mismatch(?:ed)?|discrepanc(?:y|ies)|correction|not matching|doesn['’]t match|does not match|error)\b/i;

export const PRODUCTION_DELAY_SIGNAL =
  /\b(?:\d+\s+(?:days?|weeks?|months?)|delay(?:ed)?|stuck|no update|taking (?:too )?long|how long|when will)\b/i;

/**
 * Reject unsupported first-person promises in author-facing replies.
 */
export const FIRST_PERSON_PROMISE =
  /\bI(?:['’]ll|\s+will|\s+shall|\s+am going to)\b[^.!?\n]{0,120}\b(?:personally|follow up|get back to you|update you|ensure|make sure)\b|\blet (?:me|us) know once you\b/i;
