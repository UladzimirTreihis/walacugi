import React from "react";
import { Box, Button, Chip, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";
import type { EventItem } from "../../types";
import formatDateEU from "../../utils/formatDateEU";
import { getEventCalendarRange } from "../../utils/eventCalendarRange";
import { addLangToPath } from "../../utils/langUrl";

interface CalendarEventDetailProps {
  events: EventItem[];
  selectedDay: string | null;
}

function formatBudget(event: EventItem): string | null {
  if (!event.budget && !event.currency) return null;
  if (event.budget && event.currency) return `${event.budget} ${event.currency}`;
  return event.budget || event.currency || null;
}

function formatDates(event: EventItem): string {
  const range = getEventCalendarRange(event);
  if (event.startDate && event.endDate) {
    return `${formatDateEU(event.startDate)} — ${formatDateEU(event.endDate)}`;
  }
  if (event.approxDate?.trim()) return event.approxDate;
  if (range) return formatDateEU(range.anchor) ?? range.anchor;
  return "—";
}

export default function CalendarEventDetail({ events, selectedDay }: CalendarEventDetailProps) {
  const { t, i18n } = useTranslation();

  if (!selectedDay) {
    return (
      <Box
        sx={{
          mt: 2,
          p: 2.5,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper"
        }}
      >
        <Typography color="text.secondary">{t("calendar.selectDayHint")}</Typography>
      </Box>
    );
  }

  if (events.length === 0) {
    return (
      <Box
        sx={{
          mt: 2,
          p: 2.5,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper"
        }}
      >
        <Typography color="text.secondary">
          {t("calendar.noEventOnDay", { date: formatDateEU(selectedDay) })}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
      {events.map((event, index) => {
        const range = getEventCalendarRange(event);
        const uncertain = range?.kind === "uncertain";
        const budget = formatBudget(event);
        return (
          <Box
            key={event._id}
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper"
            }}
          >
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
              <Chip
                size="small"
                label={t("calendar.eventTag", { n: index + 1 })}
                sx={{
                  fontWeight: 700,
                  bgcolor: (theme) =>
                    uncertain ? `${theme.palette.warning.main}22` : `${theme.palette.secondary.main}18`,
                  color: uncertain ? "warning.dark" : "secondary.dark"
                }}
              />
              {uncertain && (
                <Chip size="small" label={t("calendar.uncertain")} color="warning" variant="outlined" />
              )}
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {event.title}
            </Typography>
            {event.location && (
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
                {event.location}
              </Typography>
            )}

            <Typography
              variant="body1"
              component="div"
              sx={{
                color: "text.secondary",
                "& p": { mt: 0, mb: 1 },
                "& p:last-child": { mb: 0 }
              }}
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description || "") }}
            />

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: { xs: 2, sm: 3 },
                mt: 2.5,
                fontSize: 14
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {t("calendar.metaDates")}
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {formatDates(event)}
                </Typography>
              </Box>
              {event.ageRestriction && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {t("calendar.metaAge")}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {event.ageRestriction}
                  </Typography>
                </Box>
              )}
              {budget && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {t("calendar.metaBudget")}
                  </Typography>
                  <Typography variant="body2" fontWeight={700}>
                    {budget}
                  </Typography>
                </Box>
              )}
            </Box>

            <Button
              component={RouterLink}
              to={addLangToPath(`/events/${event._id}`, i18n.language)}
              variant="text"
              color="secondary"
              sx={{ mt: 1.5, px: 0, fontWeight: 700 }}
            >
              {t("calendar.openEvent")}
            </Button>
          </Box>
        );
      })}
    </Box>
  );
}
