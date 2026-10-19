import type { BookLeafTicketCategory } from './bookleaf-knowledge-base.js';

const EXAMPLE_RULES = `
EXAMPLE RULES
- Use examples for tone, structure and policy only.
- Never copy names, book titles, amounts or dates from examples.
- Use facts supplied for the current ticket.
- Never output placeholders or angle brackets.
- Write only to the author, never to the admin.
- Do not include internal notes or explanations of validation rules.
- Structure: greeting, blank line, then two short body paragraphs
  separated by one blank line.
`.trim();

const GENERAL_INQUIRY_METADATA_EXAMPLE = `
EXAMPLE (General Inquiry: description update)

Ticket:
"Can I update the description of my book on Amazon after it is live?"

Reply:
Dear Sameer,

Yes, you can update your book description after the book has gone live.
Description and metadata changes can be submitted through your author
dashboard or by emailing the BookLeaf team.

Once a change has been submitted, it typically reflects on platforms
within 3-5 business days. To get started, submit the revised description
through the dashboard or email it to the team.
`.trim();

const GENERAL_INQUIRY_PAPER_OPTIONS_EXAMPLE = `
EXAMPLE (General Inquiry: paper options not specified)

Ticket:
"Tell me about the different paper options you provide for printing."

Reply:
Dear Arjun,

Thank you for asking about the paper options available for printing your
book. BookLeaf has an in-house printing facility and works with print
partners, including Repro India and Epitome Books.

The available information does not specify the paper grades, GSM values,
weights, or finishes offered for each book format. These details need to
be verified before a particular paper option can be accurately recommended.
`.trim();

export const CATEGORY_EXAMPLES: Record<BookLeafTicketCategory, string> = {
  'Royalty & Payments': `
EXAMPLE 1 (Royalty & Payments: royalty pending or not received)

Ticket:
"I published my book 4 months ago and still haven't received any royalty."

Data:
title Moonlit Paths, totalRoyaltyEarned 1800, royaltyPaid 0,
royaltyPending 1800.

Reply:
Dear Meera,

I understand how frustrating it is to wait on royalties without a clear
picture, and I am sorry for the uncertainty. For Moonlit Paths, your
dashboard shows INR 1,800 earned, INR 0 recorded as paid, and INR 1,800
pending.

BookLeaf calculates royalties quarterly and pays within 45 days after
each quarter ends, with a minimum payout threshold of INR 1,000. Your
records do not show which quarter this balance belongs to, so our team
will verify your royalty statement and payment status and get back to
you within 48 hours.

EXAMPLE 2 (Royalty & Payments: amount seems low)

Ticket:
"My royalty amount seems too low. I sold 200 copies but only received
INR 3,000."

Reply:
Dear Karan,

I understand why those figures feel low, and I would like to make the
calculation clear. BookLeaf pays authors 80% of net profit, and net
profit is the MRP minus printing cost, platform commission and shipping
charges.

Because those deductions come off every copy sold, the amount received
is not simply copies sold multiplied by the MRP. If you would like a
line-by-line breakdown for this book, reply here and we can share it
with you. A breakdown by sales platform is also available in your
dashboard.
`.trim(),

  'ISBN & Metadata Issues': `
EXAMPLE (ISBN & Metadata Issues: ISBN mismatch)

Ticket:
"My book shows a different ISBN on Amazon than on the physical copy."

Reply:
Dear Vivek,

A discrepancy between the ISBN on the listing and the one assigned to
your book is a serious data issue, and I am sorry for the worry it has
caused. We treat ISBN discrepancies as high priority.

This needs to be referred to our production team for verification, and
our team will verify the ISBN details and get back to you within
48 hours. To help them check the right record, please reply with the
ISBN printed on your copy and the one shown on the listing.
`.trim(),

  'Printing & Quality': `
EXAMPLE (Printing & Quality: print defect)

Ticket:
"My author copies have blurry images and misaligned pages."

Reply:
Dear Isha,

I am sorry your author copies arrived with blurry images and misaligned
pages. That is not the quality we want you to receive, and I understand
how disappointing it is.

Please reply with clear photos of the affected pages. Once we verify
the defect, BookLeaf arranges a free reprint, with a standard turnaround
of 5-7 business days from order confirmation.
`.trim(),

  'Distribution & Availability': `
EXAMPLE (Distribution & Availability: listing unavailable)

Ticket:
"My published book is showing Currently Unavailable on Amazon."

Reply:
Dear Aman,

I understand how worrying it is to see your published book marked
Currently Unavailable on Amazon. This usually points to a stock sync
issue.

Our distribution team can assess whether a re-sync is needed, and a
re-sync typically takes 24-48 hours to take effect. Please reply with
the listing URL or a screenshot so the team has the exact page to check.
`.trim(),

  'Book Status & Production Updates': `
EXAMPLE 1 (Book Status: delay reported)

Ticket:
"It has been 3 weeks and my book is still in typesetting. When will it
be done?"

Data:
status "In Production - Typesetting".

Reply:
Dear Kavita,

I understand your concern about the time your book has spent in
typesetting, and I am sorry you do not yet have a clear estimate.
Your book is currently recorded as In Production - Typesetting.

We do not have a confirmed completion date to share yet, so our team
will check the current stage and get back to you within 48 hours. After
typesetting, the book moves on to proofreading, ISBN assignment,
printing and distribution setup.

EXAMPLE 2 (Book Status: plain status request)

Ticket:
"Can you share the current production status of my book?"

Data:
status "Cover Design".

Reply:
Dear Tanvi,

Your book is currently recorded at the Cover Design stage. The stages
after it are typesetting, proofreading, ISBN assignment, printing and
distribution setup.

We do not have a confirmed completion date for this book, so I would
rather not guess at one. If you tell us which step you are waiting on,
we can look at that specific item.
`.trim(),

  'General Inquiry': GENERAL_INQUIRY_METADATA_EXAMPLE,
};

/**
 * Returns shared example rules and examples from one category only.
 *
 * This function selects by category, not by the specific ticket intent.
 * Use getExamplesForTicket() when subject and description are available.
 */
export function getExamplesForCategory(
  category: BookLeafTicketCategory,
): string {
  return `${EXAMPLE_RULES}\n\n${CATEGORY_EXAMPLES[category]}`;
}

/**
 * Selects examples using both the ticket category and its intent.
 * Paper-option questions get a focused example even if classification
 * assigns them to Printing & Quality instead of General Inquiry.
 */
export function getExamplesForTicket(
  category: BookLeafTicketCategory,
  subject: string,
  description: string,
): string {
  const ticketText = `${subject}\n${description}`;

  const isPaperOptionsQuestion =
    /\b(?:paper|gsm|paperweight|paper\s+weight|paper\s+stock|paper\s+grade|paper\s+type|finishes?|matte|glossy|gloss)\b/i.test(
      ticketText,
    ) &&
    !/\b(?:blurry|misaligned|damaged|defect|misprint|poor print quality|binding defect|reprint)\b/i.test(
      ticketText,
    );

  if (isPaperOptionsQuestion) {
    return `${EXAMPLE_RULES}\n\n${GENERAL_INQUIRY_PAPER_OPTIONS_EXAMPLE}`;
  }

  if (category !== 'General Inquiry') {
    return getExamplesForCategory(category);
  }

  const isMetadataQuestion =
    /\b(?:description|metadata|author bio|book bio)\b/i.test(ticketText);

  if (isMetadataQuestion) {
    return `${EXAMPLE_RULES}\n\n${GENERAL_INQUIRY_METADATA_EXAMPLE}`;
  }

  // Avoid sending an unrelated example for an unrecognized intent.
  return EXAMPLE_RULES;
}

/**
 * Legacy export retained for compatibility with any existing imports.
 * Do not use it for response generation because it includes every category.
 */
export const FEW_SHOT_EXAMPLES = `${EXAMPLE_RULES}\n\n${Object.values(
  CATEGORY_EXAMPLES,
).join('\n\n')}`;