import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Container, Chip, Stack, Divider, Button } from "@mui/material";
import Carousel from "react-material-ui-carousel";
import { useSelector, useDispatch } from "react-redux";
import { fetchEvents } from "../store/eventsSlice";
import DOMPurify from "dompurify";
import type { RootState } from "../store/store";
import { COUNTRY_BY_CODE, getFlagEmoji } from "../constants/countries";
import formatDateEU from "../utils/formatDateEU";
import { useTranslation } from "react-i18next";

export default function EventFull() {
  const { t } = useTranslation();
  const { eventId } = useParams<{ eventId: string }>();
  const dispatch = useDispatch();
  const eventsList = useSelector((state: RootState) => state.events.items);
  const loading = useSelector((state: RootState) => state.events.loading);
  const error = useSelector((state: RootState) => state.events.error);
  const event = eventsList.find((item) => item._id === eventId);

  useEffect(() => {
    if (!event) {
      // @ts-expect-error thunk typing
      dispatch(fetchEvents());
    }
  }, [dispatch, event]);

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
