import React, { useState } from "react";
import { TextField, Button, Box, Typography, CircularProgress } from "@mui/material";
import useApi from "../../hooks/useApi";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import styles

export default function AdminEventsForm() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // Store as HTML

  const { post, loading, error } = useApi();
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  async function handleUpload() {
    if (selectedFiles.length === 0) return [];
    const uploadedFilePaths = [];

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("images", file);
      const res = await post("/upload/event-image", formData);
      if (!res || !res.filePaths) {
        console.error("Upload error:", res);
        continue;
      }
      uploadedFilePaths.push(...res.filePaths);
    }
    return uploadedFilePaths;
  }

  async function handleCreateEvent() {
    try {
      const filePaths = await handleUpload();
      const eventBody = {
        title,
        description, // HTML format
        images: filePaths,
      };
      const result = await post("/events", eventBody);
      if (!result) {
        console.error("Create event failed.");
        return;
      }
      console.log("Event created:", result);
      setSelectedFiles([]);
      setImagePreviews([]);
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Error creating event:", error);
    }
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>Create Event</Typography>
      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}

      <TextField fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} margin="normal" />
      <Typography variant="h6" gutterBottom>Description</Typography>
      <ReactQuill theme="snow" value={description} onChange={setDescription} style={{ marginBottom: 20 }} />

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
        {imagePreviews.map((img, index) => (
          <Box key={index} sx={{ width: 100, height: 100, borderRadius: 2, overflow: "hidden" }}>
            <img src={img} alt="preview" width="100%" height="100%" style={{ objectFit: "cover" }} />
          </Box>
        ))}
      </Box>

      <input type="file" multiple onChange={handleFileChange} style={{ marginTop: 16 }} />
      <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleCreateEvent} disabled={loading}>
        {loading ? "Creating..." : "Create Event"}
      </Button>
    </Box>
  );
}
