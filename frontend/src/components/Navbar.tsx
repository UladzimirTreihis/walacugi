import React from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { Link } from "react-router-dom"
import NavbarButton from "./shared/NavbarButton";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

function Navbar() {
  const { t, i18n } = useTranslation();
  const adminToken = useSelector((state: RootState) => state.auth.token); // Get token from Redux

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
        {adminToken  
        ? <NavbarButton component={Link} variant="contained" to={"/admin"}>{t("admin")}</NavbarButton>
        : ""
        }

        <Box sx={{ display: "flex", gap: 0 }}>
          <Button color="inherit" onClick={() => i18n.changeLanguage("pl")} sx={{ color: "#fff", minWidth: "auto", padding: "4px 0px 4px 8px", margin: 0 }}>Pl/</Button>
          <Button color="inherit" onClick={() => i18n.changeLanguage("en")} sx={{ color: "#fff", minWidth: "auto", padding: "4px 0px", margin: 0 }}>En</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
