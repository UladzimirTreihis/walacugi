import React, { useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  Toolbar,
  useMediaQuery,
  useTheme
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router-dom";
import NavbarButton from "./shared/NavbarButton";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";
import { addLangToPath } from "../utils/langUrl";
import type { Locale } from "../types/localization";

type NavLink = {
  to: string;
  label: string;
  scrollToId?: string;
};

function CartButton({ onNavigate }: { onNavigate?: () => void }) {
  const { t, i18n } = useTranslation();
  const cartCount = useSelector((state: RootState) => state.checkout.items.length);

  return (
    <Button
      component={Link}
      to={addLangToPath("/cart", i18n.language)}
      color="inherit"
      onClick={onNavigate}
      sx={{
        minWidth: "auto",
        px: 1.2,
        position: "relative",
        fontSize: 20,
        lineHeight: 1
      }}
      aria-label={t("cart.title")}
    >
      <span role="img" aria-label="cart">
        🛍️
      </span>
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
  );
}

function LanguageSwitcher({
  onSelect,
  vertical = false,
  inDrawer = false
}: {
  onSelect?: () => void;
  vertical?: boolean;
  inDrawer?: boolean;
}) {
  const { i18n } = useTranslation();
  const locales: { code: Locale; flag: string }[] = [
    { code: "pl", flag: "🇵🇱" },
    { code: "en", flag: "🇬🇧" },
    { code: "be", flag: "🇧🇾" }
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: vertical ? "column" : "row",
        gap: vertical ? 0 : 0.5,
        alignItems: vertical ? "stretch" : "center"
      }}
    >
      {locales.map(({ code, flag }) => (
        <Button
          key={code}
          color="inherit"
          onClick={() => {
            void i18n.changeLanguage(code);
            onSelect?.();
          }}
          sx={{
            color: inDrawer ? "text.primary" : "#fff",
            minWidth: "auto",
            px: vertical ? 2 : 1,
            py: 0.5,
            justifyContent: vertical ? "flex-start" : "center"
          }}
        >
          {flag}
        </Button>
      ))}
    </Box>
  );
}

function NavLinks({
  links,
  isAdmin,
  onNavigate,
  layout
}: {
  links: NavLink[];
  isAdmin: boolean;
  onNavigate?: () => void;
  layout: "toolbar" | "drawer";
}) {
  const { t, i18n } = useTranslation();

  if (layout === "toolbar") {
    return (
      <>
        {links.map((link) => (
          <NavbarButton
            key={`${link.to}-${link.label}`}
            component={Link}
            variant="contained"
            to={link.to}
            scrollToId={link.scrollToId}
          >
            {link.label}
          </NavbarButton>
        ))}
        {isAdmin && (
          <NavbarButton
            component={Link}
            variant="contained"
            to={addLangToPath("/admin", i18n.language)}
          >
            {t("admin")}
          </NavbarButton>
        )}
      </>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", px: 1, py: 1 }}>
      {links.map((link) => (
        <NavbarButton
          key={`${link.to}-${link.label}`}
          component={Link}
          variant="text"
          to={link.to}
          scrollToId={link.scrollToId}
          onClick={onNavigate}
          sx={{
            justifyContent: "flex-start",
            color: "text.primary",
            width: "100%",
            py: 1.5
          }}
        >
          {link.label}
        </NavbarButton>
      ))}
      {isAdmin && (
        <NavbarButton
          component={Link}
          variant="text"
          to="/admin"
          onClick={onNavigate}
          sx={{
            justifyContent: "flex-start",
            color: "text.primary",
            width: "100%",
            py: 1.5
          }}
        >
          {t("admin")}
        </NavbarButton>
      )}
    </Box>
  );
}

function Navbar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const closeMobile = () => setMobileOpen(false);

  const navLinks: NavLink[] = [
    { to: "/", label: "Walacugi" },
    { to: "/", label: t("about"), scrollToId: "about" },
    { to: "/poznaj-swiat", label: t("foundation") },
    { to: "/events", label: t("events") },
    { to: "/equipment", label: t("equipment.title") }
  ];

  return (
    <>
      <AppBar position="sticky">
        <Toolbar
          sx={{
            justifyContent: isDesktop ? "center" : "space-between",
            alignItems: "center",
            gap: 1,
            minHeight: { xs: 56, sm: 64 },
            px: { xs: 1, sm: 2 }
          }}
        >
          {isDesktop ? (
            <>
              <NavLinks links={navLinks} isAdmin={isAdmin} layout="toolbar" />
              <CartButton />
              <Box sx={{ ml: 1 }}>
                <LanguageSwitcher />
              </Box>
            </>
          ) : (
            <>
              <NavbarButton component={Link} variant="contained" to="/">
                Walacugi
              </NavbarButton>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                <LanguageSwitcher />
                <CartButton />
                <IconButton
                  color="inherit"
                  edge="end"
                  onClick={() => setMobileOpen(true)}
                  aria-label={t("nav.openMenu")}
                  sx={{ mr: 0.5 }}
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={!isDesktop && mobileOpen}
        onClose={closeMobile}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: 280, maxWidth: "85vw" } }}
      >
        <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
          <IconButton onClick={closeMobile} aria-label={t("nav.closeMenu")}>
            <CloseIcon />
          </IconButton>
        </Box>
        <NavLinks links={navLinks} isAdmin={isAdmin} onNavigate={closeMobile} layout="drawer" />
      </Drawer>
    </>
  );
}

export default Navbar;
