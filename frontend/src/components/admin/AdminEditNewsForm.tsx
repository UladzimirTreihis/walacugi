import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Alert, TextField, Button, Box, Typography, CircularProgress, Autocomplete, FormControlLabel, Switch } from "@mui/material";
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

export default function AdminEditNewsForm() {
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const { get, put, post, loading, error } = useApi();
  const adminToken = useSelector((state: RootState) => state.auth.token);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [datedAt, setDatedAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [location, setLocation] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [images, setImages] = useState<EditableImage[]>([]);
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  useEffect(() => {
    if (!adminToken) {
      navigate("/admin/login");
      return;
    }
    get(`/news/${newsId}`, { Authorization: `Bearer ${adminToken}` })
      .then((data: any) => {
        if (data) {
          setTitle(data.title || "");
          setDescription(data.description || "");
          setDatedAt(data.datedAt ? isoDateToDisplay(String(data.datedAt).slice(0, 10)) : "");
          setPinned(Boolean(data.pinned));
          setLocation(data.location || "");
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
        label="Pinned"
      />
      <TextField fullWidth label="Location" value={location} onChange={(e) => setLocation(e.target.value)} margin="normal" />
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
      <TextField fullWidth label="Description" multiline rows={4} value={description} onChange={(e) => setDescription(e.target.value)} margin="normal" />

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
