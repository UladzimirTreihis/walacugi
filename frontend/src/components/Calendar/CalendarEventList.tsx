import React from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { EventItem } from "../../types";
import formatDateEU from "../../utils/formatDateEU";
import { getEventCalendarRange } from "../../utils/eventCalendarRange";

interface CalendarEventListProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
}

function formatBudget(event: EventItem): string | null {
  if (!event.budget && !event.currency) return null;
  if (event.budget && event.currency) return `${event.budget} ${event.currency}`;
  return event.budget || event.currency || null;
}

function formatLine(event: EventItem): string {
  const parts: string[] = [];
  if (event.startDate && event.endDate) {
    parts.push(`${formatDateEU(event.startDate)} — ${formatDateEU(event.endDate)}`);
  } else if (event.approxDate?.trim()) {
    parts.push(event.approxDate);
  } else {
    const range = getEventCalendarRange(event);
    if (range) parts.push(formatDateEU(range.anchor) ?? range.anchor);
  }
  if (event.ageRestriction) parts.push(event.ageRestriction);
  const budget = formatBudget(event);
  if (budget) parts.push(budget);
  return parts.join(" · ");
}

export default function CalendarEventList({ events, onSelectEvent }: CalendarEventListProps) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        mt: 2.5,
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        bgcolor: "background.paper",
        boxShadow: "0 2px 12px rgba(31, 41, 51, 0.06)"
      }}
    >
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
        {t("calendar.allEvents")}
      </Typography>
      {events.length === 0 ? (
        <Typography color="text.secondary">{t("calendar.emptyList")}</Typography>
      ) : (
        events.map((event) => (
          <Box
            key={event._id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectEvent(event)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectEvent(event);
              }
            }}
            sx={{
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
              cursor: "pointer",
              "&:last-child": { borderBottom: 0 },
              "&:hover strong": { color: "secondary.dark" }
            }}
          >
            <Typography component="strong" sx={{ display: "block", fontWeight: 700 }}>
              {event.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatLine(event)}
            </Typography>
          </Box>
        ))
      )}
    </Box>
  );
}
