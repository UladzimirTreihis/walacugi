import React from "react";
import { Chip } from "@mui/material";

interface PinnedChipProps {
  label?: string;
}

export default function PinnedChip({ label = "📌 Pinned" }: PinnedChipProps) {
  return (
    <Chip
      label={label}
      color="warning"
      size="small"
      sx={{ bgcolor: "rgba(255,255,255,0.92)", fontWeight: 700 }}
    />
  );
}
