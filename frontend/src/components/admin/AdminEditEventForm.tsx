import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Alert, TextField, Button, Box, Typography, CircularProgress, Autocomplete, FormControlLabel, Switch } from "@mui/material";
import useApi from "../../hooks/useApi";
import type { RootState } from "../../store/store";
import SortableImageList from "./SortableImageList";
import {
  COUNTRY_BY_CODE,
  COUNTRY_OPTIONS,
  countryMatchesQuery,
  getFlagEmoji
} from "../../constants/countries";
import { displayDateToIso, isoDateToDisplay } from "../../utils/dateDisplay";
import { DEFAULT_REQUEST_ERROR_MESSAGE, type UiFeedback } from "../../utils/feedback";
import { uploadFiles } from "../../utils/uploadFiles";
import LocaleButtonGroup from "../shared/admin/LocaleButtonGroup";
import { EMPTY_LOCALIZED, type Locale, type LocalizedText } from "../../types/localization";

interface EditableImage {
  id: string;
  previewUrl: string;
  existingPath?: string;
  file?: File;
}

interface EventLocalizedResponse {
  title?: LocalizedText;
  description?: LocalizedText;
  budget?: string;
  currency?: string;
  startDate?: string;
  endDate?: string;
  datedAt?: string;
  approxDate?: LocalizedText;
  countries?: string[];
  location?: LocalizedText;
  ageRestriction?: LocalizedText;
  chatLink?: string;
  difficultyLevel?: number;
  pinned?: boolean;
  images?: string[];
}

export default function AdminEditEventForm() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { get, put, post, loading, error } = useApi();
  const isAdmin = useSelector((state: RootState) => state.auth.isAdmin);

  const [activeLocale, setActiveLocale] = useState<Locale>("be");
  const [title, setTitle] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [description, setDescription] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datedAt, setDatedAt] = useState("");
  const [approxDate, setApproxDate] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [countries, setCountries] = useState<string[]>([]);
  const [location, setLocation] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [ageRestriction, setAgeRestriction] = useState<LocalizedText>({ ...EMPTY_LOCALIZED });
  const [chatLink, setChatLink] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<number>(3);
  const [pinned, setPinned] = useState(false);
  const [images, setImages] = useState<EditableImage[]>([]);
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate("/admin/login");
      return;
    }
    get<EventLocalizedResponse>(`/admin/events/${eventId}/localized`)
      .then((data) => {
        if (data) {
          setTitle(data.title || { ...EMPTY_LOCALIZED });
          setDescription(data.description || { ...EMPTY_LOCALIZED });
          setBudget(data.budget || "");
          setCurrency(data.currency || "");
          setStartDate(data.startDate ? isoDateToDisplay(String(data.startDate).slice(0, 10)) : "");
          setEndDate(data.endDate ? isoDateToDisplay(String(data.endDate).slice(0, 10)) : "");
          setDatedAt(data.datedAt ? isoDateToDisplay(String(data.datedAt).slice(0, 10)) : "");
          setApproxDate(data.approxDate || { ...EMPTY_LOCALIZED });
          setCountries(data.countries || []);
          setLocation(data.location || { ...EMPTY_LOCALIZED });
          setAgeRestriction(data.ageRestriction || { ...EMPTY_LOCALIZED });
          setChatLink(data.chatLink || "");
          setDifficultyLevel(data.difficultyLevel || 3);
          setImages(
            (data.images || []).map((path: string, index: number) => ({
              id: `existing-${index}-${path}`,
              previewUrl: path,
              existingPath: path
            }))
          );
          setPinned(Boolean(data.pinned));
        }
      })
      .catch((err) => console.error("Failed to fetch event:", err));
  }, [eventId, isAdmin, navigate]);

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

  async function handleUpdateEvent() {
    setFeedback(null);
    try {
      if (!isAdmin) {
        return;
      }
      if (!title.be.trim()) {
        setFeedback({
          severity: "error",
          message: "Belarusian title is required."
        });
        return;
      }
      const newImages = images.filter((item) => item.file);
      const uploadedImages = await uploadFiles(
        newImages.map((item) => item.file as File),
        "/upload/event-image",
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
      const startDateIso = displayDateToIso(startDate);
      const endDateIso = displayDateToIso(endDate);
      const datedAtIso = displayDateToIso(datedAt);
      const updatedEvent = {
        title,
        description,
        budget,
        currency,
        startDate: startDateIso || undefined,
        endDate: endDateIso || undefined,
        datedAt: datedAtIso || undefined,
        approxDate,
        countries,
        location,
        ageRestriction,
        chatLink,
        difficultyLevel,
        pinned,
        images: images
          .map((item) => item.existingPath ?? uploadedById.get(item.id) ?? "")
          .filter((path) => path.length > 0),
      };
      const result = await put(`/events/${eventId}`, updatedEvent);
      if (!result) {
        setFeedback({
          severity: "error",
          message: "We could not update this event. Please try again."
        });
        return;
      }
      setFeedback({ severity: "success", message: "Event updated successfully." });
    } catch (error) {
      console.error("Error updating event:", error);
      setFeedback({
        severity: "error",
        message: "Something went wrong while updating the event. Please try again."
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
  const hasStartDateError = startDate.trim().length > 0 && !displayDateToIso(startDate);
  const hasEndDateError = endDate.trim().length > 0 && !displayDateToIso(endDate);
  const hasDatedAtError = datedAt.trim().length > 0 && !displayDateToIso(datedAt);
  const isDateRequirementUnmet = !(displayDateToIso(startDate) || displayDateToIso(datedAt));

  const setLocalizedValue = (setter: React.Dispatch<React.SetStateAction<LocalizedText>>, value: string) => {
    setter((prev) => ({ ...prev, [activeLocale]: value }));
  };

  const handleAutoTranslate = async () => {
    if (!isAdmin) {
      setFeedback({ severity: "error", message: "Admin session missing. Please log in again." });
      return;
    }
    if (
      !title.be.trim() &&
      !description.be.trim() &&
      !location.be.trim() &&
      !approxDate.be.trim() &&
      !ageRestriction.be.trim()
    ) {
      setFeedback({ severity: "error", message: "Fill Belarusian fields first before translating." });
      return;
    }
    const result = await post<{ en: Record<string, string>; pl: Record<string, string> }>(
      "/admin/translate-localized",
      {
        entity: "event",
        source: {
          title: title.be,
          description: description.be,
          location: location.be,
          approxDate: approxDate.be,
          ageRestriction: ageRestriction.be
        }
      }
    );
    if (!result) {
      setFeedback({ severity: "error", message: "AI translation failed. Please try again." });
      return;
    }
    setTitle((prev) => ({ ...prev, en: result.en.title ?? "", pl: result.pl.title ?? "" }));
    setDescription((prev) => ({ ...prev, en: result.en.description ?? "", pl: result.pl.description ?? "" }));
    setLocation((prev) => ({ ...prev, en: result.en.location ?? "", pl: result.pl.location ?? "" }));
    setApproxDate((prev) => ({ ...prev, en: result.en.approxDate ?? "", pl: result.pl.approxDate ?? "" }));
    setAgeRestriction((prev) => ({ ...prev, en: result.en.ageRestriction ?? "", pl: result.pl.ageRestriction ?? "" }));
    setActiveLocale("en");
    setFeedback({ severity: "success", message: "AI translations filled for EN and PL. Please review before saving." });
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Edit Event
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
        <LocaleButtonGroup activeLocale={activeLocale} onChange={setActiveLocale} />
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
        label={`Location (${activeLocale.toUpperCase()})`}
        value={location[activeLocale]}
        onChange={(e) => setLocalizedValue(setLocation, e.target.value)}
        margin="normal"
      />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <TextField label="Budget (ex: 300-500)" value={budget} onChange={(e) => setBudget(e.target.value)} margin="normal" />
        <TextField label="Currency (ex: EUR)" value={currency} onChange={(e) => setCurrency(e.target.value)} margin="normal" />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <TextField
          label="Start date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          margin="normal"
          placeholder="dd-mm-yyyy"
          error={hasStartDateError}
          helperText={hasStartDateError ? "Use dd-mm-yyyy format" : "dd-mm-yyyy"}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Dated at (sorting date)"
          value={datedAt}
          onChange={(e) => setDatedAt(e.target.value)}
          margin="normal"
          placeholder="dd-mm-yyyy"
          error={hasDatedAtError}
          helperText={hasDatedAtError ? "Use dd-mm-yyyy format" : "dd-mm-yyyy"}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
      <TextField
        label="End date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        margin="normal"
        placeholder="dd-mm-yyyy"
        error={hasEndDateError}
        helperText={hasEndDateError ? "Use dd-mm-yyyy format" : "dd-mm-yyyy"}
        InputLabelProps={{ shrink: true }}
      />
      <TextField
        fullWidth
        label="Approx date (if exact dates unknown)"
        value={approxDate[activeLocale]}
        onChange={(e) => setLocalizedValue(setApproxDate, e.target.value)}
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
          <TextField
            {...params}
            label="Countries"
            margin="normal"
            placeholder="Type country name, code, or alias (e.g. UK, USA)"
          />
        )}
      />
      <TextField
        fullWidth
        label="Age restriction"
        value={ageRestriction[activeLocale]}
        onChange={(e) => setLocalizedValue(setAgeRestriction, e.target.value)}
        margin="normal"
      />
      <FormControlLabel
        control={<Switch checked={pinned} onChange={(e) => setPinned(e.target.checked)} />}
        label="Pin (pinned show first; ordered by last update)"
      />
      <TextField fullWidth label="Planning chat link" value={chatLink} onChange={(e) => setChatLink(e.target.value)} margin="normal" />
      <TextField
        type="number"
        fullWidth
        inputProps={{ min: 1, max: 5 }}
        label="Difficulty level (1-5)"
        value={difficultyLevel}
        onChange={(e) => setDifficultyLevel(Number(e.target.value || 1))}
        margin="normal"
      />
      <Typography variant="h6" gutterBottom>{`Description (${activeLocale.toUpperCase()})`}</Typography>
      <TextField
        fullWidth
        label={`Description (${activeLocale.toUpperCase()})`}
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
        imageAlt="Event image"
      />

      <input type="file" multiple onChange={handleFileChange} style={{ marginTop: 16 }} />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleUpdateEvent}
        disabled={loading || hasStartDateError || hasEndDateError || hasDatedAtError || isDateRequirementUnmet}
      >
        {loading ? "Updating..." : "Update Event"}
      </Button>
    </Box>
  );
}
