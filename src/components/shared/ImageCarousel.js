import React from "react";
import Slider from "react-slick";
import { Box } from "@mui/material";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function ImageCarousel({ images }) {
  const settings = {
    dots: false, // Hide pagination dots
    infinite: true, // Loop through images
    speed: 500, // Transition speed
    slidesToShow: 3, // Show 3 slides at a time (center + previews)
    slidesToScroll: 1,
    centerMode: true, // Enables preview of previous/next images
    centerPadding: "20px", // Adjusts preview size of side images
    responsive: [
      {
        breakpoint: 768, // On smaller screens
        settings: { slidesToShow: 1, centerPadding: "10px" }
      }
    ]
  };

  return (
    <Box sx={{ width: "100%", maxWidth: "900px", margin: "auto" }}>
      <Slider {...settings}>
        {images.map((img, index) => (
          <Box key={index} sx={{ px: 1 }}>
            <img
              src={img}
              alt={`Slide ${index}`}
              style={{
                width: "100%",
                height: "auto",
                borderRadius: "8px",
                objectFit: "cover"
              }}
            />
          </Box>
        ))}
      </Slider>
    </Box>
  );
}
