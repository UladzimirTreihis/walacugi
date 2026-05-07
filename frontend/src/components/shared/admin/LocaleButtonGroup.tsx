import React from "react";
import { Button, ButtonGroup } from "@mui/material";
import { LOCALES, type Locale } from "../../../types/localization";

interface LocaleButtonGroupProps {
  activeLocale: Locale;
  onChange: (locale: Locale) => void;
}

export default function LocaleButtonGroup({ activeLocale, onChange }: LocaleButtonGroupProps) {
  return (
    <ButtonGroup size="small" variant="outlined">
      {LOCALES.map((locale) => (
        <Button
          key={locale}
          variant={activeLocale === locale ? "contained" : "outlined"}
          onClick={() => onChange(locale)}
        >
          {locale.toUpperCase()}
        </Button>
      ))}
    </ButtonGroup>
  );
}
