import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { TextField, Button, Box, Typography, CircularProgress, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import useApi from "../../hooks/useApi";
import type { RootState } from "../../store/store";

export default function AdminEditNewsForm() {
  const { newsId } = useParams<{ newsId: string }>();
  const navigate = useNavigate();
  const { get, put, post, loading, error } = useApi();
  const adminToken = useSelector((state: RootState) => state.auth.token);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
      const updatedNews = {
        title,
        description,
        images: [...existingImages, ...uploadedImages],
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

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Edit News
      </Typography>

      {loading && <CircularProgress />}
      {error && <Typography color="error">{error}</Typography>}

      <TextField fullWidth label="Title" value={title} onChange={(e) => setTitle(e.target.value)} margin="normal" />
      <TextField fullWidth label="Description" multiline rows={4} value={description} onChange={(e) => setDescription(e.target.value)} margin="normal" />

      <Typography variant="subtitle1" sx={{ mt: 2 }}>
        Existing Images:
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
        {existingImages.map((img, index) => (
          <Box key={index} sx={{ position: "relative", width: 100, height: 100, borderRadius: 2, overflow: "hidden" }}>
            <img src={img} alt="news" width="100%" height="100%" style={{ objectFit: "cover" }} />
            <IconButton sx={{ position: "absolute", top: 0, right: 0, background: "rgba(255,255,255,0.8)" }} onClick={() => handleDeleteImage(index)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
      </Box>

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

      <input type="file" multiple onChange={handleFileChange} style={{ marginTop: 16 }} />

      <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleUpdateNews} disabled={loading}>
        {loading ? "Updating..." : "Update News"}
      </Button>
    </Box>
  );
}
