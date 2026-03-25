import React, { useState } from "react";
import { TextField, Button, Box, Typography, CircularProgress, IconButton, Autocomplete } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import useApi from "../../hooks/useApi";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import {
  COUNTRY_BY_CODE,
  COUNTRY_OPTIONS,
  countryMatchesQuery,
  getFlagEmoji
} from "../../constants/countries";

export default function AdminEventsForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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

  const { post, loading, error } = useApi();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {    
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  async function handleUpload(): Promise<string[]> {
    if (selectedFiles.length === 0) return [];
    const uploadedFilePaths: string[] = [];

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("images", file);
      const res = await post<{ filePaths: string[] }>("/upload/event-image", formData);
      if (res?.filePaths) {
        uploadedFilePaths.push(...res.filePaths);
      }
    }
    return uploadedFilePaths;
  }

  async function handleCreateEvent() {
    try {
      const filePaths = await handleUpload();
      const eventBody = {
        title,
        description,
        images: filePaths,
        budget,
        currency,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        approxDate,
        countries,
        location,
        ageRestriction,
        chatLink,
        difficultyLevel
      };
      const result = await post("/events", eventBody);
      if (!result) return;
      setSelectedFiles([]);
      setImagePreviews([]);
      setTitle("");
      setDescription("");
      setBudget("");
      setCurrency("");
      setStartDate("");
      setEndDate("");
      setApproxDate("");
      setCountries([]);
      setLocation("");
      setAgeRestriction("");
      setChatLink("");
      setDifficultyLevel(3);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  }

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setImagePreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>Create Event</Typography>
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
          type="date"
          label="Start date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="End date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          margin="normal"
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
      <Typography variant="h6" gutterBottom>Description</Typography>
      <ReactQuill theme="snow" value={description} onChange={setDescription as any} style={{ marginBottom: 50, height: 300 }} />

      {imagePreviews.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
          {imagePreviews.map((src, index) => (
            <Box key={index} sx={{ position: "relative", width: 100, height: 100 }}>
              <img src={src} alt="Preview" width="100%" height="100%" style={{ objectFit: "cover" }} />
              <IconButton
                sx={{ position: "absolute", top: 0, right: 0, background: "rgba(255,255,255,0.8)" }}
                onClick={() => handleRemoveImage(index)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
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
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : "Create Event"}
      </Button>
    </Box>
  );
}
