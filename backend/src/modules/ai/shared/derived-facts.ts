
const DAY_MS = 86_400_000;
const PAYOUT_WINDOW_DAYS = 45;
const MIN_PAYOUT_INR = 1000;

/** Last completed calendar-quarter end, assuming calendar quarters. */
export function lastEndedQuarterEnd(now: Date): Date {
  const currentQuarter = Math.floor(now.getUTCMonth() / 3);

  return new Date(
    Date.UTC(now.getUTCFullYear(), currentQuarter * 3, 0),
  );
}

const fmt = (date: Date): string =>
  date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });

export interface DerivedFacts {
  today: string;
  monthsSincePublication: number | null;
  royaltyPendingInr: number | null;
  pendingIsAboveMinimumThreshold: boolean | null;
  rolloverNote: string;
  policyReference: {
    lastEndedQuarterEnd: string;
    policyPayByDate: string;
    note: string;
  };
}

export function buildDerivedFacts(
  book: Record<string, unknown> | undefined,
  now = new Date(),
): DerivedFacts {
  // Use a specific quarter end only when the record supplies one.
  // Do not derive it from lastRoyaltyPayoutDate.
  const rawQuarterEnd =
    book?.royaltyQuarterEndDate ??
    book?.royalty_quarter_end_date;

  const parsedQuarterEnd =
    rawQuarterEnd == null || rawQuarterEnd === ''
      ? null
      : rawQuarterEnd instanceof Date
        ? new Date(rawQuarterEnd.getTime())
        : new Date(String(rawQuarterEnd));

  const hasBookSpecificQuarterEnd =
    parsedQuarterEnd !== null &&
    !Number.isNaN(parsedQuarterEnd.getTime());

  const quarterEnd =
    hasBookSpecificQuarterEnd && parsedQuarterEnd
      ? parsedQuarterEnd
      : lastEndedQuarterEnd(now);

  const policyPayByDate = new Date(
    quarterEnd.getTime() + PAYOUT_WINDOW_DAYS * DAY_MS,
  );

  // Support the database's camelCase fields and the sample JSON's
  // snake_case fields.
  const rawPublicationDate =
    book?.publicationDate ?? book?.publication_date;

  const publicationDate =
    rawPublicationDate == null || rawPublicationDate === ''
      ? null
      : new Date(String(rawPublicationDate));

  const monthsSincePublication =
    publicationDate && !Number.isNaN(publicationDate.getTime())
      ? Math.max(
          0,
          Math.floor(
            (now.getTime() - publicationDate.getTime()) /
              (30.44 * DAY_MS),
          ),
        )
      : null;

  const rawPending =
    book?.royaltyPending ?? book?.royalty_pending;

  const pending =
    typeof rawPending === 'number' &&
    Number.isFinite(rawPending)
      ? rawPending
      : null;

  return {
    today: fmt(now),
    monthsSincePublication,
    royaltyPendingInr: pending,

    pendingIsAboveMinimumThreshold:
      pending === null ? null : pending >= MIN_PAYOUT_INR,

    rolloverNote:
      pending === null
        ? 'The pending balance is unavailable; do not infer whether rollover applies or whether a payout is eligible.'
        : pending < MIN_PAYOUT_INR
          ? 'The pending balance is below INR 1,000. BookLeaf policy says balances below INR 1,000 roll over to the next payout cycle.'
          : 'The pending balance is INR 1,000 or more; do not say it rolls over. This does not by itself confirm payout eligibility or a payment date.',

    policyReference: {
      lastEndedQuarterEnd: fmt(quarterEnd),
      policyPayByDate: fmt(policyPayByDate),

      note: hasBookSpecificQuarterEnd
        ? 'A book-specific quarter-end date was supplied. The 45-day date is a policy deadline, not confirmation that payment is approved or scheduled.'
        : 'General policy reference only. The pending balance has not been linked to a specific quarter, so this is not a confirmed payment deadline for the author.',
    },
  };
}
