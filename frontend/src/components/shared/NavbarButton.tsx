import { Button, type ButtonProps } from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import React from "react";

interface Props extends ButtonProps {
  scrollToId?: string;
  to: string;
}

const NavbarButton: React.FC<Props> = ({ children, scrollToId, to, ...props }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (scrollToId) {
      event.preventDefault();

      if (location.pathname !== "/") {
        navigate("/", { replace: false });
        setTimeout(() => {
          const element = document.getElementById(scrollToId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      } else {
        const element = document.getElementById(scrollToId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  };

  return (
    <Button
      component={RouterLink}
      to={to}
      onClick={scrollToId ? handleClick : undefined}
      {...props}
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
