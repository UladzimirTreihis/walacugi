import React from "react";
import { Box, Chip, Stack } from "@mui/material";
import { COUNTRY_BY_CODE, getFlagEmoji } from "../../../constants/countries";

interface NewsOverlayTagsProps {
  location?: string;
  countries?: string[];
  datedTag?: string | null;
}

export default function NewsOverlayTags({ location, countries, datedTag }: NewsOverlayTagsProps) {
  const hasOverlayTags = Boolean(location) || Boolean(countries?.length) || Boolean(datedTag);
  if (!hasOverlayTags) return null;

  return (
    <Box sx={{ position: "absolute", top: 12, left: 12, right: 12, zIndex: 2 }}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ justifyContent: "center" }}>
        {location && (
          <Chip
            label={`📍 ${location}`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ bgcolor: "rgba(255,255,255,0.85) !important" }}
          />
        )}
        {countries?.map((code) => {
          const meta = COUNTRY_BY_CODE[code];
          const name = meta?.name ?? code.toUpperCase();
          return (
            <Chip
              key={code}
              label={`${getFlagEmoji(code)} ${name}`}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.85) !important" }}
            />
          );
        })}
        {datedTag && (
          <Chip
            label={`🗓️ ${datedTag}`}
            color="primary"
            variant="outlined"
            size="small"
            sx={{ bgcolor: "rgba(255,255,255,0.85) !important" }}
          />
        )}
      </Stack>
    </Box>
  );
}
