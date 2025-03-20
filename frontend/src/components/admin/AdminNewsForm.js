import React, { useState } from "react";
import { Box, Button, TextField, Typography, CircularProgress, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import useApi from "../../hooks/useApi";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import styles

export default function AdminNewsForm() {
  const [selectedFiles, setSelectedFiles] = useState([]); // Store multiple images
  const [imagePreviews, setImagePreviews] = useState([]); // Previews for images
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { post, loading, error } = useApi();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  // Upload multiple images
  async function handleUpload() {
    if (selectedFiles.length === 0) return [];

    const uploadedFilePaths = [];
    
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("images", file);

      const res = await post("/upload/news-image", formData);

      if (!res || !res.filePaths) {
        console.error("Upload error:", res);
        continue; // Skip this file and continue
      }

      uploadedFilePaths.push(...res.filePaths);
    }
    
    return uploadedFilePaths;
  }

  // Create news item
  async function handleCreateNews() {
    try {
      const filePaths = await handleUpload();

      const newsBody = {
        title,
        description,
        images: filePaths,
      };

      const result = await post("/news", newsBody);

      if (!result) {
        console.error("Create news failed.");
        return;
      }

      console.log("News created:", result);

      // Reset form fields
      setSelectedFiles([]);
      setImagePreviews([]);
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Error creating news:", error);
    }
  }

  // Remove selected image
  const handleRemoveImage = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    setImagePreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index));
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3, boxShadow: 2, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom>
        Create News
      </Typography>

      {error && <Typography color="error">{error}</Typography>}

      {/* Title Input */}
      <TextField
        fullWidth
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        margin="normal"
      />

      <Typography variant="h6" gutterBottom>Description</Typography>
      <ReactQuill multiline theme="snow" value={description} onChange={setDescription} style={{ marginBottom: 50, height: 300 }} />


      {/* Image Previews */}
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

      {/* File Input */}
      <Button variant="contained" component="label" fullWidth sx={{ mt: 2 }}>
        Select Images
        <input type="file" multiple hidden onChange={handleFileChange} />
      </Button>

      {/* Submit Button */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        onClick={handleCreateNews}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} /> : "Create News"}
      </Button>
    </Box>
  );
}
