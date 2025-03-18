// Events.js
import React from "react";
import { Box, Container, Typography } from "@mui/material";
import EventShort from "./EventShort";
import { useTranslation } from "react-i18next";


export default function Events({ events }) {
  const {t} = useTranslation();

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
