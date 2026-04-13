import React from "react";
import { Box, Button, Card, CardContent, CardMedia, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import type { EquipmentModelItem } from "../types";

export default function EquipmentCard({ item }: { item: EquipmentModelItem }) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardMedia
        component="img"
        image={item.images?.[0] || "/images/logo_white.jpg"}
        alt={item.title}
        sx={{ height: 220, objectFit: "cover" }}
      />
      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1, flexGrow: 1 }}>
        <Typography variant="overline" color="text.secondary">
          {item.category}
        </Typography>
        <Typography variant="h6">{item.title}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
          {item.description}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">
            {item.pricePerDay} {item.currency}/day
          </Typography>
          <Button component={Link} to={`/equipment/${item._id}`} variant="contained">
            View
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
