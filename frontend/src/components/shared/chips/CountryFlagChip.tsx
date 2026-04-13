import React from "react";
import { Chip } from "@mui/material";
import { COUNTRY_BY_CODE, getFlagEmoji } from "../../../constants/countries";
import { overlayOutlinedChipSx } from "./overlayChipStyles";

interface CountryFlagChipProps {
  code: string;
}

export default function CountryFlagChip({ code }: CountryFlagChipProps) {
  const meta = COUNTRY_BY_CODE[code];
  const name = meta?.name ?? code.toUpperCase();
  return (
    <Chip
      label={`${getFlagEmoji(code)} ${name}`}
      color="primary"
      variant="outlined"
      size="small"
      sx={overlayOutlinedChipSx}
    />
  );
}
