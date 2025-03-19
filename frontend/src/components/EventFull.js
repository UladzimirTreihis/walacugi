// EventFull.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import Carousel from "react-material-ui-carousel";
import { useSelector, useDispatch } from "react-redux";
import { fetchEvents } from "../store/eventsSlice";
// ... (import your data or fetch it from an API)

export default function EventFull() {
  const { eventId } = useParams(); 
  // or use the 'title' if that's how you're routing
  // find the right event object
  const dispatch = useDispatch();

  // Get event from Redux
  const eventsList = useSelector((state) => state.events.items);
  const loading = useSelector((state) => state.events.loading);
  const error = useSelector((state) => state.events.error);

  const event = eventsList.find((item) => item._id === eventId);

  // Fetch event only if it's not already in Redux
  useEffect(() => {
    if (!event) {
      dispatch(fetchEvents());
    }
  }, [dispatch, event]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!event) return <Typography variant="h6">Event not found</Typography>;


  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        {event.title}
      </Typography>
      <Carousel autoPlay={false} animation="slide">
        {event.images.map((img, idx) => (
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
        {event.description}
      </Typography>
    </Box>
  );
}
