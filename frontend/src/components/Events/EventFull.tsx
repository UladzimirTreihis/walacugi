import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Container, Chip, Stack, Divider, Button } from "@mui/material";
import Carousel from "react-material-ui-carousel";
import { useSelector, useDispatch } from "react-redux";
import { fetchEvents } from "../../store/eventsSlice";
import DOMPurify from "dompurify";
import type { AppDispatch, RootState } from "../../store/store";
import type { EventItem } from "../../types";
import { COUNTRY_BY_CODE, getFlagEmoji } from "../../constants/countries";
import formatDateEU from "../../utils/formatDateEU";
import { normalizeLang } from "../../utils/langUrl";
import { useTranslation } from "react-i18next";

const API_URL = process.env.REACT_APP_API_URL;

export default function EventFull() {
  const { t, i18n } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const eventsList = useSelector((state: RootState) => state.events.items);
  const listLoading = useSelector((state: RootState) => state.events.loading);
  const listError = useSelector((state: RootState) => state.events.error);
  const fromList = eventsList.find((item) => item._id === eventId);
  const [fetchedEvent, setFetchedEvent] = useState<EventItem | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchEvents(i18n.language));
  }, [dispatch, i18n.language]);

  useEffect(() => {
    if (!eventId || fromList) {
      setFetchedEvent(null);
      setFetchError(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setFetchLoading(true);
      setFetchError(null);
      try {
        const lang = normalizeLang(i18n.language) ?? "be";
        const response = await fetch(`${API_URL}/events/${eventId}?lang=${lang}`);
        if (!response.ok) {
          throw new Error(response.status === 404 ? "Event not found" : "Failed to load event");
        }
        const data = (await response.json()) as EventItem;
        if (!cancelled) setFetchedEvent(data);
      } catch (err) {
        if (!cancelled) {
          setFetchedEvent(null);
          setFetchError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [eventId, fromList, i18n.language]);

  const event = fromList ?? fetchedEvent;
  const loading = listLoading || fetchLoading;
  const error = fetchError || (!fromList && !fetchedEvent ? listError : null);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!event) return <Typography variant="h6">Event not found</Typography>;

  const dateRange =
    event.startDate && event.endDate
      ? `${formatDateEU(event.startDate)} - ${formatDateEU(event.endDate)}`
      : null;

  const hasMeta =
    event.location ||
    event.budget ||
    event.currency ||
    event.approxDate ||
    dateRange ||
    event.ageRestriction ||
    event.chatLink ||
    (event.countries && event.countries.length > 0) ||
    event.difficultyLevel;

  const difficultyLabel = event.difficultyLevel
    ? `${"★".repeat(event.difficultyLevel)}${"☆".repeat(5 - event.difficultyLevel)}`
    : null;

  return (
    <Container sx={{ py: 10 }}>
      <Box sx={{ maxWidth: 1100, mx: "auto" }}>
        <Typography variant="h4" fontWeight={700} align="center" sx={{ mb: 3 }}>
          {event.title}
        </Typography>

        <Box sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}>
          <Carousel autoPlay={false} animation="slide" navButtonsAlwaysVisible>
            {event.images.map((img, idx) => (
              <Box
                component="img"
                sx={{ width: "100%", maxHeight: 520, objectFit: "cover", background: "#000" }}
                src={img}
                alt={`event-${idx}`}
                key={idx}
              />
            ))}
          </Carousel>
        </Box>

        {hasMeta && (
          <Box
            sx={{
              p: 2.5,
              borderRadius: 2,
              mb: 3,
              bgcolor: "background.paper",
              boxShadow: 2
            }}
          >
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
              {event.location && <Chip label={`📍 ${event.location}`} color="primary" variant="outlined" />}
              {dateRange && <Chip label={`📅 ${dateRange}`} color="primary" variant="outlined" />}
              {event.approxDate && <Chip label={`🗓️ ${event.approxDate}`} color="secondary" variant="outlined" />}
              {(event.budget || event.currency) && (
                <Chip
                  label={`💸 ${event.budget ?? ""}${event.currency ? ` ${event.currency}` : ""}`}
                  color="secondary"
                  variant="outlined"
                />
              )}
              {event.ageRestriction && <Chip label={`🧭 Age: ${event.ageRestriction}`} variant="outlined" />}
              {event.countries &&
                event.countries.map((country) => {
                  const countryMeta = COUNTRY_BY_CODE[country];
                  const label = countryMeta ? countryMeta.name : country.toUpperCase();
                  return (
                    <Chip
                      key={country}
                      label={`${getFlagEmoji(country)} ${label}`}
                      color="primary"
                      variant="outlined"
                    />
                  );
                })}
              {difficultyLabel && <Chip label={`⭐ Difficulty: ${difficultyLabel}`} variant="outlined" />}
            </Stack>

            {event.chatLink && (
              <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  href={event.chatLink}
                  target="_blank"
                  rel="noreferrer"
                  sx={{ px: 4, py: 1.2, fontSize: "1rem", fontWeight: 700 }}
                >
                  👇 {t("join_chat")} 👇
                </Button>
              </Box>
            )}
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />
        <Typography
          variant="body1"
          sx={{ lineHeight: 1.8 }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description) }}
        />
      </Box>
    </Container>
  );
}
