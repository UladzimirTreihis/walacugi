import React, { useState, useEffect } from "react";
import { Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function ImageGallery({ images }: { images: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevIndex = (currentIndex - 1 + images.length) % images.length;
  const nextIndex = (currentIndex + 1) % images.length;

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <Box sx={{ width: "80%", mb: 4, maxHeight: "500px", overflow: "hidden" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
          mb: 2,
        }}
      >
        <Box
          sx={{
            width: "25%",
            maxHeight: "200px",
            cursor: "pointer",
            filter: "brightness(50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": { filter: "brightness(70%)" }
          }}
          onClick={() => setIsOpen(true)}
        >
          <img
            src={images[prevIndex]}
            alt="Previous"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "8px"
            }}
          />
        </Box>
 
        <Box
          sx={{
            flex: "0 1 500px",
            maxHeight: "400px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": { transform: "scale(1.02)" }
          }}
          onClick={() => setIsOpen(true)}
        >
          <img
            src={images[currentIndex]}
            alt="Gallery"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "8px"
            }}
          />
        </Box>
 
        <Box
          sx={{
            width: "25%",
            maxHeight: "200px",
            cursor: "pointer",
            filter: "brightness(50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": { filter: "brightness(70%)" }
          }}
          onClick={() => setIsOpen(true)}
        >
          <img
            src={images[nextIndex]}
            alt="Next"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: "8px"
            }}
          />
        </Box>
      </Box>
 
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
