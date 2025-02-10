// EventFull.js
import React from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import Carousel from "react-material-ui-carousel";
// ... (import your data or fetch it from an API)

export default function EventFull({ allEvents }) {
  const { eventId } = useParams(); 
  // or use the 'title' if that's how you're routing
  // find the right event object
  const eventData = allEvents.find(e => e.id === eventId);

  if (!eventData) {
    return <Typography variant="h5">Event not found</Typography>;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        {eventData.title}
      </Typography>
      <Carousel autoPlay={false} animation="slide">
        {eventData.images.map((img, idx) => (
          <Box
            component="img"
            sx={{ width: "100%", height: 400, objectFit: "cover" }}
            src={img}
            alt=""
            key={idx}
          />
        ))}
      </Carousel>
      <Typography variant="body1" sx={{ mt: 2 }}>
        {eventData.description}
      </Typography>
    </Box>
  );
}
