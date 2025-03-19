import { Button } from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

const NavbarButton = ({ children, scrollToId, to, ...props }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (event) => {
    if (scrollToId) {
      event.preventDefault(); // Prevent default link behavior

      if (location.pathname !== "/") {
        // Navigate to "/" first, then scroll after navigation completes
        navigate("/", { replace: false });

        // Delay scrolling slightly to ensure DOM is updated
        setTimeout(() => {
          const element = document.getElementById(scrollToId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        // If already on "/", just scroll immediately
        const element = document.getElementById(scrollToId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  return (
    <Button 
    component={RouterLink} to={to} onClick={scrollToId ? handleClick : undefined} {...props}
    sx={{
        margin: 0, 
        padding: "8px 16px", 
        border: "none", 
        boxShadow: "none", 
        borderRadius: 0
    }}
    >
      {children}
    </Button>
  );
};

export default NavbarButton;
