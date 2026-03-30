import React, { useState } from "react";
import {
  Box,
  Button,
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

function displayDateToIso(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(trimmed);
  if (!match) return "";
  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminNewsForm() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [datedAt, setDatedAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [location, setLocation] = useState("");
  const [countries, setCountries] = useState<string[]>([]);

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
      const res = await post<{ filePaths: string[] }>("/upload/news-image", formData);
      if (res?.filePaths) {
        uploadedFilePaths.push(...res.filePaths);
      }
    }
    return uploadedFilePaths;
  }

  async function handleCreateNews() {
    try {
      const filePaths = await handleUpload();
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
      if (!result) return;
      setSelectedFiles([]);
      setImagePreviews([]);
      setTitle("");
      setDescription("");
      setDatedAt("");
      setPinned(false);
      setLocation("");
      setCountries([]);
    } catch (error) {
      console.error("Error creating news:", error);
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

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3, boxShadow: 2, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom>
        Create News
      </Typography>
      {error && <Typography color="error">{error}</Typography>}
      <TextField fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} margin="normal" />
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
      <TextField fullWidth label="Location" value={location} onChange={(e) => setLocation(e.target.value)} margin="normal" />
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
