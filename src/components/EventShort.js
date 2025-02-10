// EventShort.js
import React from "react";
import { Card, CardMedia, CardContent, Typography, Button, Box } from "@mui/material";
import Carousel from "react-material-ui-carousel"; // npm install react-material-ui-carousel
import { Link } from "react-router-dom"; // or any routing approach

export default function EventShort({ data }) {
  const { id, images, title, description } = data;

  // We'll just show 100 chars, then '...' 
  const excerpt = description.length > 100
    ? description.slice(0, 100) + "..."
    : description;

  return (
    <Card sx={{ width: 300, margin: 2, display: "flex", flexDirection: "column", height: "100%"}}>
      {/* Carousel of images at the top */}
      <Carousel
        navButtonsAlwaysVisible
        autoPlay={false}
        animation="slide"
        indicators={true}
        sx={{ 
          // Overwrite styles as needed
          width: '100%', 
          height: 200, // fixed height for images
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

      {/* Text content below */}
      <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" gutterBottom sx={{ minHeight: "65px" }}>
          {title}
        </Typography>
        <Typography variant="body2" paragraph sx={{ flexGrow: 1, minHeight: "80px" }}>
          {excerpt}
        </Typography>

        {/* Link or button to full page */}
        <Button 
          component={Link} 
          to={`/event/${id}`} 
          variant="outlined"
          sx={{ marginTop: "auto" }}
        >
          Read More
        </Button>
      </CardContent>
    </Card>
  );
}
