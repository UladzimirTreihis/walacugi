import React from "react";
import { Box, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

interface SortableImageListProps {
  images: string[];
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove?: (index: number) => void;
  imageAlt?: string;
}

export default function SortableImageList({
  images,
  onMove,
  onRemove,
  imageAlt = "Preview"
}: SortableImageListProps) {
  if (images.length === 0) return null;

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1 }}>
      {images.map((src, index) => (
        <Box key={`${src}-${index}`} sx={{ position: "relative", width: 112, height: 112, borderRadius: 2, overflow: "hidden" }}>
          <img src={src} alt={imageAlt} width="100%" height="100%" style={{ objectFit: "cover" }} />
          <Box sx={{ position: "absolute", left: 4, right: 4, bottom: 4, display: "flex", justifyContent: "space-between", gap: 0.5 }}>
            <IconButton
              size="small"
              disabled={index === 0}
              onClick={() => onMove(index, index - 1)}
              sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              disabled={index === images.length - 1}
              onClick={() => onMove(index, index + 1)}
              sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
            >
              <ArrowForwardIcon fontSize="small" />
            </IconButton>
            {onRemove && (
              <IconButton
                size="small"
                onClick={() => onRemove(index)}
                sx={{ bgcolor: "rgba(255,255,255,0.9)" }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
