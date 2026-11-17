export interface ParsedEventPaste {
  title: { be: string; en: string; pl: string };
  location: { be: string; en: string; pl: string };
  description: { be: string; en: string; pl: string };
  approxDate: { be: string; en: string; pl: string };
  ageRestriction: { be: string; en: string; pl: string };
  budget: string;
  currency: string;
  startDate?: string;
  endDate?: string;
  datedAt?: string;
  countries: string[];
  chatLink: string;
  difficultyLevel: number;
  pinned: boolean;
  images: string[];
}

export interface ParseEventPasteError {
  eventIndex: number;
  message: string;
}

export interface ParseEventPasteResult {
  events: ParsedEventPaste[];
  errors: ParseEventPasteError[];
}

const HEADER = "WALACUGI_EVENT_V1";
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

const SINGLE_KEYS = [
  "title.be",
  "title.en",
  "title.pl",
  "location.be",
  "location.en",
  "location.pl",
  "approxDate.be",
  "approxDate.en",
  "approxDate.pl",
  "ageRestriction.be",
  "ageRestriction.en",
  "ageRestriction.pl",
  "budget",
  "currency",
  "startDate",
  "endDate",
  "datedAt",
  "countries",
  "chatLink",
  "difficultyLevel",
  "pinned"
] as const;

const BLOCK_KEYS = ["description.be", "description.en", "description.pl"] as const;

type SingleKey = (typeof SINGLE_KEYS)[number];
type BlockKey = (typeof BLOCK_KEYS)[number];
type FieldMap = Partial<Record<SingleKey | BlockKey, string>>;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [yyyy, mm, dd] = value.split("-").map(Number);
  const date = new Date(Date.UTC(yyyy, mm - 1, dd));
  return date.getUTCFullYear() === yyyy && date.getUTCMonth() === mm - 1 && date.getUTCDate() === dd;
}

function splitBlocks(text: string): string[] {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const parts = normalized.split(new RegExp(`^${HEADER}\\s*$`, "m"));
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}

function parseBlockFields(block: string): { fields: FieldMap; error?: string } {
  const fields: FieldMap = {};
  const lines = block.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i += 1;
      continue;
    }

    const blockOpen = /^([a-zA-Z.]+)<<\s*$/.exec(trimmed);
    if (blockOpen) {
      const key = blockOpen[1] as BlockKey;
      if (!(BLOCK_KEYS as readonly string[]).includes(key)) {
        return { fields, error: `Unknown block key: ${key}` };
      }
      i += 1;
      const body: string[] = [];
      let closed = false;
      while (i < lines.length) {
        if (lines[i].trim() === ">>") {
          closed = true;
          i += 1;
          break;
        }
        body.push(lines[i]);
        i += 1;
      }
      if (!closed) {
        return { fields, error: `Unclosed block for ${key}` };
      }
      fields[key] = body.join("\n").trim();
      continue;
    }

    const single = /^([a-zA-Z.]+)\s*:\s*(.*)$/.exec(line);
    if (!single) {
      return { fields, error: `Invalid line (expected key: value): ${trimmed.slice(0, 80)}` };
    }
    const key = single[1] as SingleKey;
    if (!(SINGLE_KEYS as readonly string[]).includes(key)) {
      return { fields, error: `Unknown key: ${key}` };
    }
    fields[key] = single[2].trim();
    i += 1;
  }

  return { fields };
}

function requireLocalized(
  fields: FieldMap,
  prefix: "title" | "location" | "description" | "approxDate" | "ageRestriction"
): { be: string; en: string; pl: string } | null {
  const be = fields[`${prefix}.be` as SingleKey | BlockKey];
  const en = fields[`${prefix}.en` as SingleKey | BlockKey];
  const pl = fields[`${prefix}.pl` as SingleKey | BlockKey];
  if (be === undefined || en === undefined || pl === undefined) return null;
  return { be, en, pl };
}

function parseCountries(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

function toEvent(fields: FieldMap, eventIndex: number): { event?: ParsedEventPaste; error?: string } {
  const title = requireLocalized(fields, "title");
  const location = requireLocalized(fields, "location");
  const description = requireLocalized(fields, "description");
  const approxDate = requireLocalized(fields, "approxDate");
  const ageRestriction = requireLocalized(fields, "ageRestriction");

  if (!title) return { error: "Missing title.be / title.en / title.pl" };
  if (!location) return { error: "Missing location.be / location.en / location.pl" };
  if (!description) return { error: "Missing description.be / description.en / description.pl blocks" };
  if (!approxDate) return { error: "Missing approxDate.be / approxDate.en / approxDate.pl" };
  if (!ageRestriction) return { error: "Missing ageRestriction.be / ageRestriction.en / ageRestriction.pl" };
  if (!title.be.trim()) return { error: "title.be must be non-empty" };

  if (fields.budget === undefined) return { error: "Missing budget" };
  if (fields.currency === undefined) return { error: "Missing currency" };
  if (fields.startDate === undefined) return { error: "Missing startDate" };
  if (fields.endDate === undefined) return { error: "Missing endDate" };
  if (fields.datedAt === undefined) return { error: "Missing datedAt" };
  if (fields.countries === undefined) return { error: "Missing countries" };
  if (fields.chatLink === undefined) return { error: "Missing chatLink" };
  if (fields.difficultyLevel === undefined) return { error: "Missing difficultyLevel" };
  if (fields.pinned === undefined) return { error: "Missing pinned" };

  const startDate = fields.startDate.trim();
  const endDate = fields.endDate.trim();
  const datedAt = fields.datedAt.trim();

  for (const [label, value] of [
    ["startDate", startDate],
    ["endDate", endDate],
    ["datedAt", datedAt]
  ] as const) {
    if (value && !isValidIsoDate(value)) {
      return { error: `Invalid ${label} (use yyyy-mm-dd or empty): ${value}` };
    }
  }
  if (!startDate && !datedAt) {
    return { error: "Provide at least one of startDate or datedAt" };
  }

  const difficultyRaw = fields.difficultyLevel.trim();
  const difficultyLevel = Number(difficultyRaw);
  if (!Number.isInteger(difficultyLevel) || difficultyLevel < 1 || difficultyLevel > 5) {
    return { error: `difficultyLevel must be integer 1-5 (got: ${fields.difficultyLevel})` };
  }

  const pinnedRaw = fields.pinned.trim().toLowerCase();
  if (pinnedRaw !== "true" && pinnedRaw !== "false") {
    return { error: `pinned must be true or false (got: ${fields.pinned})` };
  }

  const countries = parseCountries(fields.countries);
  for (const code of countries) {
    if (!/^[a-z]{2}$/.test(code)) {
      return { error: `Invalid country code: ${code}` };
    }
  }

  void eventIndex;

  const event: ParsedEventPaste = {
    title,
    location,
    description,
    approxDate,
    ageRestriction,
    budget: fields.budget,
    currency: fields.currency,
    countries,
    chatLink: fields.chatLink,
    difficultyLevel,
    pinned: pinnedRaw === "true",
    images: []
  };
  if (startDate) event.startDate = startDate;
  if (endDate) event.endDate = endDate;
  if (datedAt) event.datedAt = datedAt;

  return { event };
}

/**
 * Parse one or more WALACUGI_EVENT_V1 paste blocks into create payloads.
 * Does not write to the database.
 */
export function parseEventPaste(text: string): ParseEventPasteResult {
  const events: ParsedEventPaste[] = [];
  const errors: ParseEventPasteError[] = [];

  if (!text.replace(/^\uFEFF/, "").trim()) {
    return { events, errors: [{ eventIndex: 0, message: "Paste text is empty" }] };
  }

  if (!/^[\s\S]*WALACUGI_EVENT_V1\b/m.test(text)) {
    return {
      events,
      errors: [{ eventIndex: 0, message: `Missing header line: ${HEADER}` }]
    };
  }

  const blocks = splitBlocks(text);
  if (blocks.length === 0) {
    return { events, errors: [{ eventIndex: 0, message: "No event blocks found after header" }] };
  }

  blocks.forEach((block, index) => {
    const eventIndex = index + 1;
    const { fields, error } = parseBlockFields(block);
    if (error) {
      errors.push({ eventIndex, message: error });
      return;
    }
    const parsed = toEvent(fields, eventIndex);
    if (parsed.error || !parsed.event) {
      errors.push({ eventIndex, message: parsed.error ?? "Invalid event" });
      return;
    }
    events.push(parsed.event);
  });

  return { events, errors };
}
