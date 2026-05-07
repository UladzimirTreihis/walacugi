import React from "react";
import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import Navbar from "./Navbar";
import { useTranslation } from "react-i18next";


function Intro() {
  const theme = useTheme();
  void useMediaQuery(theme.breakpoints.up("md"));
  const { t } = useTranslation();
  return (
    <Box>
      <Navbar />
      <Box
      sx={{
        position: "relative",
        minHeight: "1050px",
        backgroundImage: 'url("/images/background.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(128, 128, 128, 0.5)",
        }}
      />
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "400px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <Typography variant="h4" gutterBottom>
          Poznaj Świat
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
