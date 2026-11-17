import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { EventItem } from "../../types";
import { normalizeLang } from "../../utils/langUrl";
import { eventCoversDay, getEventCalendarRange } from "../../utils/eventCalendarRange";
import MonthCalendar from "./MonthCalendar";
import CalendarEventDetail from "./CalendarEventDetail";
import CalendarEventList from "./CalendarEventList";
import type { DayMark } from "./CalendarDayCell";

const API_URL = process.env.REACT_APP_API_URL;

function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function dayInViewMonth(isoDay: string, year: number, month: number): boolean {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return isoDay.startsWith(prefix);
}

export default function EventsCalendarPage() {
  const { t, i18n } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calendarTopRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const lang = normalizeLang(i18n.language) ?? "be";
        const response = await fetch(`${API_URL}/events/calendar?lang=${lang}`);
        if (!response.ok) {
          throw new Error("Failed to load calendar events");
        }
        const data = (await response.json()) as EventItem[];
        if (!cancelled) setEvents(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
          setEvents([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [i18n.language]);

  const dayMarks = useMemo(() => {
    const marks: Record<string, DayMark> = {};
    for (const event of events) {
      const range = getEventCalendarRange(event);
      if (!range) continue;
      for (const day of range.days) {
        const prev = marks[day] ?? "none";
        if (prev === "none") {
          marks[day] = range.kind;
        } else if (prev !== range.kind) {
          marks[day] = "mixed";
        }
      }
    }
    return marks;
  }, [events]);

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    return events.filter((event) => eventCoversDay(event, selectedDay));
  }, [events, selectedDay]);

  const handlePrevMonth = useCallback(() => {
    const next = shiftMonth(year, month, -1);
    setYear(next.year);
    setMonth(next.month);
    setSelectedDay((prev) => (prev && dayInViewMonth(prev, next.year, next.month) ? prev : null));
  }, [year, month]);

  const handleNextMonth = useCallback(() => {
    const next = shiftMonth(year, month, 1);
    setYear(next.year);
    setMonth(next.month);
    setSelectedDay((prev) => (prev && dayInViewMonth(prev, next.year, next.month) ? prev : null));
  }, [year, month]);

  const handleSelectEvent = useCallback((event: EventItem) => {
    const range = getEventCalendarRange(event);
    const jumpDay = range?.anchor ?? null;
    if (jumpDay) {
      const [y, m] = jumpDay.split("-").map(Number);
      setYear(y);
      setMonth(m - 1);
      setSelectedDay(jumpDay);
    } else {
      setSelectedDay(null);
    }
    calendarTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 1.5, sm: 2 }, py: { xs: 3, sm: 5 } }}>
      <Box ref={calendarTopRef} sx={{ mb: 2.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {t("calendar.title")}
        </Typography>
        <Typography color="text.secondary">{t("calendar.subtitle")}</Typography>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && (
        <>
          <Box
            sx={{
              p: { xs: 1.5, sm: 2.5 },
              borderRadius: 3,
              bgcolor: "background.paper",
              boxShadow: "0 2px 12px rgba(31, 41, 51, 0.06)"
            }}
          >
            <MonthCalendar
              year={year}
              month={month}
              selectedDay={selectedDay}
              dayMarks={dayMarks}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSelectDay={setSelectedDay}
            />
            <CalendarEventDetail events={selectedEvents} selectedDay={selectedDay} />
          </Box>

          <CalendarEventList events={events} onSelectEvent={handleSelectEvent} />
        </>
      )}
    </Box>
  );
}
