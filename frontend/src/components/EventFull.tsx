import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import Carousel from "react-material-ui-carousel";
import { useSelector, useDispatch } from "react-redux";
import { fetchEvents } from "../store/eventsSlice";
import DOMPurify from "dompurify";
import type { RootState } from "../store/store";

export default function EventFull() {
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

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>{event.title}</Typography>
      <Carousel autoPlay={false} animation="slide">
        {event.images.map((img, idx) => (
          <Box component="img" sx={{ width: "100%", height: 400, objectFit: "cover" }} src={img} alt="" key={idx} />
        ))}
      </Carousel>
      <Typography
        variant="body1"
        sx={{ mt: 2 }}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description) }} 
      />
    </Box>
  );
}
