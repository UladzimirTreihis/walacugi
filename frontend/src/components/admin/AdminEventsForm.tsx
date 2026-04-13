import React, { useState } from "react";
import { Alert, TextField, Button, Box, Typography, CircularProgress, Autocomplete, FormControlLabel, Switch } from "@mui/material";
import useApi from "../../hooks/useApi";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import SortableImageList from "./SortableImageList";
import {
  COUNTRY_BY_CODE,
  COUNTRY_OPTIONS,
  countryMatchesQuery,
  getFlagEmoji
} from "../../constants/countries";
import { displayDateToIso } from "../../utils/dateDisplay";
import { DEFAULT_REQUEST_ERROR_MESSAGE, type UiFeedback } from "../../utils/feedback";
import { uploadFiles } from "../../utils/uploadFiles";

export default function AdminEventsForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  const { post, loading, error } = useApi();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {    
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  async function handleCreateEvent() {
    setFeedback(null);
    try {
      const filePaths = await uploadFiles(selectedFiles, "/upload/event-image", post);
      const startDateIso = displayDateToIso(startDate);
      const endDateIso = displayDateToIso(endDate);
      const eventBody = {
        title,
        description,
        images: filePaths,
        budget,
        currency,
        datedAt: displayDateToIso(datedAt) || undefined,
        startDate: startDateIso || undefined,
        endDate: endDateIso || undefined,
        approxDate,
        countries,
        location,
        ageRestriction,
        chatLink,
        difficultyLevel,
        pinned
      };
      const result = await post("/events", eventBody);
      if (!result) {
        setFeedback({
          severity: "error",
          message: "We could not create this event. Please check the form and try again."
        });
        return;
      }
      setSelectedFiles([]);
      setImagePreviews([]);
      setTitle("");
      setDescription("");
      setBudget("");
      setCurrency("");
      setStartDate("");
      setEndDate("");
      setDatedAt("");
      setApproxDate("");
      setCountries([]);
      setLocation("");
      setAgeRestriction("");
      setChatLink("");
      setDifficultyLevel(3);
      setPinned(false);
      setFeedback({ severity: "success", message: "Event created successfully." });
    } catch (error) {
      console.error("Error creating event:", error);
      setFeedback({
        severity: "error",
        message: "Something went wrong while creating the event. Please try again."
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
  const startDateIso = displayDateToIso(startDate);
  const endDateIso = displayDateToIso(endDate);
  const datedAtIso = displayDateToIso(datedAt);
  const hasStartDateError = startDate.trim().length > 0 && !startDateIso;
  const hasEndDateError = endDate.trim().length > 0 && !endDateIso;
  const hasDatedAtError = datedAt.trim().length > 0 && !datedAtIso;
  const isDateRequirementUnmet = !(startDateIso || datedAtIso);

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>Create Event</Typography>
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
      <Typography variant="h6" gutterBottom>Description</Typography>
      <ReactQuill theme="snow" value={description} onChange={setDescription as any} style={{ marginBottom: 50, height: 300 }} />

      {imagePreviews.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            Arrange selected images (left to right):
          </Typography>
          <SortableImageList
            images={imagePreviews}
            onMove={handleMoveImage}
            onRemove={handleRemoveImage}
            imageAlt="Event preview"
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
        onClick={handleCreateEvent}
        disabled={loading || hasStartDateError || hasEndDateError || hasDatedAtError || isDateRequirementUnmet}
      >
        {loading ? <CircularProgress size={24} /> : "Create Event"}
      </Button>
    </Box>
  );
}
