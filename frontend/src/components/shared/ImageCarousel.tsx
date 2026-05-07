import React from "react";
import Slider from "react-slick";
import type { Settings } from "react-slick";
import { Box } from "@mui/material";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

export default function ImageCarousel({ images }: { images: string[] }) {
  const settings: Settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "20px",
    responsive: [
      {
        breakpoint: 768,
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
