
import type { BookLeafTicketCategory } from '../prompts/bookleaf-knowledge-base.js';

export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';

const RANK: Record<Priority, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Critical: 3,
};

function maxPriority(a: Priority, b: Priority): Priority {
  return RANK[a] >= RANK[b] ? a : b;
}

export function applyPriorityFloor(
  category: BookLeafTicketCategory,
  text: string,
  aiPriority: Priority,
): Priority {
  const t = text.toLowerCase();

  let floor: Priority =
    category === 'General Inquiry' ? 'Low' : 'Medium';

  // Incorrect, discrepant, or mismatched ISBN information requires High.
  if (
    category === 'ISBN & Metadata Issues' &&
    /\b(?:duplicate|wrong|different|mismatch|incorrect|discrepanc(?:y|ies)|error)\b/i.test(t)
  ) {
    floor = maxPriority(floor, 'High');
  }

  // Delayed or unreceived royalties require High priority.
  if (category === 'Royalty & Payments') {
    const months = /\b(\d+)\s*\+?\s*months?\b/i.exec(t);
    const longWait = months !== null && Number(months[1]) >= 3;

    if (
      longWait ||
      /\b(?:not received|haven't received|have not received|no royalty|overdue|still waiting|pending)\b/i.test(t)
    ) {
      floor = maxPriority(floor, 'High');
    }
  }

  // High-impact printing defects require High priority.
  if (
    category === 'Printing & Quality' &&
    /\b(?:upside[- ]down|misprinted|wrong cover|incorrectly printed)\b/i.test(t) &&
    /\b(?:event|launch|deadline|ordered\s+\d+|bulk)\b/i.test(t)
  ) {
    floor = maxPriority(floor, 'High');
  }

  // Serious legal, fraud, or consumer-escalation language requires Critical.
  if (
    /\b(?:legal|lawyer|court|fraud|scam|consumer forum)\b|\brefund all\b/i.test(t)
  ) {
    floor = 'Critical';
  }

  // Never let AI priority fall below the deterministic priority floor.
  return maxPriority(aiPriority, floor);
}

export function keywordClassify(text: string): {
  category: BookLeafTicketCategory;
  priority: Priority;
} {
  const t = text.toLowerCase();
  let category: BookLeafTicketCategory = 'General Inquiry';

  // Explicitly include royalty net-profit breakdown questions.
  if (
    /\b(?:royalt\w*|payout|payment|bank|threshold|80\s*%\s*(?:of\s+)?net\s+profit|net\s+profit\s+breakdown)\b/i.test(t) ||
    /\b(?:royalt\w*|net\s+profit)\b.{0,50}\bbreakdown\b/i.test(t) ||
    /\bbreakdown\b.{0,50}\b(?:royalt\w*|net\s+profit)\b/i.test(t)
  ) {
    category = 'Royalty & Payments';
  } else if (/\bisbn\b|metadata/i.test(t)) {
    category = 'ISBN & Metadata Issues';
  } else if (/(print|blurry|binding|misprint|quality|reprint)/i.test(t)) {
    category = 'Printing & Quality';
  } else if (
    /\b(?:update|change|edit|revise|correct)\b.{0,100}\b(?:author bio|author biography|book description|description|author profile|profile details)\b/i.test(t)
  ) {
    category = 'General Inquiry';
  } else if (/(unavailable|amazon|flipkart|listing|not showing|stock)/i.test(t)) {
    category = 'Distribution & Availability';
  } else if (/(status|typesetting|proofread|cover design|production|how long)/i.test(t)) {
    category = 'Book Status & Production Updates';
  }

  const baseline: Priority =
    category === 'General Inquiry' ? 'Low' : 'Medium';

  return {
    category,
    priority: applyPriorityFloor(category, t, baseline),
  };
}
