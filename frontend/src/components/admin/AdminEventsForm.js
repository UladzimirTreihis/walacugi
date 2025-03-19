import React, { useState } from "react";
import { TextField, Button, Box, Typography, CircularProgress } from "@mui/material";
import useApi from "../../hooks/useApi";

export default function AdminEventsForm() {
  const [selectedFiles, setSelectedFiles] = useState([]); // Store multiple images
  const [imagePreviews, setImagePreviews] = useState([]); // Previews for selected images
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { post, loading, error } = useApi();
  const token = localStorage.getItem("adminToken") || "";

  // Handle file selection and generate previews
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);

    // Generate image previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // Upload multiple images to S3
  async function handleUpload() {
    if (selectedFiles.length === 0) return [];

    const uploadedFilePaths = [];
    
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("images", file);

      const res = await post("/upload/event-image", formData, {
        "x-admin-token": token,
      });

      if (!res || !res.filePaths) {
        console.error("Upload error:", res);
        continue; // Skip this file and continue
      }

      uploadedFilePaths.push(...res.filePaths);
    }

    return uploadedFilePaths; // Return array of uploaded image URLs
  }

  // Handle event creation
  async function handleCreateEvent() {
    try {
      // Upload images first
      const filePaths = await handleUpload();

      // Prepare event object
      const eventBody = {
        title,
        description,
        images: filePaths, // Store uploaded image URLs
      };

      const result = await post("/events", eventBody, {
        "x-admin-token": token,
      });

      if (!result) {
        console.error("Create event failed.");
        return;
      }

      console.log("Event created:", result);

      // Reset form fields
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
      <Typography variant="h4" gutterBottom>
        Create Event
      </Typography>

      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}

      <TextField
        fullWidth
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Description"
        multiline
        rows={4}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        margin="normal"
      />

      {/* Image Previews */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2 }}>
        {imagePreviews.map((img, index) => (
          <Box key={index} sx={{ width: 100, height: 100, borderRadius: 2, overflow: "hidden" }}>
            <img src={img} alt="preview" width="100%" height="100%" style={{ objectFit: "cover" }} />
          </Box>
        ))}
      </Box>

      {/* Upload New Images */}
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ marginTop: 16 }}
      />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleCreateEvent}
        disabled={loading}
      >
        {loading ? "Creating..." : "Create Event"}
      </Button>
    </Box>
  );
}
