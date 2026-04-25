import React, { useEffect } from "react";
import { Box, Container, Typography } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { fetchEvents } from "../store/eventsSlice";
import EventShort from "./EventShort";
import { useTranslation } from "react-i18next";
import type { RootState } from "../store/store";

export default function Events() {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();

  const events = useSelector((state: RootState) => state.events.items);
  const loading = useSelector((state: RootState) => state.events.loading);
  const error = useSelector((state: RootState) => state.events.error);

  useEffect(() => {
    // @ts-expect-error thunk typing
    dispatch(fetchEvents(i18n.language));
  }, [dispatch, i18n.language]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <Container sx={{ py: 10 }}>
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
          <Box
            key={index}
            sx={{
              flex: "1 1 calc(33% - 16px)",
              minWidth: "250px",
              display: "flex"
            }}
          >
            <EventShort data={evt} />
          </Box>
        ))}
      </Box>
    </Container>
  );
}
