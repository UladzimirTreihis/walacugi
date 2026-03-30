import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { TextField, Button, Box, Typography, CircularProgress, Autocomplete } from "@mui/material";
import useApi from "../../hooks/useApi";
import type { RootState } from "../../store/store";
import SortableImageList from "./SortableImageList";
import {
  COUNTRY_BY_CODE,
  COUNTRY_OPTIONS,
  countryMatchesQuery,
  getFlagEmoji
} from "../../constants/countries";

function displayDateToIso(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(trimmed);
  if (!match) return "";
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

function isoDateToDisplay(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return "";
  const [, yyyy, mm, dd] = match;
  return `${dd}-${mm}-${yyyy}`;
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
  const [approxDate, setApproxDate] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [ageRestriction, setAgeRestriction] = useState("");
  const [chatLink, setChatLink] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState<number>(3);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

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
          setApproxDate(data.approxDate || "");
          setCountries(data.countries || []);
          setLocation(data.location || "");
          setAgeRestriction(data.ageRestriction || "");
          setChatLink(data.chatLink || "");
          setDifficultyLevel(data.difficultyLevel || 3);
          setExistingImages(data.images || []);
        }
      })
      .catch((err) => console.error("Failed to fetch event:", err));
  }, [eventId, adminToken, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setNewFiles(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews(previews);
  };

  async function handleUpload(): Promise<string[]> {
    if (newFiles.length === 0) return [];
    const uploadedFilePaths: string[] = [];
    for (const file of newFiles) {
      const formData = new FormData();
      formData.append("images", file);
      const res = await post<{ filePaths: string[] }>("/upload/event-image", formData, {
        Authorization: `Bearer ${adminToken ?? ""}`,
      });
      if (res?.filePaths) {
        uploadedFilePaths.push(...res.filePaths);
      }
    }
    return uploadedFilePaths;
  }

  async function handleUpdateEvent() {
    try {
      if (!adminToken) {
        return;
      }
      const uploadedImages = await handleUpload();
      const startDateIso = displayDateToIso(startDate);
      const endDateIso = displayDateToIso(endDate);
      const updatedEvent = {
        title,
        description,
        budget,
        currency,
        startDate: startDateIso || undefined,
        endDate: endDateIso || undefined,
        approxDate,
        countries,
        location,
        ageRestriction,
        chatLink,
        difficultyLevel,
        images: [...existingImages, ...uploadedImages],
      };
      const result = await put(`/events/${eventId}`, updatedEvent, {
        Authorization: `Bearer ${adminToken}`,
      });
      if (!result) {
        return;
      }
      navigate("/admin");
    } catch (error) {
      console.error("Error updating event:", error);
    }
  }

  function handleDeleteImage(index: number) {
    setExistingImages((prevImages) => prevImages.filter((_, i) => i !== index));
  }
  function handleMoveExistingImage(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= existingImages.length) return;
    setExistingImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }
  function handleDeleteNewImage(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }
  function handleMoveNewImage(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= newFiles.length) return;
    setNewFiles((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setNewImagePreviews((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }
  const hasStartDateError = startDate.trim().length > 0 && !displayDateToIso(startDate);
  const hasEndDateError = endDate.trim().length > 0 && !displayDateToIso(endDate);

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Edit Event
      </Typography>

      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}

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
          label="End date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          margin="normal"
          placeholder="dd-mm-yyyy"
          error={hasEndDateError}
          helperText={hasEndDateError ? "Use dd-mm-yyyy format" : "dd-mm-yyyy"}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
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
        Existing Images:
      </Typography>
      <SortableImageList
        images={existingImages}
        onMove={handleMoveExistingImage}
        onRemove={handleDeleteImage}
        imageAlt="Existing event image"
      />

      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        New Images:
      </Typography>
      <SortableImageList
        images={newImagePreviews}
        onMove={handleMoveNewImage}
        onRemove={handleDeleteNewImage}
        imageAlt="New event image"
      />

      <input type="file" multiple onChange={handleFileChange} style={{ marginTop: 16 }} />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleUpdateEvent}
        disabled={loading || hasStartDateError || hasEndDateError}
      >
        {loading ? "Updating..." : "Update Event"}
      </Button>
    </Box>
  );
}
