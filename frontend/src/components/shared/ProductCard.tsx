import React from "react";
import { Box, Button, Card, CardContent, CardMedia, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { addLangToPath } from "../../utils/langUrl";

interface ProductCardProps {
  image: string;
  imageAlt: string;
  overline?: string;
  title: string;
  description?: string;
  priceLabel: string;
  viewTo: string;
  viewLabel?: string;
  onRemove?: () => void;
}

export default function ProductCard({
  image,
  imageAlt,
  overline,
  title,
  description,
  priceLabel,
  viewTo,
  viewLabel,
  onRemove
}: ProductCardProps) {
  const { t, i18n } = useTranslation();

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ position: "relative" }}>
        <CardMedia component="img" image={image} alt={imageAlt} sx={{ height: 220, objectFit: "cover" }} />
        {onRemove && (
          <IconButton
            onClick={onRemove}
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "rgba(255, 255, 255, 0.95)",
              "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" }
            }}
            aria-label={t("cart.remove_from_cart")}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, flexGrow: 1 }}>
        {overline && (
          <Typography variant="overline" color="text.secondary">
            {overline}
          </Typography>
        )}
        <Typography variant="h6">{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
            {description}
          </Typography>
        )}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: "auto" }}>
          <Typography variant="h6">{priceLabel}</Typography>
          <Button component={Link} to={addLangToPath(viewTo, i18n.language)} variant="contained">
            {viewLabel ?? t("common.view")}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
