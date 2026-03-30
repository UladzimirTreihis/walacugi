const PAD = (n: number) => String(n).padStart(2, "0");

function parseDateOnly(value: string) {
  // Handles `YYYY-MM-DD` from <input type="date" />
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

export default function formatDateEU(input?: string | Date | null): string | null {
  if (!input) return null;

  const date =
    typeof input === "string"
      ? parseDateOnly(input) ?? new Date(input)
      : input;

  if (Number.isNaN(date.getTime())) return null;

  const day = PAD(date.getDate());
  const month = PAD(date.getMonth() + 1);
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

