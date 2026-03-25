import React from "react";
import { Tooltip, Typography } from "@mui/material";

export default function ClampedTitle({
  text,
  lines = 2
}: {
  text: string;
  lines?: number;
}) {
  return (
    <Tooltip
      arrow
      placement="top-start"
      disableInteractive
      title={<Typography sx={{ textAlign: "left", maxWidth: 260 }}>{text}</Typography>}
    >
      <span>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            display: "-webkit-box",
            WebkitLineClamp: lines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: lines === 2 ? "2.9em" : "auto"
          }}
        >
          {text}
        </Typography>
      </span>
    </Tooltip>
  );
}

