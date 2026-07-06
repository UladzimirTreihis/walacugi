import { Button, type ButtonProps } from "@mui/material";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import React from "react";
import { useTranslation } from "react-i18next";
import { addLangToPath } from "../../utils/langUrl";

interface Props extends Omit<ButtonProps, "onClick"> {
  scrollToId?: string;
  to: string;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const NavbarButton: React.FC<Props> = ({ children, scrollToId, to, onClick, ...props }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const toWithLang = addLangToPath(to, i18n.language);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (scrollToId) {
      event.preventDefault();

      if (location.pathname !== "/") {
        navigate(addLangToPath("/", i18n.language), { replace: false });
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
    onClick?.(event);
  };

  return (
    <Button
      component={RouterLink}
      to={toWithLang}
      onClick={handleClick}
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
