import React, { useRef } from "react";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { IconButton, InputAdornment, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { displayDateToIso, isoDateToDisplay } from "../../utils/dateDisplay";

interface DateInputWithPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: "small" | "medium";
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
}

export default function DateInputWithPicker({
  label,
  value,
  onChange,
  placeholder = "dd-mm-yyyy",
  size = "medium",
  fullWidth,
  error,
  helperText,
}: DateInputWithPickerProps) {
  const { t } = useTranslation();
  const hiddenDateInputRef = useRef<HTMLInputElement | null>(null);
  const isoValue = displayDateToIso(value);

  const openNativeDatePicker = () => {
    const input = hiddenDateInputRef.current as (HTMLInputElement & { showPicker?: () => void }) | null;
    if (!input) return;
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  return (
    <>
      <TextField
        label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        size={size}
        fullWidth={fullWidth}
        error={error}
        helperText={helperText}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton aria-label={t("common.open_calendar_for", { label: label.toLowerCase() })} edge="end" onClick={openNativeDatePicker}>
                <CalendarTodayIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <input
        ref={hiddenDateInputRef}
        type="date"
        value={isoValue}
        onChange={(e) => onChange(isoDateToDisplay(e.target.value))}
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
    </>
  );
}
