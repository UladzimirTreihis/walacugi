import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import useApi from "../../hooks/useApi";
import type { CategoryItem, EquipmentModelItem, EquipmentUnitItem } from "../../types";
import AdminEquipmentUnitsPanel from "./AdminEquipmentUnitsPanel";
import SortableImageList from "./SortableImageList";
import CategoryMultiField from "./CategoryMultiField";
import { DEFAULT_REQUEST_ERROR_MESSAGE, type UiFeedback } from "../../utils/feedback";
import { uploadFiles } from "../../utils/uploadFiles";
import { useTranslation } from "react-i18next";
import { addLangToPath } from "../../utils/langUrl";
import type { RootState } from "../../store/store";
import LocaleButtonGroup from "../shared/admin/LocaleButtonGroup";
import { EMPTY_LOCALIZED, type Locale, type LocalizedText } from "../../types/localization";

interface EquipmentLocalizedResponse {
  model: {
    _id: string;
    categories: Array<{ _id: string; name: LocalizedText }>;
    title: LocalizedText;
    description: LocalizedText;
    pricePerDay: number;
    currency?: string;
    size?: LocalizedText;
    images: string[];
  };
  units: EquipmentUnitItem[];
}

interface EditableImage {
  id: string;
  previewUrl: string;
  existingPath?: string;
  file?: File;
}

export default function AdminEditEquipmentForm() {
  const { i18n } = useTranslation();
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const { get, put, post, del, loading, error } = useApi();
  const adminToken = useSelector((state: RootState) => state.auth.token);
  const [model, setModel] = useState<EquipmentModelItem | null>(null);
  const [units, setUnits] = useState<EquipmentUnitItem[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [categoryIds, setCategoryIds] = useState<string[]>([""]);
  const [activeLocale, setActiveLocale] = useState<Locale>("be");
  const [title, setTitle] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [description, setDescription] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [pricePerDay, setPricePerDay] = useState<string>("");
  const [currency, setCurrency] = useState("EUR");
  const [size, setSize] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [images, setImages] = useState<EditableImage[]>([]);
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);
  const normalizedPricePerDay = Number.parseFloat(pricePerDay.replace(",", "."));
  const hasPriceInput = pricePerDay.trim().length > 0;
  const isValidPricePerDay = Number.isFinite(normalizedPricePerDay) && normalizedPricePerDay > 0;

  const refreshCategories = () => {
    get<CategoryItem[]>("/equipment/categories").then((data) => {
      if (data) setAllCategories(data);
    });
  };

  const refresh = () => {
    get<EquipmentLocalizedResponse>(`/admin/equipment/${modelId}/localized`).then((data) => {
      if (!data) return;
      const modelForList: EquipmentModelItem = {
        _id: data.model._id,
        categories: data.model.categories.map((c) => ({ _id: c._id, name: c.name[i18n.language as Locale] ?? c.name.be ?? "" })),
        categoryDisplay: data.model.categories.map((c) => c.name[i18n.language as Locale] ?? c.name.be ?? "").join(", "),
        title: data.model.title[i18n.language as Locale] ?? data.model.title.be ?? "",
        description: data.model.description[i18n.language as Locale] ?? data.model.description.be ?? "",
        pricePerDay: data.model.pricePerDay,
        currency: data.model.currency,
        size: (data.model.size?.[i18n.language as Locale] ?? data.model.size?.be ?? ""),
        images: data.model.images,
        active: true,
        createdAt: "",
        updatedAt: ""
      };
      setModel(modelForList);
      setUnits(data.units);
      const ids = (data.model.categories ?? []).map((c) => c._id).filter(Boolean);
      setCategoryIds(ids.length > 0 ? ids : [""]);
      setTitle(data.model.title ?? { ...EMPTY_LOCALIZED });
      setDescription(data.model.description ?? { ...EMPTY_LOCALIZED });
      setPricePerDay(String(data.model.pricePerDay ?? ""));
      setCurrency(data.model.currency ?? "PLN");
      setSize(data.model.size ?? { ...EMPTY_LOCALIZED });
      setImages(
        (data.model.images ?? []).map((path, index) => ({
          id: `existing-${index}-${path}`,
          previewUrl: path,
          existingPath: path
        }))
      );
    });
  };

  useEffect(() => {
    refreshCategories();
  }, []);

  useEffect(() => {
    refresh();
  }, [modelId, i18n.language]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const newImages: EditableImage[] = files.map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      previewUrl: URL.createObjectURL(file),
      file
    }));
    setImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!model) return;
    setFeedback(null);
    if (!isValidPricePerDay) {
      setFeedback({
        severity: "error",
        message: "Price per day must be a valid number greater than 0."
      });
      return;
    }
    const selected = categoryIds.filter(Boolean);
    if (selected.length === 0) {
      setFeedback({ severity: "error", message: "Select at least one category." });
      return;
    }
    try {
      const newImages = images.filter((item) => item.file);
      const uploadedImages = await uploadFiles(
        newImages.map((item) => item.file as File),
        "/upload/equipment-image",
        post
      );
      if (uploadedImages.length !== newImages.length) {
        setFeedback({
          severity: "error",
          message: "Some new images failed to upload. Please try again."
        });
        return;
      }
      const uploadedById = new Map<string, string>();
      newImages.forEach((item, index) => {
        const path = uploadedImages[index];
        if (path) uploadedById.set(item.id, path);
      });
      const payload = {
        categories: selected,
        title,
        description,
        pricePerDay: normalizedPricePerDay,
        currency,
        size,
        images: images
          .map((item) => item.existingPath ?? uploadedById.get(item.id) ?? "")
          .filter((path) => path.length > 0)
      };
      const res = await put<EquipmentModelItem>(`/equipment/${model._id}`, payload);
      if (res) {
        setFeedback({ severity: "success", message: "Equipment model updated successfully." });
        refresh();
      } else {
        setFeedback({
          severity: "error",
          message: "We could not update this equipment model. Please try again."
        });
      }
    } catch {
      setFeedback({
        severity: "error",
        message: "Something went wrong while updating equipment. Please try again."
      });
    }
  };

  const deleteModel = async () => {
    if (!model) return;
    if (!window.confirm("Delete this equipment model and units?")) return;
    const res = await del(`/equipment/${model._id}`);
    if (res) navigate(addLangToPath("/admin/equipment/create", i18n.language));
  };

  const setLocalizedValue = (setter: React.Dispatch<React.SetStateAction<LocalizedText>>, value: string) => {
    setter((prev) => ({ ...prev, [activeLocale]: value }));
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

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };
  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  if (!model) {
    return (
      <Box sx={{ p: 3 }}>
        {loading ? <CircularProgress /> : <Typography>Equipment not found.</Typography>}
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Edit Equipment Model
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
        <TextField
          type="text"
          label="Price per day"
          value={pricePerDay}
          onChange={(e) => setPricePerDay(e.target.value)}
          error={hasPriceInput && !isValidPricePerDay}
          helperText={hasPriceInput && !isValidPricePerDay ? "Enter a valid number greater than 0 (e.g. 12.5)" : ""}
          inputProps={{ inputMode: "decimal" }}
        />
        <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
        <TextField
          label={`Size (optional) (${activeLocale.toUpperCase()})`}
          value={size[activeLocale]}
          onChange={(e) => setLocalizedValue(setSize, e.target.value)}
        />
        <Typography variant="subtitle2">Images:</Typography>
        <SortableImageList
          images={images.map((item) => item.previewUrl)}
          onMove={handleMoveImage}
          onRemove={handleRemoveImage}
          imageAlt="Equipment image"
        />
        <Button variant="contained" component="label">
          Select Images
          <input type="file" multiple hidden onChange={handleFileChange} />
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Save model changes
        </Button>
        <Button color="error" variant="outlined" onClick={deleteModel}>
          Delete model
        </Button>
      </Stack>

      <AdminEquipmentUnitsPanel units={units} onRefresh={refresh} />
    </Box>
  );
}
