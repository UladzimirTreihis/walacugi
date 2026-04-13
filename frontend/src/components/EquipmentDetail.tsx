import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import useApi from "../hooks/useApi";
import type { EquipmentAvailabilityItem, EquipmentModelItem, EquipmentUnitItem } from "../types";
import { addToCheckout } from "../store/checkoutSlice";
import type { AppDispatch } from "../store/store";
import { displayDateToIso, isoDateToDisplay } from "../utils/dateDisplay";
import DateInputWithPicker from "./shared/DateInputWithPicker";

interface DetailsResponse {
  model: EquipmentModelItem;
  units: EquipmentUnitItem[];
}

export default function EquipmentDetail() {
  const { t } = useTranslation();
  const { modelId } = useParams<{ modelId: string }>();
  const location = useLocation();
  const { get } = useApi();
  const dispatch = useDispatch<AppDispatch>();
  const [model, setModel] = useState<EquipmentModelItem | null>(null);
  const [units, setUnits] = useState<EquipmentUnitItem[]>([]);
  const [availability, setAvailability] = useState<Record<string, EquipmentAvailabilityItem>>({});
  const [startDateInput, setStartDateInput] = useState("");
  const [endDateInput, setEndDateInput] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const startDateIso = useMemo(() => displayDateToIso(startDateInput), [startDateInput]);
  const endDateIso = useMemo(() => displayDateToIso(endDateInput), [endDateInput]);

  const selectedUnit = useMemo(() => units.find((u) => u._id === selectedUnitId) ?? null, [selectedUnitId, units]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const startDateParam = params.get("startDate");
    const endDateParam = params.get("endDate");
    if (startDateParam) {
      setStartDateInput(isoDateToDisplay(startDateParam) || startDateParam);
    }
    if (endDateParam) {
      setEndDateInput(isoDateToDisplay(endDateParam) || endDateParam);
    }
  }, [location.search]);

  useEffect(() => {
    get<DetailsResponse>(`/equipment/${modelId}`).then((data) => {
      if (!data) return;
      setModel(data.model);
      setUnits(data.units);
    });
  }, [modelId]);

  useEffect(() => {
    if (!startDateIso || !endDateIso || !modelId) return;
    get<{ units: EquipmentAvailabilityItem[] }>(`/equipment/${modelId}/availability?startDate=${startDateIso}&endDate=${endDateIso}`).then((data) => {
      if (!data) return;
      const mapped = data.units.reduce<Record<string, EquipmentAvailabilityItem>>((acc, item) => {
        acc[item.unitId] = item;
        return acc;
      }, {});
      setAvailability(mapped);
    });
  }, [startDateIso, endDateIso, modelId]);

  const handleAdd = () => {
    if (!model || !selectedUnit || !startDateIso || !endDateIso) return;
    dispatch(
      addToCheckout({
        unitId: selectedUnit._id,
        unitCode: selectedUnit.unitCode,
        modelId: model._id,
        modelTitle: model.title,
        modelImage: model.images?.[0],
        pricePerDay: model.pricePerDay,
        currency: model.currency,
        startDate: startDateIso,
        endDate: endDateIso
      })
    );
  };

  const hasStartDateError = startDateInput.trim().length > 0 && !startDateIso;
  const hasEndDateError = endDateInput.trim().length > 0 && !endDateIso;

  if (!model) return <Container sx={{ py: 8 }}><Typography>{t("common.loading")}</Typography></Container>;

  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>{model.title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{model.description}</Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>{model.pricePerDay} {model.currency}{t("common.per_day_suffix")}</Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <DateInputWithPicker
          label={t("common.start_date")}
          value={startDateInput}
          onChange={setStartDateInput}
          error={hasStartDateError}
          helperText={hasStartDateError ? t("common.date_format_help") : ""}
        />
        <DateInputWithPicker
          label={t("common.end_date")}
          value={endDateInput}
          onChange={setEndDateInput}
          error={hasEndDateError}
          helperText={hasEndDateError ? t("common.date_format_help") : ""}
        />
      </Stack>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>{t("equipment.choose_unit")}</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {units.map((unit) => {
          const a = availability[unit._id];
          const isAvailable = a ? a.available : unit.status === "active";
          return (
            <Chip
              key={unit._id}
              label={`${unit.unitCode}${isAvailable ? "" : ` (${t("equipment.unavailable")})`}`}
              color={selectedUnitId === unit._id ? "primary" : "default"}
              variant={isAvailable ? "filled" : "outlined"}
              disabled={!isAvailable}
              onClick={() => setSelectedUnitId(unit._id)}
            />
          );
        })}
      </Stack>

      <Box sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleAdd} disabled={!selectedUnit || !startDateIso || !endDateIso}>
          {t("cart.add_to_cart")}
        </Button>
      </Box>
    </Container>
  );
}
