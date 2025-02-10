// Events.js
import React from "react";
import { Box } from "@mui/material";
import EventShort from "./EventShort";

export default function Events({ events }) {
  return (
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
  );
}
