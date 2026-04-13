import React from "react";
import { Chip } from "@mui/material";
import { overlayOutlinedChipSx } from "./overlayChipStyles";

interface CalendarDateChipProps {
  /** Pre-formatted date string (e.g. from formatDateEU) */
  datedLabel: string;
}

export default function CalendarDateChip({ datedLabel }: CalendarDateChipProps) {
  return (
    <Chip
      label={`🗓️ ${datedLabel}`}
      color="primary"
      variant="outlined"
      size="small"
      sx={overlayOutlinedChipSx}
    />
  );
}
