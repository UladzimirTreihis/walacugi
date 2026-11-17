import React from "react";
import { Box, ButtonBase } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

export type DayMark = "none" | "confirmed" | "uncertain" | "mixed";

interface CalendarDayCellProps {
  dayNumber: number;
  isoDay: string;
  mark: DayMark;
  selected: boolean;
  isToday: boolean;
  onSelect: (isoDay: string) => void;
}

export default function CalendarDayCell({
  dayNumber,
  isoDay,
  mark,
  selected,
  isToday,
  onSelect
}: CalendarDayCellProps) {
  const theme = useTheme();
  const hasEvent = mark !== "none";

  let bg = theme.palette.background.paper;
  let border = theme.palette.divider;
  let color = theme.palette.text.primary;
  let dot = theme.palette.secondary.main;

  if (mark === "confirmed") {
    bg = alpha(theme.palette.secondary.main, 0.15);
    border = alpha(theme.palette.secondary.main, 0.45);
    dot = theme.palette.secondary.main;
  } else if (mark === "uncertain") {
    bg = alpha(theme.palette.warning.main, 0.18);
    border = alpha(theme.palette.warning.main, 0.5);
    dot = theme.palette.warning.main;
  } else if (mark === "mixed") {
    bg = alpha(theme.palette.secondary.main, 0.12);
    border = alpha(theme.palette.warning.main, 0.55);
    dot = theme.palette.secondary.dark;
  }

  if (selected) {
    bg = theme.palette.secondary.dark;
    border = theme.palette.secondary.dark;
    color = theme.palette.secondary.contrastText;
    dot = theme.palette.common.white;
  }

  return (
    <ButtonBase
      onClick={() => onSelect(isoDay)}
      aria-label={isoDay}
      aria-pressed={selected}
      sx={{
        minHeight: { xs: 46, sm: 54 },
        width: "100%",
        borderRadius: 2,
        border: "1px solid",
        borderColor: selected ? border : isToday ? theme.palette.primary.main : border,
        borderWidth: isToday && !selected ? 2 : 1,
        bgcolor: bg,
        color,
        fontWeight: hasEvent ? 700 : 500,
        fontSize: { xs: 14, sm: 15 },
        position: "relative",
        transition: "background-color 0.15s ease, border-color 0.15s ease",
        "&:hover": {
          bgcolor: selected ? theme.palette.secondary.dark : alpha(theme.palette.secondary.main, 0.08)
        }
      }}
    >
      {dayNumber}
      {hasEvent && (
        <Box
          component="span"
          sx={{
            position: "absolute",
            bottom: 6,
            left: "50%",
            width: 6,
            height: 6,
            ml: "-3px",
            borderRadius: "50%",
            bgcolor: dot
          }}
        />
      )}
    </ButtonBase>
  );
}
