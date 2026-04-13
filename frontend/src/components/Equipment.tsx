import React, { useEffect } from "react";
import { Box, Container, Grid2 as Grid, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import EquipmentCard from "./EquipmentCard";
import { fetchEquipment } from "../store/equipmentSlice";
import type { AppDispatch, RootState } from "../store/store";

export default function Equipment() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((state: RootState) => state.equipment.items);
  const loading = useSelector((state: RootState) => state.equipment.loading);
  const error = useSelector((state: RootState) => state.equipment.error);

  useEffect(() => {
    dispatch(fetchEquipment());
  }, [dispatch]);

  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h4" align="center" sx={{ mb: 3 }}>
        {t("equipment.title")}
      </Typography>
      {loading && <Typography>{t("common.loading")}</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid key={item._id} size={{ xs: 12, md: 4 }}>
            <EquipmentCard item={item} />
          </Grid>
        ))}
      </Grid>
      {!loading && !error && items.length === 0 && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography color="text.secondary">{t("equipment.empty")}</Typography>
        </Box>
      )}
    </Container>
  );
}
