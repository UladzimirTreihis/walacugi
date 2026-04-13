import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import useApi from "../../hooks/useApi";
import type { CategoryItem } from "../../types";
import { DEFAULT_REQUEST_ERROR_MESSAGE, type UiFeedback } from "../../utils/feedback";
import { useTranslation } from "react-i18next";

export default function AdminCategoriesPage() {
  const { t } = useTranslation();
  const { get, post, put, del, loading, error } = useApi();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [feedback, setFeedback] = useState<UiFeedback | null>(null);

  const refresh = () => {
    get<CategoryItem[]>("/equipment/categories").then((data) => {
      if (data) setItems(data);
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAdd = async () => {
    setFeedback(null);
    const name = newName.trim();
    if (!name) return;
    const res = await post<CategoryItem>("/equipment/categories", { name });
    if (res) {
      setNewName("");
      setFeedback({ severity: "success", message: t("admin_page.category_created") });
      refresh();
    } else {
      setFeedback({ severity: "error", message: t("admin_page.category_create_failed") });
    }
  };

  const startEdit = (c: CategoryItem) => {
    setEditingId(c._id);
    setEditName(c.name);
    setFeedback(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setFeedback(null);
    const name = editName.trim();
    if (!name) return;
    const res = await put<CategoryItem>(`/equipment/categories/${editingId}`, { name });
    if (res) {
      setEditingId(null);
      setEditName("");
      setFeedback({ severity: "success", message: t("admin_page.category_updated") });
      refresh();
    } else {
      setFeedback({ severity: "error", message: t("admin_page.category_update_failed") });
    }
  };

  const handleDelete = async (c: CategoryItem) => {
    if (!window.confirm(t("admin_page.category_delete_confirm", { name: c.name }))) return;
    setFeedback(null);
    const res = await del(`/equipment/categories/${c._id}`);
    if (res) {
      setFeedback({ severity: "success", message: t("admin_page.category_deleted") });
      refresh();
    } else {
      setFeedback({ severity: "error", message: t("admin_page.category_delete_failed") });
    }
  };

  return (
    <Box sx={{ maxWidth: 640, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t("admin_page.categories_title")}
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

      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {t("admin_page.categories_add_new")}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mb: 3 }}>
        <TextField
          label={t("admin_page.category_name")}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          fullWidth
          size="small"
        />
        <Button variant="contained" onClick={handleAdd} disabled={loading || !newName.trim()}>
          {loading ? <CircularProgress size={22} /> : t("admin_page.category_add")}
        </Button>
      </Stack>

      <Typography variant="h6" gutterBottom>
        {t("admin_page.categories_list")}
      </Typography>
      <Stack spacing={1}>
        {items.map((c) => (
          <Box
            key={c._id}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 1.5,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1
            }}
          >
            {editingId === c._id ? (
              <>
                <TextField size="small" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth />
                <IconButton aria-label={t("admin_page.save")} onClick={saveEdit} color="primary">
                  <CheckIcon />
                </IconButton>
                <IconButton aria-label={t("admin_page.cancel")} onClick={cancelEdit}>
                  <CloseIcon />
                </IconButton>
              </>
            ) : (
              <>
                <Typography sx={{ flexGrow: 1 }}>{c.name}</Typography>
                <IconButton aria-label={t("admin_page.edit")} onClick={() => startEdit(c)} size="small">
                  <EditIcon />
                </IconButton>
                <IconButton aria-label={t("admin_page.delete")} onClick={() => handleDelete(c)} size="small" color="error">
                  <DeleteOutlineIcon />
                </IconButton>
              </>
            )}
          </Box>
        ))}
        {items.length === 0 && !loading && (
          <Typography color="text.secondary">{t("admin_page.categories_empty")}</Typography>
        )}
      </Stack>
    </Box>
  );
}
