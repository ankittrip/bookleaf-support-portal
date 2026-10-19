export const BOOKLEAF_TICKET_CATEGORIES = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
] as const;

export type BookLeafTicketCategory =
  (typeof BOOKLEAF_TICKET_CATEGORIES)[number];

export const BOOKLEAF_GLOBAL_CONTEXT = `
BookLeaf Publishing is a self-publishing company operating in India
and the US.

Services include cover design, typesetting, ISBN assignment,
printing, distribution, and royalty management.

Printing facilities and a warehouse are located in Delhi.
Print partners include Repro India and Epitome Books.

Publishing packages:
- Standard Free: no upfront cost.
- Bestseller Breakthrough: paid package with marketing and
  distribution add-ons.
`;

export const BOOKLEAF_COMMUNICATION_GUIDELINES = `
1. Be empathetic, professional, and respectful.
2. Acknowledge the author's concern before offering a solution.
3. Use actual book details, amounts, and statuses when available.
4. Never invent payment dates, investigation results, or book statuses.
5. Acknowledge BookLeaf's responsibility when appropriate.
6. Provide a realistic next step and a policy-based timeline.
7. Do not claim that an escalation, reprint, or stock re-sync has
   already happened unless the system confirms it.
8. If information is missing, explain what needs to be verified.
9. Draft responses for an admin to review before sending.
`;

export const BOOKLEAF_CATEGORY_KNOWLEDGE: Record<
  BookLeafTicketCategory,
  string
> = {
  'Royalty & Payments': `
- Authors receive 80% of net profit; BookLeaf receives 20%.
- Net profit = MRP minus printing cost, platform commission,
  and shipping charges.
- Royalties are calculated quarterly.
- Payments are made within 45 days after the quarter ends.
- Minimum payout threshold is INR 1,000.
- Amounts below the threshold roll over to the next quarter.
- Payments are made by bank transfer to the account linked
  to the author's dashboard.
- A detailed royalty breakdown is available by sales platform.
- If payment appears overdue, recommend verification and
  escalation with a 48-hour follow-up timeline.
`,

  'ISBN & Metadata Issues': `
- Every BookLeaf-published book receives a unique ISBN assigned
  by BookLeaf.
- ISBNs are registered under BookLeaf's publisher imprint.
- Authors wanting their own imprint must obtain their ISBN independently.
- Duplicate ISBNs or incorrect book-to-ISBN mappings are high priority.
- These issues should be escalated to the production team.
- The stated resolution follow-up timeline is 48 hours.
`,

  'Printing & Quality': `
- Standard printing turnaround is 5–7 business days from
  order confirmation.
- Quality issues include misprints, binding defects, and
  colour inconsistencies.
- A free reprint is arranged after verification of the defect.
- The author may need to share photographs of the defective copy.
- Do not promise that a reprint has been approved until verified.
`,

  'Distribution & Availability': `
- Books may be listed on Amazon India, Flipkart, Amazon US,
  Amazon UK, and the BookLeaf Store.
- New listings typically go live within 7–10 business days
  after publication is complete.
- An unavailable listing may indicate a stock synchronisation issue.
- The distribution team can trigger a re-sync, typically taking
  24–48 hours.
- Do not claim that a re-sync has been triggered unless confirmed.
`,

  'Book Status & Production Updates': `
- Production stages:
  Manuscript Received → Editing (if opted) → Cover Design →
  Typesetting → Proofreading → ISBN Assignment → Printing →
  Distribution Setup → Published & Live.
- Authors are updated at each stage by email.
- Common delays include waiting for cover approval and
  proofreading revisions.
- Use the actual book status supplied by the application.
- Never invent a revised completion date.
`,

'General Inquiry': `
- Book descriptions and metadata changes can be submitted
  through the author dashboard or by emailing BookLeaf.
- Changes typically appear on platforms within 3–5 business days.
- Answer using the relevant BookLeaf policy.
- When a request is outside the available policies, recommend
  verification by the appropriate team.

- BookLeaf has an in-house printing facility and warehouse in Delhi.
- Print partners include Repro India and Epitome Books.
- The available knowledge base does not specify individual paper
  grades, GSM values, paper weights, finishes, or paper options
  for particular book formats.
- Do not invent paper specifications, prices, availability,
  dashboard sections, or quotation procedures.
- If an author asks about specific paper options, explain that
  the exact specifications need to be confirmed before recommending
  a particular paper type.
`,
};

/**
 * Returns the category-specific knowledge needed to draft
 * a response without sending the entire knowledge base.
 */
export function getKnowledgeBaseForCategory(
  category: string,
): string {
  const isValidCategory = (
    BOOKLEAF_TICKET_CATEGORIES as readonly string[]
  ).includes(category);

  const selectedCategory: BookLeafTicketCategory = isValidCategory
    ? (category as BookLeafTicketCategory)
    : 'General Inquiry';

  return [
    BOOKLEAF_GLOBAL_CONTEXT,
    BOOKLEAF_COMMUNICATION_GUIDELINES,
    `Relevant category: ${selectedCategory}`,
    BOOKLEAF_CATEGORY_KNOWLEDGE[selectedCategory],
  ].join('\n\n');
}