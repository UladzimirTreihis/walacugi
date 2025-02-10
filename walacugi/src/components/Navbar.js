import React from "react";
import { AppBar, Toolbar, Button, Typography } from "@mui/material";

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
        <Button color="inherit">Walacugi</Button>
        <Button color="inherit">About</Button>
        <Button color="inherit">Events</Button>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
