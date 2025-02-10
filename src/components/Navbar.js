import React from "react";
import { AppBar, Toolbar, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom"
import NavbarButton from "./shared/NavbarButton";

function Navbar() {
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
        <NavbarButton component={Link} variant="contained" to={"/"} scrollToId="about">About</NavbarButton>
        <NavbarButton component={Link} variant="contained" to={"/events"}>Events</NavbarButton>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
