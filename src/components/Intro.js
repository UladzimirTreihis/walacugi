import React from "react";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import Navbar from "./Navbar";
import { useTranslation } from "react-i18next";


function Intro() {
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
    const { t } = useTranslation();
  return (
    <Box>
      {/* Image fills the container width */}
      <Navbar />
      <Box
      sx={{
        position: "relative",
        // This container is as tall as you need:
        minHeight: "1000px",  // or whatever makes sense for your large image
        // The background image
        backgroundImage: 'url("/images/background.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
        {/* The grey overlay that sits on top of the background image */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(128, 128, 128, 0.5)", // 50% grey
        }}
      />
       
      {/* Some introductory text below the image */}
      <Box
        sx={{
          position: "relative", // so we stay above the overlay
          zIndex: 1,            // above the overlay
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "400px", // How tall the 'intro text area' is
          textAlign: "center",
          color: "#fff",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Walacugi
        </Typography>
        <Typography variant="body1">
          {t("welcome")}
        </Typography>
      </Box>
    </Box>
      
    </Box>
  );
}

export default Intro;
