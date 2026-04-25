import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Alert, TextField, Button, Box, Typography, CircularProgress, Autocomplete, FormControlLabel, Switch, ButtonGroup } from "@mui/material";
import useApi from "../../hooks/useApi";
import type { RootState } from "../../store/store";
import { COUNTRY_OPTIONS, COUNTRY_BY_CODE, countryMatchesQuery, getFlagEmoji } from "../../constants/countries";
import SortableImageList from "./SortableImageList";
import { displayDateToIso, isoDateToDisplay } from "../../utils/dateDisplay";
import { DEFAULT_REQUEST_ERROR_MESSAGE, type UiFeedback } from "../../utils/feedback";
import { uploadFiles } from "../../utils/uploadFiles";

interface EditableImage {
  id: string;
  previewUrl: string;
  existingPath?: string;
  file?: File;
}

type Locale = "be" | "en" | "pl";
type LocalizedText = Record<Locale, string>;
const LOCALES: Locale[] = ["be", "en", "pl"];
const EMPTY_LOCALIZED: LocalizedText = { be: "", en: "", pl: "" };

export default function AdminEditNewsForm() {
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const { get, put, post, loading, error } = useApi();
  const adminToken = useSelector((state: RootState) => state.auth.token);

  const [activeLocale, setActiveLocale] = useState<Locale>("be");
  const [title, setTitle] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [description, setDescription] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [datedAt, setDatedAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [location, setLocation] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [countries, setCountries] = useState<string[]>([]);
  const [images, setImages] = useState<EditableImage[]>([]);
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }
    get(`/admin/news/${newsId}/localized`, { Authorization: `Bearer ${adminToken}` })
      .then((data: any) => {
        if (data) {
          setTitle(data.title || { ...EMPTY_LOCALIZED });
          setDescription(data.description || { ...EMPTY_LOCALIZED });
          setDatedAt(data.datedAt ? isoDateToDisplay(String(data.datedAt).slice(0, 10)) : "");
          setPinned(Boolean(data.pinned));
          setLocation(data.location || { ...EMPTY_LOCALIZED });
          setCountries(data.countries || []);
          setImages(
            (data.images || []).map((path: string, index: number) => ({
              id: `existing-${index}-${path}`,
              previewUrl: path,
              existingPath: path,
            }))
          );
        }
      })
      .catch((err) => console.error("Failed to fetch news:", err));
  }, [newsId, adminToken, navigate]);

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
  }

  async function handleUpdateNews() {
    setFeedback(null);
    try {
      if (!adminToken) {
        return;
      }
      if (!title.be.trim() || !description.be.trim()) {
        setFeedback({
          severity: "error",
          message: "Belarusian title and description are required."
        });
        return;
      }
      const newImages = images.filter((item) => item.file);
      const uploadedImages = await uploadFiles(
        newImages.map((item) => item.file as File),
        "/upload/news-image",
        post,
        { Authorization: `Bearer ${adminToken}` }
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
      const datedAtIso = displayDateToIso(datedAt);
      const updatedNews = {
        title,
        description,
        images: images
          .map((item) => item.existingPath ?? uploadedById.get(item.id) ?? "")
          .filter((path) => path.length > 0),
        datedAt: datedAtIso || undefined,
        pinned,
        location,
        countries
      };
      const result = await put(`/news/${newsId}`, updatedNews, {
        Authorization: `Bearer ${adminToken}`,
      });
      if (!result) {
        setFeedback({
          severity: "error",
          message: "We could not update this news item. Please try again."
        });
        return;
      }
      setFeedback({ severity: "success", message: "News item updated successfully." });
    } catch (error) {
      console.error("Error updating news:", error);
      setFeedback({
        severity: "error",
        message: "Something went wrong while updating news. Please try again."
      });
    }
  }

  function handleDeleteImage(index: number) {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  }
  function handleMoveImage(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }
  const hasDatedAtError = datedAt.trim().length > 0 && !displayDateToIso(datedAt);

  const setLocalizedValue = (setter: React.Dispatch<React.SetStateAction<LocalizedText>>, value: string) => {
    setter((prev) => ({ ...prev, [activeLocale]: value }));
  };

  const handleAutoTranslate = async () => {
    if (!adminToken) {
      setFeedback({ severity: "error", message: "Admin session missing. Please log in again." });
      return;
    }
    if (!title.be.trim() && !description.be.trim() && !location.be.trim()) {
      setFeedback({ severity: "error", message: "Fill Belarusian fields first before translating." });
      return;
    }
    const result = await post<{ en: Record<string, string>; pl: Record<string, string> }>(
      "/admin/translate-localized",
      {
        entity: "news",
        source: {
          title: title.be,
          description: description.be,
          location: location.be
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
    setLocation((prev) => ({ ...prev, en: result.en.location ?? "", pl: result.pl.location ?? "" }));
    setActiveLocale("en");
    setFeedback({ severity: "success", message: "AI translations filled for EN and PL. Please review before saving." });
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Edit News
      </Typography>

      {loading && <CircularProgress />}
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

      <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
        <ButtonGroup size="small" variant="outlined">
          {LOCALES.map((locale) => (
            <Button key={locale} variant={activeLocale === locale ? "contained" : "outlined"} onClick={() => setActiveLocale(locale)}>
              {locale.toUpperCase()}
            </Button>
          ))}
        </ButtonGroup>
        <Button variant="outlined" onClick={handleAutoTranslate} disabled={loading}>
          Use AI to translate the content
        </Button>
      </Box>
      <TextField
        fullWidth
        label={`Title (${activeLocale.toUpperCase()})`}
        value={title[activeLocale]}
        onChange={(e) => setLocalizedValue(setTitle, e.target.value)}
        margin="normal"
      />
      <TextField
        fullWidth
        label="Dated at"
        value={datedAt}
        onChange={(e) => setDatedAt(e.target.value)}
        margin="normal"
        placeholder="dd-mm-yyyy"
        error={hasDatedAtError}
        helperText={hasDatedAtError ? "Use dd-mm-yyyy format" : "dd-mm-yyyy"}
        InputLabelProps={{ shrink: true }}
      />
      <FormControlLabel
        control={<Switch checked={pinned} onChange={(e) => setPinned(e.target.checked)} />}
        label="Pinned"
      />
      <TextField
        fullWidth
        label={`Location (${activeLocale.toUpperCase()})`}
        value={location[activeLocale]}
        onChange={(e) => setLocalizedValue(setLocation, e.target.value)}
        margin="normal"
      />
      <Autocomplete
        multiple
        options={COUNTRY_OPTIONS}
        value={countries
          .map((code) => COUNTRY_BY_CODE[code])
          .filter((option): option is (typeof COUNTRY_OPTIONS)[number] => Boolean(option))}
        filterOptions={(options, state) =>
          options.filter((option) => countryMatchesQuery(option, state.inputValue))}
        getOptionLabel={(option) => `${getFlagEmoji(option.code)} ${option.name}`}
        onChange={(_event, value) => setCountries(value.map((item) => item.code))}
        renderInput={(params) => (
          <TextField {...params} label="Countries" margin="normal" placeholder="Type country name, code, or alias" />
        )}
      />
      <Typography variant="h6" gutterBottom>{`Description (${activeLocale.toUpperCase()})`}</Typography>
      <TextField
        fullWidth
        multiline
        rows={6}
        value={description[activeLocale]}
        onChange={(e) => setLocalizedValue(setDescription, e.target.value)}
        margin="normal"
      />

      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Images:
      </Typography>
      <SortableImageList
        images={images.map((item) => item.previewUrl)}
        onMove={handleMoveImage}
        onRemove={handleDeleteImage}
        imageAlt="News image"
      />

      <input type="file" multiple onChange={handleFileChange} style={{ marginTop: 16 }} />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleUpdateNews}
        disabled={loading || hasDatedAtError}
      >
        {loading ? "Updating..." : "Update News"}
      </Button>
    </Box>
  );
}
