import React, { useState } from "react";
import { Box, Button, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material";
import useApi from "../../hooks/useApi";
import type { EquipmentUnitItem } from "../../types";
import DateInputWithPicker from "../shared/DateInputWithPicker";
import { displayDateToIso } from "../../utils/dateDisplay";

interface Props {
  units: EquipmentUnitItem[];
  onRefresh: () => void;
}

export default function AdminEquipmentUnitsPanel({ units, onRefresh }: Props) {
  const { post, put } = useApi();
  const [blockDates, setBlockDates] = useState<Record<string, { startDate: string; endDate: string; reason: string }>>({});

  const createClone = async (unitId: string) => {
    const res = await post(`/equipment/units/${unitId}/clone`, {});
    if (res) onRefresh();
  };

  const updateUnit = async (unit: EquipmentUnitItem, patch: Partial<EquipmentUnitItem>) => {
    const res = await put(`/equipment/units/${unit._id}`, patch);
    if (res) onRefresh();
  };

  const createBlock = async (unitId: string) => {
    const data = blockDates[unitId];
    const startDate = displayDateToIso(data?.startDate ?? "");
    const endDate = displayDateToIso(data?.endDate ?? "");
    if (!startDate || !endDate) return;
    const res = await post(`/equipment/units/${unitId}/blocks`, {
      ...data,
      startDate,
      endDate,
    });
    if (res) {
      setBlockDates((prev) => ({ ...prev, [unitId]: { startDate: "", endDate: "", reason: "" } }));
      onRefresh();
    }
  };

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Typography variant="h6">Units</Typography>
      {units.map((unit) => (
        <Box key={unit._id} sx={{ p: 2, border: "1px solid #ddd", borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle1">{unit.unitCode}</Typography>
            <Button size="small" variant="outlined" onClick={() => createClone(unit._id)}>
              Clone
            </Button>
          </Stack>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField
              label="Condition"
              value={unit.condition ?? ""}
              onChange={(e) => updateUnit(unit, { condition: e.target.value })}
              size="small"
              fullWidth
            />
            <TextField
              select
              label="Status"
              size="small"
              value={unit.status}
              onChange={(e) => updateUnit(unit, { status: e.target.value as EquipmentUnitItem["status"] })}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="active">active</MenuItem>
              <MenuItem value="maintenance">maintenance</MenuItem>
              <MenuItem value="retired">retired</MenuItem>
            </TextField>
          </Stack>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body2" sx={{ mb: 1 }}>
            Manual unavailability block
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <DateInputWithPicker
              label="Start"
              size="small"
              value={blockDates[unit._id]?.startDate ?? ""}
              onChange={(value) =>
                setBlockDates((prev) => ({
                  ...prev,
                  [unit._id]: { ...(prev[unit._id] ?? { endDate: "", reason: "" }), startDate: value }
                }))
              }
            />
            <DateInputWithPicker
              label="End"
              size="small"
              value={blockDates[unit._id]?.endDate ?? ""}
              onChange={(value) =>
                setBlockDates((prev) => ({
                  ...prev,
                  [unit._id]: { ...(prev[unit._id] ?? { startDate: "", reason: "" }), endDate: value }
                }))
              }
            />
            <TextField
              label="Reason"
              size="small"
              value={blockDates[unit._id]?.reason ?? ""}
              onChange={(e) =>
                setBlockDates((prev) => ({
                  ...prev,
                  [unit._id]: { ...(prev[unit._id] ?? { startDate: "", endDate: "" }), reason: e.target.value }
                }))
              }
              fullWidth
            />
            <Button variant="outlined" onClick={() => createBlock(unit._id)}>
              Block
            </Button>
          </Stack>
        </Box>
      ))}
      {units.length === 0 && <Typography color="text.secondary">No units yet.</Typography>}
    </Stack>
  );
}
