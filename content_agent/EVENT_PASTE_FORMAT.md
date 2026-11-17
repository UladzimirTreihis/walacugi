# Walacugi event paste format (for AI + admins)

Give this file to an AI together with raw trip text. The AI must output **only** text in this format (no markdown fences, no commentary). Admins paste that output into **Admin → Import Event**.

Images are **not** included; add them later in the edit UI.

---

## Rules (strict)

1. Start every event with a line that is exactly: `WALACUGI_EVENT_V1`
2. One event per block. Multiple events = multiple blocks one after another.
3. Use **exact keys** below. Keys are case-sensitive.
4. Single-line fields: `key: value` (space after colon optional). Empty value allowed: `key:`
5. Multiline fields (`description.*` only) use block markers:

```text
description.be<<
paragraph or HTML here
more lines ok
>>
```

6. Locales: always fill **be**, **en**, and **pl** for every localized field (use `""` empty only when truly unknown — prefer translating).
7. Dates must be `yyyy-mm-dd` or empty. Provide **at least one** of `startDate` or `datedAt`.
8. `countries`: lowercase ISO-ish codes, comma-separated, no spaces required (`es` or `es,pt`). Use codes from `content_agent/countries.json` (Belarus = `by`, Belgium = `be`).
9. `difficultyLevel`: integer 1–5. If not provided, estimate.
10. `pinned`: `true` or `false`. Default false unless specified otherwise.
11. `currency`: short code like `EUR`. Assume EUR as default if not specified.
12. `budget`: number or short range as text (`490` or `300-500`).
13. Do **not** invent `images`. Do **not** add extra keys.
14. HTML in descriptions is allowed (`<p>`, `<strong>`, `<br>`, lists, links). Keep structure parallel across be/en/pl.
15. Output **only** the paste blocks — no preamble (“Sure!”), no ``` fences.

---

## Required keys (every event)

```text
WALACUGI_EVENT_V1
title.be:
title.en:
title.pl:
location.be:
location.en:
location.pl:
description.be<<
>>
description.en<<
>>
description.pl<<
>>
approxDate.be:
approxDate.en:
approxDate.pl:
ageRestriction.be:
ageRestriction.en:
ageRestriction.pl:
budget:
currency:
startDate:
endDate:
datedAt:
countries:
chatLink:
difficultyLevel:
pinned:
```

Validation extras:
- `title.be` must be non-empty after trim.
- `startDate` or `datedAt` must be a valid `yyyy-mm-dd`.

---

## Example

```text
WALACUGI_EVENT_V1
title.be: Паўднёвае ўзбярэжжа Іспаніі і Гібралтар: пешы паход + віафераты
title.en: Southern coast of Spain and Gibraltar: hiking + via ferrata
title.pl: Południowe wybrzeże Hiszpanii i Gibraltar: trekking + via ferrata
location.be: Паўднёвая Іспанія / Гібралтар
location.en: Southern Spain / Gibraltar
location.pl: Południowa Hiszpania / Gibraltar
description.be<<
<p>Семь дней вдоль Средиземного моря и Атлантики. Маршрут E9–GR92.</p>
>>
description.en<<
<p>Seven days along the Mediterranean and the Atlantic. Route E9–GR92.</p>
>>
description.pl<<
<p>Siedem dni wzdłuż Morza Śródziemnego i Atlantyku. Trasa E9–GR92.</p>
>>
approxDate.be:
approxDate.en:
approxDate.pl:
ageRestriction.be: 10+
ageRestriction.en: 10+
ageRestriction.pl: 10+
budget: 490
currency: EUR
startDate: 2027-04-10
endDate: 2027-04-17
datedAt: 2027-04-10
countries: es
chatLink:
difficultyLevel: 3
pinned: false
```

---

## Admin workflow

1. Copy raw chat/announcement text.
2. Attach this rules file + `countries.json` (for codes).
3. Ask AI: “Convert to WALACUGI_EVENT_V1 paste format only.”
4. Paste AI output into Admin → **Import Event** → Create.
5. Open the created event and add images.
