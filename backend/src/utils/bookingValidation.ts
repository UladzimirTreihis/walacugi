export interface DateRangeLike {
  startDate: Date;
  endDate: Date;
}

export function isValidDateRange(startDate: Date, endDate: Date): boolean {
  return !Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && startDate < endDate;
}

export function rangesOverlap(a: DateRangeLike, b: DateRangeLike): boolean {
  return a.startDate < b.endDate && b.startDate < a.endDate;
}
