export interface CountryOption {
  code: string;
  name: string;
  aliases?: string[];
}

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "pl", name: "Poland", aliases: ["polska"] },
  { code: "by", name: "Belarus"},
  { code: "lt", name: "Lithuania" },
  { code: "lv", name: "Latvia" },
  { code: "ee", name: "Estonia" },
  { code: "ua", name: "Ukraine" },
  { code: "de", name: "Germany", aliases: ["deutschland"] },
  { code: "fr", name: "France" },
  { code: "it", name: "Italy" },
  { code: "es", name: "Spain" },
  { code: "pt", name: "Portugal" },
  { code: "nl", name: "Netherlands", aliases: ["holland"] },
  { code: "be", name: "Belgium" },
  { code: "dk", name: "Denmark" },
  { code: "se", name: "Sweden" },
  { code: "no", name: "Norway" },
  { code: "fi", name: "Finland" },
  { code: "gb", name: "United Kingdom", aliases: ["uk", "great britain", "britain", "england"] },
  { code: "ie", name: "Ireland" },
  { code: "ch", name: "Switzerland" },
  { code: "at", name: "Austria" },
  { code: "cz", name: "Czech Republic", aliases: ["czechia"] },
  { code: "sk", name: "Slovakia" },
  { code: "hu", name: "Hungary" },
  { code: "ro", name: "Romania" },
  { code: "bg", name: "Bulgaria" },
  { code: "hr", name: "Croatia" },
  { code: "si", name: "Slovenia" },
  { code: "gr", name: "Greece" },
  { code: "tr", name: "Turkey", aliases: ["turkiye"] },
  { code: "ge", name: "Georgia" },
  { code: "am", name: "Armenia" },
  { code: "kz", name: "Kazakhstan" },
  { code: "uz", name: "Uzbekistan" },
  { code: "ae", name: "United Arab Emirates", aliases: ["uae"] },
  { code: "il", name: "Israel" },
  { code: "eg", name: "Egypt" },
  { code: "ma", name: "Morocco" },
  { code: "us", name: "United States", aliases: ["usa", "united states of america", "america"] },
  { code: "ca", name: "Canada" },
  { code: "mx", name: "Mexico" },
  { code: "br", name: "Brazil" },
  { code: "ar", name: "Argentina" },
  { code: "pe", name: "Peru" },
  { code: "co", name: "Colombia" },
  { code: "ve", name: "Venezuela" },
  { code: "ec", name: "Ecuador" },
  { code: "bo", name: "Bolivia" },
  { code: "py", name: "Paraguay" },
  { code: "uy", name: "Uruguay" },
  { code: "sr", name: "Suriname" },
  { code: "gy", name: "Guyana" },
  { code: "cl", name: "Chile" },
  { code: "za", name: "South Africa" },
  { code: "ng", name: "Nigeria" },
  { code: "ke", name: "Kenya" },
  { code: "tz", name: "Tanzania" },
  { code: "gh", name: "Ghana" },
  { code: "et", name: "Ethiopia" },
  { code: "qa", name: "Qatar" },
  { code: "sa", name: "Saudi Arabia" },
  { code: "jo", name: "Jordan" },
  { code: "lb", name: "Lebanon" },
  { code: "iq", name: "Iraq" },
  { code: "ir", name: "Iran" },
  { code: "pk", name: "Pakistan" },
  { code: "bd", name: "Bangladesh" },
  { code: "lk", name: "Sri Lanka" },
  { code: "np", name: "Nepal" },
  { code: "ph", name: "Philippines" },
  { code: "kh", name: "Cambodia" },
  { code: "la", name: "Laos" },
  { code: "mm", name: "Myanmar", aliases: ["burma"] },
  { code: "tw", name: "Taiwan" },
  { code: "mn", name: "Mongolia" },
  { code: "ru", name: "Russia" },
  { code: "rs", name: "Serbia" },
  { code: "me", name: "Montenegro" },
  { code: "ba", name: "Bosnia and Herzegovina", aliases: ["bosnia"] },
  { code: "al", name: "Albania" },
  { code: "mk", name: "North Macedonia", aliases: ["macedonia"] },
  { code: "md", name: "Moldova" },
  { code: "lu", name: "Luxembourg" },
  { code: "is", name: "Iceland" },
  { code: "mt", name: "Malta" },
  { code: "cy", name: "Cyprus" },
  { code: "jp", name: "Japan" },
  { code: "kr", name: "South Korea", aliases: ["korea"] },
  { code: "cn", name: "China" },
  { code: "in", name: "India" },
  { code: "th", name: "Thailand" },
  { code: "vn", name: "Vietnam" },
  { code: "id", name: "Indonesia" },
  { code: "sg", name: "Singapore" },
  { code: "my", name: "Malaysia" },
  { code: "au", name: "Australia" },
  { code: "nz", name: "New Zealand" }
];

export const COUNTRY_BY_CODE: Record<string, CountryOption> = COUNTRY_OPTIONS.reduce(
  (acc, option) => {
    acc[option.code] = option;
    return acc;
  },
  {} as Record<string, CountryOption>
);

export function getFlagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return countryCode.toUpperCase();
  const chars = [...code].map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...chars);
}

export function countryMatchesQuery(option: CountryOption, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;
  if (option.name.toLowerCase().includes(query)) return true;
  if (option.code.toLowerCase().includes(query)) return true;
  return (option.aliases ?? []).some((alias) => alias.toLowerCase().includes(query));
}
