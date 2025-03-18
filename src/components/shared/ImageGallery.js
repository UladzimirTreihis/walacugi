import React, { useState, useEffect } from "react";
import { Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function ImageGallery({ images }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevIndex = (currentIndex - 1 + images.length) % images.length;
  const nextIndex = (currentIndex + 1) % images.length;

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  // Prevent body scroll when gallery is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"; // Disable scrolling
    } else {
      document.body.style.overflow = "auto"; // Restore scrolling
    }
    return () => {
      document.body.style.overflow = "auto"; // Cleanup on unmount
    };
  }, [isOpen]);

  return (
    <Box sx={{ width: "80%", mb: 4, maxHeight: "500px"}}>
      {/* Three-image preview */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
          mb: 2, // Ensures spacing below images
        }}
      >
        {/* Left Image */}
        <Box
          sx={{
            width: "25%",
            maxHeight: "200px",
            cursor: "pointer",
            filter: "brightness(50%)",
            "&:hover": { filter: "brightness(70%)" },
          }}
          onClick={() => setIsOpen(true)}
        >
          <img
            src={images[prevIndex]}
            alt="Previous"
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
          />
        </Box>
  
        {/* Center Image */}
        <Box
          sx={{
            flex: "0 1 500px",
            maxHeight: "350px",
            cursor: "pointer",
            "&:hover": { transform: "scale(1.02)" },
          }}
          onClick={() => setIsOpen(true)}
        >
          <img
            src={images[currentIndex]}
            alt="Gallery"
            style={{ width: "100%", height: "400px", objectFit: "contain", borderRadius: "8px" }}
          />
        </Box>
  
        {/* Right Image */}
        <Box
          sx={{
            width: "25%",
            maxHeight: "200px",
            cursor: "pointer",
            filter: "brightness(50%)",
            "&:hover": { filter: "brightness(70%)" },
          }}
          onClick={() => setIsOpen(true)}
        >
          <img
            src={images[nextIndex]}
            alt="Next"
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
          />
        </Box>
      </Box>
  
      {/* Fullscreen overlay */}
      {isOpen && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={() => setIsOpen(false)}
        >
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            sx={{ position: "absolute", left: 20, color: "white" }}
          >
            <ArrowBackIosIcon fontSize="large" />
          </IconButton>
  
          <Box
            component="img"
            src={images[currentIndex]}
            alt={`Gallery ${currentIndex}`}
            sx={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 2 }}
            onClick={(e) => e.stopPropagation()}
          />
  
          <IconButton
            onClick={() => setIsOpen(false)}
            sx={{ position: "absolute", top: 20, right: 20, color: "white" }}
          >
            <CloseIcon fontSize="large" />
          </IconButton>
  
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            sx={{ position: "absolute", right: 20, color: "white" }}
          >
            <ArrowForwardIosIcon fontSize="large" />
          </IconButton>
        </Box>
      )}
    </Box>
  );  
}
