import { Link, Outlet } from "react-router-dom";
import { Button, Box } from "@mui/material";
import { useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import { useNavigate } from "react-router-dom";

export default function AdminNavbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/admin/login");
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
      {/* Left Side - Navigation Links */}
      <Box sx={{ display: "flex", gap: 2 }}>
        <Button variant="contained" color="secondary" component={Link} to="/admin/news/create">
          Add News
        </Button>
        <Button variant="contained" color="secondary" component={Link} to="/admin/events/create">
          Add Event
        </Button>
        <Button variant="contained" color="secondary" component={Link} to="/">
          Main
        </Button>
      </Box>

      {/* Right Side - Logout */}
      <Button variant="contained" color="error" onClick={handleLogout}>
        Logout
      </Button>
    </Box>
  );
}
