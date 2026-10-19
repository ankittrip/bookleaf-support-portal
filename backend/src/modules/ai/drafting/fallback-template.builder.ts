import { Injectable } from '@nestjs/common';

import type { TicketDraftInput } from '../shared/ai.types.js';

import {
  ISBN_ERROR_SIGNAL,
  PRODUCTION_DELAY_SIGNAL,
  ROYALTY_DELAY_SIGNAL,
  ROYALTY_LOW_AMOUNT_SIGNAL,
} from '../shared/ai.constants.js';

type DraftResponse = {
  paragraphOne: string;
  paragraphTwo: string;
};

type ContextEntry = {
  key: string;
  path: string;
  value: unknown;
};

@Injectable()
export class FallbackTemplateBuilder {
  build(ticket: TicketDraftInput): string {
    const record = ticket as unknown as Record<string, unknown>;

    const subject = this.asText(record.subject);
    const description = this.asText(
      record.description ?? record.message ?? record.body,
    );

    const ticketText = `${subject}\n${description}`;
    const category = this.asText(record.category).toLowerCase();
    const firstName = this.getFirstName(record);

    const response = this.buildResponse(category, ticketText, record);

    return [
      `Dear ${firstName},`,
      response.paragraphOne,
      response.paragraphTwo,
    ].join('\n\n');
  }

  private buildResponse(
    category: string,
    ticketText: string,
    record: Record<string, unknown>,
  ): DraftResponse {
    if (
      category.includes('royalty') ||
      ROYALTY_DELAY_SIGNAL.test(ticketText) ||
      ROYALTY_LOW_AMOUNT_SIGNAL.test(ticketText)
    ) {
      return this.buildRoyaltyResponse(ticketText, record);
    }

    if (
      category.includes('isbn') ||
      ISBN_ERROR_SIGNAL.test(ticketText)
    ) {
      return {
        paragraphOne:
          'I understand your concern regarding the ISBN information for your book. An ISBN discrepancy is important because accurate metadata helps identify and list a title correctly.',

        paragraphTwo:
          'An ISBN mismatch is a high-priority metadata concern. The production team’s publishing records are the appropriate reference for verifying the discrepancy before any correction can be confirmed.',
      };
    }

    if (
      category.includes('print') ||
      category.includes('quality') ||
      /\b(?:damaged|defect|printing error|misprint|poor print quality|wrong pages)\b/i.test(
        ticketText,
      )
    ) {
      return {
        paragraphOne:
          'I understand your concern regarding the printing or physical quality of your book. I appreciate you bringing the issue to our attention.',

        paragraphTwo:
          'Please retain a clear description of the defect and any relevant photographs to help clarify the printing concern. As a general policy reference, the typical turnaround for a reprint, if approved after review, is 5–7 business days. This timeframe does not confirm that a reprint has been approved for your title.',
      };
    }

    if (
      category.includes('distribution') ||
      category.includes('availability') ||
      /\b(?:not available|not listed|missing from|bookstore|online platform|distribution)\b/i.test(
        ticketText,
      )
    ) {
      return {
        paragraphOne:
          'I understand your concern about your book’s availability on a distribution platform. Listing visibility can depend on the platform and the status of the title.',

        paragraphTwo:
          'Stock synchronization can affect when a listing becomes visible on a distribution platform. As a general policy reference, stock synchronization typically takes 24–48 hours; this is a typical timeframe and does not confirm that your specific listing has updated.',
      };
    }

    if (
      category.includes('production') ||
      PRODUCTION_DELAY_SIGNAL.test(ticketText)
    ) {
      return {
        paragraphOne:
          'I understand that you would like an update on your book’s production status. I appreciate that knowing the status of your publication is important to you.',

        paragraphTwo:
          'Production timelines can depend on the current stage and the details of the project. I cannot confirm a specific completion date from the information currently available in this message.',
      };
    }

    if (
      category.includes('publication') ||
      category.includes('book') ||
      category.includes('author')
    ) {
      return {
        paragraphOne:
          'Thank you for contacting BookLeaf Publishing. I understand that you need assistance with your book or publication.',

        paragraphTwo:
          'Please include the specific question or change you need help with, along with the book title where relevant. This will help clarify the information needed to address your concern.',
      };
    }

    return {
      paragraphOne:
        'Thank you for contacting BookLeaf Publishing. I understand your concern and appreciate you taking the time to share it with us.',

      paragraphTwo:
        'The information currently available is not sufficient to confirm a specific outcome. Please provide any relevant details that may be missing from your message so that the concern can be understood more clearly.',
    };
  }

  private buildRoyaltyResponse(
  ticketText: string,
  record: Record<string, unknown>,
): DraftResponse {
  const bookTitle = this.getBookTitle(record);
  const amount = this.getRoyaltyAmount(record);
  const pendingAmount = this.getPendingRoyaltyAmount(record);

  const pendingReported =
    /\b(?:pending|not received|haven't received|have not received|overdue|still waiting)\b/i.test(
      ticketText,
    );

  const titleClause = bookTitle ? ` for "${bookTitle}"` : '';

  if (ROYALTY_LOW_AMOUNT_SIGNAL.test(ticketText)) {
    const amountSentence = amount
      ? ` The royalty amount shown in the available book information is ${amount}.`
      : '';

    return {
      paragraphOne:
        `I understand your concern about the royalty amount${titleClause}. Royalty calculations should be understood using the applicable royalty-sharing terms and the relevant net-profit basis described in the BookLeaf policy.`,

      paragraphTwo:
        `The information currently available is not sufficient to verify an individual royalty calculation or provide a line-by-line breakdown.${amountSentence} Please refer to the applicable royalty terms and reporting period when reviewing the amount.`,
    };
  }

  let pendingSentence: string;

  if (pendingAmount) {
    pendingSentence =
      `The amount${titleClause} currently reported as pending is ${pendingAmount}.`;
  } else if (pendingReported && amount) {
    pendingSentence =
      `The royalty amount${titleClause} mentioned in your message is ${amount}, but the supplied information does not confirm that this is the current pending balance.`;
  } else if (pendingReported) {
    pendingSentence =
      `The royalty amount${titleClause} described in your message is reported as pending or delayed.`;
  } else {
    pendingSentence =
      `The available information does not establish the current payment status of the royalty amount${titleClause}.`;
  }

  const thresholdComparison = pendingAmount
    ? this.buildThresholdComparison(pendingAmount)
    : '';

  return {
    paragraphOne:
      `I understand your concern regarding the status of royalties${titleClause}. As a general policy reference, BookLeaf's royalty cycle is quarterly, with a payment window of 45 days after the close of the relevant quarter, subject to applicable minimum payout requirements.`,

    paragraphTwo: [
      pendingSentence,
      thresholdComparison,
      'A pending amount alone does not confirm payout eligibility or establish that payment has been scheduled.',
      'A specific payment date cannot be confirmed from the information currently available.',
    ]
      .filter(Boolean)
      .join(' '),
  };
}

  private getBookTitle(record: Record<string, unknown>): string {
    const directTitle = this.asText(record.bookTitle);

    if (directTitle) {
      return directTitle;
    }

    const entries = this.getContextEntries(record);

    const titleEntry = entries.find(
      ({ key, value }) =>
        typeof value === 'string' &&
        /^(?:booktitle|title|bookname)$/i.test(key),
    );

    if (titleEntry) {
      return this.asText(titleEntry.value);
    }

    // Look for an explicitly labelled title in the ticket itself.
    const ticketText = [
      this.asText(record.subject),
      this.asText(record.description ?? record.message ?? record.body),
    ].join('\n');

    const match =
      /\bbook\s+title\s*[:=-]\s*["']?([^"'\n,;.!?]+)["']?/i.exec(
        ticketText,
      );

    return match?.[1]?.trim() ?? '';
  }

  private getPendingRoyaltyAmount(
  record: Record<string, unknown>,
): string {
  // Prefer fields that explicitly identify a pending amount.
  const directCandidates = [
    record.pendingRoyaltyAmount,
    record.pendingRoyalty,
    record.royaltyPending,
    record.pendingAmount,
    record.pendingBalance,
    record.pendingRoyaltyBalance,
  ];

  for (const candidate of directCandidates) {
    if (!this.isScalar(candidate)) {
      continue;
    }

    const formatted = this.formatRoyaltyAmount(candidate);

    if (this.parseInrAmount(formatted) !== null) {
      return formatted;
    }
  }

  // Search nested book context for an explicitly pending amount.
  const entry = this.getContextEntries(record).find(
    ({ key, path, value }) => {
      if (!this.isScalar(value)) {
        return false;
      }

      const normalizedPath = `${key} ${path}`
        .toLowerCase()
        .replace(/[^a-z]/g, '');

      const identifiesPendingAmount =
        normalizedPath.includes('pending') &&
        /royalty|royalties|amount|balance/.test(normalizedPath);

      if (!identifiesPendingAmount) {
        return false;
      }

      return (
        this.parseInrAmount(this.formatRoyaltyAmount(value)) !== null
      );
    },
  );

  return entry ? this.formatRoyaltyAmount(entry.value) : '';
}

private buildThresholdComparison(amount: string): string {
  const numericAmount = this.parseInrAmount(amount);

  // Never compare unknown or non-INR amounts with an INR threshold.
  if (numericAmount === null) {
    return '';
  }

  const threshold = 1000;

  if (numericAmount > threshold) {
    return (
      `The pending balance of ${amount} is above the INR 1,000 ` +
      'minimum payout threshold.'
    );
  }

  if (numericAmount < threshold) {
    return (
      `The pending balance of ${amount} is below the INR 1,000 ` +
      'minimum payout threshold.'
    );
  }

  return (
    `The pending balance of ${amount} is equal to the INR 1,000 ` +
    'minimum payout threshold.'
  );
}

private parseInrAmount(value: string): number | null {
  if (!/^INR\s/i.test(value)) {
    return null;
  }

  const match = /(-?[\d,]+(?:\.\d+)?)/.exec(value);

  if (!match) {
    return null;
  }

  const numericAmount = Number(match[1].replace(/,/g, ''));

  return Number.isFinite(numericAmount) ? numericAmount : null;
}
  private getRoyaltyAmount(
    record: Record<string, unknown>,
  ): string {
    const entries = this.getContextEntries(record);

    // Prefer explicit royalty-amount fields from the book context.
    const amountEntry = entries.find(
      ({ key, path, value }) =>
        this.isScalar(value) &&
        /(?:royalt(?:y|ies).*(?:amount|value)|(?:amount|value).*royalt(?:y|ies)|pending.*(?:amount|royalt)|(?:amount|royalt).*pending)/i.test(
          `${key} ${path}`,
        ),
    );

    if (amountEntry) {
      return this.formatRoyaltyAmount(amountEntry.value);
    }

    // Support directly supplied royalty amount fields.
    const directAmount =
      record.pendingRoyaltyAmount ??
      record.royaltyAmount ??
      record.amount;

    if (this.isScalar(directAmount) && String(directAmount).trim()) {
      return this.formatRoyaltyAmount(directAmount);
    }

    return '';
  }

  private getContextEntries(
    record: Record<string, unknown>,
  ): ContextEntry[] {
    const context =
      record.bookContext ??
      record.book ??
      record.bookDetails ??
      null;

    return this.flattenContext(context);
  }

  private flattenContext(
    value: unknown,
    parentPath = '',
  ): ContextEntry[] {
    if (Array.isArray(value)) {
      return value.flatMap((item, index) =>
        this.flattenContext(item, `${parentPath}[${index}]`),
      );
    }

    if (value === null || typeof value !== 'object') {
      return [];
    }

    const record = value as Record<string, unknown>;
    const entries: ContextEntry[] = [];

    for (const [key, child] of Object.entries(record)) {
      const path = parentPath ? `${parentPath}.${key}` : key;

      entries.push({ key, path, value: child });
      entries.push(...this.flattenContext(child, path));
    }

    return entries;
  }

  private formatRoyaltyAmount(value: unknown): string {
    const raw = this.scalarText(value);

    if (!raw) {
      return '';
    }

    const match =
      /(?:INR|Rs\.?|₹|USD|\$|GBP|£|EUR|€)?\s*(-?[\d,]+(?:\.\d+)?)/i.exec(
        raw,
      );

    if (!match) {
      return raw;
    }

    const numericAmount = Number(match[1].replace(/,/g, ''));

    if (!Number.isFinite(numericAmount)) {
      return raw;
    }

    const currency = /\bUSD\b|\$/i.test(raw)
      ? 'USD'
      : /\bGBP\b|£/i.test(raw)
        ? 'GBP'
        : /\bEUR\b|€/i.test(raw)
          ? 'EUR'
          : 'INR';

    const formattedAmount = numericAmount.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    });

    return `${currency} ${formattedAmount}`;
  }

  private isScalar(value: unknown): boolean {
    return (
      typeof value === 'string' ||
      (typeof value === 'number' && Number.isFinite(value))
    );
  }

  private scalarText(value: unknown): string {
    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return '';
  }

  private getFirstName(record: Record<string, unknown>): string {
    const rawName = this.asText(
      record.authorFirstName ??
        record.firstName ??
        record.authorName ??
        record.author ??
        record.name,
    ).trim();

    if (!rawName) {
      return 'Author';
    }

    const firstName = rawName
      .replace(/^(?:dear|mr\.?|mrs\.?|ms\.?)\s+/i, '')
      .split(/\s+/)[0]
      .replace(/[^A-Za-z'-]/g, '');

    return firstName
      ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
      : 'Author';
  }

  private asText(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }
}