import React from "react";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { Button, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { CategoryItem } from "../../types";

interface CategoryMultiFieldProps {
  value: string[];
  onChange: (ids: string[]) => void;
  categories: CategoryItem[];
  disabled?: boolean;
}

export default function CategoryMultiField({ value, onChange, categories, disabled }: CategoryMultiFieldProps) {
  const { t } = useTranslation();

  const setAt = (index: number, id: string) => {
    const next = [...value];
    next[index] = id;
    onChange(next);
  };

  const removeAt = (index: number) => {
    if (value.length <= 1) return;
    onChange(value.filter((_, j) => j !== index));
  };

  const addRow = () => {
    onChange([...value, ""]);
  };

  const isTakenElsewhere = (rowIndex: number, candidateId: string) =>
    Boolean(candidateId) && value.some((id, j) => j !== rowIndex && id === candidateId);

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{t("admin_page.equipment_categories_label")}</Typography>
      {value.map((id, i) => (
        <Stack key={i} direction="row" spacing={1} alignItems="center">
          <FormControl fullWidth size="small" disabled={disabled}>
            <InputLabel id={`cat-label-${i}`}>{t("admin_page.category_n", { n: i + 1 })}</InputLabel>
            <Select
              labelId={`cat-label-${i}`}
              label={t("admin_page.category_n", { n: i + 1 })}
              value={id}
              onChange={(e) => setAt(i, e.target.value as string)}
            >
              <MenuItem value="">
                <em>{t("admin_page.select_category")}</em>
              </MenuItem>
              {categories.map((c) => (
                <MenuItem key={c._id} value={c._id} disabled={isTakenElsewhere(i, c._id)}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <IconButton
            aria-label={t("admin_page.remove_category_row")}
            onClick={() => removeAt(i)}
            disabled={disabled || value.length <= 1}
            size="small"
          >
            <RemoveIcon />
          </IconButton>
        </Stack>
      ))}
      <Button startIcon={<AddIcon />} onClick={addRow} size="small" disabled={disabled}>
        {t("admin_page.add_category_row")}
      </Button>
    </Stack>
  );
}
