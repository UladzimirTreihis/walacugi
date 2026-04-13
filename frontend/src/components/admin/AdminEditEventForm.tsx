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

interface EditableImage {
  id: string;
  previewUrl: string;
  existingPath?: string;
  file?: File;
}

export default function AdminEditEventForm() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { get, put, post, loading, error } = useApi();
  const adminToken = useSelector((state: RootState) => state.auth.token);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datedAt, setDatedAt] = useState("");
  const [approxDate, setApproxDate] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [ageRestriction, setAgeRestriction] = useState("");
  const [chatLink, setChatLink] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<number>(3);
  const [pinned, setPinned] = useState(false);
  const [images, setImages] = useState<EditableImage[]>([]);
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }
    get(`/events/${eventId}`, { Authorization: `Bearer ${adminToken}` })
      .then((data: any) => {
        if (data) {
          setTitle(data.title || "");
          setDescription(data.description || "");
          setBudget(data.budget || "");
          setCurrency(data.currency || "");
          setStartDate(data.startDate ? isoDateToDisplay(String(data.startDate).slice(0, 10)) : "");
          setEndDate(data.endDate ? isoDateToDisplay(String(data.endDate).slice(0, 10)) : "");
          setDatedAt(data.datedAt ? isoDateToDisplay(String(data.datedAt).slice(0, 10)) : "");
          setApproxDate(data.approxDate || "");
          setCountries(data.countries || []);
          setLocation(data.location || "");
          setAgeRestriction(data.ageRestriction || "");
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
  }, [eventId, adminToken, navigate]);

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
      if (!adminToken) {
        return;
      }
      const newImages = images.filter((item) => item.file);
      const uploadedImages = await uploadFiles(
        newImages.map((item) => item.file as File),
        "/upload/event-image",
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
      const result = await put(`/events/${eventId}`, updatedEvent, {
        Authorization: `Bearer ${adminToken}`,
      });
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

      <TextField fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} margin="normal" />
      <TextField fullWidth label="Location" value={location} onChange={(e) => setLocation(e.target.value)} margin="normal" />
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
        value={approxDate}
        onChange={(e) => setApproxDate(e.target.value)}
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
        value={ageRestriction}
        onChange={(e) => setAgeRestriction(e.target.value)}
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
      <TextField fullWidth label="Description" multiline rows={4} value={description} onChange={(e) => setDescription(e.target.value)} margin="normal" />

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
