import React from "react";
import { Typography } from "@mui/material";
import DOMPurify from "dompurify";

export default function ClampedHtml({
  html,
  lines = 4,
  minHeight = "6.2em"
}: {
  html: string;
  lines?: number;
  minHeight?: string;
}) {
  return (
    <Typography
      variant="body2"
      sx={{
        display: "-webkit-box",
        WebkitLineClamp: lines,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        minHeight
      }}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  );
}

