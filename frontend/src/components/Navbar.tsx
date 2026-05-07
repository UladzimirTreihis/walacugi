import React from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { Link } from "react-router-dom"
import NavbarButton from "./shared/NavbarButton";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { addLangToPath } from "../utils/langUrl";

function Navbar() {
  const { t, i18n } = useTranslation();
  const adminToken = useSelector((state: RootState) => state.auth.token);
  const cartCount = useSelector((state: RootState) => state.checkout.items.length);

  return (
    <AppBar position="sticky">
      <Toolbar sx={{
      justifyContent: "center",
      alignItems: "center",
      }}>
        <NavbarButton component={Link} variant="contained" to={"/"}>Walacugi</NavbarButton>
        <NavbarButton component={Link} variant="contained" to={"/"} scrollToId="about">{t("about")}</NavbarButton>
        <NavbarButton component={Link} variant="contained" to={"/events"}>{t("events")}</NavbarButton>
        <NavbarButton component={Link} variant="contained" to={"/equipment"}>{t("equipment.title")}</NavbarButton>
        <Button
          component={Link}
          to={addLangToPath("/cart", i18n.language)}
          color="inherit"
          sx={{ minWidth: "auto", px: 1.2, mr: 3, position: "relative", fontSize: 20, lineHeight: 1 }}
          aria-label={t("cart.title")}
        >
          <span role="img" aria-label="cart">🛍️</span>
          {cartCount > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: -2,
                right: -2,
                minWidth: 16,
                height: 16,
                px: 0.5,
                borderRadius: "999px",
                bgcolor: "error.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 700
              }}
            >
              {cartCount}
            </Box>
          )}
        </Button>
        {adminToken  
        ? <NavbarButton component={Link} variant="contained" to={addLangToPath("/admin", i18n.language)}>{t("admin")}</NavbarButton>
        : ""
        }

        <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
          <Button
            color="inherit"
            onClick={() => i18n.changeLanguage("pl")}
            sx={{ color: "#fff", minWidth: "auto", px: 1, py: 0.5 }}
          >
            🇵🇱
          </Button>
          <Button
            color="inherit"
            onClick={() => i18n.changeLanguage("en")}
            sx={{ color: "#fff", minWidth: "auto", px: 1, py: 0.5 }}
          >
            🇬🇧
          </Button>
          <Button
            color="inherit"
            onClick={() => i18n.changeLanguage("be")}
            sx={{ color: "#fff", minWidth: "auto", px: 1, py: 0.5 }}
          >
            🇧🇾
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
