import React from "react";
import { Stack, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  EQUIPMENT_PRICE_BRACKETS,
  emptyPriceTiers,
  type PriceTierKey,
  type PriceTiers
} from "../../utils/equipmentPricing";

interface AdminPriceTiersFieldsProps {
  value: PriceTiers;
  onChange: (next: PriceTiers) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  disabled?: boolean;
}

export function parseTierInput(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(",", ".").trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function tiersFromStringMap(map: Record<PriceTierKey, string>): PriceTiers | null {
  const out = emptyPriceTiers();
  for (const bracket of EQUIPMENT_PRICE_BRACKETS) {
    const parsed = parseTierInput(map[bracket.key] ?? "");
    if (parsed == null) return null;
    out[bracket.key] = parsed;
  }
  return out;
}

export default function AdminPriceTiersFields({
  value,
  onChange,
  currency,
  onCurrencyChange,
  disabled
}: AdminPriceTiersFieldsProps) {
  const { t } = useTranslation();

  const setTier = (key: PriceTierKey, raw: string) => {
    const parsed = parseTierInput(raw);
    onChange({
      ...value,
      [key]: parsed ?? 0
    });
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2">{t("equipment.priceTiersTitle")}</Typography>
      {EQUIPMENT_PRICE_BRACKETS.map((bracket) => (
        <TextField
          key={bracket.key}
          type="number"
          label={t(bracket.labelKey)}
          value={value[bracket.key]}
          onChange={(e) => setTier(bracket.key, e.target.value)}
          disabled={disabled}
          inputProps={{ min: 0, step: "0.01" }}
          fullWidth
        />
      ))}
      <TextField
        label={t("equipment.currency")}
        value={currency}
        onChange={(e) => onCurrencyChange(e.target.value)}
        disabled={disabled}
        fullWidth
      />
    </Stack>
  );
}
