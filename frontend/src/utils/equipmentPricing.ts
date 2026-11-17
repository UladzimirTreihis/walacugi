export const PRICE_TIER_KEYS = ["d1_2", "d3_4", "d5_7", "d8_14", "d15_plus"] as const;

export type PriceTierKey = (typeof PRICE_TIER_KEYS)[number];

export type PriceTiers = Record<PriceTierKey, number>;

export interface PriceBracket {
  key: PriceTierKey;
  minDays: number;
  maxDays: number | null;
  labelKey: string;
}

export const EQUIPMENT_PRICE_BRACKETS: readonly PriceBracket[] = [
  { key: "d1_2", minDays: 1, maxDays: 2, labelKey: "equipment.priceBracket.d1_2" },
  { key: "d3_4", minDays: 3, maxDays: 4, labelKey: "equipment.priceBracket.d3_4" },
  { key: "d5_7", minDays: 5, maxDays: 7, labelKey: "equipment.priceBracket.d5_7" },
  { key: "d8_14", minDays: 8, maxDays: 14, labelKey: "equipment.priceBracket.d8_14" },
  { key: "d15_plus", minDays: 15, maxDays: null, labelKey: "equipment.priceBracket.d15_plus" }
] as const;

export function emptyPriceTiers(fill = 0): PriceTiers {
  return {
    d1_2: fill,
    d3_4: fill,
    d5_7: fill,
    d8_14: fill,
    d15_plus: fill
  };
}

export function isPriceTiers(value: unknown): value is PriceTiers {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return PRICE_TIER_KEYS.every((key) => {
    const n = obj[key];
    return typeof n === "number" && Number.isFinite(n) && n >= 0;
  });
}

export function parsePriceTiers(value: unknown): PriceTiers | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const out = emptyPriceTiers();
  for (const key of PRICE_TIER_KEYS) {
    const raw = obj[key];
    const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number.parseFloat(raw.replace(",", ".")) : NaN;
    if (!Number.isFinite(n) || n < 0) return null;
    out[key] = n;
  }
  return out;
}

export function resolvePriceBracket(days: number): PriceTierKey {
  const n = Math.max(1, Math.floor(days));
  for (const bracket of EQUIPMENT_PRICE_BRACKETS) {
    if (n < bracket.minDays) continue;
    if (bracket.maxDays == null || n <= bracket.maxDays) {
      return bracket.key;
    }
  }
  return "d15_plus";
}

export function getDailyRate(tiers: PriceTiers, days: number): number {
  return tiers[resolvePriceBracket(days)];
}

export function getLineTotal(tiers: PriceTiers, days: number): number {
  const n = Math.max(1, Math.floor(days));
  return getDailyRate(tiers, n) * n;
}

export function getMinDailyRate(tiers: PriceTiers): number {
  return Math.min(...PRICE_TIER_KEYS.map((key) => tiers[key]));
}

/** Half-open range: end exclusive, same as cart today. */
export function countRentalDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate.slice(0, 10)}T00:00:00Z`).getTime();
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  return Math.max(1, Math.floor((end - start) / 86400000));
}

export function resolvePriceTiers(
  priceTiers?: PriceTiers | null,
  pricePerDay?: number | null
): PriceTiers | null {
  if (isPriceTiers(priceTiers)) return priceTiers;
  if (typeof pricePerDay === "number" && Number.isFinite(pricePerDay) && pricePerDay >= 0) {
    return emptyPriceTiers(pricePerDay);
  }
  return null;
}

export function tiersFromLegacyPricePerDay(pricePerDay: number): PriceTiers {
  const n = Number.isFinite(pricePerDay) && pricePerDay >= 0 ? pricePerDay : 0;
  return emptyPriceTiers(n);
}
