import React, { useEffect } from "react";
import { Box, Container, Typography } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { fetchEvents } from "../store/eventsSlice"; // Import Redux action
import EventShort from "./EventShort";
import { useTranslation } from "react-i18next";

export default function Events() {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Get events from Redux
  const events = useSelector((state) => state.events.items);
  const loading = useSelector((state) => state.events.loading);
  const error = useSelector((state) => state.events.error);

  // Fetch only if events are empty
  useEffect(() => {
    if (events.length === 0) {
      dispatch(fetchEvents());
    }
  }, [dispatch, events.length]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <Container>
      <Typography variant="h4" gutterBottom align="center">
        {t("events")}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 2,
          p: 2,
        }}
      >
        {events.map((evt, index) => (
          <EventShort key={index} data={evt} />
        ))}
      </Box>
    </Container>
  );
}
