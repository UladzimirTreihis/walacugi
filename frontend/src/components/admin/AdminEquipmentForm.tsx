import React, { useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import type { EquipmentModelItem } from "../../types";
import SortableImageList from "./SortableImageList";
import { DEFAULT_REQUEST_ERROR_MESSAGE, type UiFeedback } from "../../utils/feedback";
import { uploadFiles } from "../../utils/uploadFiles";

export default function AdminEquipmentForm() {
  const { post, get, loading, error } = useApi();
  const [items, setItems] = useState<EquipmentModelItem[]>([]);
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pricePerDay, setPricePerDay] = useState<number>(0);
  const [currency, setCurrency] = useState("EUR");
  const [size, setSize] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleRemoveImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
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

  const refresh = () => {
    get<EquipmentModelItem[]>("/equipment").then((data) => {
      if (data) setItems(data);
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleCreate = async () => {
    setFeedback(null);
    try {
      const filePaths = await uploadFiles(selectedFiles, "/upload/equipment-image", post);
      const payload = {
        category,
        title,
        description,
        pricePerDay: Number(pricePerDay),
        currency,
        size,
        images: filePaths
      };
      const created = await post("/equipment", payload);
      if (!created) {
        setFeedback({
          severity: "error",
          message: "We could not create this equipment model. Please check the fields and try again."
        });
        return;
      }
      setCategory("");
      setTitle("");
      setDescription("");
      setPricePerDay(0);
      setCurrency("EUR");
      setSize("");
      setSelectedFiles([]);
      setImagePreviews([]);
      setFeedback({ severity: "success", message: "Equipment model created successfully." });
      refresh();
    } catch {
      setFeedback({
        severity: "error",
        message: "Something went wrong while creating equipment. Please try again."
      });
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Add Equipment Model
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
      <Stack spacing={1.5}>
        <TextField label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextField label="Description" multiline minRows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        <TextField type="number" label="Price per day" value={pricePerDay} onChange={(e) => setPricePerDay(Number(e.target.value || 0))} />
        <TextField label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)} />
        <TextField label="Size (optional)" value={size} onChange={(e) => setSize(e.target.value)} />
        {imagePreviews.length > 0 && (
          <>
            <Typography variant="subtitle2">Arrange selected images (left to right):</Typography>
            <SortableImageList
              images={imagePreviews}
              onMove={handleMoveImage}
              onRemove={handleRemoveImage}
              imageAlt="Equipment preview"
            />
          </>
        )}
        <Button variant="contained" component="label">
          Select Images
          <input type="file" multiple hidden onChange={handleFileChange} />
        </Button>
        <Button variant="contained" onClick={handleCreate} disabled={loading || !category || !title}>
          {loading ? <CircularProgress size={22} /> : "Create Equipment"}
        </Button>
      </Stack>

      <Typography variant="h6" sx={{ mt: 4 }}>
        Existing models
      </Typography>
      <Stack spacing={1} sx={{ mt: 1 }}>
        {items.map((item) => (
          <Box key={item._id} sx={{ p: 1.5, border: "1px solid #ddd", borderRadius: 1 }}>
            <Typography variant="subtitle1">{item.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {item.category} • {item.pricePerDay} {item.currency}/day
            </Typography>
            <Button size="small" component={Link} to={`/admin/equipment/edit/${item._id}`} sx={{ mt: 0.5 }}>
              Edit
            </Button>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
