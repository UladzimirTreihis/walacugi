/**
 * Normalize a single translated field from an LLM JSON response into a string.
 * Models sometimes return null, numbers, or structured location objects/arrays.
 */
export function coerceTranslatedField(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  if (Array.isArray(value)) {
    return value
      .map((item) => coerceTranslatedField(item))
      .filter((s) => s.length > 0)
      .join(", ");
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["name", "title", "text", "value", "label", "city", "place"]) {
      if (typeof obj[key] === "string" && obj[key].trim()) {
        return obj[key];
      }
    }
    const stringValues = Object.values(obj)
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0);
    if (stringValues.length > 0) {
      return stringValues.join(", ");
    }
    return "";
  }

  return "";
}
