import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  Grid2 as Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import EquipmentCard from "./EquipmentCard";
import DateInputWithPicker from "../shared/DateInputWithPicker";
import { fetchEquipment } from "../../store/equipmentSlice";
import type { AppDispatch, RootState } from "../../store/store";
import type { CategoryItem, EquipmentModelItem } from "../../types";
import { displayDateToIso } from "../../utils/dateDisplay";

const API_URL = process.env.REACT_APP_API_URL;

export default function Equipment() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const items = useSelector((state: RootState) => state.equipment.items);
  const loading = useSelector((state: RootState) => state.equipment.loading);
  const error = useSelector((state: RootState) => state.equipment.error);

  const [categoryOptions, setCategoryOptions] = useState<CategoryItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/equipment/categories`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: CategoryItem[]) => setCategoryOptions(Array.isArray(data) ? data : []))
      .catch(() => setCategoryOptions([]));
  }, []);

  useEffect(() => {
    const fromIso = displayDateToIso(dateFrom);
    const toIso = displayDateToIso(dateTo);
    const bothDates = Boolean(fromIso && toIso);
    dispatch(
      fetchEquipment({
        categoryId: categoryFilter || undefined,
        from: bothDates ? fromIso : undefined,
        to: bothDates ? toIso : undefined
      })
    );
  }, [dispatch, categoryFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setCategoryFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const oneDateOnly = Boolean(dateFrom.trim() || dateTo.trim()) && !(displayDateToIso(dateFrom) && displayDateToIso(dateTo));

  return (
    <Container sx={{ py: 10 }}>
      <Typography variant="h4" align="center" sx={{ mb: 3 }}>
        {t("equipment.title")}
      </Typography>

      <Box sx={{ position: "relative", mb: 3 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "flex-end" }}
          flexWrap="wrap"
          useFlexGap
        >
          <FormControl size="small" sx={{ minWidth: { xs: "100%", md: 200 } }}>
            <InputLabel id="equipment-filter-category">{t("equipment.filter_category")}</InputLabel>
            <Select
              labelId="equipment-filter-category"
              label={t("equipment.filter_category")}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as string)}
            >
              <MenuItem value="">
                <em>{t("equipment.all_categories")}</em>
              </MenuItem>
              {categoryOptions.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ flex: { md: "1 1 160px" }, minWidth: { md: 160 } }}>
            <DateInputWithPicker
              label={t("equipment.filter_from")}
              value={dateFrom}
              onChange={setDateFrom}
              size="small"
              fullWidth
            />
          </Box>
          <Box sx={{ flex: { md: "1 1 160px" }, minWidth: { md: 160 } }}>
            <DateInputWithPicker
              label={t("equipment.filter_to")}
              value={dateTo}
              onChange={setDateTo}
              size="small"
              fullWidth
            />
          </Box>
          <Button variant="outlined" size="medium" onClick={clearFilters} sx={{ alignSelf: { xs: "stretch", md: "center" } }}>
            {t("common.clear")}
          </Button>
        </Stack>
        {oneDateOnly && (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            {t("equipment.filter_date_hint")}
          </Typography>
        )}
      </Box>

      {loading && <Typography>{t("common.loading")}</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      <Grid container spacing={2}>
        {items.map((item: EquipmentModelItem) => (
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
