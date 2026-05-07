import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Alert, Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import useApi from "../../hooks/useApi";
import type { EquipmentAvailabilityItem, EquipmentModelItem, EquipmentUnitItem } from "../../types";
import { addToCheckout } from "../../store/checkoutSlice";
import type { AppDispatch, RootState } from "../../store/store";
import type { UiFeedback } from "../../utils/feedback";

interface DetailsResponse {
  model: EquipmentModelItem;
  units: EquipmentUnitItem[];
}

interface UnavailableRangeItem {
  startDate: string;
  endDate: string;
  reason: string;
}

dayjs.extend(customParseFormat);

function isDateInsideRange(isoDate: string, range: UnavailableRangeItem): boolean {
  return isoDate >= range.startDate && isoDate < range.endDate;
}

function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && endA > startB;
}

export default function EquipmentDetail() {
  const { t } = useTranslation();
  const { modelId } = useParams<{ modelId: string }>();
  const location = useLocation();
  const { get } = useApi();
  const dispatch = useDispatch<AppDispatch>();
  const checkoutItems = useSelector((state: RootState) => state.checkout.items);
  const [model, setModel] = useState<EquipmentModelItem | null>(null);
  const [units, setUnits] = useState<EquipmentUnitItem[]>([]);
  const [availability, setAvailability] = useState<Record<string, EquipmentAvailabilityItem>>({});
  const [unavailableRanges, setUnavailableRanges] = useState<UnavailableRangeItem[]>([]);
  const [startDateIso, setStartDateIso] = useState("");
  const [endDateIso, setEndDateIso] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);
  const selectedUnit = useMemo(() => units.find((u) => u._id === selectedUnitId) ?? null, [selectedUnitId, units]);
  const hasRangeConflict = useMemo(() => {
    if (!startDateIso || !endDateIso) return false;
    return unavailableRanges.some((range) => rangesOverlap(startDateIso, endDateIso, range.startDate, range.endDate));
  }, [startDateIso, endDateIso, unavailableRanges]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const startDateParam = params.get("startDate");
    const endDateParam = params.get("endDate");
    if (startDateParam) {
      setStartDateIso(startDateParam);
    }
    if (endDateParam) {
      setEndDateIso(endDateParam);
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

  useEffect(() => {
    if (!selectedUnitId) {
      setUnavailableRanges([]);
      return;
    }
    const now = new Date();
    const from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const to = new Date(now.getTime() + 730 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    get<{ unavailableRanges: UnavailableRangeItem[] }>(
      `/equipment/units/${selectedUnitId}/unavailable?from=${from}&to=${to}`
    ).then((data) => {
      if (!data) return;
      setUnavailableRanges(data.unavailableRanges ?? []);
    });
  }, [selectedUnitId]);

  const handleAdd = () => {
    if (!model || !selectedUnit || !startDateIso || !endDateIso || hasRangeConflict) return;
    const alreadyInCart = checkoutItems.some(
      (item) => item.unitId === selectedUnit._id && item.startDate === startDateIso && item.endDate === endDateIso
    );
    if (alreadyInCart) {
      setFeedback({ severity: "info", message: t("cart.already_in_cart") });
      return;
    }
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
    setFeedback({ severity: "success", message: t("cart.added_to_cart") });
  };

  const shouldDisableStartDate = (value: Dayjs) => {
    if (!selectedUnitId) return true;
    const iso = value.format("YYYY-MM-DD");
    return unavailableRanges.some((range) => isDateInsideRange(iso, range));
  };

  const shouldDisableEndDate = (value: Dayjs) => {
    if (!selectedUnitId) return true;
    if (!startDateIso) return false;
    const iso = value.format("YYYY-MM-DD");
    if (iso <= startDateIso) return true;
    return unavailableRanges.some((range) => iso > range.startDate && iso < range.endDate);
  };

  if (!model) return <Container sx={{ py: 8 }}><Typography>{t("common.loading")}</Typography></Container>;

  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>{model.title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{model.description}</Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>{model.pricePerDay} {model.currency}{t("common.per_day_suffix")}</Typography>

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

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2, mt: 2 }}>
          <DatePicker
            label={t("common.start_date")}
            format="DD-MM-YYYY"
            value={startDateIso ? dayjs(startDateIso, "YYYY-MM-DD") : null}
            onChange={(value) => setStartDateIso(value && value.isValid() ? value.format("YYYY-MM-DD") : "")}
            shouldDisableDate={shouldDisableStartDate}
            disabled={!selectedUnitId}
            slotProps={{
              textField: {
                fullWidth: true,
                helperText: !selectedUnitId ? t("equipment.select_unit_first") : t("common.date_format_help")
              }
            }}
          />
          <DatePicker
            label={t("common.end_date")}
            format="DD-MM-YYYY"
            value={endDateIso ? dayjs(endDateIso, "YYYY-MM-DD") : null}
            onChange={(value) => setEndDateIso(value && value.isValid() ? value.format("YYYY-MM-DD") : "")}
            shouldDisableDate={shouldDisableEndDate}
            disabled={!selectedUnitId}
            slotProps={{
              textField: {
                fullWidth: true,
                helperText: !selectedUnitId ? t("equipment.select_unit_first") : t("common.date_format_help")
              }
            }}
          />
        </Stack>
      </LocalizationProvider>

      {hasRangeConflict && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("equipment.range_conflict")}
        </Alert>
      )}
      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 2 }}>
          {feedback.message}
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={!selectedUnit || !startDateIso || !endDateIso || hasRangeConflict}
        >
          {t("cart.add_to_cart")}
        </Button>
      </Box>
    </Container>
  );
}
