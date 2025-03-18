import React, { useState } from "react";
import useApi from "../../hooks/useApi";

function AdminNewsForm() {
  const [selectedFiles, setSelectedFiles] = useState([]); // Store multiple images
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { post, loading, error } = useApi();

  // Retrieve the stored token (from localStorage or sessionStorage)
  const token = localStorage.getItem("adminToken") || "";

  // Upload multiple images one by one
  async function handleUpload() {
    if (selectedFiles.length === 0) return [];

    const uploadedFilePaths = [];
    
    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append("images", file);

      const res = await post("/upload/news-image", formData, {
        "x-admin-token": token,
      });

      if (!res || !res.filePaths) {
        console.error("Upload error:", res);
        continue; // Skip this file and continue
      }

      uploadedFilePaths.push(...res.filePaths);
    }
    console.log("test file path", uploadedFilePaths)
    return uploadedFilePaths; // Return array of uploaded image URLs
  }

  // Create the news item
  async function handleCreateNews() {
    try {
      // Upload images first
      const filePaths = await handleUpload();
      console.log(filePaths)

      // Prepare news object
      const newsBody = {
        title,
        description,
        images: filePaths, // Send all uploaded image URLs
      };

      const result = await post("/news", newsBody, {
        "x-admin-token": token,
      });

      if (!result) {
        console.error("Create news failed.");
        return;
      }

      console.log("News created:", result);

      // Reset form fields
      setSelectedFiles([]);
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Error creating news:", error);
    }
  }

  return (
    <div>
      <h2>Create News</h2>

      {error && <p style={{ color: "red" }}>{error}</p>} {/* Display API error */}

      {/* Allow multiple file selection */}
      <input
        type="file"
        multiple
        onChange={(e) => setSelectedFiles([...e.target.files])}
      />
      <br />

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <br />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <br />

      <button onClick={handleCreateNews} disabled={loading}>
        {loading ? "Creating..." : "Create News"}
      </button>
    </div>
  );
}

export default AdminNewsForm;
