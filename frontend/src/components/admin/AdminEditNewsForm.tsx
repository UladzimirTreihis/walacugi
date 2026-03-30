import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { TextField, Button, Box, Typography, CircularProgress, Autocomplete, FormControlLabel, Switch } from "@mui/material";
import useApi from "../../hooks/useApi";
import type { RootState } from "../../store/store";
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

function isoDateToDisplay(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) return "";
  const [, yyyy, mm, dd] = match;
  return `${dd}-${mm}-${yyyy}`;
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
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

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
          setExistingImages(data.images || []);
        }
      })
      .catch((err) => console.error("Failed to fetch news:", err));
  }, [newsId, adminToken, navigate]);

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
      const res = await post<{ filePaths: string[] }>("/upload/news-image", formData, {
        Authorization: `Bearer ${adminToken ?? ""}`,
      });
      if (res?.filePaths) {
        uploadedFilePaths.push(...res.filePaths);
      }
    }
    return uploadedFilePaths;
  }

  async function handleUpdateNews() {
    try {
      if (!adminToken) {
        return;
      }
      const uploadedImages = await handleUpload();
      const datedAtIso = displayDateToIso(datedAt);
      const updatedNews = {
        title,
        description,
        images: [...existingImages, ...uploadedImages],
        datedAt: datedAtIso || undefined,
        pinned,
        location,
        countries
      };
      const result = await put(`/news/${newsId}`, updatedNews, {
        Authorization: `Bearer ${adminToken}`,
      });
      if (!result) {
        return;
      }
      navigate("/admin");
    } catch (error) {
      console.error("Error updating news:", error);
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
  const hasDatedAtError = datedAt.trim().length > 0 && !displayDateToIso(datedAt);

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Edit News
      </Typography>

      {loading && <CircularProgress />}
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
        Existing Images:
      </Typography>
      <SortableImageList
        images={existingImages}
        onMove={handleMoveExistingImage}
        onRemove={handleDeleteImage}
        imageAlt="Existing news image"
      />

      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        New Images:
      </Typography>
      <SortableImageList
        images={newImagePreviews}
        onMove={handleMoveNewImage}
        onRemove={handleDeleteNewImage}
        imageAlt="New news image"
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
