import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Button, Chip, Container, Stack, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import useApi from "../hooks/useApi";
import type { EquipmentAvailabilityItem, EquipmentModelItem, EquipmentUnitItem } from "../types";
import { addToCheckout } from "../store/checkoutSlice";
import type { AppDispatch } from "../store/store";
import { displayDateToIso } from "../utils/dateDisplay";
import DateInputWithPicker from "./shared/DateInputWithPicker";

interface DetailsResponse {
  model: EquipmentModelItem;
  units: EquipmentUnitItem[];
}

export default function EquipmentDetail() {
  const { modelId } = useParams<{ modelId: string }>();
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
        startDate: startDateIso,
        endDate: endDateIso
      })
    );
  };

  const hasStartDateError = startDateInput.trim().length > 0 && !startDateIso;
  const hasEndDateError = endDateInput.trim().length > 0 && !endDateIso;

  if (!model) return <Container sx={{ py: 8 }}><Typography>Loading...</Typography></Container>;

  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h4" sx={{ mb: 1 }}>{model.title}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{model.description}</Typography>
      <Typography variant="h6" sx={{ mb: 2 }}>{model.pricePerDay} {model.currency}/day</Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <DateInputWithPicker
          label="Start date"
          value={startDateInput}
          onChange={setStartDateInput}
          error={hasStartDateError}
          helperText={hasStartDateError ? "Use dd-mm-yyyy format" : ""}
        />
        <DateInputWithPicker
          label="End date"
          value={endDateInput}
          onChange={setEndDateInput}
          error={hasEndDateError}
          helperText={hasEndDateError ? "Use dd-mm-yyyy format" : ""}
        />
      </Stack>

      <Typography variant="subtitle1" sx={{ mb: 1 }}>Choose unit</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {units.map((unit) => {
          const a = availability[unit._id];
          const isAvailable = a ? a.available : unit.status === "active";
          return (
            <Chip
              key={unit._id}
              label={`${unit.unitCode}${isAvailable ? "" : " (unavailable)"}`}
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
          Add to checkout
        </Button>
      </Box>
    </Container>
  );
}
