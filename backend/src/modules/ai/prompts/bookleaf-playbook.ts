import type { BookLeafTicketCategory } from './bookleaf-knowledge-base.js';

export const CATEGORY_PLAYBOOK: Record<BookLeafTicketCategory, string> = {
  'Royalty & Payments': `
Acknowledge the author's concern and apologise once if appropriate.

Use verified book data when relevant: copies sold, total royalty earned,
amount recorded as paid, pending amount, and last payout date. Quote
figures exactly as supplied.

For payment-status or pending-balance questions:
- Explain the quarterly royalty cycle and 45-day payment window in a
  sentence beginning exactly with "As a general policy reference,".
- State that the minimum payout threshold is INR 1,000.
- Only if royaltyPending is strictly below INR 1,000 or is null, explain
  that balances below INR 1,000 roll over to the next quarter.
- If royaltyPending is INR 1,000 or more, never mention rollover.
- Use dates from derivedFacts.policyReference only when supplied.
  Never present a general policy date as the author's confirmed
  payment date.
- Do not infer the earning quarter, payout eligibility, overdue status,
  or payment date from a pending balance or the last payout date.
- When the author reports a missing, pending, or delayed payment, or
  asks when a pending balance will be paid, end with this commitment:
  "Our team will verify your royalty statement and payment status and
  get back to you within 48 hours."
- For other royalty questions, give a relevant next step without an
  unsupported timeline.
- Support staff perform verification. Never ask the author to check
  the statement or provide bank details.
When an author asks about royalty payment timing, explicitly
state that royalties are calculated quarterly and payments
are made within 45 days after each quarter ends.

When pending royalty and the minimum payout threshold are
provided, compare the two amounts explicitly.

Never imply that crossing the threshold confirms payout
eligibility or that a payment has been scheduled.

For missing or pending payments, use the approved follow-up:
"Our team will verify your royalty statement and payment
status and get back to you within 48 hours."
For questions about low royalty amounts:
- Explain the 80/20 split: 80% of net profit goes to the author and
  20% goes to BookLeaf.
- Net profit is MRP minus printing cost, platform commission, and
  shipping charges.
- Use verified sales and royalty figures when available.
- Explain that a platform-wise royalty breakdown is available in the
  dashboard. Offer a line-by-line breakdown only as authorized by the
  supplied policy.
- Never invent costs, deductions, or reasons for a discrepancy.
`.trim(),

  'ISBN & Metadata Issues': `
Treat an incorrect, duplicate, mismatched, or discrepant ISBN as a
high-priority data issue. Acknowledge its seriousness and apologise
without deflecting responsibility.

For an ISBN error or discrepancy:
- Explain that the issue needs referral to the production team for
  verification.
- Do not claim it has already been escalated, investigated, corrected,
  or fixed unless trusted facts confirm the action.
- Include this authorized follow-up commitment:
  "Our team will verify the ISBN details with the production team and
  get back to you within 48 hours."
- This is a follow-up timeframe, not a promise that the correction
  will be completed.
- Ask for the ISBN printed on the physical copy and the ISBN on the
  online listing, or a listing URL or screenshot, only when the
  relevant information is not already available.

For questions about using the author's own ISBN:
- Explain that BookLeaf assigns each published book a unique ISBN
  under its publisher imprint.
- An author who wants an ISBN under their own imprint must obtain it
  independently.
- Do not add a follow-up commitment unless authorized.

For ordinary metadata changes:
- Requests may be submitted through the author dashboard or by email.
- Changes typically reflect on platforms within 3–5 business days.
- Any general policy timeframe sentence must begin exactly with
  "As a general policy reference,".
- Do not claim that the change has already been submitted or updated.
- End with a practical next step.
`.trim(),

  'Printing & Quality': `
Acknowledge the specific printing defect and apologise sincerely.

- Ask for clear photographs of the affected copies only if they have
  not already been provided.
- BookLeaf arranges a free reprint after the defect is verified.
- Do not imply that a reprint is automatic, approved, or already
  ordered.
- Explain the standard 5–7 business day turnaround only in the
  context of the reprint policy after order confirmation.
- Any general policy timeframe sentence must begin exactly with
  "As a general policy reference,".
- Do not invent paper grades, GSM, finishes, paper availability,
  prices, or production details.
- End with one clear and practical next step.
`.trim(),

  'Distribution & Availability': `
Acknowledge the concern about availability on the specific retailer
or distribution platform named in the ticket.

- An unavailable listing usually indicates a possible stock
  synchronization issue, but do not present the cause as confirmed.
- The distribution team can assess whether a re-sync is needed.
- A re-sync typically takes 24–48 hours to take effect.
- Any general policy timeframe sentence must begin exactly with
  "As a general policy reference,".
- Do not claim a re-sync has been requested, triggered, or started
  unless trusted facts confirm it.
- Do not guarantee when the listing will return.
- Never instruct the author to trigger the re-sync.
- Never promise that BookLeaf will contact a retailer.
- Ask for the listing URL or a screenshot only if it is not already
  available.
- End with a practical next step supported by the policy.
`.trim(),

  'Book Status & Production Updates': `
Use the actual production stage supplied in the trusted book record.

- Acknowledge the specific concern, including the reported waiting
  time when stated in the ticket.
- Explain the recorded production stage in plain language.
- Mention a delay reason only when supported by the ticket or record.
- Do not assume author approval is pending or blame the author.
- Never invent a completion date.
- If no confirmed completion date is available, say so plainly.

When the ticket reports a delay or asks how long the process will take,
close with:
"Our team will check the current stage and get back to you within
48 hours."

For a plain status request already answered by the supplied record,
explain the recorded stage and relevant subsequent stages, then end
with a practical next step without an unnecessary timeline.

Do not tell the author to check the dashboard when the status is
already supplied.
`.trim(),

  'General Inquiry': `
Answer the author's actual question directly using the relevant
documented BookLeaf policy and verified ticket facts.

For questions about starting the publishing process:
- Explain the Standard Free package, which has no upfront cost.
- Explain the Bestseller Breakthrough package, which is paid and
  includes marketing and distribution add-ons.
- Mention relevant documented services: cover design, typesetting,
  proofreading, ISBN assignment, printing, distribution, and royalty
  management.
- End with the documented next step: submit the manuscript or choose
  a publishing package through the author dashboard.
- Do not invent dashboard tab names, buttons, upload instructions,
  document requirements, email-based publishing procedures, package
  prices, or publishing timelines.
- Do not apply metadata-change timelines to the overall publishing
  process.
- Never promise additional work or future assistance without support
  from the supplied policy.

For description or metadata changes:
- Explain that requests may be submitted through the author dashboard
  or by emailing BookLeaf.
- Changes typically reflect on platforms within 3–5 business days.
- Any general policy timeframe sentence must begin exactly with
  "As a general policy reference,".
- Do not claim a change has already been submitted or completed.

For questions about printing paper options, grades, GSM, weight, size,
or finishes:
- BookLeaf has an in-house printing facility in Delhi and works with
  print partners including Repro India and Epitome Books.
- The available knowledge does not specify individual paper grades,
  GSM, weights, sizes, finishes, format compatibility, or prices.
- Do not invent available options, package features, dashboard
  sections, quotation procedures, or comparison sheets.
- Explain briefly that the exact specifications are not documented.
- Do not recommend a specific paper option without verified facts.
- Do not ask about genre or preferences as a substitute for verifying
  which paper options are available.

For other inquiries:
- Include only the policy relevant to the question.
- If essential information is unavailable, state what is unknown.
- Give a relevant next step without inventing actions or commitments.
- Avoid generic filler.
`.trim(),
};

/**
 * Select a focused playbook using the ticket category and intent.
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

  // Paper questions require specific knowledge restrictions even if
  // the ticket classifier selected another category.
  if (isPaperOptionsQuestion) {
    return `
PAPER OPTIONS — GENERAL INQUIRY

- Answer the specific question about printing paper options.
- BookLeaf has an in-house printing facility in Delhi and works with
  Repro India and Epitome Books.
- Exact paper grades, GSM, weights, sizes, finishes, compatibility,
  and prices are not documented in the available knowledge.
- Do not invent options, availability, package features, dashboard
  sections, quotations, or comparison sheets.
- Explain briefly that the exact specifications need to be verified.
- Do not recommend a paper option without verified facts.
- Do not promise future actions or follow-ups without authorization.
- Keep the answer focused on the author's question.
`.trim();
  }

  // Specialized categories use their complete category playbooks.
  if (category !== 'General Inquiry') {
    return CATEGORY_PLAYBOOK[category];
  }

  // Check metadata changes before publishing intent.
  const isMetadataQuestion =
    /\b(?:description|metadata|author bio|book bio)\b/i.test(ticketText);

  if (isMetadataQuestion) {
    return `
GENERAL INQUIRY — METADATA UPDATE

- Description and metadata changes can be submitted through the
  author dashboard or by emailing BookLeaf.
- Changes typically reflect on platforms within 3–5 business days.
- Begin every sentence describing this general policy timeframe
  with exactly "As a general policy reference,".
- Do not claim a change has already been submitted or updated.
- Do not confuse metadata updates with publishing a new book.
- End with a practical next step.
`.trim();
  }

  // Match natural variations, including "how to publish the book".
  const isPublishingQuestion =
    /\b(?:how\s+(?:do\s+i|can\s+i|to)\s+publish|how\s+can\s+i\s+get\s+published|publish(?:ing)?\s+(?:a|the|my|your)\s+book|book\s+publishing|publishing\s+packages?|manuscript|standard\s+free|bestseller\s+breakthrough)\b/i.test(
      ticketText,
    );

  if (isPublishingQuestion) {
    return `
GENERAL INQUIRY — PUBLISHING

- Standard Free has no upfront cost.
- Bestseller Breakthrough is a paid package with marketing and
  distribution add-ons.
- Relevant services include cover design, typesetting, proofreading,
  ISBN assignment, printing, distribution, and royalty management.
- End with the documented next step: submit the manuscript or choose
  a publishing package through the author dashboard.
- Do not invent dashboard sections, buttons, upload steps, document
  requirements, email-based publishing procedures, prices, or
  publishing timelines.
- Do not apply metadata-change timelines to new-book publishing.
- Do not promise that BookLeaf will handle setup or perform additional
  work unless explicitly authorized by the supplied facts and policy.
- Keep the response focused on getting started with BookLeaf.
`.trim();
  }

  return `
GENERAL INQUIRY — OTHER

- Answer the author's actual question using verified ticket facts
  and the supplied BookLeaf knowledge base.
- Include only the policy relevant to the question.
- If essential information is unavailable, state what is unknown.
- Do not invent product details, policies, actions, or commitments.
- End with a relevant next step without making unsupported promises.
`.trim();
}