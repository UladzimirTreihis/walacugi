import React, { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import useApi from "../../hooks/useApi";
import type { CategoryItem, EquipmentModelItem } from "../../types";
import SortableImageList from "./SortableImageList";
import CategoryMultiField from "./CategoryMultiField";
import { DEFAULT_REQUEST_ERROR_MESSAGE, type UiFeedback } from "../../utils/feedback";
import { uploadFiles } from "../../utils/uploadFiles";
import { useTranslation } from "react-i18next";
import { addLangToPath } from "../../utils/langUrl";
import type { RootState } from "../../store/store";
import LocaleButtonGroup from "../shared/admin/LocaleButtonGroup";
import { EMPTY_LOCALIZED, type Locale, type LocalizedText } from "../../types/localization";

export default function AdminEquipmentForm() {
  const { i18n } = useTranslation();
  const { post, get, loading, error } = useApi();
  const adminToken = useSelector((state: RootState) => state.auth.token);
  const [items, setItems] = useState<EquipmentModelItem[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([""]);
  const [activeLocale, setActiveLocale] = useState<Locale>("be");
  const [title, setTitle] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [description, setDescription] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [pricePerDay, setPricePerDay] = useState<number>(0);
  const [currency, setCurrency] = useState("EUR");
  const [size, setSize] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= selectedFiles.length) return;
    setSelectedFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setImagePreviews((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const refresh = () => {
    get<EquipmentModelItem[]>("/equipment").then((data) => {
      if (data) setItems(data);
    });
  };

  const refreshCategories = () => {
    get<CategoryItem[]>("/equipment/categories").then((data) => {
      if (data) setAllCategories(data);
    });
  };

  useEffect(() => {
    refresh();
    refreshCategories();
  }, []);

  const selectedCategoryIds = categoryIds.filter(Boolean);
  const canCreate = selectedCategoryIds.length > 0 && Boolean(title.be.trim());

  const setLocalizedValue = (setter: React.Dispatch<React.SetStateAction<LocalizedText>>, value: string) => {
    setter((prev) => ({ ...prev, [activeLocale]: value }));
  };

  const handleCreate = async () => {
    setFeedback(null);
    try {
      const filePaths = await uploadFiles(selectedFiles, "/upload/equipment-image", post);
      const payload = {
        categories: selectedCategoryIds,
        title,
        description,
        pricePerDay: Number(pricePerDay),
        currency,
        size,
        images: filePaths
      };
      const created = await post<EquipmentModelItem>("/equipment", payload);
      if (!created) {
        setFeedback({
          severity: "error",
          message: "We could not create this equipment model. Please check the fields and try again."
        });
        return;
      }
      setCategoryIds([""]);
      setTitle({ ...EMPTY_LOCALIZED });
      setDescription({ ...EMPTY_LOCALIZED });
      setPricePerDay(0);
      setCurrency("EUR");
      setSize({ ...EMPTY_LOCALIZED });
      setSelectedFiles([]);
      setImagePreviews([]);
      setFeedback({ severity: "success", message: "Equipment model created successfully." });
      refresh();
    } catch {
      setFeedback({
        severity: "error",
        message: "Something went wrong while creating equipment. Please try again."
      });
    }
  };

  const handleAutoTranslate = async () => {
    if (!adminToken) {
      setFeedback({ severity: "error", message: "Admin session missing. Please log in again." });
      return;
    }
    if (!title.be.trim() && !description.be.trim() && !size.be.trim()) {
      setFeedback({ severity: "error", message: "Fill Belarusian fields first before translating." });
      return;
    }
    const result = await post<{ en: Record<string, string>; pl: Record<string, string> }>(
      "/admin/translate-localized",
      {
        entity: "equipment",
        source: {
          title: title.be,
          description: description.be,
          size: size.be
        }
      },
      { Authorization: `Bearer ${adminToken}` }
    );
    if (!result) {
      setFeedback({ severity: "error", message: "AI translation failed. Please try again." });
      return;
    }
    setTitle((prev) => ({ ...prev, en: result.en.title ?? "", pl: result.pl.title ?? "" }));
    setDescription((prev) => ({ ...prev, en: result.en.description ?? "", pl: result.pl.description ?? "" }));
    setSize((prev) => ({ ...prev, en: result.en.size ?? "", pl: result.pl.size ?? "" }));
    setActiveLocale("en");
    setFeedback({ severity: "success", message: "AI translations filled for EN and PL. Please review before saving." });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Add Equipment Model
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {DEFAULT_REQUEST_ERROR_MESSAGE}
        </Alert>
      )}
      {feedback && (
        <Alert severity={feedback.severity} sx={{ mb: 2 }}>
          {feedback.message}
        </Alert>
      )}
      <Stack spacing={1.5}>
        <CategoryMultiField value={categoryIds} onChange={setCategoryIds} categories={allCategories} disabled={loading} />
        <LocaleButtonGroup activeLocale={activeLocale} onChange={setActiveLocale} />
        <Button variant="outlined" onClick={handleAutoTranslate} disabled={loading}>
          Use AI to translate the content
        </Button>
        <TextField
          label={`Title (${activeLocale.toUpperCase()})`}
          value={title[activeLocale]}
          onChange={(e) => setLocalizedValue(setTitle, e.target.value)}
        />
        <TextField
          label={`Description (${activeLocale.toUpperCase()})`}
          multiline
          minRows={3}
          value={description[activeLocale]}
          onChange={(e) => setLocalizedValue(setDescription, e.target.value)}
        />
        <TextField type="number" label="Price per day" value={pricePerDay} onChange={(e) => setPricePerDay(Number(e.target.value || 0))} />
        <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
        <TextField
          label={`Size (optional) (${activeLocale.toUpperCase()})`}
          value={size[activeLocale]}
          onChange={(e) => setLocalizedValue(setSize, e.target.value)}
        />
        {imagePreviews.length > 0 && (
          <>
            <Typography variant="subtitle2">Arrange selected images (left to right):</Typography>
            <SortableImageList
              images={imagePreviews}
              onMove={handleMoveImage}
              onRemove={handleRemoveImage}
              imageAlt="Equipment preview"
            />
          </>
        )}
        <Button variant="contained" component="label">
          Select Images
          <input type="file" multiple hidden onChange={handleFileChange} />
        </Button>
        <Button variant="contained" onClick={handleCreate} disabled={loading || !canCreate}>
          {loading ? <CircularProgress size={22} /> : "Create Equipment"}
        </Button>
      </Stack>

      <Typography variant="h6" sx={{ mt: 4 }}>
        Existing models
      </Typography>
      <Stack spacing={1} sx={{ mt: 1 }}>
        {items.map((item) => (
          <Box key={item._id} sx={{ p: 1.5, border: "1px solid #ddd", borderRadius: 1 }}>
            <Typography variant="subtitle1">{item.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {item.categoryDisplay} • {item.pricePerDay} {item.currency}/day
            </Typography>
            <Button size="small" component={Link} to={addLangToPath(`/admin/equipment/edit/${item._id}`, i18n.language)} sx={{ mt: 0.5 }}>
              Edit
            </Button>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
