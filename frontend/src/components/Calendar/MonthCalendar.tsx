import React, { useMemo } from "react";
import { Box, IconButton, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useTranslation } from "react-i18next";
import CalendarDayCell, { type DayMark } from "./CalendarDayCell";

interface MonthCalendarProps {
  year: number;
  month: number; // 0-based
  selectedDay: string | null;
  dayMarks: Record<string, DayMark>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (isoDay: string) => void;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}

function todayIso(): string {
  const now = new Date();
  return toIso(now.getFullYear(), now.getMonth(), now.getDate());
}

export default function MonthCalendar({
  year,
  month,
  selectedDay,
  dayMarks,
  onPrevMonth,
  onNextMonth,
  onSelectDay
}: MonthCalendarProps) {
  const { i18n, t } = useTranslation();
  const locale = i18n.language || "be";

  const monthTitle = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
    const label = formatter.format(new Date(year, month, 1));
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [locale, year, month]);

  const weekdays = useMemo(() => {
    // Monday-first labels via a known week (2024-01-01 was Monday)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.UTC(2024, 0, 1 + i));
      return new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d);
    });
  }, [locale]);

  const cells = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
    const items: Array<{ key: string; day?: number; iso?: string }> = [];
    for (let i = 0; i < offset; i += 1) {
      items.push({ key: `pad-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const iso = toIso(year, month, d);
      items.push({ key: iso, day: d, iso });
    }
    return items;
  }, [year, month]);

  const today = todayIso();

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <IconButton aria-label={t("calendar.prevMonth")} onClick={onPrevMonth} size="small">
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, textAlign: "center" }}>
          {monthTitle}
        </Typography>
        <IconButton aria-label={t("calendar.nextMonth")} onClick={onNextMonth} size="small">
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.75,
          mb: 0.75
        }}
      >
        {weekdays.map((label) => (
          <Typography
            key={label}
            variant="caption"
            align="center"
            color="text.secondary"
            sx={{ fontWeight: 600, py: 0.5 }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.75
        }}
      >
        {cells.map((cell) =>
          cell.iso && cell.day != null ? (
            <CalendarDayCell
              key={cell.key}
              dayNumber={cell.day}
              isoDay={cell.iso}
              mark={dayMarks[cell.iso] ?? "none"}
              selected={selectedDay === cell.iso}
              isToday={cell.iso === today}
              onSelect={onSelectDay}
            />
          ) : (
            <Box key={cell.key} />
          )
        )}
      </Box>
    </Box>
  );
}
