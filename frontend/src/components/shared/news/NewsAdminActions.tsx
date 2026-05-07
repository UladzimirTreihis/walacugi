import React from "react";
import { Box, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { addLangToPath } from "../../../utils/langUrl";

interface NewsAdminActionsProps {
  newsId: string;
  lang: string;
  compact?: boolean;
  onDelete: () => void;
}

export default function NewsAdminActions({ newsId, lang, compact = false, onDelete }: NewsAdminActionsProps) {
  return (
    <Box sx={{ display: "flex", gap: 1, mt: compact ? 0.5 : 1 }}>
      <Button
        variant="outlined"
        color="primary"
        component={Link}
        to={addLangToPath(`/admin/news/edit/${newsId}`, lang)}
        size={compact ? "small" : "medium"}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        Edit
      </Button>
      <Button
        variant="outlined"
        color="error"
        size={compact ? "small" : "medium"}
        onClick={(event) => {
          event.stopPropagation();
          event.preventDefault();
          onDelete();
        }}
      >
        Delete
      </Button>
    </Box>
  );
}
