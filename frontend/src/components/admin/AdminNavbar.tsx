import { Link } from "react-router-dom";
import { Button, Box } from "@mui/material";
import { useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import { useNavigate } from "react-router-dom";
import React from "react";
import { useTranslation } from "react-i18next";
import { addLangToPath } from "../../utils/langUrl";
import useApi from "../../hooks/useApi";

export default function AdminNavbar() {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { post } = useApi();

  const handleLogout = async () => {
    await post("/admin/logout", {});
    dispatch(logout());
    navigate(addLangToPath("/admin/login", i18n.language));
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 2,
        bgcolor: "primary.main",
        boxShadow: 2,
        borderRadius: 1,
      }}
    >
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" color="secondary" component={Link} to={addLangToPath("/admin/news/create", i18n.language)}>
          Add News
        </Button>
        <Button variant="contained" color="secondary" component={Link} to={addLangToPath("/admin/events/create", i18n.language)}>
          Add Event
        </Button>
        <Button variant="contained" color="secondary" component={Link} to={addLangToPath("/admin/equipment/create", i18n.language)}>
          Add Equipment
        </Button>
        <Button variant="contained" color="secondary" component={Link} to={addLangToPath("/admin/categories", i18n.language)}>
          Categories
        </Button>
        <Button variant="contained" color="secondary" component={Link} to={addLangToPath("/", i18n.language)}>
          Main
        </Button>
      </Box>

      <Button variant="contained" color="error" onClick={() => void handleLogout()}>
        Logout
      </Button>
    </Box>
  );
}
