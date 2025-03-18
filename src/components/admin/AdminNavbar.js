
import { Link, Outlet } from "react-router-dom";
import { Button } from "@mui/material";
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
      <nav>
        <Button
              variant="outlined"
              color="primary"
              component={Link}
              to={`/admin/news/create`}
              sx={{ mt: 1 }}
            >
              Add News
          </Button>
          <Button
              variant="outlined"
              color="primary"
              component={Link}
              to={`/admin/events/create`}
              sx={{ mt: 1 }}
            >
              Add Events
          </Button>
          <Button               
            variant="outlined"
            color="primary"
            component={Link}
            to={`/`}>
            Main
          </Button>
        <button onClick={handleLogout}>Logout</button>
        
      </nav>
    );
  }