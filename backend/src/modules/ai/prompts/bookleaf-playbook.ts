import type { BookLeafTicketCategory } from './bookleaf-knowledge-base.js';

export const CATEGORY_PLAYBOOK: Record<BookLeafTicketCategory, string> = {
  'Royalty & Payments': `
Acknowledge the author's concern, and apologise once if the timing or
communication has fallen short.

Use the author's verified book data when relevant: copies sold, total
royalty earned, amount recorded as paid, pending amount, and last payout
date. Quote figures exactly as supplied.

For payment-status or pending-balance questions:
- Explain that royalties are calculated quarterly and paid within 45 days
  after each quarter ends. State that the minimum payout threshold is INR 1,000.
- ONLY if royaltyPending is strictly below 1000 (or null), add that balances
  below INR 1,000 roll over to the next quarter. If royaltyPending is 1000 or
  more, do NOT mention rollover or use the words "roll over" or "carry over"
  anywhere in your reply.
- If derivedFacts.policyReference is supplied, you may give the policyReference
  dates in one sentence that begins "As a general policy reference," and never
  as this author's confirmed payment date.
- Do not infer the earning quarter, payout eligibility, overdue status or a
  payout date from the pending balance or the last payout date.
- When the author reports a missing, pending or delayed payment (or asks when
  a pending balance will be paid), close with one commitment sentence:
  "Our team will verify your royalty statement and payment status and get back
  to you within 48 hours." For other royalty questions, end with a practical
  next step and no timeline.
- Support does the verification. Never ask the author to check the
  statement, never offer help accessing it, and do not ask about bank
  details.

For questions about low royalty amounts:
- Explain that the author receives 80% of net profit and BookLeaf receives
  20%, and that net profit is the MRP minus printing cost, platform
  commission and shipping charges.
- Use supplied sales and royalty figures where available.
- Offer a line-by-line breakdown, and mention the platform-wise breakdown
  in the dashboard. Be transparent, not defensive.
- Never invent printing costs, commissions, deductions or a reason for
  a discrepancy.
  `.trim(),

  'ISBN & Metadata Issues': `
Treat an incorrect, duplicate, mismatched, or discrepant ISBN as a
high-priority data issue. Acknowledge its seriousness, apologise, and take
responsibility without deflection.

Say the issue needs to be referred to the production team for verification.
Do not say it has been or is being escalated, investigated, corrected or
fixed.

For a reported ISBN error or discrepancy (duplicate, wrong, mismatched, or
correction request), include one commitment sentence: "Our team will verify
the ISBN details with the production team and get back to you within 48 hours."
This is a follow-up timeframe, not a promise that the correction will be
completed.

For a question about using the author's own ISBN, explain that BookLeaf
assigns each book a unique ISBN under its publisher imprint and that an
author who wants their own imprint must obtain the ISBN independently.
No timeline commitment is needed.

Ask for the ISBN printed on the physical copy and the ISBN on the online
listing (or a listing URL or screenshot) only if those details are not
already available.

For ordinary metadata changes, explain that requests can be submitted
through the dashboard or by email and typically reflect on platforms
within 3-5 business days.
  `.trim(),

  'Printing & Quality': `
Apologise sincerely and acknowledge the specific print problem, such as
blurry images, misaligned pages or binding defects.

Ask for clear photographs of the affected copies only if they have not
already been provided.

Explain that BookLeaf arranges a free reprint after the defect is verified,
with a standard turnaround of 5-7 business days from order confirmation.
Do not imply that a reprint is automatic, approved or already ordered.

End with one clear, practical next step.
  `.trim(),

  'Distribution & Availability': `
Acknowledge the concern about availability on the specific retailer or
platform named in the ticket.

Say that this usually points to a stock sync issue, without asserting it as
the confirmed cause. The distribution team can assess whether a re-sync is
needed, and a re-sync typically takes 24-48 hours to take effect.

Do not claim that a re-sync has been requested, triggered or started. Do not
guarantee when the listing will return. Never tell the author to trigger the
re-sync, and never promise that BookLeaf will contact a retailer.

Ask for the listing URL or a screenshot only if it is not already available.
  `.trim(),

  'Book Status & Production Updates': `
Use the actual book status supplied in the book record.

Acknowledge the specific concern, including the reported waiting time when
the ticket gives it. Explain the recorded stage in plain language.

Mention a reason for delay only if the ticket or record supports it. Do not
assume author approval is pending and do not blame the author. Never invent
a completion date.

If no confirmed completion date is available, say so plainly.

When the ticket reports a delay or asks how long it will take, close with:
"Our team will check the current stage and get back to you within 48
hours." For a plain status request that the record already answers, give
the recorded stage and the stages that follow, and end with a practical
next step without a timeline.

Do not tell the author to check the dashboard when the status is already
supplied.
  `.trim(),

  'General Inquiry': `
Answer the author's actual question directly, using the relevant documented
BookLeaf policy and the ticket facts.

For questions about how to publish a book with BookLeaf: explain that BookLeaf
offers the Standard Free package (no upfront cost) and the Bestseller
Breakthrough package (paid package with marketing and distribution add-ons),
and handles cover design, typesetting, proofreading, ISBN assignment,
printing, distribution across Amazon India, Flipkart, Amazon US, Amazon UK,
and the BookLeaf Store, and quarterly royalty management (80% of net profit
to the author). End with a clear next step to submit the manuscript or choose
a publishing package through the author dashboard.

For description or metadata changes: they can be submitted through the
author dashboard or by emailing BookLeaf, and typically reflect on platforms
within 3-5 business days.

For questions about printing paper options, paper grades, GSM, weight, size,
or finishes:
- The known context confirms an in-house printing facility and print
  partners Repro India and Epitome Books.
- The available knowledge does not specify individual paper grades, GSM,
  weights, sizes, finishes, format compatibility, or prices.
- Do not claim that matte, glossy, premium, standard, or any other specific
  paper options are available unless the supplied facts confirm this.
- Do not invent package-based paper choices, dashboard sections, quotation
  procedures, comparison sheets, or future follow-up commitments.
- Explain briefly that the available information does not list the exact
  specifications, and do not recommend a specific paper option.
- Do not ask for the author's genre or preferences as a substitute for
  verifying which paper options are actually available.

Provide only the policy relevant to the question, with no generic filler.
If essential information is missing, say what is unknown and give a relevant
next step without inventing an action or commitment.
  `.trim(),
};

/**
 * Selects the most relevant playbook for the current ticket.
 *
 * Specialized categories keep their existing policies.
 * General Inquiry uses a smaller intent-specific playbook.
 */
export function getPlaybookForTicket(
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

  // Paper-options questions need only the relevant policy.
  if (isPaperOptionsQuestion) {
    return `
PAPER OPTIONS — GENERAL INQUIRY

- Answer the author's question about printing paper options.
- BookLeaf has an in-house printing facility in Delhi and works
  with print partners, including Repro India and Epitome Books.
- The supplied knowledge does not specify individual paper grades,
  GSM, weights, sizes, finishes, format compatibility, or prices.
- Do not invent paper options, availability, package features,
  dashboard sections, quotations, or comparison sheets.
- State briefly that the exact specifications are not available
  in the supplied information.
- Do not recommend a specific paper option without verified facts.
- Do not promise a future action or follow-up unless authorized.
- Keep the response focused on the paper-options question.
`.trim();
  }

  const isMetadataChange =
    /\b(?:description|metadata|author bio|book bio)\b/i.test(ticketText);

  // Ordinary metadata changes can occur under either category.
  if (
    isMetadataChange &&
    (category === 'General Inquiry' ||
      category === 'ISBN & Metadata Issues')
  ) {
    return `
METADATA UPDATE

- Book descriptions and ordinary metadata changes can be submitted
  through the author dashboard or by emailing BookLeaf.
- Changes typically reflect on platforms within 3-5 business days.
- Explain the relevant submission method and timeframe.
- Do not claim that a change has already been submitted or updated.
- Do not invent dashboard features or completion dates.
- End with a practical next step.
`.trim();
  }

  // Other specialized categories use their established playbooks.
  if (category !== 'General Inquiry') {
    return CATEGORY_PLAYBOOK[category];
  }

  const isPublishingQuestion =
    /\b(?:publish a book|publishing package|publishing packages|manuscript|standard free|bestseller breakthrough)\b/i.test(
      ticketText,
    );

  if (isPublishingQuestion) {
    return `
PUBLISHING — GENERAL INQUIRY

- Standard Free has no upfront cost.
- Bestseller Breakthrough is a paid package with marketing and
  distribution add-ons.
- BookLeaf handles cover design, typesetting, proofreading,
  ISBN assignment, printing, distribution, and royalty management.
- Mention distribution platforms only when relevant to the question.
- Explain only the services relevant to the author's request.
- Do not invent package features, prices, or commitments.
- End with a relevant next step supported by the documented policy.
`.trim();
  }

  // Safe, compact instructions for other General Inquiry tickets.
  return `
GENERAL INQUIRY — OTHER

- Answer the author's actual question using verified ticket facts
  and the supplied BookLeaf knowledge base.
- Include only policy relevant to the question.
- If essential information is unavailable, state what is unknown.
- Do not invent product details, prices, procedures, actions, or
  future commitments.
- Give a relevant next step without promising an unsupported outcome.
`.trim();
}