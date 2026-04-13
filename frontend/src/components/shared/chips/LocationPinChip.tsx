import React from "react";
import { Chip } from "@mui/material";
import { overlayOutlinedChipSx } from "./overlayChipStyles";

interface LocationPinChipProps {
  location: string;
}

export default function LocationPinChip({ location }: LocationPinChipProps) {
  return (
    <Chip
      label={`📍 ${location}`}
      color="primary"
      variant="outlined"
      size="small"
      sx={overlayOutlinedChipSx}
    />
  );
}
