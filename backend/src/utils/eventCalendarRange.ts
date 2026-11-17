export type CalendarDateKind = "confirmed" | "uncertain";

export interface CalendarDateRange {
  kind: CalendarDateKind;
  days: string[];
  anchor: string;
}

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toIsoDay(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = ISO_DAY.exec(trimmed.slice(0, 10));
  if (!match) return null;
  const yyyy = Number(match[1]);
  const mm = Number(match[2]);
  const dd = Number(match[3]);
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  if (date.getUTCFullYear() !== yyyy || date.getUTCMonth() !== mm - 1 || date.getUTCDate() !== dd) {
    return null;
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function addDaysIso(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + delta));
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function enumerateInclusive(start: string, end: string): string[] {
  const days: string[] = [];
  let cursor = start;
  if (start > end) {
    return enumerateInclusive(end, start);
  }
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDaysIso(cursor, 1);
    if (days.length > 366) break;
  }
  return days;
}

export interface EventDateFields {
  startDate?: string | null;
  endDate?: string | null;
  datedAt?: string | null;
}

export function getEventCalendarRange(event: EventDateFields): CalendarDateRange | null {
  const start = toIsoDay(event.startDate ?? null);
  const end = toIsoDay(event.endDate ?? null);
  const datedAt = toIsoDay(event.datedAt ?? null);

  if (start && end) {
    return {
      kind: "confirmed",
      days: enumerateInclusive(start, end),
      anchor: start
    };
  }

  const anchor = start ?? end ?? datedAt;
  if (!anchor) return null;

  return {
    kind: "uncertain",
    days: enumerateInclusive(addDaysIso(anchor, -2), addDaysIso(anchor, 2)),
    anchor
  };
}
