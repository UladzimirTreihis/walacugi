import React from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { Link } from "react-router-dom"
import NavbarButton from "./shared/NavbarButton";
import { useTranslation } from "react-i18next";

function Navbar() {
  const { t, i18n } = useTranslation();
  return (
    <AppBar position="sticky">
      <Toolbar sx={{
      justifyContent: "center",
      alignItems: "center",
      }}>
        {/* <Typography variant="h6" sx={{ flexGrow: 1 }}>
          My Website
        </Typography> */}
        <NavbarButton component={Link} variant="contained" to={"/"}>Walacugi</NavbarButton>
        <NavbarButton component={Link} variant="contained" to={"/"} scrollToId="about">{t("about")}</NavbarButton>
        <NavbarButton component={Link} variant="contained" to={"/events"}>{t("events")}</NavbarButton>
        <Box sx={{ display: "flex", gap: 0 }}>
          <Button color="white" onClick={() => i18n.changeLanguage("pl")} sx={{ minWidth: "auto", padding: "4px 0px 4px 8px", margin: 0 }}>Pl/</Button>
          <Button color="white" onClick={() => i18n.changeLanguage("en")} sx={{ minWidth: "auto", padding: "4px 0px", margin: 0 }}>En</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
