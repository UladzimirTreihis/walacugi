import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { TextField, Button, Box, Typography, CircularProgress, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import useApi from "../../hooks/useApi";

export default function AdminEditEventForm() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { get, put, post, loading, error } = useApi();
  const adminToken = useSelector((state) => state.auth.token);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [existingImages, setExistingImages] = useState([]); // Existing event images
  const [newFiles, setNewFiles] = useState([]); // New images to upload
  const [newImagePreviews, setNewImagePreviews] = useState([]); // Previews for new images

  // Fetch existing event data
  useEffect(() => {
    if (!adminToken) {
      navigate("/admin/login"); // Redirect if no token
      return;
    }

    get(`/events/${eventId}`, { Authorization: `Bearer ${adminToken}` })
      .then((data) => {
        if (data) {
          setTitle(data.title || "");
          setDescription(data.description || "");
          setExistingImages(data.images || []);
        }
      })
      .catch((err) => console.error("Failed to fetch event:", err));
  }, [eventId, adminToken, navigate]);

  // Handle file selection and generate previews
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(files);

    // Generate image previews
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews(previews);
  };

  // Upload new images to S3
  async function handleUpload() {
    if (newFiles.length === 0) return [];

    const uploadedFilePaths = [];

    for (const file of newFiles) {
      const formData = new FormData();
      formData.append("images", file);

      const res = await post("/upload/event-image", formData, {
        Authorization: `Bearer ${adminToken}`,
      });

      if (!res || !res.filePaths) {
        console.error("Upload error:", res);
        continue;
      }

      uploadedFilePaths.push(...res.filePaths);
    }

    return uploadedFilePaths;
  }

  // Handle event update
  async function handleUpdateEvent() {
    try {
      if (!adminToken) {
        console.error("Unauthorized: No admin token found.");
        return;
      }

      // Upload new images first
      const uploadedImages = await handleUpload();

      // Prepare updated event object
      const updatedEvent = {
        title,
        description,
        images: [...existingImages, ...uploadedImages], // Keep old images + new ones
      };

      const result = await put(`/events/${eventId}`, updatedEvent, {
        Authorization: `Bearer ${adminToken}`,
      });

      if (!result) {
        console.error("Update failed.");
        return;
      }

      console.log("Event updated:", result);
      navigate("/admin"); // Redirect after update
    } catch (error) {
      console.error("Error updating event:", error);
    }
  }

  // Remove an image from existing images
  function handleDeleteImage(index) {
    setExistingImages((prevImages) => prevImages.filter((_, i) => i !== index));
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Edit Event
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

      {/* Existing Images */}
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Existing Images:
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
        {existingImages.map((img, index) => (
          <Box key={index} sx={{ position: "relative", width: 100, height: 100, borderRadius: 2, overflow: "hidden" }}>
            <img src={img} alt="event" width="100%" height="100%" style={{ objectFit: "cover" }} />
            <IconButton
              sx={{ position: "absolute", top: 0, right: 0, background: "rgba(255,255,255,0.8)" }}
              onClick={() => handleDeleteImage(index)}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
      </Box>

      {/* New Image Previews */}
      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        New Images:
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
        {newImagePreviews.map((preview, index) => (
          <Box key={index} sx={{ width: 100, height: 100, borderRadius: 2, overflow: "hidden" }}>
            <img src={preview} alt="preview" width="100%" height="100%" style={{ objectFit: "cover" }} />
          </Box>
        ))}
      </Box>

      {/* Upload New Images */}
      <input type="file" multiple onChange={handleFileChange} style={{ marginTop: 16 }} />

      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleUpdateEvent}
        disabled={loading}
      >
        {loading ? "Updating..." : "Update Event"}
      </Button>
    </Box>
  );
}
