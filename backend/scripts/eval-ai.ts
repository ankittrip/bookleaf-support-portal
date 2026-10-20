import 'dotenv/config';

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigService } from '@nestjs/config';

import { buildDerivedFacts } from '../src/modules/ai/shared/derived-facts.js';

import { AiService } from '../src/modules/ai/ai.service.js';
import { LlmClientService } from '../src/modules/ai/providers/llm-client.service.js';
import { TicketClassificationService } from '../src/modules/ai/classification/ticket-classification.service.js';
import { ResponseDraftService } from '../src/modules/ai/drafting/response-draft.service.js';
import { DraftPromptBuilder } from '../src/modules/ai/drafting/draft-prompt.builder.js';
import { DraftValidator } from '../src/modules/ai/drafting/draft-validator.js';
import { FallbackTemplateBuilder } from '../src/modules/ai/drafting/fallback-template.builder.js';
import type {
  TicketClassificationInput,
  TicketDraftInput,
  TicketPriority,
} from '../src/modules/ai/shared/ai.types.js';
import type { BookLeafTicketCategory } from '../src/modules/ai/prompts/bookleaf-knowledge-base.js';
import { keywordClassify } from '../src/modules/ai/classification/ticket-rules.js';

interface ClassificationCase {
  id: string;
  subject: string;
  description: string;
  expectedCategory: BookLeafTicketCategory;
  minPriority: TicketPriority;
  bookTitle?: string;
}

const CASES: ClassificationCase[] = [
  { id: 'ROYALTY-01', subject: 'Royalty not received', description: "I published 4 months ago and still haven't received any royalty.", expectedCategory: 'Royalty & Payments', minPriority: 'High', bookTitle: 'Moonlit Paths' },
  { id: 'ROYALTY-02', subject: 'Royalty amount seems low', description: 'I sold 200 copies but only received INR 3,000. Can I get a line-by-line breakdown?', expectedCategory: 'Royalty & Payments', minPriority: 'Medium' },
  { id: 'ROYALTY-03', subject: 'Below threshold payout', description: 'My dashboard shows ₹850 earned. Will this be deposited to my bank this quarter?', expectedCategory: 'Royalty & Payments', minPriority: 'Medium' },
  { id: 'ROYALTY-04', subject: 'Bank account update for payouts', description: 'I need to change the bank account where my quarterly royalties are sent.', expectedCategory: 'Royalty & Payments', minPriority: 'Medium' },

  { id: 'ISBN-01', subject: 'ISBN mismatch', description: 'My book shows a different ISBN on Amazon than on the physical copy.', expectedCategory: 'ISBN & Metadata Issues', minPriority: 'High' },
  { id: 'ISBN-02', subject: 'Incorrect ISBN metadata', description: 'The ISBN in my book metadata is incorrect and appears duplicated on the online listing.', expectedCategory: 'ISBN & Metadata Issues', minPriority: 'High' },
  { id: 'ISBN-03', subject: 'Own Imprint ISBN', description: 'I want to use my own ISBN under my publishing imprint instead of the BookLeaf assigned one.', expectedCategory: 'ISBN & Metadata Issues', minPriority: 'Medium' },

  { id: 'PRINT-01', subject: 'Blurry pages and misaligned printing', description: 'My author copies have blurry images and several pages are misaligned.', expectedCategory: 'Printing & Quality', minPriority: 'Medium' },
  { id: 'PRINT-02', subject: 'Damaged binding', description: 'The binding is damaged and several pages are printed incorrectly. Can this be reprinted?', expectedCategory: 'Printing & Quality', minPriority: 'Medium' },
  { id: 'PRINT-03', subject: 'Upside down cover', description: 'I ordered 10 copies for an event and the covers are printed upside down!', expectedCategory: 'Printing & Quality', minPriority: 'High' },

  { id: 'DIST-01', subject: 'Amazon listing unavailable', description: 'My book is published but it is showing Currently Unavailable on Amazon.', expectedCategory: 'Distribution & Availability', minPriority: 'Medium' },
  { id: 'DIST-02', subject: 'Book listing not visible', description: 'My title is missing from Flipkart and the stock availability has not updated.', expectedCategory: 'Distribution & Availability', minPriority: 'Medium' },
  { id: 'DIST-03', subject: 'New listing not live yet', description: 'My book finished production 2 days ago but I cannot find it on the BookLeaf Store or Amazon.', expectedCategory: 'Distribution & Availability', minPriority: 'Low' },

  { id: 'PROD-01', subject: 'Book still in typesetting', description: "It's been 3 weeks and my book is still in typesetting. When will it be done?", expectedCategory: 'Book Status & Production Updates', minPriority: 'Medium' },
  { id: 'PROD-02', subject: 'Production status update', description: 'Can you share the current production status? I am waiting for proofreading and cover approval.', expectedCategory: 'Book Status & Production Updates', minPriority: 'Medium' },
  { id: 'PROD-03', subject: 'Cover design delay', description: 'I submitted my manuscript a month ago. How long until I see the first cover design concepts?', expectedCategory: 'Book Status & Production Updates', minPriority: 'Low' },

  { id: 'GENERAL-01', subject: 'Update author bio', description: 'Can I update my author bio?', expectedCategory: 'General Inquiry', minPriority: 'Low' },
  { id: 'GENERAL-02', subject: 'Change book description', description: 'Can I update the description of my book on Amazon after it is already live?', expectedCategory: 'General Inquiry', minPriority: 'Low' },
  { id: 'GENERAL-03', subject: 'Marketing packages', description: 'How do I upgrade from the Standard Free package to the Bestseller Breakthrough package?', expectedCategory: 'General Inquiry', minPriority: 'Low' },
];

const HELD_OUT: ClassificationCase[] = [
  { id: 'HELDOUT-ROYALTY-QUARTERLY', subject: 'Previous quarter payment missing', description: 'The last quarterly royalty payout never arrived, and I need the payment status checked.', expectedCategory: 'Royalty & Payments', minPriority: 'High' },
  { id: 'HELDOUT-ISBN-ONLINE-PRINT', subject: 'Bookstore identifier mismatch', description: 'The ISBN shown on the retailer page does not match the identifier printed inside my book.', expectedCategory: 'ISBN & Metadata Issues', minPriority: 'High' },
  { id: 'HELDOUT-PRINT-COVER', subject: 'Cover is peeling on author copies', description: 'Several copies arrived with peeling cover lamination and damaged binding.', expectedCategory: 'Printing & Quality', minPriority: 'Medium' },
  { id: 'HELDOUT-DIST-RETAILER', subject: 'Retailer cannot order my title', description: 'My book page is visible, but the retailer says the title is unavailable to order.', expectedCategory: 'Distribution & Availability', minPriority: 'Medium' },
  { id: 'HELDOUT-PROD-PROOFREADING', subject: 'Proofreading stage update', description: 'The dashboard still says proofreading and I am waiting to know the current production stage.', expectedCategory: 'Book Status & Production Updates', minPriority: 'Medium' },
  { id: 'HELDOUT-GENERAL-BIO', subject: 'Update my author profile', description: 'I want to change the short biography displayed on my author profile.', expectedCategory: 'General Inquiry', minPriority: 'Low' },
];

const PRIORITY_RANK: Record<TicketPriority, number> = {
  Low: 0,
  Medium: 1,
  High: 2,
  Critical: 3,
};

interface RuleTest {
  id: string;
  text: string;
  expectedCategory: BookLeafTicketCategory;
  minPriority: TicketPriority;
}

const RULE_TESTS: RuleTest[] = [
  { id: 'RULE-ISBN-HIGH', text: 'My book has a different ISBN on Amazon than the printed copy.', expectedCategory: 'ISBN & Metadata Issues', minPriority: 'High' },
  { id: 'RULE-ROYALTY-HIGH', text: "I haven't received any royalty for 4 months.", expectedCategory: 'Royalty & Payments', minPriority: 'High' },
  { id: 'RULE-ROYALTY-BREAKDOWN', text: 'Can I get a breakdown of my 80% net profit?', expectedCategory: 'Royalty & Payments', minPriority: 'Medium' },
  { id: 'RULE-GENERAL-LOW', text: 'Can I update my author bio?', expectedCategory: 'General Inquiry', minPriority: 'Low' },
  { id: 'RULE-METADATA-EDIT-GENERAL', text: 'Can I update the description of my book on Amazon after it is live?', expectedCategory: 'General Inquiry', minPriority: 'Low' },
  { id: 'RULE-LEGAL-CRITICAL', text: 'I am reporting fraud and will contact a lawyer.', expectedCategory: 'General Inquiry', minPriority: 'Critical' },
  { id: 'RULE-PRINT-MEDIUM', text: 'My author copies have blurry pages.', expectedCategory: 'Printing & Quality', minPriority: 'Medium' },
  { id: 'RULE-DIST-MEDIUM', text: 'My published book is unavailable on Amazon.', expectedCategory: 'Distribution & Availability', minPriority: 'Medium' },
  { id: 'RULE-PROD-MEDIUM', text: 'Please share my book production status.', expectedCategory: 'Book Status & Production Updates', minPriority: 'Medium' },
];

interface DraftSignal {
  label: string;
  pattern: RegExp;
}

interface DraftCase {
  id: string;
  ticket: TicketDraftInput;
  policySignals: DraftSignal[];
  requiredFactSignals?: DraftSignal[];
  forbiddenSignals?: DraftSignal[];
}

const TURBAN_TALES_BOOK_CONTEXT: Record<string, unknown> = {
  title: 'Turban Tales',
  totalCopiesSold: 88,
  totalRoyaltyEarned: 2464,
  royaltyPaid: 0,
  royaltyPending: 2464,
};

const NAGPUR_NOTEBOOKS_CONTEXT: Record<string, unknown> = { 
  title: 'The Nagpur Notebooks', 
  totalCopiesSold: 34, 
  totalRoyaltyEarned: 850, 
  royaltyPaid: 0, 
  royaltyPending: 850 
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&');
}

function normalizeForChecks(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

const TURBAN_TALES_DERIVED_FACTS = buildDerivedFacts(TURBAN_TALES_BOOK_CONTEXT);

const DRAFT_CASES: DraftCase[] = [
  {
    id: 'DRAFT-ROYALTY-TURBAN-TALES',
    ticket: {
      subject: 'Royalty pending for Turban Tales',
      description: "I have not received my royalty. Please explain the pending balance and payment timing.",
      category: 'Royalty & Payments',
      priority: 'High',
      authorName: 'Arjun Malhotra',
      bookContext: TURBAN_TALES_BOOK_CONTEXT,
    },
    policySignals: [
      { label: 'quarterly royalty policy', pattern: /quarter/i },
      { label: '45-day payment window', pattern: /45\s*days/i },
    ],
    requiredFactSignals: [
      { label: 'correct book title', pattern: /Turban\s+Tales/i },
      { label: 'INR 2,464 amount', pattern: /(?:₹\s*|INR\s*)?2,?464(?:\.00)?/i },
      {
        label: 'amount described as pending',
        pattern: /(?:pending|outstanding|unpaid).{0,60}(?:₹\s*|INR\s*)?2,?464|(?:₹\s*|INR\s*)?2,?464.{0,80}(?:pending|outstanding|unpaid|none has been paid|has not been paid|not yet paid)/i,
      },
      {
        label: 'pending balance compared against payout threshold',
        pattern: /\b(?:pending|outstanding|unpaid)\b[^.!?\n]{0,120}\b(?:above|over|exceeds?|exceeding|greater than|higher than|at least|surpasses?)\b[^.!?\n]{0,80}\b(?:that\s+)?(?:minimum\s+)?(?:payout\s+)?threshold\b|\b(?:balance|amount)\b[^.!?\n]{0,100}\b(?:above|over|exceeds?|exceeding|greater than|higher than|at least|surpasses?)\b[^.!?\n]{0,80}\b(?:that\s+)?(?:minimum\s+)?(?:payout\s+)?threshold\b/i,
      },
    ],
    forbiddenSignals: [
      { label: 'no unsupported meets-requirement phrasing', pattern: /meets (?:the )?requirement/i },
      { label: 'no instruction to check the statement', pattern: /please check (?:the )?statement/i },
      {
        label: 'no unsupported payout eligibility or due-date claim',
        pattern: /\b(?:eligible\s+for\s+(?:payment|payout)|qualif(?:y|ies|ied)\s+for\s+(?:payment|a\s+payout)|payout\s+is\s+due|eligible\b[^.!?\n]{0,80}\b(?:upcoming|next)\s+(?:payout|payment)\s+cycle)\b/i,
      },
    ],
  },
  {
    id: 'DRAFT-ROYALTY-BELOW-THRESHOLD',
    ticket: { 
      subject: 'Royalty payout for The Nagpur Notebooks', 
      description: "When will my ₹850 royalty be deposited?", 
      category: 'Royalty & Payments', 
      priority: 'Medium', 
      authorName: 'Kavita Deshmukh', 
      bookContext: NAGPUR_NOTEBOOKS_CONTEXT 
    },
    policySignals: [
      { label: 'minimum payout threshold policy', pattern: /₹?1,?000|threshold/i },
      { label: 'mentions rollover to next quarter', pattern: /roll\s*over|next quarter/i },
    ],
    requiredFactSignals: [
      { label: 'correct book title', pattern: /The\s+Nagpur\s+Notebooks/i },
      { label: 'INR 850 amount', pattern: /(?:₹\s*|INR\s*)?850(?:\.00)?/i },
    ],
    forbiddenSignals: [
      { label: 'must not promise immediate payment', pattern: /\b(?:payout\s+is\s+due|will\s+be\s+paid\s+within)\b/i },
    ]
  },
  {
    id: 'DRAFT-ISBN-MISMATCH',
    ticket: {
      subject: 'Different ISBN online and on printed copy',
      description: 'My book shows a different ISBN on Amazon than the physical copy.',
      category: 'ISBN & Metadata Issues',
      priority: 'High',
      authorName: 'Rohan Mehta',
    },
    policySignals: [
      { label: 'mentions ISBN', pattern: /\bISBN\b/i },
      { label: 'high priority or production team', pattern: /high priority|production team/i },
      { label: '48 hour resolution timeline', pattern: /48\s*hours/i },
    ],
  },
  {
    id: 'DRAFT-PRINTING-QUALITY',
    ticket: {
      subject: 'Blurry images and misaligned pages',
      description: 'My author copies have terrible print quality, blurry images and misaligned pages.',
      category: 'Printing & Quality',
      priority: 'Medium',
      authorName: 'Ritika Sharma',
    },
    policySignals: [
      { label: 'requests photos', pattern: /photos?|pictures?/i },
      { label: 'mentions reprint', pattern: /reprint/i },
      { label: '5–7 business day turnaround', pattern: /5\s*[-–—]\s*7\s+business days/i },
    ],
  },
  {
    id: 'DRAFT-DISTRIBUTION-UNAVAILABLE',
    ticket: {
      subject: 'Amazon listing currently unavailable',
      description: 'My published book is showing Currently Unavailable on Amazon.',
      category: 'Distribution & Availability',
      priority: 'Medium',
      authorName: 'Neha Joshi',
    },
    policySignals: [
      {
        label: 'explains stock synchronization',
        pattern: /stock[\s-]?sync|stock synchroni[sz]ation|(?:distribution|inventory|stock).{0,80}\bout of sync\b/i,
      },
      { label: '24–48-hour typical timeframe', pattern: /24\s*[-–—]\s*48\s+hours/i },
    ],
    forbiddenSignals: [
      {
        label: 'no unsupported promise to contact Amazon',
        pattern: /\b(?:we|our team|the support team)\s+(?:will|shall|are going to)\b[^.!?\n]{0,100}\b(?:contact(?:ing)?|reach out to)\b[^.!?\n]{0,80}\b(?:amazon|retailer|platform)\b/i,
      },
      {
        label: 'does not tell authors to initiate re-sync',
        pattern: /\b(?:you|authors?)\s+(?:can|may|could|should|will)\b[^.!?\n]{0,120}\b(?:trigger|initiate|perform|run|request)\b[^.!?\n]{0,60}\b(?:re[\s-]?sync|resync|stock[\s-]?sync)\b/i,
      },
    ],
  },
  {
    id: 'DRAFT-DISTRIBUTION-NEW-LISTING',
    ticket: { 
      subject: 'Not visible on Flipkart yet', 
      description: 'My publication finished yesterday but I cannot find it on Flipkart.', 
      category: 'Distribution & Availability', 
      priority: 'Low', 
      authorName: 'Vikram Joshi' 
    },
    policySignals: [
      { label: '7-10 business day timeline', pattern: /7\s*[-–—]\s*10\s+business days/i },
    ],
  }
];

const FIRST_PERSON_PROMISE =
  /\bI(?:'ll|\s+will|\s+shall|\s+am going to)\b[^.!?\n]{0,120}\b(?:personally|follow up|get back to you|update you|ensure|make sure)\b|\blet (?:me|us) know once you\b/i;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function percent(numerator: number, denominator: number): string {
  return denominator === 0 ? 'N/A' : `${((numerator / denominator) * 100).toFixed(1)}%`;
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const draftsOnly = args.has('--drafts-only');
  const heldOutOnly = args.has('--heldout');
  const includeDrafts = args.has('--drafts') || draftsOnly;
  
  const runClassification = !draftsOnly;
  const selectedCases = heldOutOnly ? HELD_OUT : CASES;
  const configService = new ConfigService();
  const llmClient = new LlmClientService(configService);
  const classificationService = new TicketClassificationService(llmClient);
  const draftingService = new ResponseDraftService(
    llmClient,
    new DraftPromptBuilder(),
    new DraftValidator(),
    new FallbackTemplateBuilder(),
  );
  const aiService = new AiService(
    llmClient,
    classificationService,
    draftingService,
  );
  const aiAvailable = aiService.isAvailable();
  const report: Record<string, unknown> = {
    createdAt: new Date().toISOString(),
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
    aiAvailable,
    classification: null,
    ruleFallback: null,
    draftEvaluation: null,
    classificationDataset: heldOutOnly ? 'held-out' : 'main',
  };

  console.log('\nBookLeaf AI evaluation');
  console.log(`Model: ${String(report.model)}`);
  console.log(`AI configured: ${aiAvailable ? 'yes' : 'no'}`);

  const fallbackResults = RULE_TESTS.map((test) => {
    const result = keywordClassify(test.text);
    const categoryCorrect = result.category === test.expectedCategory;
    const priorityMeetsMinimum =
      PRIORITY_RANK[result.priority] >= PRIORITY_RANK[test.minPriority];
    const passed = categoryCorrect && priorityMeetsMinimum;
    console.log(
      `${passed ? 'PASS' : 'FAIL'} ${test.id}: ${result.category} / ${result.priority}; expected ${test.expectedCategory} / at least ${test.minPriority}`,
    );
    return {
      ...test,
      actualCategory: result.category,
      actualPriority: result.priority,
      categoryCorrect,
      priorityMeetsMinimum,
      passed,
    };
  });
  const fallbackPassed = fallbackResults.filter((r) => r.passed).length;
  report.ruleFallback = {
    total: fallbackResults.length,
    passed: fallbackPassed,
    accuracy: percent(fallbackResults.filter((r) => r.categoryCorrect).length, fallbackResults.length),
    priorityMinimumPassRate: percent(fallbackResults.filter((r) => r.priorityMeetsMinimum).length, fallbackResults.length),
    cases: fallbackResults,
  };
  console.log(`Rule fallback: ${fallbackPassed}/${fallbackResults.length} passed`);

  let classificationHadFailures = false;
  if (aiAvailable && runClassification) {
    console.log(`\nTicket classification cases (${selectedCases.length}; dataset=${heldOutOnly ? 'held-out' : 'main'}; AI category + deterministic priority floors)`);
    const classificationResults = [];

    for (const test of selectedCases) {
      const input: TicketClassificationInput = {
        subject: test.subject,
        description: test.description,
        ...(test.bookTitle ? { bookTitle: test.bookTitle } : {}),
      };
      const result = await aiService.classifyTicket(input);
      const categoryCorrect = result?.category === test.expectedCategory;
      const priorityMeetsMinimum = result
        ? PRIORITY_RANK[result.priority] >= PRIORITY_RANK[test.minPriority]
        : false;
      const classifiedPassed = Boolean(result) && categoryCorrect && priorityMeetsMinimum;
      const fallbackUsed = result === null;
      const fallbackResult = fallbackUsed
        ? keywordClassify(`${input.subject} ${input.description}`)
        : null;
      const effective = result ?? fallbackResult;
      const effectiveCategoryCorrect = effective?.category === test.expectedCategory;
      const effectivePriorityMeetsMinimum = effective
        ? PRIORITY_RANK[effective.priority] >= PRIORITY_RANK[test.minPriority]
        : false;
      const effectivePassed = Boolean(effective) && effectiveCategoryCorrect && effectivePriorityMeetsMinimum;

      if (!classifiedPassed || !effectivePassed) classificationHadFailures = true;
      console.log(
        `${effectivePassed ? 'PASS' : 'FAIL'} ${test.id}: classified=${result?.category ?? 'NO RESULT'} / ${result?.priority ?? 'NO PRIORITY'}${fallbackUsed ? `; keyword fallback=${effective?.category ?? 'NO RESULT'} / ${effective?.priority ?? 'NO PRIORITY'}` : ''}; expected ${test.expectedCategory} / min ${test.minPriority}`,
      );
      classificationResults.push({
        id: test.id,
        input,
        expectedCategory: test.expectedCategory,
        minPriority: test.minPriority,
        actualCategory: result?.category ?? null,
        actualPriority: result?.priority ?? null,
        reasoning: result?.reasoning ?? null,
        categoryCorrect: Boolean(categoryCorrect),
        priorityMeetsMinimumAfterRules: priorityMeetsMinimum,
        classifiedPassed,
        fallbackUsed,
        effectiveCategory: effective?.category ?? null,
        effectivePriority: effective?.priority ?? null,
        effectiveCategoryCorrect: Boolean(effectiveCategoryCorrect),
        effectivePriorityMeetsMinimum,
        effectivePassed,
      });
    }

    const categoryCorrectCount = classificationResults.filter((r) => r.categoryCorrect).length;
    const priorityFloorPassCount = classificationResults.filter((r) => r.priorityMeetsMinimumAfterRules).length;
    const classifiedPassedCount = classificationResults.filter((r) => r.classifiedPassed).length;
    const effectivePassedCount = classificationResults.filter((r) => r.effectivePassed).length;
    const fallbackUsedCount = classificationResults.filter((r) => r.fallbackUsed).length;
    report.classification = {
      total: selectedCases.length,
      classifierSucceeded: selectedCases.length - fallbackUsedCount,
      classifierSuccessRate: percent(selectedCases.length - fallbackUsedCount, selectedCases.length),
      categoryCorrect: categoryCorrectCount,
      categoryAccuracy: percent(categoryCorrectCount, selectedCases.length),
      priorityMinimumSatisfiedAfterRules: priorityFloorPassCount,
      priorityMinimumPassRateAfterRules: percent(priorityFloorPassCount, selectedCases.length),
      casesFullyPassedAfterRules: classifiedPassedCount,
      fallbackUsed: fallbackUsedCount,
      fallbackAssistedCasesFullyPassed: effectivePassedCount,
      fallbackAssistedPassRate: percent(effectivePassedCount, selectedCases.length),
      cases: classificationResults,
    };
    console.log(`Category accuracy: ${categoryCorrectCount}/${selectedCases.length} (${percent(categoryCorrectCount, selectedCases.length)})`);
    console.log(`Priority minimum after deterministic rules: ${priorityFloorPassCount}/${selectedCases.length} (${percent(priorityFloorPassCount, selectedCases.length)})`);
    console.log(`Classified cases meeting both checks: ${classifiedPassedCount}/${selectedCases.length}`);
    console.log(`Null-result keyword fallbacks used: ${fallbackUsedCount}/${selectedCases.length}`);
    console.log(`Final pipeline cases meeting both checks: ${effectivePassedCount}/${selectedCases.length} (${percent(effectivePassedCount, selectedCases.length)})`);
  } else if (runClassification) {
    console.warn('\nSKIP classification: GROQ_API_KEY is missing. Load your backend .env file and rerun to measure classification.');
  } else {
    console.log('\nClassification skipped (--drafts-only).');
  }

  if (includeDrafts) {
    console.log(`\nDraft quality checks (${DRAFT_CASES.length} sample knowledge-base scenarios)`);
    const draftResults = [];

    for (let draftIndex = 0; draftIndex < DRAFT_CASES.length; draftIndex += 1) {
      const test = DRAFT_CASES[draftIndex];
      const result = await aiService.generateResponseDraft(test.ticket);
      const text = result.text;
      const normalizedText = normalizeForChecks(text);
      const expectedFirstName =
        (test.ticket.authorName ?? 'Author').trim().split(/\s+/)[0] || 'Author';

      const commonChecks = [
        {
          label: 'expected author greeting',
          passed: normalizedText.startsWith(`Dear ${expectedFirstName},`),
        },
        {
          label: 'no placeholders',
          passed: !(/\[[^\]]+\]|\{\{|<[A-Za-z ]+>/.test(normalizedText)),
        },
        {
          label: 'no admin-facing text',
          passed: !(/\b(?:admin|administrator|this draft|review this)\b/i.test(normalizedText)),
        },
        {
          label: 'no first-person follow-up promise',
          passed: !FIRST_PERSON_PROMISE.test(normalizedText),
        },
        {
          label: 'complete final sentence',
          passed: /[.!?]["'’”)}\]]?\s*\$/.test(normalizedText),
        },
      ];

      const policySignals = test.policySignals.map((signal) => ({
        label: signal.label,
        passed: signal.pattern.test(normalizedText),
      }));
      const factSignals = (test.requiredFactSignals ?? []).map((signal) => ({
        label: signal.label,
        passed: signal.pattern.test(normalizedText),
      }));
      const forbiddenSignals = (test.forbiddenSignals ?? []).map((signal) => ({
        label: signal.label,
        passed: !signal.pattern.test(normalizedText),
      }));

      const referenceDates = test.id === 'DRAFT-ROYALTY-TURBAN-TALES'
        ? [
            TURBAN_TALES_DERIVED_FACTS.policyReference.lastEndedQuarterEnd,
            TURBAN_TALES_DERIVED_FACTS.policyReference.policyPayByDate,
          ]
        : [];
      const referenceDateSentences = normalizedText
        .split(/(?<=[.!?])\s+/)
        .filter((sentence) =>
          referenceDates.some((date) =>
            sentence.toLocaleLowerCase().includes(date.toLocaleLowerCase()),
          ),
        );
      const optionalPolicyDateChecks = referenceDates.length > 0
        ? [{
            label: 'policy dates omitted or safely framed as a general policy reference',
            passed:
              referenceDateSentences.length === 0 ||
              (referenceDateSentences.length === 1 &&
                /^As a general policy reference,/i.test(referenceDateSentences[0]) &&
                referenceDates.every((date) =>
                  !normalizedText.toLocaleLowerCase().includes(date.toLocaleLowerCase()) ||
                  referenceDateSentences[0].toLocaleLowerCase().includes(date.toLocaleLowerCase()),
                )),
          }]
        : [];

      const policyPass = policySignals.every((signal) => signal.passed);
      const factPass = factSignals.every((signal) => signal.passed);
      const forbiddenPass = forbiddenSignals.every((signal) => signal.passed);
      const commonPass = commonChecks.every((signal) => signal.passed);
      const optionalDatePass = optionalPolicyDateChecks.every((signal) => signal.passed);
      
      const passed = commonPass && policyPass && factPass && forbiddenPass && optionalDatePass;

      if (!passed) classificationHadFailures = true;
      
      console.log({
        id: test.id,
        source: result.source,
        passed,
        commonFailures: commonChecks
          .filter((item) => !item.passed)
          .map((item) => item.label),
        policyFailures: policySignals
          .filter((item) => !item.passed)
          .map((item) => item.label),
        factFailures: factSignals
          .filter((item) => !item.passed)
          .map((item) => item.label),
        forbiddenFailures: forbiddenSignals
          .filter((item) => !item.passed)
          .map((item) => item.label),
        dateFailures: optionalPolicyDateChecks
          .filter((item) => !item.passed)
          .map((item) => item.label),
      });

      if (!passed) {
        console.error(
          `\n--- FAILED DRAFT TEXT: ${test.id} (source=${result.source}) ---\n${text}\n--- END FAILED DRAFT TEXT ---\n`,
        );
      }

      draftResults.push({
        id: test.id,
        source: result.source,
        warning: result.warning ?? null,
        commonChecks,
        policySignals,
        factSignals,
        forbiddenSignals,
        optionalPolicyDateChecks,
        passed,
        text,
      });

      if (aiAvailable && draftIndex < DRAFT_CASES.length - 1) {
        console.log('Waiting 60 seconds before the next draft check to reduce TPM pressure...');
        await sleep(65_000);
      }
    }

    const draftPassedCount = draftResults.filter((r) => r.passed).length;
    const aiDraftCount = draftResults.filter((r) => r.source === 'ai').length;
    const templateDraftCount = draftResults.filter((r) => r.source === 'template').length;
    report.draftEvaluation = {
      total: DRAFT_CASES.length,
      passed: draftPassedCount,
      passRate: percent(draftPassedCount, DRAFT_CASES.length),
      aiDraftCount,
      templateDraftCount,
      aiDraftRate: percent(aiDraftCount, DRAFT_CASES.length),
      note: 'Policy-signal smoke checks, not an exact or semantic comparison against reference answers. Verified supplied book facts are required. Policy-reference dates are optional; if included, they must appear only in one sentence beginning As a general policy reference.',
      cases: draftResults,
    };
    console.log(`Draft signal checks: ${draftPassedCount}/${DRAFT_CASES.length} (${percent(draftPassedCount, DRAFT_CASES.length)})`);
    console.log(`AI-generated drafts: ${aiDraftCount}/${DRAFT_CASES.length}; template fallbacks: ${templateDraftCount}/${DRAFT_CASES.length}`);
  } else {
    console.log('\nTip: add --drafts for response-draft checks; use --drafts-only to skip classification; use --heldout to evaluate the separate held-out classification set.');
  }

  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const reportPath = resolve(scriptDir, '../reports/ai-eval-results.json');
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`\nSaved machine-readable report: ${reportPath}`);

  if ((!aiAvailable && runClassification) || classificationHadFailures || fallbackPassed !== RULE_TESTS.length) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error('AI evaluation crashed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
});