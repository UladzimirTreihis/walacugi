import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
  CircularProgress,
  Autocomplete
} from "@mui/material";
import useApi from "../../hooks/useApi";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { COUNTRY_OPTIONS, COUNTRY_BY_CODE, countryMatchesQuery, getFlagEmoji } from "../../constants/countries";
import SortableImageList from "./SortableImageList";
import { displayDateToIso } from "../../utils/dateDisplay";
import { DEFAULT_REQUEST_ERROR_MESSAGE, type UiFeedback } from "../../utils/feedback";
import { uploadFiles } from "../../utils/uploadFiles";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";

type Locale = "be" | "en" | "pl";
type LocalizedText = Record<Locale, string>;
const LOCALES: Locale[] = ["be", "en", "pl"];
const EMPTY_LOCALIZED: LocalizedText = { be: "", en: "", pl: "" };

export default function AdminNewsForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [activeLocale, setActiveLocale] = useState<Locale>("be");
  const [title, setTitle] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [description, setDescription] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [datedAt, setDatedAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [location, setLocation] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [countries, setCountries] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  const { post, loading, error } = useApi();
  const adminToken = useSelector((state: RootState) => state.auth.token);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  async function handleCreateNews() {
    setFeedback(null);
    if (!title.be.trim() || !description.be.trim()) {
      setFeedback({
        severity: "error",
        message: "Belarusian title and description are required."
      });
      return;
    }
    try {
      const filePaths = await uploadFiles(selectedFiles, "/upload/news-image", post);
      const datedAtIso = displayDateToIso(datedAt);
      const newsBody = {
        title,
        description,
        images: filePaths,
        datedAt: datedAtIso || undefined,
        pinned,
        location,
        countries
      };
      const result = await post("/news", newsBody);
      if (!result) {
        setFeedback({
          severity: "error",
          message: "We could not create this news item. Please try again."
        });
        return;
      }
      setSelectedFiles([]);
      setImagePreviews([]);
      setTitle({ ...EMPTY_LOCALIZED });
      setDescription({ ...EMPTY_LOCALIZED });
      setDatedAt("");
      setPinned(false);
      setLocation({ ...EMPTY_LOCALIZED });
      setCountries([]);
      setFeedback({ severity: "success", message: "News item created successfully." });
    } catch (error) {
      console.error("Error creating news:", error);
      setFeedback({
        severity: "error",
        message: "Something went wrong while creating news. Please try again."
      });
    }
  }

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setImagePreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index));
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
  const datedAtIso = displayDateToIso(datedAt);
  const hasDatedAtError = datedAt.trim().length > 0 && !datedAtIso;

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
    setFeedback(null);
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
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3, boxShadow: 2, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom>
        Create News
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
        label="Pin (shows first; pinned are ordered by last update)"
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
        filterOptions={(options, state) => options.filter((option) => countryMatchesQuery(option, state.inputValue))}
        getOptionLabel={(option) => `${getFlagEmoji(option.code)} ${option.name}`}
        onChange={(_event, value) => setCountries(value.map((item) => item.code))}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Countries"
            margin="normal"
            placeholder="Type country name, code, or alias (e.g. UK, USA)"
          />
        )}
      />
      <Typography variant="h6" gutterBottom>{`Description (${activeLocale.toUpperCase()})`}</Typography>
      <ReactQuill
        theme="snow"
        value={description[activeLocale]}
        onChange={(value) => setLocalizedValue(setDescription, value)}
        style={{ marginBottom: 50, height: 300 }}
      />
      {imagePreviews.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Arrange selected images (left to right):
          </Typography>
          <SortableImageList
            images={imagePreviews}
            onMove={handleMoveImage}
            onRemove={handleRemoveImage}
            imageAlt="News preview"
          />
        </>
      )}
      <Button variant="contained" component="label" fullWidth sx={{ mt: 2 }}>
        Select Images
        <input type="file" multiple hidden onChange={handleFileChange} />
      </Button>
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleCreateNews}
        disabled={loading || hasDatedAtError}
      >
        {loading ? <CircularProgress size={24} /> : "Create News"}
      </Button>
    </Box>
  );
}
