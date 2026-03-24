// EventShort.tsx
import React from "react";
import { Card, CardMedia, CardContent, Typography, Button } from "@mui/material";
import Carousel from "react-material-ui-carousel";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useApi from "../hooks/useApi";
import { deleteEvent } from "../store/eventsSlice";
import DOMPurify from "dompurify";
import getExcerpt from "../utils/getExcerpt";
import type { RootState } from "../store/store";
import type { EventItem } from "../types";

export default function EventShort({ data }: { data: EventItem }) {
  const { _id, images, title, description } = data;
  const adminToken = useSelector((state: RootState) => state.auth.token); 
  const isAdmin = !!adminToken
  const dispatch = useDispatch();

  const { del } = useApi(); 

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    const response = await del(`/events/${eventId}`, {
      "x-admin-token": adminToken ?? ""
    });

    if (response) {
      dispatch(deleteEvent(eventId));
    }
  };

  const safeExcerpt = getExcerpt(description);

  return (
    <Card sx={{ width: 300, margin: 2, display: "flex", flexDirection: "column", height: "100%"}}>
      <Carousel
        navButtonsAlwaysVisible
        autoPlay={false}
        animation="slide"
        indicators={true}
        sx={{ 
          width: '100%', 
          height: 200,
          "& img": {
            objectFit: "cover"
          }
        }}
      >
        {images.map((imgSrc, idx) => (
          <CardMedia
            key={idx}
            component="img"
            image={imgSrc}
            alt={`Event image ${idx}`}
            sx={{ height: "100%", width: "100%" }}
          />
        ))}
      </Carousel>

      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" gutterBottom sx={{ minHeight: "65px" }}>
          {title}
        </Typography>
        <Typography 
          variant="body2" 
          paragraph 
          sx={{ flexGrow: 1, minHeight: "80px" }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(safeExcerpt) }} 
        />

        <Button 
          component={Link} 
          to={`/events/${_id}`} 
          variant="outlined"
          sx={{ marginTop: "auto" }}
        >
          Read More
        </Button>
        {isAdmin && (
            <>
              <Button
                variant="outlined"
                color="primary"
                component={Link}
                to={`/admin/events/edit/${data._id}`}
                sx={{ mt: 1 }}
              >
                Edit
              </Button>
              <Button
              variant="outlined"
              color="error"
              sx={{ mt: 1, ml: 2 }}
              onClick={() => handleDeleteEvent(data._id)}
              >
              Delete
            </Button>
          </>
          )}
      </CardContent>
    </Card>
  );
}
